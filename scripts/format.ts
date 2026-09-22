// Prettier по файлам репозитория, а не по рабочему каталогу (T-253).
//
// `prettier --check .` обходит файловую систему, поэтому в приговор попадало всё, что лежит
// рядом: каталоги внешней обвязки, чужие клоны, черновики. Такое исключается локально, через
// `.git/info/exclude`, а Prettier его не читает — и даже `--ignore-path .git/info/exclude` не
// помогает: шаблоны в файле исключений считаются относительно каталога самого файла, то есть
// `.claude/commands/orchestrate.md` там означал бы `.git/info/.claude/commands/orchestrate.md`.
// Класть такие пути в `.prettierignore` — значит вписывать в репозиторий знание о том, чего в нём
// нет, и дописывать строку под каждый новый инструмент рядом.
//
// Предмет форматирования — то, что составляет репозиторий: файлы индекса плюс новые файлы,
// которые ещё не добавлены, но и не исключены (`--cached --others --exclude-standard`). Список
// исключений здесь тот же, что у самого git: `.gitignore`, `.git/info/exclude`, глобальный
// `core.excludesFile`. В CI после checkout неотслеживаемых файлов нет, и список совпадает с
// деревом — состав проверки не меняется. `.prettierignore` продолжает действовать: Prettier
// применяет его и к явно переданным путям (`docs/`, `templates/` и прочие строки файла
// по-прежнему не форматируются).

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const write = process.argv.includes('--write');
const prettier = createRequire(import.meta.url).resolve('prettier/bin/prettier.cjs');

// CreateProcessW на Windows обрывает командную строку на 32 767 символах, и весь список путей
// репозитория в неё уже не влезает. Бюджет взят с запасом на путь к node.exe, путь к prettier
// и флаги; счёт идёт по символам, а не по числу файлов, потому что длина путей разная.
const ARGV_BUDGET = 24_000;

let listed: string;
try {
  listed = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (error) {
  console.error('git ls-files не выполнился: нужен git и рабочая копия репозитория.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Файл может числиться в индексе и быть удалён из рабочей копии — форматировать там нечего.
const files = listed.split('\0').filter((path) => path !== '' && existsSync(path));

// «Пусто» за «проверено» не выдаётся: пустой список означает сбой, а не зелёный прогон.
if (files.length === 0) {
  console.error('git ls-files не вернул ни одного существующего файла — проверять нечего.');
  process.exit(1);
}

const batches: string[][] = [];
let current: string[] = [];
let width = 0;
for (const file of files) {
  const cost = file.length + 3; // кавычки и разделяющий пробел
  if (current.length > 0 && width + cost > ARGV_BUDGET) {
    batches.push(current);
    current = [];
    width = 0;
  }
  current.push(file);
  width += cost;
}
batches.push(current);

const flags = [write ? '--write' : '--check', '--ignore-unknown', '--log-level', 'warn'];
let failed = false;
for (const batch of batches) {
  const run = spawnSync(process.execPath, [prettier, ...flags, ...batch], { stdio: 'inherit' });
  if (run.error) {
    console.error(run.error.message);
    process.exit(1);
  }
  if (run.status !== 0) failed = true;
}

if (failed) {
  console.error(`Prettier: файлов репозитория — ${files.length}, формат сошёлся не у всех.`);
  process.exit(1);
}

const verdict = write ? 'отформатированы' : 'формат сошёлся';
console.log(
  `Prettier: файлов репозитория — ${files.length}, пачек — ${batches.length}, ${verdict}.`,
);
