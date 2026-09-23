import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { glob, readFile } from 'node:fs/promises';
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

interface Preset {
  ci: { collect: { numberOfRuns: number } };
}

function lhci(...args: string[]) {
  return spawnSync('pnpm', ['exec', 'lhci', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

/**
 * Адреса, по которым собрано не `runs` отчётов. `lhci assert` делит отчёты по `finalUrl`
 * целиком, вместе с портом (`@lhci/utils/src/assertions.js`: `_.groupBy(lhrs, lhr =>
 * lhr.finalUrl)`), и медиану считает внутри группы. Группа из одного отчёта — это медиана
 * по одному прогону: приговор выносит единственный замер, а не середина трёх.
 */
export function shortOfRuns(finalUrls: string[], runs: number): string[] {
  const counted = new Map<string, number>();
  for (const url of finalUrls) counted.set(url, (counted.get(url) ?? 0) + 1);
  return [...counted]
    .filter(([, count]) => count !== runs)
    .map(([url, count]) => `${url}: отчётов ${count}, а не ${runs}`);
}

async function collected(): Promise<{ reports: string[]; urls: string[] }> {
  const reports: string[] = [];
  for await (const entry of glob(`${OUT}/lhr-*.json`)) reports.push(entry);
  const urls = await Promise.all(
    reports.map(async (report) => {
      const lhr = JSON.parse(await readFile(report, 'utf8')) as { finalUrl: string };
      return lhr.finalUrl;
    }),
  );
  return { reports, urls };
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
// Сбор и приговор разнесены на два шага вместо одного `lhci autorun`. Причина не в стиле:
// на Windows chrome-launcher убирает временный профиль раньше, чем Chrome отпускает файлы,
// и падает с EBUSY уже после того, как отчёты записаны. Код возврата шага сбора говорит
// в этом случае о состоянии диска, а не о метриках, — поэтому сбор судится по составу
// собранных отчётов, а пороги проверяет отдельный процесс `lhci assert`, который браузер
// не поднимает и такой гонки не имеет. Неполный набор пересчитывается заново (ATTEMPTS):
// досдать один прогон в старую группу нельзя — новый сбор поднимет новый порт.
export const gate: Gate = {
  id: 'G-01',
  command: 'gate:lh',
  claim: 'объявленные пороги скорости соблюдены: TTR, LCP, Lighthouse mobile',
  enabledIn: 'Э-0',
  async run() {
    if (!existsSync('dist')) return pending('Э-0 — нет каталога dist, сначала pnpm build');
    if (process.env['DOKEY_SKIP_LH'] === '1') {
      return pending('Э-0 — DOKEY_SKIP_LH=1, прогон отключён вручную');
    }

    const preset = JSON.parse(await readFile(RC, 'utf8')) as Preset;
    if (preset.ci.collect.numberOfRuns !== RUNS) {
      return fail(
        `${RC}: numberOfRuns ${preset.ci.collect.numberOfRuns}, а гейт судит по ${RUNS} прогонам`,
      );
    }

    let attempts = 0;
    let reports: string[] = [];
    let urls: string[] = [];
    let short: string[] = [];
    let code: number | null = null;
    while (attempts < ATTEMPTS) {
      attempts += 1;
      rmSync(OUT, { recursive: true, force: true });
      code = lhci('collect').status;
      ({ reports, urls } = await collected());
      short = shortOfRuns(urls, RUNS);
      if (reports.length > 0 && short.length === 0) break;
    }

    if (reports.length === 0) {
      return fail(`lhci collect не оставил ни одного отчёта за ${attempts} сбор(а), код ${code}`);
    }
    if (short.length > 0) {
      const lines = short.map((line) => `  ${line}`);
      return fail(
        `набор неполон за ${attempts} сбор(а) — медиана считалась бы не по ${RUNS} прогонам:\n` +
          lines.join('\n'),
      );
    }

    const assert = lhci('assert');
    if (!existsSync(RESULTS)) {
      const output = `${assert.stdout ?? ''}${assert.stderr ?? ''}`.trim();
      return fail(`lhci assert не оставил ${RESULTS}\n${output}`);
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
    const routes = new Set(urls).size;
    const retry = attempts > 1 ? `, сборов ${attempts}` : '';
    const disk = code === 0 ? '' : `, код сбора ${code} (гонка уборки Chrome)`;
    return pass(`отчётов ${reports.length} (${RUNS} прогонов × ${routes} маршрута)${retry}${disk}`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
