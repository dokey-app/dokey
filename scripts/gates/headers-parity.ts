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

function fromHeadersFile(text: string): Map<string, string> {
  const found = new Map<string, string>();
  // Разбор не должен зависеть от перевода строки: CRLF в этом файле уже один раз
  // сделал гейт зелёным на пустом множестве заголовков.
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s{2}([A-Za-z-]+):\s*(.+)$/.exec(line);
    if (!match) continue;
    const [, name = '', value = ''] = match;
    const key = name.toLowerCase();
    if (!WANTED.has(key) || found.has(key)) continue;
    found.set(key, normalize(value));
  }
  return found;
}

function fromNginxConf(text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of text.matchAll(/add_header\s+([A-Za-z-]+)\s+"([^"]*)"/g)) {
    const [, name = '', value = ''] = match;
    const key = name.toLowerCase();
    if (!WANTED.has(key) || found.has(key)) continue;
    found.set(key, normalize(value));
  }
  return found;
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

    if (problems.length > 0) return fail(problems.join('; '));
    return pass(
      `${CHECKED.length} заголовков совпадают в обеих копиях, ${PROD_ONLY} — только на проде`,
    );
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
