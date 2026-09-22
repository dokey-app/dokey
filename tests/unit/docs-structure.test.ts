import { glob, readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';

// RUN-01. Структура документов: markdown, который рендерится не тем, чем написан.
// Оба правила ловят повреждения, возникающие при правке абзацев и таблиц скриптом:
// съеденная пустая строка меняет смысл разметки молча, и в исходнике это не видно.

// Все файлы `docs/**/*.md` (80 штук, ≈ 2 МБ) читаются один раз на файл тестов, а не на
// случай: чтение на каждый случай упиралось в таймаут 5 с на холодном дереве (T-238).
let docs: { path: string; lines: string[] }[] = [];

beforeAll(async () => {
  const paths: string[] = [];
  for await (const path of glob('docs/**/*.md')) paths.push(path);
  docs = await Promise.all(
    paths.map(async (path) => ({ path, lines: (await readFile(path, 'utf8')).split(/\r?\n/) })),
  );
  // Пустая выборка прошла бы оба правила молча: «пусто» за «проверено» не выдаётся.
  if (docs.length === 0) throw new Error('docs/**/*.md: не найдено ни одного файла');
}, 30_000);

describe('структура документов', () => {
  it('не превращает абзац в заголовок: перед `---` стоит пустая строка', () => {
    const broken: string[] = [];
    for (const { path, lines } of docs) {
      // Закрывающий `---` фронтматтера стоит вплотную к последнему полю — это не разметка.
      const frontmatter = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
      lines.forEach((line, index) => {
        if (index === frontmatter || !/^-{3,}\s*$/.test(line)) return;
        const previous = lines[index - 1];
        if (previous !== undefined && previous.trim() !== '') {
          broken.push(`${path}:${index + 1} — «${previous.slice(0, 60)}»`);
        }
      });
    }
    expect(broken).toEqual([]);
  });

  it('не оставляет строк таблицы вне таблицы', () => {
    const broken: string[] = [];
    for (const { path, lines } of docs) {
      lines.forEach((line, index) => {
        if (!line.startsWith('|')) return;
        const previous = lines[index - 1];
        const next = lines[index + 1];
        const isolated =
          (previous === undefined || previous.trim() === '') &&
          (next === undefined || !next.startsWith('|'));
        if (isolated) broken.push(`${path}:${index + 1} — «${line.slice(0, 60)}»`);
      });
    }
    expect(broken).toEqual([]);
  });
});
