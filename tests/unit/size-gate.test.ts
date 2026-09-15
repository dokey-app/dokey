import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { expand, scriptsOf, specifiersOf } from '../../scripts/gates/size.ts';

// RUN-01. Разбор G-02 (D-88, D-156): скрипт, импорт или файл бюджета, не узнанный разбором,
// выпадает из счёта молча — гейт недосчитывает, а не падает.

const GATE = resolve('scripts/gates/size.ts');

function fill(unit: string): string {
  return unit.repeat(Math.ceil((256 * 1024) / unit.length));
}

// Гейт целиком — отдельным процессом в каталоге фикстуры: `dist` и `.size-limit.json` он
// берёт из рабочего каталога.
async function gateOn(
  files: Record<string, string>,
): Promise<{ status: number | null; out: string }> {
  const root = await mkdtemp(join(tmpdir(), 'dokey-g02-'));
  try {
    const budget = {
      name: 'initial JS',
      measure: 'initial-js',
      path: 'dist/**/*.html',
      limit: '40 kB',
    };
    await writeFile(join(root, '.size-limit.json'), JSON.stringify([{ ...budget, gzip: true }]));
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    const run = spawnSync(process.execPath, ['--experimental-strip-types', GATE], {
      cwd: root,
      encoding: 'utf8',
    });
    return { status: run.status, out: run.stdout };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

// Обычный блок комментариев неминифицированного файла: слово `import` в первой строке.
const PROSE = [
  'Theme script: we import nothing here and run before paint',
  'so that the page does not flash in the wrong colour scheme',
  'the value comes from the media query and the stored choice',
  'which is never written by this file itself at all anyway',
  'see the design system readme for the token names we use',
];

describe('G-02: <script> в HTML', () => {
  it.each(['<!-->', '<!--->', '<!-- x --!>'])(
    'закрывает комментарий %s так же, как браузер',
    (comment) => {
      const html = `${comment}<script type="module" src="/_astro/a.js"></script><!-- хвост -->`;
      expect(scriptsOf(html).map((script) => script.src)).toEqual(['/_astro/a.js']);
    },
  );

  it('не обрывает тег на `>` внутри значения атрибута', () => {
    const html = '<script type="module" data-note="a>b" src="/_astro/a.js"></script>';
    expect(scriptsOf(html)).toEqual([{ src: '/_astro/a.js', code: '', module: true }]);
  });

  it('не считает закомментированный тег', () => {
    expect(scriptsOf('<!-- <script src="/_astro/a.js"></script> -->')).toEqual([]);
  });

  // Astro экранирует в значении атрибута только `&` и `"`: `<` доходит до сборки как есть.
  it.each([
    [
      '`<script>` в атрибуте',
      '<meta name="description" content="Кодирует тег <script> в URL">',
      '',
    ],
    ['`<!--` и `-->` в атрибутах', '<a title="<!--">x</a>', '<p title="-->">y</p>'],
    ['`<script>` в стилях', '<style>a::after{content:"<script>"}</style>', ''],
    ['элемент `script-card`', '<script-card></script-card>', ''],
  ])('находит скрипт рядом с: %s', (_, before, after) => {
    const html = `${before}<script type="module" src="/_astro/a.js"></script>${after}`;
    expect(scriptsOf(html).map((script) => script.src)).toEqual(['/_astro/a.js']);
  });

  it.each([`<a${'b'.repeat(50_000)}`, `<ab="${'c'.repeat(50_000)}`])(
    'разбирает незакрытый тег без отката: %#',
    (html) => {
      const started = performance.now();
      expect(scriptsOf(html)).toEqual([]);
      expect(performance.now() - started).toBeLessThan(1000);
    },
  );

  it.each(['</script foo>', '</script/>'])('закрывает скрипт тегом %s', (end) => {
    const html = `<script>var a=1${end}<script type="module" src="/_astro/a.js"></script>`;
    expect(scriptsOf(html).map((script) => script.src)).toEqual([undefined, '/_astro/a.js']);
  });
});

describe('G-02: статические импорты', () => {
  it.each([
    ['строковое имя', 'import{"a-b"as y}from"./a.js"'],
    ['имя не на ASCII', 'import{ñ}from"./a.js"'],
    ['блочный комментарий в клаузе', 'import{x/* (.; */}from"./a.js"'],
    ['строчный комментарий в клаузе', 'import{x// (.;\n}from"./a.js"'],
    ['export from со строковым именем', 'export{y as"b-c"}from"./a.js"'],
    ['import ради побочного эффекта', 'import"./a.js"'],
    ['экранированная кавычка в строковом имени', String.raw`import{"a\"b"as c}from"./a.js"`],
    ['комментарий после from', 'import a from/*c*/"./a.js"'],
    ['атрибуты импорта', 'import d from"./a.js"with{type:"json"}'],
  ])('находит импорт: %s', (_, code) => {
    expect(specifiersOf(code)).toEqual(['./a.js']);
  });

  it.each([
    [
      'комментарием со словом import',
      "// we import only what the first paint needs\nimport './p.js'\nimport { t } from './a.js'\n",
    ],
    [
      '`export let` без точки с запятой',
      "export let a, b\nimport './p.js'\nexport * from './a.js'\n",
    ],
  ])('не проглатывает импорт без `;` за %s', (_, code) => {
    expect(specifiersOf(code)).toEqual(['./p.js', './a.js']);
  });

  it('находит апостроф в спецификаторе и импорты подряд', () => {
    const code = `import"./it's.js";import{b}from"./b.js"\nexport*from'./c.js'`;
    expect(specifiersOf(code)).toEqual(["./it's.js", './b.js', './c.js']);
  });

  it('не принимает за статический импорт import(), import.meta и строку в export', () => {
    const code =
      'import("./a.js");const u=import.meta.url;export const p="./b.js";export default"./c.js"';
    expect(specifiersOf(code)).toEqual([]);
  });

  it.each([
    ['строка «export» в сравнении', 'if(a.dataset.action==="export")b.classList.add("x")'],
    ['строки с ключевыми словами', 'const k=["break","export","extends","import"]'],
    ['слово import внутри строки', 'throw Error("Cannot import "+name+"!")'],
    ['имя, начатое с import', 'importScripts("./w.js")'],
  ])('не выдумывает спецификатор: %s', (_, code) => {
    expect(specifiersOf(code)).toEqual([]);
  });

  // D-158: текст в форме импорта внутри комментария, JSDoc или строки — не ребро графа.
  it.each([
    ['закомментированный импорт', "// import { debug } from './debug.js';\nexport const x = 1;\n"],
    [
      'пример в JSDoc',
      "/**\n * @example\n * import { copy } from 'dokey-clipboard';\n */\nexport function copy() {}\n",
    ],
    [
      'пример кода в шаблонной строке',
      'const example = `\nimport jwt from "jsonwebtoken"\n`;\nexport { example };\n',
    ],
  ])('не принимает текст в форме импорта за импорт: %s', (_, code) => {
    expect(specifiersOf(code)).toEqual([]);
  });

  // Файл, сохранённый как UTF-8 с BOM: браузер снимает BOM при декодировании и грузит импорт.
  it('находит первый импорт файла, начатого с BOM', () => {
    const bom = String.fromCharCode(0xfeff);
    expect(specifiersOf(`${bom}import"./a.js";export*from"./b.js"`)).toEqual(['./a.js', './b.js']);
  });

  it('бросает на тексте, который не разбирается как модуль, а не молчит', () => {
    expect(() => specifiersOf('import { a } from "./a.js')).toThrow();
  });

  it('разбирает сотни килобайт враждебного ввода линейно', () => {
    const inputs = [
      fill(
        'export const q=function(e,t){return e.import?t:"export "+e};var z={export:1,import:2};',
      ),
      fill(`export${' '.repeat(5000)}x;`),
    ];
    const started = performance.now();
    for (const input of inputs) specifiersOf(input);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it.each([
    ['строчные', PROSE.map((line) => `// ${line}`).join('\n')],
    ['блочные', PROSE.map((line) => `/* ${line} */`).join('\n')],
  ])('разбирает комментарии со словом import без отката: %s', (_, comments) => {
    const started = performance.now();
    expect(specifiersOf(`${comments}\nimport"./a.js"`)).toEqual(['./a.js']);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe('G-02: граф маршрута', () => {
  it('считает файл классического <script src>, но импортов в нём не ищет', async () => {
    const { status, out } = await gateOn({
      'dist/index.html':
        '<script src="/shared.js"></script><script type="module" src="/m.js"></script>',
      'dist/shared.js': 'import"./dep.js";',
      'dist/m.js': 'import"./shared.js";',
      'dist/dep.js': `export const d=${JSON.stringify([...Array.from({ length: 200 }).keys()])};`,
      'dist/about/index.html': '<script src="/theme.js"></script>',
      'dist/theme.js':
        "// import { debug } from './debug.js';\ndocument.body.dataset.theme = 'dark';\n",
    });
    expect(out).not.toContain('ПРОВАЛ');
    expect(status).toBe(0);
    // shared.js встречен сначала классическим скриптом, потом импортом модуля — обходится.
    expect(out).toContain('максимум — / (shared.js, m.js, dep.js)');
  });

  it('валит маршрут на модуле, который не разбирается, и называет файл', async () => {
    const { status, out } = await gateOn({
      'dist/index.html': '<script type="module" src="/broken.js"></script>',
      'dist/broken.js': 'import { a } from "./a.js',
    });
    expect(status).toBe(1);
    expect(out).toContain('/: broken.js не разбирается как модуль');
  });
});

describe('G-02: предмет бюджета', () => {
  it('шрифты критического пути — три файла D-157, без глоба по семейству', async () => {
    const budgets = JSON.parse(await readFile('.size-limit.json', 'utf8')) as {
      name: string;
      path: string | string[];
    }[];
    const fonts = budgets.find((budget) => budget.name.startsWith('шрифты критического пути'));
    expect(fonts?.path).toEqual([
      'dist/fonts/manrope-400.woff2',
      'dist/fonts/manrope-600.woff2',
      'dist/fonts/jetbrains-mono-400.woff2',
    ]);
  });

  it('называет путь бюджета, который не совпал ни с одним файлом', async () => {
    expect(await expand(['package.json', 'no-such-file.json'])).toEqual({
      files: ['package.json'],
      missing: ['no-such-file.json'],
    });
  });
});
