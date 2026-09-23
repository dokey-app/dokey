import { describe, expect, it } from 'vitest';
import { CASE_TIMEOUT, gateOn } from './harness.ts';

// Негативный прогон RUN-16 (D-106 п. 1, US-047 крит. 3, SEC-22): гейт равенства двух копий
// политики заголовков обязан краснеть на обеих половинах правила профиля D-150 п. 3 —
// `strict-transport-security` обязан быть в `_headers` и обязан отсутствовать в `nginx.conf`.
//
// Предмет суда — **пара фикстур**, а не настоящие `infra/headers/_headers` и
// `infra/docker/nginx.conf`: копировать и мутировать настоящие копии значило бы красить набор
// при каждой правке политики, и один дефект краснел бы дважды. Набор судит гейт, а не
// сегодняшнюю политику.
//
// Обе копии печатаются из одной таблицы `POLICY` — тем же приёмом, каким D-107 выводит их из
// `policy.ts`: шесть общих заголовков в фикстуре не могут разъехаться случайно, разъезжается
// только то, что случай разводит намеренно. Иначе случай краснел бы не тем, чем кажется.

const HEADERS = 'infra/headers/_headers';
const NGINX = 'infra/docker/nginx.conf';

const POLICY: readonly (readonly [string, string])[] = [
  ['Content-Security-Policy', "default-src 'self'; script-src 'self'; connect-src 'self'"],
  ['Referrer-Policy', 'no-referrer'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Permissions-Policy', 'camera=(), geolocation=(), microphone=()'],
  ['Cross-Origin-Opener-Policy', 'same-origin'],
  ['Cross-Origin-Resource-Policy', 'same-origin'],
];

const HSTS = 'Strict-Transport-Security';
const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload';

/** Где стоит HSTS в копии Cloudflare: в наборе `/*`, в частном правиле или нигде. */
type InHeaders = 'root' | 'private' | 'none';
/** Где стоит HSTS в копии nginx: нигде, на уровне `server` или внутри блока `location`. */
type InNginx = 'none' | 'server' | 'location';

/** Копия политики в диалекте Cloudflare. Отступ ровно два пробела — его требует разбор гейта. */
function headersFile(hsts: InHeaders): string {
  const lines = ['# Фикстура RUN-16: пара выведена из таблицы POLICY набора.', '', '/*'];
  for (const [name, value] of POLICY) lines.push(`  ${name}: ${value}`);
  if (hsts === 'root') lines.push(`  ${HSTS}: ${HSTS_VALUE}`);
  // Частное правило ставит только HSTS: одноимённого заголовка в `/*` при этом нет, и склейка
  // (`concatenated`) в приговор не попадает — случай судит переезд, а не склейку (T-236).
  if (hsts === 'private') lines.push('', '/sw.js', `  ${HSTS}: ${HSTS_VALUE}`);
  return `${lines.join('\n')}\n`;
}

/** Копия политики в диалекте nginx: набор один на все пути, на уровне `server`. */
function nginxConf(hsts: InNginx): string {
  const set = POLICY.map(([name, value]) => `    add_header ${name} "${value}" always;`);
  if (hsts === 'server') set.push(`    add_header ${HSTS} "${HSTS_VALUE}" always;`);
  const location = hsts === 'location' ? [`      add_header ${HSTS} "${HSTS_VALUE}" always;`] : [];
  return [
    '# Фикстура RUN-16: пара выведена из таблицы POLICY набора.',
    'http {',
    '  server {',
    '    listen 8080;',
    ...set,
    '',
    '    location / {',
    ...location,
    '      try_files $uri $uri/index.html =404;',
    '    }',
    '  }',
    '}',
    '',
  ].join('\n');
}

function pair(hsts: { headers?: InHeaders; nginx?: InNginx } = {}): Record<string, string> {
  return {
    [HEADERS]: headersFile(hsts.headers ?? 'root'),
    [NGINX]: nginxConf(hsts.nginx ?? 'none'),
  };
}

describe('RUN-16 на расходящейся паре копий', () => {
  // Сторожевой случай идёт первым: без него каждый `fail` ниже мог бы приходить из кривой
  // фикстуры, а не из внесённого нарушения, — красный по чужой причине засчитался бы за
  // проверку. Исход `pass` **вместе** с кодом 0: код — то, чем гейт пускает конвейер дальше.
  it(
    'пускает неизменённую пару: шесть заголовков равны, HSTS только на проде',
    async () => {
      const { code, verdict, out } = await gateOn('RUN-16', pair());
      expect(verdict.id, out).toBe('RUN-16');
      expect(verdict.status, out).toBe('pass');
      expect(code, out).toBe(0);
    },
    CASE_TIMEOUT,
  );
});
