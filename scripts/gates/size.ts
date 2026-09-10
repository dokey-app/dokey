import { glob, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import filePlugin from '@size-limit/file';
import sizeLimit from 'size-limit';
import { type Gate, fail, pass, pending, runGate } from './gate.ts';

// G-02 «бюджеты веса» — NFR-03, NFR-06, NFR-18. Единственный источник бюджетов —
// `.size-limit.json`; счёт ведёт size-limit 13.0.3 (ADR-16) своим Node API, потому что
// бюджет, чьего предмета в сборке ещё нет, должен читаться как «предмета нет», а не как
// ошибка инструмента.
//
// «Initial JS» считается по определению D-88 (docs/decisions.md) — здесь ссылка, а не копия.
// У строки с `"measure": "initial-js"` в `path` лежат не файлы счёта, а корни графа — HTML
// маршрутов. Маршрут — каждый HTML сборки: это надмножество маршрутов реестра, и порог от
// этого строже, а не мягче. Спецификатор, который не разрешается в файл сборки, — провал:
// неразрешённое не может молча выпасть из счёта.

interface Budget {
  name: string;
  path: string | string[];
  limit: string;
  gzip?: boolean;
  measure?: string;
}

const DIST = resolve('dist');
const UNITS: Record<string, number> = { b: 1, kb: 1000, mb: 1000 * 1000 };

function toBytes(limit: string): number {
  const match = /^([\d.]+)\s*([a-zA-Z]+)$/.exec(limit.trim());
  if (!match) throw new Error(`бюджет «${limit}» не разобран`);
  const [, amount = '', unit = ''] = match;
  const factor = UNITS[unit.toLowerCase()];
  if (factor === undefined) throw new Error(`единица «${unit}» неизвестна`);
  return Number(amount) * factor;
}

async function expand(patterns: string | string[]): Promise<string[]> {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const files: string[] = [];
  for (const pattern of list) {
    for await (const entry of glob(pattern)) files.push(entry);
  }
  return files.toSorted();
}

async function measure(files: string[], gzip: boolean): Promise<number> {
  if (files.length === 0) return 0;
  const [result] = await sizeLimit([filePlugin], { checks: [{ files, gzip }] });
  return result?.size ?? 0;
}

// Комментарий и <script> ищутся одной регуляркой слева направо: закомментированный тег
// не исполняется, а `<!--` внутри кода скрипта не съедает следующий тег.
const TAG = /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

// Что браузер исполняет как JS: без `type`, «JavaScript MIME type» по HTML и `module`.
// JSON-LD, `importmap`, `speculationrules` — не JS. Параметры MIME отбрасываются:
// лишний счёт безопаснее недосчёта.
const JS_TYPES = new Set([
  '',
  'module',
  'application/ecmascript',
  'application/javascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript',
]);

// Статические `import … from`, `export … from` и `import "…"`. Между ключевым словом и
// `from` допустимы только имена, `{}`, `*`, `,` и пробелы — скобки и точки туда не входят,
// поэтому `import(` и `import.meta` не совпадают по построению.
const STATIC_IMPORT =
  /(?<![\w$.])(?:import|export)\s*(?:[\w$\s{},*]*?\bfrom\s*)?(["'])([^"'\r\n]+)\1/g;

interface Script {
  src: string | undefined;
  code: string;
  module: boolean;
}

function attributes(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, name = '', double, single, bare] of raw.matchAll(ATTR)) {
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, double ?? single ?? bare ?? '');
  }
  return map;
}

function scriptsOf(html: string): Script[] {
  const scripts: Script[] = [];
  for (const [tag, raw, code = ''] of html.matchAll(TAG)) {
    if (tag.startsWith('<!--') || raw === undefined) continue;
    const attrs = attributes(raw);
    const type = (attrs.get('type')?.split(';')[0] ?? '').trim().toLowerCase();
    if (!JS_TYPES.has(type)) continue;
    scripts.push({ src: attrs.get('src'), code, module: type === 'module' });
  }
  return scripts;
}

function specifiersOf(code: string): string[] {
  return [...code.matchAll(STATIC_IMPORT)].map(([, , specifier = '']) => specifier);
}

function display(file: string): string {
  return relative(DIST, file).split(sep).join('/');
}

function routeOf(html: string): string {
  return '/' + display(html).replace(/(^|\/)index\.html$/, '$1');
}

async function isFile(path: string): Promise<boolean> {
  return stat(path).then(
    (entry) => entry.isFile(),
    () => false,
  );
}

// `/…` — от корня сборки, `./` и `../` — от файла, где стоит спецификатор. Всё иное —
// URL, `//хост`, голое имя пакета — в сборке файла не имеет.
async function resolveSpecifier(specifier: string, from: string): Promise<string | undefined> {
  const path = specifier.replace(/[?#].*$/, '');
  let target: string;
  if (path.startsWith('/') && !path.startsWith('//')) target = join(DIST, path);
  else if (path.startsWith('./') || path.startsWith('../')) target = resolve(dirname(from), path);
  else return undefined;
  const inside = relative(DIST, target);
  if (inside.startsWith('..') || isAbsolute(inside)) return undefined;
  return (await isFile(target)) ? target : undefined;
}

interface RouteGraph {
  route: string;
  inline: string[];
  files: string[];
  problems: string[];
}

async function graphOf(htmlFile: string): Promise<RouteGraph> {
  const html = resolve(htmlFile);
  const route = routeOf(html);
  const inline: string[] = [];
  const edges: { specifier: string; from: string }[] = [];

  for (const script of scriptsOf(await readFile(html, 'utf8'))) {
    if (script.src !== undefined) {
      edges.push({ specifier: script.src, from: html });
    } else if (script.code.trim() !== '') {
      inline.push(script.code);
      if (script.module) {
        for (const specifier of specifiersOf(script.code)) edges.push({ specifier, from: html });
      }
    }
  }

  const files = new Set<string>();
  const problems: string[] = [];
  // Обход в ширину: for…of по массиву видит рёбра, дописанные по ходу.
  for (const { specifier, from } of edges) {
    const target = await resolveSpecifier(specifier, from);
    if (target === undefined) {
      problems.push(`${route}: «${specifier}» из ${display(from)} не разрешается в файл сборки`);
      continue;
    }
    if (files.has(target)) continue;
    files.add(target);
    for (const next of specifiersOf(await readFile(target, 'utf8'))) {
      edges.push({ specifier: next, from: target });
    }
  }

  return { route, inline, files: [...files], problems };
}

interface Outcome {
  line: string;
  broken: string[];
}

async function initialJs(budget: Budget, htmls: string[], limit: number): Promise<Outcome> {
  const scratch = await mkdtemp(join(tmpdir(), 'dokey-size-'));
  try {
    const routes: { graph: RouteGraph; size: number }[] = [];
    let counter = 0;
    for (const html of htmls) {
      const graph = await graphOf(html);
      // Инлайновый скрипт — во временный файл, чтобы его gzip считал тот же size-limit.
      const inlineFiles: string[] = [];
      for (const code of graph.inline) {
        const file = join(scratch, `inline-${(counter += 1)}.js`);
        await writeFile(file, code);
        inlineFiles.push(file);
      }
      const size = await measure([...graph.files, ...inlineFiles], budget.gzip !== false);
      routes.push({ graph, size });
    }

    const [top] = routes.toSorted((a, b) => b.size - a.size);
    const over = routes.filter((entry) => entry.size > limit);
    const broken = routes.flatMap((entry) => entry.graph.problems);
    if (over.length > 0) {
      const list = over.map((entry) => `${entry.graph.route} ${entry.size} B`).join(', ');
      broken.push(`${budget.name}: ${list} > ${limit} B`);
    }

    const parts = top
      ? [
          ...top.graph.inline.map((_, index) => `инлайн №${index + 1}`),
          ...top.graph.files.map(display),
        ]
      : [];
    const composition = parts.length > 0 ? parts.join(', ') : 'скриптов нет';
    const line =
      `  ${budget.name}: максимум ${top?.size ?? 0} B из ${limit} B, маршрутов ${routes.length};` +
      ` максимум — ${top?.graph.route} (${composition})`;
    return { line, broken };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

export const gate: Gate = {
  id: 'G-02',
  command: 'gate:size',
  claim: 'бюджеты веса сборки соблюдены',
  enabledIn: 'Э-0',
  async run() {
    let budgets: Budget[];
    try {
      budgets = JSON.parse(await readFile('.size-limit.json', 'utf8')) as Budget[];
    } catch {
      return fail('нет файла .size-limit.json — бюджеты негде объявить');
    }

    const lines: string[] = [];
    const broken: string[] = [];
    let measured = 0;

    for (const budget of budgets) {
      if (budget.measure !== undefined && budget.measure !== 'initial-js') {
        broken.push(`${budget.name}: способ счёта «${budget.measure}» неизвестен`);
        continue;
      }

      const files = await expand(budget.path);
      const limit = toBytes(budget.limit);

      if (files.length === 0) {
        lines.push(`  ${budget.name}: предмета в сборке нет, бюджет ${budget.limit}`);
        continue;
      }

      measured += 1;
      if (budget.measure === 'initial-js') {
        const outcome = await initialJs(budget, files, limit);
        lines.push(outcome.line);
        broken.push(...outcome.broken);
        continue;
      }

      const size = await measure(files, budget.gzip !== false);
      lines.push(`  ${budget.name}: ${size} B из ${limit} B (${files.length} файлов)`);
      if (size > limit) broken.push(`${budget.name}: ${size} B > ${limit} B`);
    }

    if (broken.length > 0) return fail(`${broken.join('; ')}\n${lines.join('\n')}`);
    if (measured === 0) return pending('Э-0 — ни у одного бюджета нет предмета в сборке');
    return pass(`${measured} из ${budgets.length} бюджетов измерены\n${lines.join('\n')}`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
