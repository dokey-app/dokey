import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

// RUN-01. Предмет `pnpm format:check` — файлы репозитория, а не содержимое рабочего каталога
// (T-253). `prettier --check .` обходил файловую систему, и каталоги внешней обвязки рядом
// (`orchestrator/`, `.orchestrator/`), исключённые через `.git/info/exclude`, красили проверку.
// Проверка машинная, потому что вернуть обход каталога («`prettier --check .` же короче») или
// залепить симптом строкой в `.prettierignore` ничто не мешает: и то и другое снова позеленеет
// молча. Здесь закрыт класс, а не форма: что считается предметом, что им не считается и что
// обязано быть сбоем, а не зелёным прогоном.

const SCRIPT = resolve('scripts/format.ts');
const run = promisify(execFile);

// Кривой формат при любой настройке Prettier: два пробела в объявлении и нет точки с запятой.
const BAD = 'const  a=1\n';
const GOOD = 'const a = 1;\n';

type Spec = {
  // Всё, что оказывается в рабочем каталоге; `.prettierrc` добавляется сам.
  files?: Record<string, string>;
  // Пути, которые идут в индекс (`git add`); остальные остаются неотслеживаемыми.
  tracked?: string[];
  // Строки `.git/info/exclude` — локальные исключения, которых нет в репозитории.
  exclude?: string[];
  // Пути, добавленные в индекс и стёртые из рабочей копии.
  deleted?: Record<string, string>;
  // Каталог без `git init`: проверка идёт вне рабочей копии.
  repo?: false;
  // Репозиторий без единого файла: не пишется даже `.prettierrc`.
  empty?: true;
  // `git` не находится в `PATH`.
  noGit?: true;
  // Бюджет командной строки: сегодня весь список влезает в одну пачку, и разбиение достижимо
  // только так.
  budget?: number;
  write?: true;
  // Что прочитать из рабочего каталога после прогона.
  read?: string[];
};

type Ran = { status: number; out: string; after: Record<string, string> };

// Скрипт целиком — отдельным процессом во временном репозитории: предмет он берёт у git в
// рабочем каталоге. Процесс асинхронный, а не `spawnSync`: синхронный запуск держит поток
// воркера, и таймер Vitest при нём не срабатывает (T-241).
async function formatOn(spec: Spec): Promise<Ran> {
  const root = await mkdtemp(join(tmpdir(), 'dokey-t253-'));
  const git = (args: string[]) => run('git', args, { cwd: root, encoding: 'utf8' });
  try {
    if (spec.repo !== false) await git(['init', '--quiet']);

    // `.prettierrc` останавливает поиск конфигурации вверх по дереву: приговор во временном
    // каталоге не должен зависеть от того, что лежит выше него у хозяина машины.
    const files: Record<string, string> = spec.empty
      ? {}
      : { '.prettierrc': '{}\n', ...spec.files, ...spec.deleted };
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    if (spec.exclude) {
      await writeFile(join(root, '.git/info/exclude'), `${spec.exclude.join('\n')}\n`);
    }
    const tracked = [...(spec.tracked ?? []), ...Object.keys(spec.deleted ?? {})];
    if (tracked.length > 0) await git(['add', '--', ...tracked]);
    for (const path of Object.keys(spec.deleted ?? {})) await rm(join(root, path));

    const env: Record<string, string | undefined> = Object.fromEntries(
      // Ceiling останавливает поиск репозитория выше временного каталога: иначе «вне рабочей
      // копии» зависело бы от того, лежит ли `%TEMP%` внутри чужого репозитория.
      Object.entries({ ...process.env, GIT_CEILING_DIRECTORIES: tmpdir() }).filter(
        // Имя `PATH` на Windows приходит как `Path`: пара ключей отдала бы дочернему процессу
        // и старое значение, и новое.
        ([name]) => !(spec.noGit && /^path$/i.test(name)),
      ),
    );
    if (spec.noGit) env.PATH = root;
    if (spec.budget !== undefined) env.DOKEY_ARGV_BUDGET = String(spec.budget);

    const args = ['--experimental-strip-types', SCRIPT, ...(spec.write ? ['--write'] : [])];
    let status = 0;
    let out = '';
    try {
      const done = await run(process.execPath, args, { cwd: root, encoding: 'utf8', env });
      out = done.stdout + done.stderr;
    } catch (error) {
      const failed = error as { code: number; stdout: string; stderr: string };
      status = failed.code;
      out = failed.stdout + failed.stderr;
    }

    const after: Record<string, string> = {};
    for (const path of spec.read ?? []) after[path] = await readFile(join(root, path), 'utf8');
    return { status, out, after };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

// Прогоны идут один раз на файл и параллельно: каждый — это node плюс Prettier, и по случаю
// они не укладываются в таймаут 5 с (T-241).
const FIXTURES: Record<string, Spec> = {
  'локально исключённый каталог': {
    files: { '.orchestrator/agents/task.md': '#  Заголовок\n', '.orchestrator/run.js': BAD },
    exclude: ['/.orchestrator/'],
    tracked: ['.prettierrc'],
  },
  'каталог под .gitignore': {
    files: { '.gitignore': 'tmp/\n', 'tmp/junk.js': BAD },
    tracked: ['.prettierrc', '.gitignore'],
  },
  'отслеживаемый кривой формат': {
    files: { 'src/tool.ts': BAD, 'data/лестница уровней.json': '{"a":1,  "b":2}\n' },
    tracked: ['.prettierrc', 'src/tool.ts', 'data/лестница уровней.json'],
  },
  'новый файл до git add': {
    files: { 'src/fresh.ts': BAD },
    tracked: ['.prettierrc'],
  },
  'файл под .prettierignore': {
    files: { '.prettierignore': 'docs/\n', 'docs/note.js': BAD },
    tracked: ['.prettierrc', '.prettierignore', 'docs/note.js'],
  },
  'файл индекса без рабочей копии': {
    files: { 'src/kept.ts': GOOD },
    tracked: ['.prettierrc', 'src/kept.ts'],
    deleted: { 'src/gone.ts': GOOD },
  },
  'вне рабочей копии': { repo: false },
  'git не находится': { noGit: true },
  'пустой репозиторий': { empty: true },
  'длинный список целиком зелёный': {
    files: Object.fromEntries(
      Array.from({ length: 6 }, (_, index) => [`src/file-${index}.ts`, GOOD]),
    ),
    tracked: ['.prettierrc', ...Array.from({ length: 6 }, (_, index) => `src/file-${index}.ts`)],
    budget: 40,
  },
  'кривой формат в непервой пачке': {
    files: { 'src/aaa.ts': GOOD, 'src/zzz.ts': BAD },
    tracked: ['.prettierrc', 'src/aaa.ts', 'src/zzz.ts'],
    budget: 40,
  },
  'запись форматирует предмет и только его': {
    files: { 'src/tool.ts': BAD, '.orchestrator/run.js': BAD },
    exclude: ['/.orchestrator/'],
    tracked: ['.prettierrc', 'src/tool.ts'],
    write: true,
    read: ['src/tool.ts', '.orchestrator/run.js'],
  },
};

describe('предмет проверки формата', () => {
  const ran = new Map<string, Ran>();

  beforeAll(async () => {
    const runs = await Promise.all(
      Object.entries(FIXTURES).map(async ([name, spec]): Promise<[string, Ran]> => {
        return [name, await formatOn(spec)];
      }),
    );
    for (const [name, result] of runs) ran.set(name, result);
  }, 180_000);

  // Фикстура без записанного прогона прошла бы молча: «пусто» за «проверено» не выдаётся.
  function ranOn(fixture: string): Ran {
    const result = ran.get(fixture);
    if (!result) throw new Error(`${fixture}: прогон скрипта не записан`);
    return result;
  }

  // Сам дефект T-253: каталог внешней обвязки рядом с репозиторием, исключённый локально.
  // Prettier `.git/info/exclude` не читает, поэтому обход каталога красит проверку, а список
  // git — нет.
  it('неотслеживаемый и локально исключённый файл — не предмет', () => {
    const { status, out } = ranOn('локально исключённый каталог');
    expect(out).not.toContain('.orchestrator');
    expect(out).toContain('формат сошёлся');
    expect(status).toBe(0);
  });

  it('файл под .gitignore — не предмет', () => {
    const { status, out } = ranOn('каталог под .gitignore');
    expect(out).not.toContain('junk.js');
    expect(status).toBe(0);
  });

  // Приговор обязан оставаться красным на том, ради чего проверка заведена. Путь с пробелом и
  // кириллицей — отдельная форма: пачка собирается по длине строк, а до Prettier пути доходят
  // аргументами процесса, не через оболочку.
  it('отслеживаемый файл с кривым форматом делает проверку красной', () => {
    const { status, out } = ranOn('отслеживаемый кривой формат');
    expect(out).toContain('src/tool.ts');
    expect(out).toContain('data/лестница уровней.json');
    expect(out).toContain('формат сошёлся не у всех');
    expect(status).toBe(1);
  });

  // Файл, который ещё не в индексе, но уже не исключён, — часть репозитория: иначе проверка
  // молчала бы ровно до `git add`, то есть на всей работе до коммита.
  it('новый файл до git add — уже предмет', () => {
    const { status, out } = ranOn('новый файл до git add');
    expect(out).toContain('src/fresh.ts');
    expect(status).toBe(1);
  });

  // `.prettierignore` — список отслеживаемых файлов, которые решено не форматировать. Prettier
  // применяет его и к явно переданным путям, и переход на список git этого не отменил.
  it('.prettierignore продолжает исключать отслеживаемый файл', () => {
    const { status, out } = ranOn('файл под .prettierignore');
    expect(out).not.toContain('docs/note.js');
    expect(status).toBe(0);
  });

  // Файл может числиться в индексе и быть стёрт из рабочей копии: Prettier упал бы на нём, и
  // проверка стала бы красной там, где формат ни при чём.
  it('файл индекса без рабочей копии не валит прогон', () => {
    const { status, out } = ranOn('файл индекса без рабочей копии');
    expect(out).toContain('формат сошёлся');
    expect(status).toBe(0);
  });

  // «Пусто» за «проверено» не выдаётся: там, где предмет не нашёлся, проверка падает. Иначе
  // сломанный вызов git давал бы самый зелёный прогон из возможных.
  it('вне рабочей копии — сбой, а не зелёный прогон', () => {
    const { status, out } = ranOn('вне рабочей копии');
    expect(out).toContain('нужен git');
    expect(status).toBe(1);
  });

  it('без git в PATH — сбой, а не зелёный прогон', () => {
    const { status, out } = ranOn('git не находится');
    expect(out).toContain('нужен git');
    expect(status).toBe(1);
  });

  it('пустой список — сбой, а не зелёный прогон', () => {
    const { status, out } = ranOn('пустой репозиторий');
    expect(out).toContain('ни одного существующего файла');
    expect(status).toBe(1);
  });

  // Командная строка Windows обрывается на 32 767 символах, поэтому список идёт пачками. Пока
  // репозиторий влезает в одну пачку, путь с разбиением проверяется только уменьшенным
  // бюджетом — иначе он сломается молча в тот день, когда файлов станет втрое больше.
  it('список длиннее бюджета идёт пачками и остаётся зелёным', () => {
    const { status, out } = ranOn('длинный список целиком зелёный');
    const batches = Number(/пачек — (\d+)/.exec(out)?.[1]);
    expect(batches).toBeGreaterThan(1);
    expect(status).toBe(0);
  });

  // Приговор пачки не должен теряться за приговором следующей: красное в любой пачке красит
  // прогон целиком.
  it('кривой формат в непервой пачке делает проверку красной', () => {
    const { status, out } = ranOn('кривой формат в непервой пачке');
    expect(out).toContain('src/zzz.ts');
    expect(status).toBe(1);
  });

  // `pnpm format` идёт тем же списком, что и `format:check`: запись правит предмет проверки и
  // не трогает чужое рядом — иначе форматтер переписывал бы файлы соседнего инструмента.
  it('запись форматирует предмет и не трогает локально исключённое', () => {
    const { status, after } = ranOn('запись форматирует предмет и только его');
    expect(after['src/tool.ts']).toBe(GOOD);
    expect(after['.orchestrator/run.js']).toBe(BAD);
    expect(status).toBe(0);
  });
});
