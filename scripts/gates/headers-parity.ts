import { readFile } from 'node:fs/promises';
import { type Gate, fail, pass, runGate } from './gate.ts';

const HEADERS = 'infra/headers/_headers';
const NGINX = 'infra/docker/nginx.conf';

// Заголовки ответа выводятся из одного источника — `infra/headers/policy.ts` (D-107):
// `_headers` для Cloudflare и `headers.conf` для nginx образа. Диалекты разные, политика
// одна. До T-021 генератора ещё нет, и прогон сравнивает две написанные руками копии
// поле за полем; после T-021 он перегенерирует оба артефакта и падает на диффе — это
// строго сильнее, потому что покрывает кеш-правила и любые будущие заголовки, не зная
// про поля вовсе.
const CHECKED: string[] = [
  'content-security-policy',
  'referrer-policy',
  'x-content-type-options',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
];

// Единственное объявленное различие профилей (D-150): HSTS ставит только прод. Образ его не
// ставит намеренно — политику своего периметра организация назначает сама (ИНВ-11). Проверка
// асимметрична и потому сильнее равенства: она ловит и пропажу заголовка на проде, и его
// возвращение в образ.
const PROD_ONLY = 'strict-transport-security';
const WANTED = new Set([...CHECKED, PROD_ONLY]);

function normalize(value: string): string {
  return value.replaceAll(/\s+/g, ' ').trim().replaceAll(/;$/g, '');
}

export function fromHeadersFile(text: string): Map<string, string> {
  const found = new Map<string, string>();
  // Значения берутся только из правила `/*`: в nginx набор один на все пути, и с ним
  // сравнивается то, что получает любая страница, а не первая попавшаяся строка файла —
  // CSP из одного `/sw.js` иначе сходила за CSP всего сайта (T-242).
  let inRoot = false;
  // Разбор не должен зависеть от перевода строки: CRLF в этом файле уже один раз
  // сделал гейт зелёным на пустом множестве заголовков.
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      inRoot = line.trim() === '/*';
      continue;
    }
    if (!inRoot) continue;
    const match = /^\s{2}([A-Za-z-]+):\s*(.+)$/.exec(line);
    if (!match) continue;
    const [, name = '', value = ''] = match;
    const key = name.toLowerCase();
    if (!WANTED.has(key) || found.has(key)) continue;
    found.set(key, normalize(value));
  }
  return found;
}

interface HeadersRule {
  path: string;
  set: Set<string>;
  unset: Set<string>;
}

function rulesOf(text: string): HeadersRule[] {
  const rules: HeadersRule[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      rules.push({ path: line.trim(), set: new Set(), unset: new Set() });
      continue;
    }
    const rule = rules.at(-1);
    if (!rule) continue;
    const unset = /^\s+!\s*([A-Za-z-]+)\s*$/.exec(line);
    if (unset) {
      rule.unset.add((unset[1] ?? '').toLowerCase());
      continue;
    }
    const set = /^\s+([A-Za-z-]+):/.exec(line);
    if (set) rule.set.add((set[1] ?? '').toLowerCase());
  }
  return rules;
}

// Cloudflare применяет все подходящие правила `_headers` по порядку, и одноимённый заголовок,
// уже поставленный прошлым правилом, не заменяет, а дописывает через запятую: на проде
// `/_astro/*` отдавал `public, max-age=0, must-revalidate, public, max-age=31536000, immutable`
// (T-234). Заменить значение можно только так: `! Name` в частном правиле, затем `Name: …`.
// Проверка статическая, чтобы склейка ловилась на сборке, а не на проде.
export function concatenated(text: string): string[] {
  const rules = rulesOf(text);
  const base = rules.find((rule) => rule.path === '/*');
  // Без `/*` сравнивать не с чем: пустой список здесь означал бы «не проверено», а гейт
  // напечатал бы его как «склейки нет» (T-240).
  if (!base) return [`${HEADERS}: нет правила /* — склейку частных правил проверить не с чем`];
  const problems: string[] = [];
  for (const rule of rules) {
    if (rule === base) continue;
    for (const name of rule.set) {
      if (base.set.has(name) && !rule.unset.has(name)) {
        problems.push(`${rule.path}: ${name} склеится со значением из /* — нет «! ${name}»`);
      }
    }
  }
  return problems;
}

// Сверяемый заголовок в частном правиле — расхождение с nginx по построению: образ ставит набор
// один раз на уровне `server`, а Cloudflare отдал бы этому пути своё значение (или только его).
// Одиночное `! Name` без повторной установки — то же расхождение: Cloudflare снимает заголовок
// с этого пути, а nginx его оставляет.
// `Cache-Control` не сверяется и частными правилами переопределяется законно (T-234).
export function outsideRoot(text: string): string[] {
  const problems: string[] = [];
  for (const rule of rulesOf(text)) {
    if (rule.path === '/*') continue;
    for (const name of new Set([...rule.set, ...rule.unset])) {
      if (!WANTED.has(name)) continue;
      if (rule.set.has(name)) {
        problems.push(`${rule.path}: ${name} задан вне /* — в nginx набор один на все пути`);
      } else {
        problems.push(
          `${rule.path}: ${name} снят вне /* — путь идёт без него, в nginx набор один на все пути`,
        );
      }
    }
  }
  return problems;
}

interface NginxDirective {
  // Цепочка блоков, в которых стоит директива: `['http', 'server', 'location = /sw.js']`.
  blocks: string[];
  words: string[];
}

// Не парсер nginx, а ровно столько, сколько нужно, чтобы знать блок директивы: слова, `;`, `{`,
// `}`, комментарий `#` с начала слова до конца строки и строки в кавычках, внутри которых
// `;`, `#` и скобки — текст (в CSP точки с запятой есть всегда).
function nginxDirectives(text: string): {
  directives: NginxDirective[];
  servers: number;
  broken: boolean;
} {
  const directives: NginxDirective[] = [];
  const blocks: string[] = [];
  let words: string[] = [];
  let word = '';
  let inWord = false;
  let servers = 0;
  let broken = false;
  const flush = (): void => {
    if (inWord) words.push(word);
    word = '';
    inWord = false;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i] ?? '';
    if ((c === '"' || c === "'") && !inWord) {
      let j = i + 1;
      while (j < text.length && text[j] !== c) {
        const next = text[j + 1] ?? '';
        if (text[j] === '\\' && (next === c || next === '\\')) {
          word += next;
          j += 2;
          continue;
        }
        word += text[j];
        j++;
      }
      if (j >= text.length) broken = true;
      inWord = true;
      i = j;
    } else if (c === '#' && !inWord) {
      while (i < text.length && text[i] !== '\n') i++;
    } else if (/\s/.test(c)) {
      flush();
    } else if (c === ';') {
      flush();
      if (words.length > 0) directives.push({ blocks: [...blocks], words });
      words = [];
    } else if (c === '{') {
      flush();
      const block = words.join(' ');
      if (block === 'server') servers++;
      blocks.push(block);
      words = [];
    } else if (c === '}') {
      flush();
      if (words.length > 0 || blocks.length === 0) broken = true;
      blocks.pop();
      words = [];
    } else {
      word += c;
      inWord = true;
    }
  }
  flush();
  if (words.length > 0 || blocks.length > 0) broken = true;
  return { directives, servers, broken };
}

function addHeaders(text: string): { blocks: string[]; key: string; value: string }[] {
  return nginxDirectives(text)
    .directives.filter((d) => d.words[0] === 'add_header' && d.words.length >= 3)
    .map((d) => ({
      blocks: d.blocks,
      key: (d.words[1] ?? '').toLowerCase(),
      value: d.words[2] ?? '',
    }));
}

// Значения берутся только с уровня `server`: `add_header` во вложенном блоке действует лишь на
// его пути, а с уровня `http` не наследуется, как только в `server` есть свой `add_header` —
// CSP из одного `location = /sw.js` иначе сходила за CSP всего сайта (T-243).
export function fromNginxConf(text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const { blocks, key, value } of addHeaders(text)) {
    if (blocks.at(-1) !== 'server') continue;
    if (!WANTED.has(key) || found.has(key)) continue;
    found.set(key, normalize(value));
  }
  return found;
}

// `add_header` во вложенном блоке снимает ВЕСЬ набор уровня `server` с путей этого блока (D-107),
// поэтому проблема — любой такой заголовок, а не только сверяемый: `Cache-Control` в
// `location /_astro/` оставил бы ассеты без CSP. Кеш задаётся через `map` на уровне `server`.
// Блоков `server` ровно один: набор сверяется в одном, второй шёл бы без проверки, а решать,
// какой из них «главный», гейт не берётся.
export function outsideServer(text: string): string[] {
  const { servers, broken } = nginxDirectives(text);
  const problems: string[] = [];
  if (broken) problems.push(`${NGINX}: скобки или кавычки не сбалансированы — блоки не разобраны`);
  if (servers === 0)
    problems.push(`${NGINX}: нет блока server — набор заголовков сверять не с чем`);
  if (servers > 1) {
    problems.push(
      `${NGINX}: блоков server — ${servers}, а набор сверяется в одном; остальные идут без проверки`,
    );
  }
  for (const { blocks, key } of addHeaders(text)) {
    const server = blocks.lastIndexOf('server');
    if (server === -1) {
      if (!WANTED.has(key)) continue;
      problems.push(
        `${blocks.join(' > ') || 'main'}: ${key} задан вне уровня server — в nginx набор один, на уровне server`,
      );
    } else if (server < blocks.length - 1) {
      problems.push(
        `${blocks.slice(server + 1).join(' > ')}: add_header ${key} внутри блока — снимает набор уровня server, путь идёт без сверяемых заголовков`,
      );
    }
  }
  return problems;
}

export const gate: Gate = {
  id: 'RUN-16',
  command: 'gate:headers-parity',
  claim: 'две копии заголовков ответа совпадают',
  enabledIn: 'Э-0',
  async run() {
    const [headersText, nginxText] = await Promise.all([
      readFile(HEADERS, 'utf8'),
      readFile(NGINX, 'utf8'),
    ]);
    const left = fromHeadersFile(headersText);
    const right = fromNginxConf(nginxText);

    const problems: string[] = [];
    for (const name of CHECKED) {
      const a = left.get(name);
      const b = right.get(name);
      if (a === undefined) problems.push(`${name}: нет в ${HEADERS}`);
      else if (b === undefined) problems.push(`${name}: нет в ${NGINX}`);
      else if (a !== b) problems.push(`${name}: «${a}» против «${b}»`);
    }

    if (left.get(PROD_ONLY) === undefined) problems.push(`${PROD_ONLY}: нет в ${HEADERS}`);
    if (right.get(PROD_ONLY) !== undefined) {
      problems.push(`${PROD_ONLY}: стоит в ${NGINX}, хотя это заголовок прода (D-150)`);
    }
    problems.push(...outsideServer(nginxText));
    problems.push(...outsideRoot(headersText));
    problems.push(...concatenated(headersText));

    if (problems.length > 0) return fail(problems.join('; '));
    return pass(
      `${CHECKED.length} заголовков правила /* и уровня server совпадают в обеих копиях, ` +
        `вне /* не заданы и не сняты, во вложенных блоках nginx add_header нет, ` +
        `${PROD_ONLY} — только на проде, ` +
        `частные правила ${HEADERS} заменяют заголовки /* , а не дописывают`,
    );
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
