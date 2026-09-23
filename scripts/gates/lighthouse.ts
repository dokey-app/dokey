import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { glob, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Gate, fail, pass, pending, runGate } from './gate.ts';

const OUT = '.lighthouseci';
const RESULTS = `${OUT}/assertion-results.json`;
const RC = 'lighthouserc.json';

/**
 * Прогонов на маршрут: столько значений попадает в медиану. Число — предмет решения
 * (D-100, NFR-04), а не настройка: меняется оно вопросом Q-NN, а не правкой здесь.
 * Держится равным `ci.collect.numberOfRuns` пресета — расхождение валит гейт (T-229).
 */
export const RUNS = 3;

/** Пересъёмок сбора, если набор отчётов вышел неполным: Chrome не всегда отпускает профиль. */
const ATTEMPTS = 2;

interface AssertionResult {
  name: string;
  passed: boolean;
  auditId?: string;
  auditProperty?: string;
  actual?: number;
  expected?: number;
  values?: number[];
  level?: string;
  url?: string;
}

/** Маршрут отчёта: порт у сервера сбора случайный, и в приговоре от него толку нет. */
function route(url: string | undefined): string {
  if (!url) return '?';
  return URL.canParse(url) ? new URL(url).pathname : url;
}

/** Ветка `ci.collect` пресета: из неё же `lhci collect` берёт список адресов. */
export interface Collect {
  numberOfRuns: number;
  staticDistDir?: string;
  url?: string | string[];
  autodiscoverUrlBlocklist?: string | string[];
  maxAutodiscoverUrls?: number;
  staticDirFileDiscoveryDepth?: number;
}

/** Ветка `ci.assert` пресета: из неё же `lhci assert` берёт список утверждений. */
export interface Assert {
  aggregationMethod?: string;
  preset?: string;
  assertMatrix?: unknown;
  assertions?: Record<string, AssertionSpec>;
}

type Level = 'off' | 'warn' | 'error';
type AssertionSpec = Level | [Level, AssertionOptions];

interface AssertionOptions {
  minScore?: number;
  maxLength?: number;
  maxNumericValue?: number;
}

interface Preset {
  ci: { collect: Collect; assert?: Assert };
}

/** Умолчания `@lhci/cli/src/collect/collect.js` — гейт обязан отбирать адреса так же. */
const AUTODISCOVER_LIMIT = 5;
const DISCOVERY_DEPTH = 2;
/** `IGNORED_FOLDERS_FOR_AUTOFIND` из `collect/fallback-server.js`. */
const IGNORED_FOLDERS = new Set([
  'node_modules',
  'bower_components',
  'jspm_packages',
  'web_modules',
  'tmp',
]);

function lhci(...args: string[]) {
  return spawnSync('pnpm', ['exec', 'lhci', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

function listed(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * html-файлы каталога сборки в порядке обхода `lhci collect`
 * (`FallbackServer.readHtmlFilesInDirectory`): сначала файлы самого каталога, затем вложенные
 * папки, кроме скрытых (с точкой в имени) и зависимостей; `depth` — оставшаяся глубина.
 */
export function htmlFiles(dir: string, depth: number): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const found = entries
    .filter(
      (entry) => entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm')),
    )
    .map((entry) => entry.name);
  if (depth <= 0) return found;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.includes('.') || IGNORED_FOLDERS.has(entry.name)) continue;
    found.push(
      ...htmlFiles(join(dir, entry.name), depth - 1).map((file) => `${entry.name}/${file}`),
    );
  }
  return found;
}

/**
 * Маршруты, которые обязан собрать `lhci collect` по этому пресету. Список не пишется здесь
 * руками: он выведен из того же источника, из которого адреса берёт сам сбор, — явных
 * `ci.collect.url`, а без них автопоиска по html-файлам `staticDistDir` с тем же чёрным
 * списком и тем же потолком `maxAutodiscoverUrls` (`collect.js`, `startServerAndDetermineUrls`).
 * Порт у сбора случайный, поэтому маршрут — это путь, а не адрес целиком.
 */
export function plannedRoutes(collect: Collect, files: string[]): string[] {
  const explicit = listed(collect.url).map(route);
  if (explicit.length > 0) return [...new Set(explicit)];
  const blocked = new Set(listed(collect.autodiscoverUrlBlocklist).map(route));
  const limit = collect.maxAutodiscoverUrls ?? AUTODISCOVER_LIMIT;
  const paths = files.map((file) => `/${file}`).filter((path) => !blocked.has(path));
  return [...new Set(limit === 0 ? paths : paths.slice(0, limit))];
}

/**
 * Чем набор отчётов расходится с планом сбора. `lhci assert` делит отчёты по `finalUrl`
 * целиком, вместе с портом (`@lhci/utils/src/assertions.js`: `_.groupBy(lhrs, lhr =>
 * lhr.finalUrl)`), и медиану считает внутри группы. Группа из одного отчёта — это медиана
 * по одному прогону: приговор выносит единственный замер, а не середина трёх.
 *
 * Считать при этом по собранным отчётам мало: маршрута, по которому не сохранилось ни
 * одного отчёта, в их списке нет вовсе, и «три отчёта на `/` и ноль на `/health`» выглядит
 * полным набором. Случай не выдуманный: `runOnUrl` бросает на первом же неудачном прогоне,
 * цикл по адресам в `runCommand` обрывается, отчёты предыдущих адресов остаются на диске, а
 * `lhci assert` затем судит один маршрут из двух и молчит об остальных. Поэтому перебираются
 * маршруты плана, а не собранные адреса, и лишний адрес — тоже расхождение.
 */
export function shortOfRuns(finalUrls: string[], runs: number, planned: string[]): string[] {
  const counted = new Map<string, number>();
  for (const url of finalUrls) counted.set(url, (counted.get(url) ?? 0) + 1);
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const path of planned) {
    const groups = [...counted].filter(([url]) => route(url) === path);
    if (groups.length === 0) {
      lines.push(`${path}: отчётов 0, а не ${runs} — сбор до маршрута не дошёл`);
      continue;
    }
    for (const [url, count] of groups) {
      seen.add(url);
      if (count !== runs) lines.push(`${url}: отчётов ${count}, а не ${runs}`);
    }
  }
  for (const [url, count] of counted) {
    if (!seen.has(url)) lines.push(`${url}: отчётов ${count}, а маршрута нет в плане сбора`);
  }
  return lines;
}

/**
 * Тип утверждения `@lhci`: им выбирается не только оператор сравнения, но и сама величина,
 * которую утверждение снимает с аудита (`AUDIT_TYPE_VALUE_GETTERS`). Порядок — тот же, в
 * котором их перебирает `getStandardAssertionResults`.
 */
export type AssertionType = 'maxLength' | 'maxNumericValue' | 'minScore';

/** Сверяемый аудит: ключ пресета, адрес величины в отчёте и снимаемые с него типы. */
export interface Asserted {
  key: string;
  auditId: string;
  property?: string;
  types: AssertionType[];
}

/** Аудит отчёта в той части, которую читают `AUDIT_TYPE_VALUE_GETTERS`. */
export interface AuditResult {
  score?: number | null;
  scoreDisplayMode?: string;
  numericValue?: number;
  details?: { items?: unknown[] };
}

/** Отчёт `lhr-*.json` в той части, которую читает `lhci assert`. */
export interface Lhr {
  finalUrl: string;
  audits?: Record<string, AuditResult | undefined>;
  categories?: Record<string, { score?: number | null } | undefined>;
}

/** `_.kebabCase` из `@lhci/utils/src/lodash.js`: ключи утверждений `lhci assert` правит им. */
function kebabCase(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/** `normalizeAssertion`: голая строка — уровень без настроек, отсутствие ключа — `off`. */
function severityOf(spec: AssertionSpec | undefined): [Level, AssertionOptions] {
  if (!spec) return ['off', {}];
  return typeof spec === 'string' ? [spec, {}] : spec;
}

/** Ключи, у которых величина берётся не из `lhr.audits[id]`, а особым путём. */
const SPECIAL_AUDITS = new Set(['performance-budget', 'resource-summary', 'user-timings']);

/**
 * Аудиты, которыми выносится приговор G-01, и величины, которые с них снимаются. Список не
 * пишется здесь руками: он выведен из того же места, откуда его берёт `lhci assert`, — ключей
 * `ci.assert.assertions`, приведённых `_.kebabCase` и разрезанных по `.` и `:`
 * (`resolveAssertionOptionsAndLhrs`). Набор типов повторяет `getStandardAssertionResults`:
 * `maxLength` и `maxNumericValue` — если заданы, `minScore` — если задан или если ручных
 * утверждений не было вовсе (тогда у `@lhci` включается умолчание `minScore: 0.9`).
 *
 * Берутся только утверждения уровня `error`: приговор выносят они, а `warn` печатается
 * предупреждением и гейт не красит — требовать от него полного набора значило бы поднять
 * уровень, объявленный пресетом. Изменят уровень в пресете — изменится и список здесь.
 *
 * Чего гейт прочитать не может, он называет вслух, а не пропускает молча: `ci.assert.preset`
 * и `assertMatrix` приносят утверждения из другого места, а у `performance-budget`,
 * `resource-summary` и `user-timings` величина собирается из `details.items` особым путём.
 */
export function assertedAudits(config: Assert): { audits: Asserted[]; unreadable: string[] } {
  const unreadable: string[] = [];
  if (config.preset) {
    unreadable.push(`ci.assert.preset ${config.preset}: его утверждения гейту не видны`);
  }
  if (config.assertMatrix) {
    unreadable.push('ci.assert.assertMatrix: гейт читает только ci.assert.assertions');
  }
  const assertions = config.assertions ?? {};
  const audits: Asserted[] = [];
  for (const key of new Set(Object.keys(assertions).map(kebabCase))) {
    const [severity, options] = severityOf(assertions[key]);
    if (severity !== 'error') continue;
    const [auditId, ...rest] = key.split(/[.:]/).filter(Boolean);
    if (!auditId) continue;
    if (SPECIAL_AUDITS.has(auditId)) {
      unreadable.push(`${key}: величину "${auditId}" гейт считать не умеет`);
      continue;
    }
    const types: AssertionType[] = [];
    if (options.maxLength !== undefined) types.push('maxLength');
    if (options.maxNumericValue !== undefined) types.push('maxNumericValue');
    if (options.minScore !== undefined || types.length === 0) types.push('minScore');
    const property = rest.join('.');
    audits.push(property ? { key, auditId, property, types } : { key, auditId, types });
  }
  return { audits, unreadable };
}

/** Аудит, с которого снимается величина. У `categories:*` это псевдо-аудит из одной оценки. */
function subject(lhr: Lhr, audit: Asserted): AuditResult | undefined {
  if (audit.auditId === 'categories' && audit.property) {
    const category = lhr.categories?.[audit.property];
    return category ? { score: category.score ?? null } : undefined;
  }
  return lhr.audits?.[audit.auditId];
}

function missingValue(result: AuditResult, what: string): string {
  const mode = result.scoreDisplayMode ? ` (scoreDisplayMode: ${result.scoreDisplayMode})` : '';
  return `нет ${what}${mode}`;
}

/**
 * Что дал аудит в одном отчёте: величину, которую возьмёт `@lhci`, и её человеческое имя для
 * текста провала. Повторяет `AUDIT_TYPE_VALUE_GETTERS` дословно, включая две ловушки оценки:
 * неприменимый аудит идёт в агрегат единицей, справочный — нулём. Правило здесь не своё, а
 * инструмента: разойдись гейт с ним — он красил бы полный агрегат или пропускал неполный.
 */
export function auditValue(
  lhr: Lhr,
  audit: Asserted,
  type: AssertionType,
): { value?: number; got: string } {
  const result = subject(lhr, audit);
  if (!result) return { got: audit.auditId === 'categories' ? 'категории нет' : 'аудита нет' };
  if (type === 'maxLength') {
    const length = result.details?.items?.length ?? 0;
    return { value: length, got: String(length) };
  }
  if (type === 'maxNumericValue') {
    const numeric = result.numericValue;
    if (typeof numeric === 'number' && Number.isFinite(numeric)) {
      return { value: numeric, got: String(numeric) };
    }
    return { got: missingValue(result, 'numericValue') };
  }
  if (typeof result.score === 'number' && Number.isFinite(result.score)) {
    return { value: result.score, got: String(result.score) };
  }
  if (result.scoreDisplayMode === 'notApplicable') return { value: 1, got: 'notApplicable → 1' };
  if (result.scoreDisplayMode === 'informative') return { value: 0, got: 'informative → 0' };
  return { got: missingValue(result, 'score') };
}

/**
 * По каким сверяемым аудитам агрегат маршрута считался бы не по всем прогонам. Полного набора
 * отчётов для этого мало: `getAssertionResult` снимает величину с каждого отчёта группы и тут
 * же выбрасывает нечисловые — `const filteredValues = values.filter(isFiniteNumber)`, — а
 * медиану считает по остатку. Одного значения из трёх хватает, чтобы утверждение прошло: пока
 * остаток не пуст, «Audit failed to produce a valid value» не печатается, а наружу, в
 * `assertion-results.json`, `getAllAssertionResults` отдаёт только провалившиеся утверждения.
 * Пропажа не оставляет следа нигде, кроме самих отчётов, — по ним и считается.
 *
 * Отчёты делятся по `finalUrl` целиком, как их делит `lhci assert`, а не по маршруту: порт у
 * сбора случайный, но группу задаёт именно адрес.
 */
export function shortOfValues(lhrs: Lhr[], runs: number, audits: Asserted[]): string[] {
  const groups = new Map<string, Lhr[]>();
  for (const lhr of lhrs) groups.set(lhr.finalUrl, [...(groups.get(lhr.finalUrl) ?? []), lhr]);
  const lines: string[] = [];
  for (const [url, group] of groups) {
    for (const audit of audits) {
      for (const type of audit.types) {
        const got = group.map((lhr) => auditValue(lhr, audit, type));
        const counted = got.filter((sample) => sample.value !== undefined).length;
        if (counted === runs) continue;
        const values = got.map((sample) => sample.got).join(', ');
        lines.push(
          `${route(url)} ${audit.key} (${type}): значений ${counted}, а не ${runs} — ${values}`,
        );
      }
    }
  }
  return lines;
}

/** Строка, которую `lhci collect` печатает, обойдя все адреса до единого. */
const COLLECT_DONE = 'Done running Lighthouse!';
/** Коды отказа файловой системы, которыми кончается уборка каталога, занятого процессом. */
const CLEANUP_ERRNO = /\b(?:EBUSY|EPERM|ENOTEMPTY)\b/;
/** Временный профиль chrome-launcher: `lighthouse.<случайное>` в каталоге temp (`utils.js`). */
const PROFILE_DIR = /lighthouse\.[A-Za-z0-9]+/;

/**
 * Можно ли списать ненулевой код `lhci collect` на гонку уборки профиля Chrome. Списывать
 * её законно только там, где она возможна и где она ничего не отняла у приговора:
 *   1. Windows — гонка в том, что chrome-launcher убирает временный профиль раньше, чем
 *      Chrome отпускает файлы (`destroyTmp`); на других системах у ненулевого кода причина
 *      другая, и её надо читать, а не прощать;
 *   2. сбор обошёл все адреса — напечатано `Done running Lighthouse!`. Без этой строки обход
 *      оборвался на каком-то маршруте: `runOnUrl` бросает на первом же неудачном прогоне, и
 *      отчёты уже пройденных адресов остаются на диске, притворяясь полным набором;
 *   3. в выводе — именно отказ уборки (EBUSY/EPERM/ENOTEMPTY) именно по каталогу профиля.
 * Полнота набора отчётов проверяется отдельно и до этого: прощается только код возврата.
 */
export function profileCleanupRace(output: string, platform: string): boolean {
  if (platform !== 'win32') return false;
  if (!output.includes(COLLECT_DONE)) return false;
  return CLEANUP_ERRNO.test(output) && PROFILE_DIR.test(output);
}

async function collected(): Promise<{ reports: string[]; lhrs: Lhr[] }> {
  const reports: string[] = [];
  for await (const entry of glob(`${OUT}/lhr-*.json`)) reports.push(entry);
  const lhrs = await Promise.all(
    reports.map(async (report) => JSON.parse(await readFile(report, 'utf8')) as Lhr),
  );
  return { reports, lhrs };
}

// G-01 «объявленные пороги скорости» — NFR-01, NFR-02, NFR-04. Гейт складывается из двух
// замеров разной природы (D-100):
//   1. Lighthouse на запиннутом пресете — навигационные метрики и mobile-оценка (NFR-04);
//   2. клиентский переход между инструментами ≤ 300 мс — `performance.measure` вокруг
//      перехода в E2E-08 (половина NFR-05, D-101). Lighthouse меряет навигацию документа,
//      а переход идёт через History API и до Lighthouse не доходит вовсе;
//   3. лабораторный TTR по процедуре D-75 п. 1 (RUN-09) — от навигации до появления
//      результата в DOM по явному селектору, медиана девяти прогонов, фиксированный
//      троттлинг. Величины «TTR» у Lighthouse нет: LCP, TTI и TBT кончаются там, где TTR
//      только начинается, поэтому NFR-01 и NFR-02 без этого замера не охранялись ничем.
// Пресет запиннут в lighthouserc.json,
// чтобы числа были сравнимы между релизами (tech-stack §3.5 п. 3), а утверждения считаются
// по медиане прогонов (`aggregationMethod: median`) — так же, как замер по процедуре D-75.
// Один неудачный прогон на загруженной машине не должен красить гейт: краснеть он обязан
// от продукта, а не от соседнего процесса.
//
// **Все прогоны маршрута снимаются одним вызовом `lhci collect`** (T-229). Медиана
// объявлена в пресете, но считается она внутри группы отчётов с одинаковым `finalUrl`, а
// свой статический сервер `lhci collect` поднимает на случайном порту
// (`collect/fallback-server.js`: `server.listen(0)`). Прежний сбор звал `lhci collect -n 1`
// трижды — и давал три порта, то есть три группы по одному отчёту вместо одной из трёх:
// медиана вырождалась в единственный замер, и приговор выносил случайный прогон. На раннере
// GitHub это дало `categories:performance` 0.85 и 0.77 против порога 0.95 на двух сборках,
// зелёных при перезапуске без единой правки. Полноту набора гейт проверяет сам: маршрут,
// по которому отчётов не `RUNS`, — это не «почти медиана», а другой приговор.
//
// **Полон набор отчётов — это ещё не полон агрегат** (T-255). Величину утверждение снимает с
// каждого отчёта группы и тут же выбрасывает нечисловые (`getAssertionResult`:
// `values.filter(isFiniteNumber)`), а медиану считает по остатку. Аудит, упавший
// (`scoreDisplayMode: error`), не применившийся (`notApplicable`) или не отдавший
// `numericValue` в одном прогоне из трёх, оставляет медиану на двух значениях — и не оставляет
// следа: пока остаток не пуст, утверждение проходит, а в `assertion-results.json` попадают
// только провалившиеся. Поэтому значения гейт считает сам, по отчётам (`shortOfValues`), а
// список сверяемых утверждений берёт оттуда же, откуда его берёт `lhci assert`, — из
// `ci.assert.assertions` пресета (`assertedAudits`); руками он здесь не пишется.
//
// Полнота считается от плана сбора (`plannedRoutes`), а не от собранных отчётов. План гейт
// выводит из того же источника, из которого адреса берёт `lhci collect`, — пресета и html
// каталога сборки; руками список маршрутов здесь не пишется. Иначе маршрут, по которому не
// сохранилось ни одного отчёта, в счёте не участвует вовсе, и набор «`RUNS` отчётов на `/`
// и ноль на `/health`» проходит как полный, а `lhci assert` судит один маршрут из двух.
//
// Сбор и приговор разнесены на два шага вместо одного `lhci autorun`. Причина не в стиле:
// на Windows chrome-launcher убирает временный профиль раньше, чем Chrome отпускает файлы
// (`destroyTmp`), и падает с EBUSY уже после того, как отчёты записаны. Код возврата шага
// сбора говорит в этом случае о состоянии диска, а не о метриках, — поэтому сбор судится по
// составу собранных отчётов, а пороги проверяет отдельный процесс `lhci assert`, который
// браузер не поднимает и такой гонки не имеет. Но списывается ненулевой код только на эту
// гонку и только по её приметам (`profileCleanupRace`): полный набор отчётов сам по себе
// оправданием не служит — отчёты пройденных адресов остаются на диске и после обрыва обхода.
// Неполный набор пересчитывается заново (ATTEMPTS): досдать один прогон в старую группу
// нельзя — новый сбор поднимет новый порт.
export const gate: Gate = {
  id: 'G-01',
  command: 'gate:lh',
  claim: 'объявленные пороги скорости соблюдены: TTR, LCP, Lighthouse mobile',
  enabledIn: 'Э-0',
  async run() {
    if (process.env['DOKEY_SKIP_LH'] === '1') {
      return pending('Э-0 — DOKEY_SKIP_LH=1, прогон отключён вручную');
    }

    const preset = JSON.parse(await readFile(RC, 'utf8')) as Preset;
    const collect = preset.ci.collect;
    if (collect.numberOfRuns !== RUNS) {
      return fail(`${RC}: numberOfRuns ${collect.numberOfRuns}, а гейт судит по ${RUNS} прогонам`);
    }
    const dist = collect.staticDistDir ?? 'dist';
    if (!existsSync(dist)) return pending(`Э-0 — нет каталога ${dist}, сначала pnpm build`);

    const planned = plannedRoutes(
      collect,
      htmlFiles(dist, collect.staticDirFileDiscoveryDepth ?? DISCOVERY_DEPTH),
    );
    if (planned.length === 0) {
      return fail(
        `${RC}: маршрутов для сбора не вышло — ни ci.collect.url, ни html-файлов в ${dist}`,
      );
    }

    const { audits, unreadable } = assertedAudits(preset.ci.assert ?? {});
    if (unreadable.length > 0) {
      return fail(
        `${RC}: гейт не видит всех сверяемых утверждений, а значит не досчитает и значений:\n` +
          unreadable.map((line) => `  ${line}`).join('\n'),
      );
    }
    if (audits.length === 0) {
      return fail(`${RC}: ни одного утверждения уровня error — приговор выносить нечем`);
    }

    let attempts = 0;
    let reports: string[] = [];
    let lhrs: Lhr[] = [];
    let short: string[] = [];
    let thin: string[] = [];
    let output = '';
    let code: number | null = null;
    while (attempts < ATTEMPTS) {
      attempts += 1;
      rmSync(OUT, { recursive: true, force: true });
      const run = lhci('collect');
      code = run.status;
      output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
      ({ reports, lhrs } = await collected());
      short = shortOfRuns(
        lhrs.map((lhr) => lhr.finalUrl),
        RUNS,
        planned,
      );
      // Значения считаются по полному набору: на неполном каждая недостача была бы названа
      // дважды — и как недобранный отчёт, и как недобранное значение в нём.
      thin = short.length === 0 ? shortOfValues(lhrs, RUNS, audits) : [];
      if (reports.length > 0 && short.length === 0 && thin.length === 0) break;
    }

    if (reports.length === 0) {
      return fail(`lhci collect не оставил ни одного отчёта (попыток ${attempts}, код ${code})`);
    }
    if (short.length > 0) {
      const lines = short.map((line) => `  ${line}`);
      return fail(
        `набор не сошёлся с планом сбора (попыток ${attempts}) — маршрутов в плане ${planned.length}, ` +
          `медиана считалась бы не по ${RUNS} прогонам:\n` +
          lines.join('\n'),
      );
    }
    if (thin.length > 0) {
      const lines = thin.map((line) => `  ${line}`);
      return fail(
        `отчётов ${reports.length}, но аудит дал число не в каждом (попыток ${attempts}) — ` +
          'медиана считалась бы по остатку (`values.filter(isFiniteNumber)`, ' +
          '@lhci/utils/src/assertions.js):\n' +
          lines.join('\n'),
      );
    }
    // Набор полон — но полный набор не оправдывает ненулевой код сам по себе: отчёты
    // пройденных адресов остаются на диске и после обрыва обхода.
    if (code !== 0 && !profileCleanupRace(output, process.platform)) {
      const lines = output.trimEnd().split('\n').slice(-10);
      return fail(
        `lhci collect вернул ${code}, и это не уборка профиля Chrome (попыток ${attempts}):\n` +
          lines.map((line) => `  ${line}`).join('\n'),
      );
    }

    const assert = lhci('assert');
    if (!existsSync(RESULTS)) {
      const verdict = `${assert.stdout ?? ''}${assert.stderr ?? ''}`.trim();
      return fail(`lhci assert не оставил ${RESULTS}\n${verdict}`);
    }

    const results = JSON.parse(await readFile(RESULTS, 'utf8')) as AssertionResult[];
    const broken = results.filter((entry) => !entry.passed && entry.level === 'error');
    if (broken.length > 0) {
      // Маршрут, имя утверждения и все значения прогонов: без них в логе стоит
      // «categories: 0.85», по которому не видно ни категории, ни маршрута, ни того,
      // разошлись прогоны между собой или просели все три.
      const lines = broken.map((entry) => {
        const name = [entry.auditId ?? entry.name, entry.auditProperty].filter(Boolean).join(':');
        const runs = entry.values ? ` (прогоны: ${entry.values.join(', ')})` : '';
        return `  ${route(entry.url)} ${name}: ${entry.actual} против ${entry.expected}${runs}`;
      });
      return fail(`нарушено утверждений: ${broken.length}\n${lines.join('\n')}`);
    }
    if (assert.status !== 0) {
      return fail(`lhci assert вернул ${assert.status} без разобранных нарушений`);
    }
    const retry = attempts > 1 ? `, сборов ${attempts}` : '';
    const disk = code === 0 ? '' : `, код сбора ${code}: уборка профиля Chrome после обхода`;
    return pass(
      `отчётов ${reports.length}: маршрутов ${planned.length} × прогонов ${RUNS}; ` +
        `сверяемых утверждений ${audits.length}, значений у каждого ${RUNS}${retry}${disk}`,
    );
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
