import { describe, expect, it } from 'vitest';
import { CASE_TIMEOUT, failureOf, gateOn } from './harness.ts';

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
//
// Кеш-лестница копии Cloudflare печатается тем же приёмом из второй таблицы — `CACHE` — и в ту
// же фикстуру: без частных правил склейку (`concatenated`, T-234) судить не на чем, а отдельная
// фикстура под неё была бы второй копией таблицы заголовков и разъехалась бы с первой.

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

// Кеш-лестница настоящего `infra/headers/_headers`: набор `/*` задаёт общее значение, каждое
// частное правило сначала отсоединяет унаследованное строкой `! Cache-Control` и только потом
// ставит своё. `Cache-Control` гейтом не сверяется (в nginx он задан через `map`), но склейку
// `concatenated` ловит именно на нём — правило без строки снятия дописало бы своё значение к
// значению из `/*` через запятую (T-234).
const CACHE = 'Cache-Control';
const CACHE_ROOT = 'public, max-age=0, must-revalidate';
const CACHE_LADDER: readonly (readonly [string, string])[] = [
  ['/_astro/*', 'public, max-age=31536000, immutable'],
  ['/fonts/*', 'public, max-age=31536000, immutable'],
  ['/sw.js', 'no-cache'],
  ['/robots.txt', 'public, max-age=3600'],
];

/** Частное правило, в блок которого случаи кладут HSTS: своего блока для этого не заводится. */
const PRIVATE_RULE = '/sw.js';

/** Где стоит HSTS в копии Cloudflare: в наборе `/*`, в частном правиле или нигде. */
type InHeaders = 'root' | 'private' | 'none';
/** Где стоит HSTS в копии nginx: нигде, на уровне `server` или внутри блока `location`. */
type InNginx = 'none' | 'server' | 'location';

/**
 * Копия политики в диалекте Cloudflare. Отступ ровно два пробела — его требует разбор гейта.
 *
 * `concat` — единственный ввод нарушения склейки: перечень путей лестницы, у которых снята
 * строка `! Cache-Control`. Пустой перечень даёт правильную лестницу, и лишь она отличает
 * приговор про склейку от кривой фикстуры.
 */
function headersFile(hsts: InHeaders, concat: readonly string[] = []): string {
  const lines = ['# Фикстура RUN-16: пара выведена из таблиц POLICY и CACHE набора.', '', '/*'];
  for (const [name, value] of POLICY) lines.push(`  ${name}: ${value}`);
  if (hsts === 'root') lines.push(`  ${HSTS}: ${HSTS_VALUE}`);
  lines.push(`  ${CACHE}: ${CACHE_ROOT}`);
  for (const [path, value] of CACHE_LADDER) {
    lines.push('', path);
    if (!concat.includes(path)) lines.push(`  ! ${CACHE}`);
    lines.push(`  ${CACHE}: ${value}`);
    // Частное правило ставит HSTS в блок кеш-правила, а не в свой: одноимённого заголовка в `/*`
    // при `private` нет, и склейка (`concatenated`) в приговор не попадает — случай судит
    // переезд, а не склейку (T-236).
    if (hsts === 'private' && path === PRIVATE_RULE) lines.push(`  ${HSTS}: ${HSTS_VALUE}`);
  }
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

// Приговор гейта — **список** проблем, склеенный через `; `, и случаи сверяют его целиком
// (`toBe`), а не подстрокой: приговор с лишней проблемой прошёл бы молча, и красным оказалось бы
// не то нарушение, которое вносил случай. Половины правила профиля печатаются одна тем же
// текстом, что и в паре, где заголовок переехал, — там они идут обе и в этом порядке.
const GONE = 'strict-transport-security: нет в infra/headers/_headers';
const RETURNED =
  'strict-transport-security: стоит в infra/docker/nginx.conf, хотя это заголовок прода (D-150)';

/** Приговор гейта о склейке одного правила. Имена в нём — в нижнем регистре, как их видит гейт. */
function concatenates(path: string, name: string): string {
  return `${path}: ${name} склеится со значением из /* — нет «! ${name}»`;
}

function pair(
  knobs: { headers?: InHeaders; nginx?: InNginx; concat?: readonly string[] } = {},
): Record<string, string> {
  return {
    [HEADERS]: headersFile(knobs.headers ?? 'root', knobs.concat),
    [NGINX]: nginxConf(knobs.nginx ?? 'none'),
  };
}

describe('RUN-16 на расходящейся паре копий', () => {
  // Сторожевой случай идёт первым: без него каждый `fail` ниже мог бы приходить из кривой
  // фикстуры, а не из внесённого нарушения, — красный по чужой причине засчитался бы за
  // проверку. Исход `pass` **вместе** с кодом 0: код — то, чем гейт пускает конвейер дальше.
  it(
    'пускает неизменённую пару: шесть заголовков равны, HSTS только на проде, лестница снимает кеш',
    async () => {
      const { code, verdict, out } = await gateOn('RUN-16', pair());
      expect(verdict.id, out).toBe('RUN-16');
      expect(verdict.status, out).toBe('pass');
      expect(code, out).toBe(0);
    },
    CASE_TIMEOUT,
  );

  // Первая половина правила профиля (D-150 п. 3): HSTS обязан быть в копии прода.
  it(
    'валит пару, где HSTS пропал из _headers',
    async () => {
      const detail = await failureOf('RUN-16', pair({ headers: 'none' }));
      expect(detail).toBe(GONE);
    },
    CASE_TIMEOUT,
  );

  // Та же половина, но заголовок не пропал, а полуспрятался: в файле он есть, а страницы сайта
  // его не получают. Класс закрывается формой переезда, а не только пропажей, и приговор
  // называет обе стороны — и отсутствие в наборе `/*`, и частное правило.
  it(
    'валит пару, где HSTS в _headers стоит в частном правиле, а не в /*',
    async () => {
      const detail = await failureOf('RUN-16', pair({ headers: 'private' }));
      expect(detail).toBe(
        `${GONE}; /sw.js: strict-transport-security задан вне /* — в nginx набор один на все пути`,
      );
    },
    CASE_TIMEOUT,
  );

  // Вторая половина правила профиля: HSTS обязан отсутствовать в образе — политику своего
  // периметра организация назначает сама (ИНВ-11).
  it(
    'валит пару, где HSTS вернулся в nginx.conf на уровень server',
    async () => {
      const detail = await failureOf('RUN-16', pair({ nginx: 'server' }));
      expect(detail).toBe(RETURNED);
    },
    CASE_TIMEOUT,
  );

  // Та же вторая половина в форме переезда — и здесь случай пинует **наблюдаемое** поведение:
  // `fromNginxConf` берёт значения только с уровня `server`, поэтому HSTS внутри `location`
  // приговор называет не заголовком прода в образе, а снятым набором уровня `server`. Гейт при
  // этом красный, релиз не проходит; правка самого гейта — за границами задачи.
  it(
    'валит пару, где HSTS в nginx.conf спрятан внутрь location',
    async () => {
      const detail = await failureOf('RUN-16', pair({ nginx: 'location' }));
      expect(detail).toBe(
        'location /: add_header strict-transport-security внутри блока —' +
          ' снимает набор уровня server, путь идёт без сверяемых заголовков',
      );
    },
    CASE_TIMEOUT,
  );

  // Переезд целиком: обе половины нарушены разом. Случай пинует, что приговор называет обе, а не
  // останавливается на первой, — иначе вторая половина чинилась бы вслепую после первой.
  it(
    'валит пару, где HSTS переехал из _headers в nginx.conf, и называет обе половины',
    async () => {
      const detail = await failureOf('RUN-16', pair({ headers: 'none', nginx: 'server' }));
      expect(detail).toBe(`${GONE}; ${RETURNED}`);
    },
    CASE_TIMEOUT,
  );

  // Предмет T-236: частное правило без строки `! Cache-Control` не заменяет значение из `/*`, а
  // дописывает своё через запятую, и на проде `/_astro/*` отдавал обе половины разом (T-234).
  // Сборка с таким правилом обязана валить конвейер, а не уезжать на прод.
  it(
    'валит _headers, где /_astro/* задаёт Cache-Control без строки снятия',
    async () => {
      const detail = await failureOf('RUN-16', pair({ concat: ['/_astro/*'] }));
      expect(detail).toBe(concatenates('/_astro/*', 'cache-control'));
    },
    CASE_TIMEOUT,
  );

  // Класс, а не найденная форма: «без **любой** строки `! Cache-Control`» — это каждое правило
  // лестницы, и приговор обязан назвать их все разом, в порядке файла. Остановись гейт на
  // первом — остальные три чинились бы вслепую, по одному прогону на правило. Перечень берётся
  // из той же таблицы, что печатает фикстуру: пятая ступень войдёт в случай сама.
  it(
    'валит _headers, где строки снятия нет ни у одного правила лестницы, и называет все',
    async () => {
      const paths = CACHE_LADDER.map(([path]) => path);
      const detail = await failureOf('RUN-16', pair({ concat: paths }));
      expect(detail).toBe(paths.map((path) => concatenates(path, 'cache-control')).join('; '));
    },
    CASE_TIMEOUT,
  );
});
