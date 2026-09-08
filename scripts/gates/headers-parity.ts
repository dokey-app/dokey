import { readFile } from 'node:fs/promises';
import { type Gate, fail, pass, runGate } from './gate.ts';

const HEADERS = 'infra/headers/_headers';
const NGINX = 'infra/docker/nginx.conf';

// Заголовки ответа живут в двух копиях: `_headers` хостинга и nginx образа (ST-03).
// Расхождение копий — известный вопрос Q-158; этот прогон делает его наблюдаемым,
// а не гипотетическим. Задача T-021 доводит сверку до кеш-правил.
const CHECKED = [
  'content-security-policy',
  'strict-transport-security',
  'referrer-policy',
  'x-content-type-options',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
];

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
    if (CHECKED.includes(key) && !found.has(key)) found.set(key, normalize(value));
  }
  return found;
}

function fromNginxConf(text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of text.matchAll(/add_header\s+([A-Za-z-]+)\s+"([^"]*)"/g)) {
    const [, name = '', value = ''] = match;
    const key = name.toLowerCase();
    if (CHECKED.includes(key) && !found.has(key)) found.set(key, normalize(value));
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

    if (problems.length > 0) return fail(problems.join('; '));
    return pass(`${CHECKED.length} заголовков совпадают в обеих копиях`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
