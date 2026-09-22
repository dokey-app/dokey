import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// RUN-01. У job без `timeout-minutes` потолок GitHub — 6 часов: зависший прогон держит раннер
// сутки напролёт (T-228 — RUN-03, T-244 — остальные пять job'ов `pr.yml`). Правило машинное,
// чтобы новый job без потолка ловился на месте, а не через шесть часов тишины.

// Разбор фиксированной грамматики workflow, а не YAML вообще: ключ job — ровно два пробела
// отступа под `jobs:` на нулевом уровне, `timeout-minutes` job'а — ровно четыре. Глубже
// (шаги, блочные скаляры `run: |`) не считается: у шага свой `timeout-minutes`, и он раннер
// целиком не ограничивает.
export function jobsWithoutTimeout(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line === 'jobs:');
  // Пустая выборка прошла бы проверку молча: «пусто» за «проверено» не выдаётся.
  if (start === -1) return ['нет блока jobs: — проверять нечего'];

  const problems: string[] = [];
  let current: string | undefined;
  let covered = false;
  const close = () => {
    if (current !== undefined && !covered) problems.push(`${current}: нет timeout-minutes`);
  };

  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    // Строка нулевого уровня закрывает блок jobs: дальше уже другой ключ workflow.
    if (!line.startsWith(' ')) break;
    const job = /^ {2}([A-Za-z_][\w-]*):\s*$/.exec(line);
    if (job) {
      close();
      current = job[1];
      covered = false;
      continue;
    }
    if (/^ {4}timeout-minutes: *\d+\s*$/.test(line)) covered = true;
  }
  close();

  if (current === undefined) return ['блок jobs: пуст — проверять нечего'];
  return problems;
}

describe('потолок времени job в pr.yml', () => {
  it('job без timeout-minutes — проблема', () => {
    const text = [
      'jobs:',
      '  lint:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - run: x',
    ].join('\n');
    expect(jobsWithoutTimeout(text)).toEqual(['lint: нет timeout-minutes']);
  });

  it('timeout-minutes шага за job не засчитывается', () => {
    const text = [
      'jobs:',
      '  lint:',
      '    steps:',
      '      - run: x',
      '        timeout-minutes: 5',
    ].join('\n');
    expect(jobsWithoutTimeout(text)).toEqual(['lint: нет timeout-minutes']);
  });

  it('потолок виден у каждого job, а соседний job не покрывает следующий', () => {
    const text = [
      'jobs:',
      '  lint:',
      '    timeout-minutes: 5',
      '    steps:',
      '      - run: x',
      '  build:',
      '    steps:',
      '      - run: y',
      'permissions:',
      '  contents: read',
    ].join('\n');
    expect(jobsWithoutTimeout(text)).toEqual(['build: нет timeout-minutes']);
  });

  it('файл без блока jobs — проблема, а не пустой список', () => {
    expect(jobsWithoutTimeout('name: PR\n')).toEqual(['нет блока jobs: — проверять нечего']);
    expect(jobsWithoutTimeout('jobs:\n')).toEqual(['блок jobs: пуст — проверять нечего']);
  });

  // Предмет правила — конвейер PR. Остальные workflow под эту проверку заводятся своей задачей.
  it('в .github/workflows/pr.yml потолок есть у каждого job', async () => {
    const text = await readFile('.github/workflows/pr.yml', 'utf8');
    expect(jobsWithoutTimeout(text)).toEqual([]);
  });
});
