import { readdir, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// RUN-01. У job без `timeout-minutes` потолок GitHub — 6 часов: зависший прогон держит раннер
// сутки напролёт (T-228 — RUN-03, T-244 — остальные пять job'ов `pr.yml`, T-249 — `gates` и
// `image` в `release.yml`, T-251 — `rebuild` и `probe`). Правило машинное, чтобы новый job без
// потолка ловился на месте, а не через шесть часов тишины, и оно распространяется на все
// workflow репозитория, а не на выбранный.

const WORKFLOWS = '.github/workflows';

// Хвостовой комментарий YAML отделён пробелом: `#` вплотную к значению — часть скаляра.
// Ведущий комментарий сюда не доходит, такие строки пропущены раньше.
function withoutComment(line: string): string {
  const at = line.search(/\s#/);
  return (at === -1 ? line : line.slice(0, at)).trimEnd();
}

// Потолок — положительное десятичное целое без знака и без ведущих нулей, в кавычках или без, — и
// выражение `${{ … }}`, разворачиваемое в число на прогоне. Числа мало: число должно подойти и
// потребителю, а документация GitHub требует от `timeout-minutes` «positive integer» («Fractional
// values are not supported. `timeout-minutes` must be a positive integer»), поэтому дробное (`5.5`,
// `5.0`, `"5.5"`) — не потолок, хотя число из него выходит (T-252), и `0` — тоже не потолок, хотя
// целое: положительным он не является, а у шага та же реализация при нуле потолка не ставит вовсе
// (T-254). Прочие числовые формы YAML (`+5`, `5e1`, `0x10`, `0o12`, `.5`, `5.`, `05`) число тоже
// дают, но здесь красные сознательно: расхождения с настоящим разбором держатся в сторону ложной
// красноты, а не молчания. Пустое значение — не одна форма, а семь: `null`, `Null`, `NULL`, `~`,
// `''`, `""` и вовсе ничего дают у js-yaml 4.3.2 `null` или пустую строку. Перечень непригодных
// форм закрывал бы найденное, а не класс, поэтому список белый: всё, что под него не подошло
// (`abc`, `5m`, `false`, `[]`, `-5`), — не потолок.
function isCeiling(value: string): boolean {
  const scalar = /^(["'])(.*)\1$/.exec(value)?.[2] ?? value;
  return /^[1-9]\d*$/.test(scalar) || /^\$\{\{.+\}\}$/.test(scalar);
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
  // на всех этих формах js-yaml видит потолок, значит видит и проверка.
  it('потолок засчитывается с комментарием, в кавычках и выражением', () => {
    for (const value of ['5 # запас', '"5"', "'5'", '${{ fromJSON(env.LIMIT) }}', '600']) {
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
  // такой workflow отвергает. Разделитель разрядов сюда же: `0_0` и `1_0` — числа YAML 1.1, а
  // js-yaml 4.3.2 (YAML 1.2) отдаёт из них строку. Потолком считается только то, что читается
  // положительным целым или `${{ … }}`.
  it('значение, из которого не выходит числа, — не потолок', () => {
    for (const value of ['abc', '5m', 'false', '[]', '-5', '0_0', '1_0']) {
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

  // Число из значения выходит, а потолка нет: документация GitHub о `timeout-minutes` требует
  // «positive integer», и собственная реализация GitHub того же ключа у шага при нуле потолка не
  // ставит вовсе — `actions/runner`, `src/Runner.Worker/StepsRunner.cs`: `if (timeoutMinutes > 0)
  // { var timeout = TimeSpan.FromMinutes(timeoutMinutes); step.ExecutionContext.SetTimeout(timeout);
  // }`. То есть `0` означает «потолка нет», а не «обрыв сразу», и засчитывать его — та же ложная
  // зелень, что дробное до T-252. `00` и `000` js-yaml 4.3.2 читает тем же нулём, кавычки меняют
  // тип скаляра, а не требование к значению, хвостовой комментарий значения не меняет (T-254).
  it('нулевое значение — не потолок', () => {
    for (const value of ['0', '00', '000', '"0"', "'0'", '0 # запас']) {
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

  // Числа из значения мало: число должно подойти и потребителю. Документация GitHub говорит о
  // `timeout-minutes` прямо — «Fractional values are not supported. `timeout-minutes` must be a
  // positive integer»; сказано это в разделе `steps[*].timeout-minutes`, а раздел
  // `jobs.<job_id>.timeout-minutes` о форме значения молчит. Молчание в белый список не пускается:
  // `5.5` js-yaml разбирает в число, GitHub потолка из него не даёт, и проверка обязана быть
  // красной, а не зелёной (T-252). Дробное в кавычках — то же самое: кавычки меняют тип скаляра,
  // а не требование к значению. `5.0` красное вместе с ними: значение целое, но форма дробная, и
  // расхождение держится в сторону ложной красноты.
  it('дробное значение — не потолок', () => {
    for (const value of ['5.5', '0.5', '5.0', '"5.5"', "'5.5'", '.5', '5.']) {
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

  // Целое число YAML даёт и из этих форм, но в workflow их не пишут, а белый список закрывает
  // класс «положительное десятичное целое без знака и без ведущих нулей»: всё прочее красное
  // сознательно, потому что ложная краснота останавливает автора строки, а ложная зелень — никого.
  // Ведущий ноль сюда же: js-yaml 4.3.2 читает `05` и `007` как `5` и `7`, но документация GitHub
  // говорит о «positive integer», а не о том, что делает с ведущим нулём её собственный разбор, и
  // молчание в белый список не пускается (T-252, T-254).
  it('экзотическая числовая форма — не потолок', () => {
    for (const value of ['+5', '5e1', '1e1', '0x10', '0o12', '05', '007']) {
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
  // бы файла job ни пришёл (T-244 — `pr.yml`, T-249 — `release.yml`, T-251 — `rebuild.yml` и
  // `synthetic.yml`). Исключений из правила больше нет, и списка исключений — тоже: пока список
  // существовал, файл в нём проходил по отдельному правилу («потолка нет»), а не по общему, и
  // после исправления его надо было не забыть опустошить. Список файлов берётся из каталога, а не
  // пишется руками, иначе следующий заведённый workflow опять пройдёт молча; четыре известных
  // названы отдельно, чтобы пустой или переименованный каталог не выдал «пусто» за «проверено».
  it('в каждом workflow потолок есть у каждого job', async () => {
    const names = (await readdir(WORKFLOWS)).filter((name) => /\.ya?ml$/.test(name)).toSorted();
    expect(names).toEqual(
      expect.arrayContaining(['pr.yml', 'rebuild.yml', 'release.yml', 'synthetic.yml']),
    );

    const problems: string[] = [];
    for (const name of names) {
      const found = jobsWithoutTimeout(await readFile(`${WORKFLOWS}/${name}`, 'utf8'));
      problems.push(...found.map((problem) => `${name}: ${problem}`));
    }
    expect(problems).toEqual([]);
  });
});
