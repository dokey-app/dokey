import { readdir, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// RUN-01. У job без `timeout-minutes` потолок GitHub — 6 часов: зависший прогон держит раннер
// сутки напролёт (T-228 — RUN-03, T-244 — остальные пять job'ов `pr.yml`, T-249 — `gates` и
// `image` в `release.yml`). Правило машинное, чтобы новый job без потолка ловился на месте, а не
// через шесть часов тишины, и оно распространяется на все workflow репозитория, а не на выбранный.

const WORKFLOWS = '.github/workflows';

// Хвостовой комментарий YAML отделён пробелом: `#` вплотную к значению — часть скаляра.
// Ведущий комментарий сюда не доходит, такие строки пропущены раньше.
function withoutComment(line: string): string {
  const at = line.search(/\s#/);
  return (at === -1 ? line : line.slice(0, at)).trimEnd();
}

// Потолок даёт только значение, из которого GitHub получит число: целое или дробное, в кавычках
// или без, и выражение `${{ … }}`, разворачиваемое в число на прогоне. Пустое значение — не одна
// форма, а шесть: `null`, `Null`, `NULL`, `~`, `''`, `""` и вовсе ничего дают у js-yaml 4.3.2
// `null` или пустую строку. Перечень пустых форм закрывал бы найденное, а не класс, поэтому
// список белый: всё, из чего числа не выходит (`abc`, `5m`, `false`, `[]`, `-5`), — не потолок.
function isCeiling(value: string): boolean {
  const scalar = /^(["'])(.*)\1$/.exec(value)?.[2] ?? value;
  return /^\d+(\.\d+)?$/.test(scalar) || /^\$\{\{.+\}\}$/.test(scalar);
}

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
  let seen = false;
  const close = () => {
    if (current !== undefined && !covered) problems.push(`${current}: нет timeout-minutes`);
    current = undefined;
    covered = false;
  };

  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    // Строка нулевого уровня закрывает блок jobs: дальше уже другой ключ workflow.
    if (!line.startsWith(' ')) break;
    // Ровно два пробела — уровень ключей job, другого содержимого на нём не бывает. Строка,
    // не разобранная как ключ, закрывает предыдущий job и сама идёт в проблемы: иначе
    // непонятый job наследовал бы чужой потолок и проходил молча.
    if (line.startsWith('  ') && !line.startsWith('   ')) {
      close();
      seen = true;
      const job = /^ {2}([A-Za-z_][\w-]*):$/.exec(withoutComment(line));
      if (job) current = job[1];
      else problems.push(`нераспознанный ключ job: ${line.trim()}`);
      continue;
    }
    // Значение отделено от ключа пробелом: `timeout-minutes:5` — не пара ключ-значение, на нём
    // падает и js-yaml, и GitHub, так что потолка эта строка не даёт.
    const timeout = /^ {4}timeout-minutes:(?:[ \t](.*))?$/.exec(withoutComment(line));
    if (timeout && isCeiling((timeout[1] ?? '').trim())) covered = true;
  }
  close();

  if (!seen) return ['блок jobs: пуст — проверять нечего'];
  return problems;
}

describe('потолок времени job в workflow', () => {
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

  // Ключ job, не подошедший под грамматику, молча наследовал потолок соседа сверху: непонятый
  // job проходил проверку. Ожидания сверены с js-yaml 4.3.2 — он на всех трёх видит job.
  it('ключ job в кавычках не прячется за потолком соседа', () => {
    const text = [
      'jobs:',
      '  lint:',
      '    timeout-minutes: 5',
      '    steps:',
      '      - run: x',
      '  "build":',
      '    steps:',
      '      - run: y',
    ].join('\n');
    expect(jobsWithoutTimeout(text)).toEqual(['нераспознанный ключ job: "build":']);
  });

  it('ключ job с цифры не прячется за потолком соседа', () => {
    const text = [
      'jobs:',
      '  lint:',
      '    timeout-minutes: 5',
      '    steps:',
      '      - run: x',
      '  2fa:',
      '    steps:',
      '      - run: y',
    ].join('\n');
    expect(jobsWithoutTimeout(text)).toEqual(['нераспознанный ключ job: 2fa:']);
  });

  it('хвостовой комментарий у ключа job не прячет job', () => {
    const text = [
      'jobs:',
      '  lint:',
      '    timeout-minutes: 5',
      '    steps:',
      '      - run: x',
      '  build: # сборка',
      '    steps:',
      '      - run: y',
    ].join('\n');
    expect(jobsWithoutTimeout(text)).toEqual(['build: нет timeout-minutes']);
  });

  // Файл насыщен комментариями, а значение потолка бывает и в кавычках, и выражением:
  // на всех этих формах js-yaml видит потолок, значит видит и проверка. `0` — тоже число, и
  // потолок он даёт; разумен ли он — предмет ревью значения, а не этой проверки.
  it('потолок засчитывается с комментарием, в кавычках и выражением', () => {
    for (const value of ['5 # запас', '"5"', "'5'", '${{ fromJSON(env.LIMIT) }}', '0']) {
      const text = [
        'jobs:',
        '  lint:',
        `    timeout-minutes: ${value}`,
        '    steps:',
        '      - run: x',
      ].join('\n');
      expect(jobsWithoutTimeout(text), value).toEqual([]);
    }
  });

  // Пустое значение бывает не только пропущенным: `null`, `Null`, `NULL`, `~`, `''`, `""` — то
  // же «ничего» YAML, и js-yaml 4.3.2 на всех даёт `null` или пустую строку. Числа GitHub из
  // них не получит, потолка нет ни в одной форме (T-250).
  it('пустое значение в любой форме — не потолок', () => {
    const suffixes = [
      '',
      ' ',
      '\t',
      ' null',
      ' Null',
      ' NULL',
      ' ~',
      " ''",
      ' ""',
      " ' '",
      ' # потом',
    ];
    for (const suffix of suffixes) {
      const text = [
        'jobs:',
        '  lint:',
        `    timeout-minutes:${suffix}`,
        '    steps:',
        '      - run: x',
      ].join('\n');
      expect(jobsWithoutTimeout(text), JSON.stringify(suffix)).toEqual([
        'lint: нет timeout-minutes',
      ]);
    }
  });

  // Перечень пустых форм закрыл бы найденное, а не класс: числа не выходит и из `abc`, `5m`,
  // `false`, `[]`, `-5` — js-yaml даёт строку, булево, список и отрицательное число, а GitHub
  // такой workflow отвергает. Потолком считается только то, что читается числом или `${{ … }}`.
  it('значение, из которого не выходит числа, — не потолок', () => {
    for (const value of ['abc', '5m', 'false', '[]', '-5']) {
      const text = [
        'jobs:',
        '  lint:',
        `    timeout-minutes: ${value}`,
        '    steps:',
        '      - run: x',
      ].join('\n');
      expect(jobsWithoutTimeout(text), value).toEqual(['lint: нет timeout-minutes']);
    }
  });

  // `timeout-minutes:5` без пробела — не пара ключ-значение: js-yaml 4.3.2 на таком файле падает
  // («bad indentation of a mapping entry»), и GitHub workflow не запустит. Потолка в файле нет,
  // и проверка это говорит, а не молчит из-за строки, похожей на значение.
  it('значение без пробела после двоеточия — не потолок', () => {
    const text = ['jobs:', '  lint:', '    timeout-minutes:5', '    steps:', '      - run: x'].join(
      '\n',
    );
    expect(jobsWithoutTimeout(text)).toEqual(['lint: нет timeout-minutes']);
  });

  it('файл без блока jobs — проблема, а не пустой список', () => {
    expect(jobsWithoutTimeout('name: PR\n')).toEqual(['нет блока jobs: — проверять нечего']);
    expect(jobsWithoutTimeout('jobs:\n')).toEqual(['блок jobs: пуст — проверять нечего']);
  });

  // Предмет правила — каждый workflow репозитория: зависание держит раннер одинаково, из какого
  // бы файла job ни пришёл (T-244 — `pr.yml`, T-249 — `release.yml`). Список файлов берётся из
  // каталога, а не пишется руками, иначе следующий заведённый workflow опять пройдёт молча.
  // `rebuild.yml` и `synthetic.yml` без потолка найдены в T-249 и правятся своей задачей: пока
  // они здесь как известное исключение, и каждое исключение подтверждается — как только потолок
  // там появится, случай станет красным и строка отсюда удалится, а не останется молча.
  const pending = ['rebuild.yml', 'synthetic.yml'];

  it('в каждом workflow потолок есть у каждого job', async () => {
    const names = (await readdir(WORKFLOWS)).filter((name) => /\.ya?ml$/.test(name)).toSorted();
    // Пустой или переименованный каталог выдал бы «пусто» за «проверено».
    expect(names).toEqual(expect.arrayContaining(['pr.yml', 'release.yml', ...pending]));

    const problems: string[] = [];
    for (const name of names) {
      const found = jobsWithoutTimeout(await readFile(`${WORKFLOWS}/${name}`, 'utf8'));
      if (pending.includes(name)) expect(found, name).not.toEqual([]);
      else problems.push(...found.map((problem) => `${name}: ${problem}`));
    }
    expect(problems).toEqual([]);
  });
});
