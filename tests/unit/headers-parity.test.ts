import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  concatenated,
  fromHeadersFile,
  fromNginxConf,
  outsideRoot,
  outsideServer,
} from '../../scripts/gates/headers-parity.ts';

// RUN-01. RUN-16: проверка склейки в `_headers` (T-234) сравнивает частные правила с набором
// из `/*`. Без `/*` сравнивать не с чем, и пустой список проблем — это «не проверено», а не
// «склейки нет» (T-240).

describe('RUN-16: склейка заголовков в _headers', () => {
  it('файл без правила /* — проблема с объяснением, а не пустой список', () => {
    const text = [
      '/',
      '  Cache-Control: public, max-age=0',
      '',
      '/_astro/*',
      '  Cache-Control: immutable',
    ].join('\n');
    const problems = concatenated(text);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('нет правила /*');
  });

  it('пустой файл — тоже проблема', () => {
    expect(concatenated('')).toHaveLength(1);
  });

  it('частное правило без «! Name» — склейка', () => {
    const text = '/*\n  Cache-Control: a\n\n/_astro/*\n  Cache-Control: b\n';
    expect(concatenated(text)).toEqual([
      '/_astro/*: cache-control склеится со значением из /* — нет «! cache-control»',
    ]);
  });

  it('текущий infra/headers/_headers — склейки нет', async () => {
    const text = await readFile('infra/headers/_headers', 'utf8');
    expect(concatenated(text)).toEqual([]);
  });
});

// RUN-16: сверка с nginx берёт значения только из `/*` — в образе набор один на все пути, и
// заголовок, заданный лишь частным правилом, на остальных страницах `_headers` отсутствует
// (T-242).
describe('RUN-16: сверяемые заголовки _headers — только в правиле /*', () => {
  const csp = "  Content-Security-Policy: default-src 'self'";
  const onlyInSw = ['/*', '  Referrer-Policy: no-referrer', '', '/sw.js', csp].join('\n');

  it('CSP только в /sw.js — в наборе /* её нет', () => {
    expect(fromHeadersFile(onlyInSw).has('content-security-policy')).toBe(false);
  });

  it('CSP только в /sw.js — проблема вне /*', () => {
    expect(outsideRoot(onlyInSw)).toEqual([
      '/sw.js: content-security-policy задан вне /* — в nginx набор один на все пути',
    ]);
  });

  it('частное правило переопределяет CSP через «!» — тоже проблема', () => {
    const text = ['/*', csp, '', '/sw.js', '  ! Content-Security-Policy', csp].join('\n');
    expect(fromHeadersFile(text).get('content-security-policy')).toBe("default-src 'self'");
    expect(outsideRoot(text)).toHaveLength(1);
  });

  it('одиночное «! Name» в частном правиле снимает CSP с пути — проблема', () => {
    const text = ['/*', csp, '', '/sw.js', '  ! Content-Security-Policy'].join('\n');
    expect(outsideRoot(text)).toEqual([
      '/sw.js: content-security-policy снят вне /* — путь идёт без него, в nginx набор один на все пути',
    ]);
  });

  it('Cache-Control в частных правилах не сверяется', () => {
    const text = '/*\n  Cache-Control: a\n\n/sw.js\n  ! Cache-Control\n  Cache-Control: b\n';
    expect(outsideRoot(text)).toEqual([]);
  });

  it('текущий infra/headers/_headers — все сверяемые заголовки в /*', async () => {
    const text = await readFile('infra/headers/_headers', 'utf8');
    expect(outsideRoot(text)).toEqual([]);
    expect(fromHeadersFile(text).size).toBe(7);
  });
});

// RUN-16: в nginx набор задаётся один раз на уровне `server`, а `add_header` во вложенном блоке
// снимает весь набор уровня выше (D-107). Значения для сверки берутся только с уровня `server`,
// а любой `add_header` во вложенном блоке — проблема, какой бы заголовок он ни ставил (T-243).
const conf = (server: string, http = ''): string =>
  ['http {', http, '  server {', '    listen 8080;', server, '  }', '}'].join('\n');

describe('RUN-16: add_header в nginx.conf — только на уровне server', () => {
  const csp = `add_header Content-Security-Policy "default-src 'self'; object-src 'none'" always;`;

  it('CSP только в location = /sw.js — в наборе server её нет', () => {
    const text = conf(`    location = /sw.js {\n      ${csp}\n    }`);
    expect(fromNginxConf(text).has('content-security-policy')).toBe(false);
  });

  it('CSP только в location = /sw.js — проблема вне server', () => {
    const text = conf(`    location = /sw.js {\n      ${csp}\n    }`);
    expect(outsideServer(text)).toEqual([
      'location = /sw.js: add_header content-security-policy внутри блока — снимает набор уровня server, путь идёт без сверяемых заголовков',
    ]);
  });

  it('любой add_header внутри location снимает набор server — проблема', () => {
    const text = conf(
      `    ${csp}\n    location /_astro/ {\n      add_header Cache-Control "immutable";\n    }`,
    );
    expect(fromNginxConf(text).get('content-security-policy')).toBe(
      "default-src 'self'; object-src 'none'",
    );
    expect(outsideServer(text)).toHaveLength(1);
    expect(outsideServer(text)[0]).toContain('location /_astro/: add_header cache-control');
  });

  it('add_header во вложенном if и location внутри location — тоже проблема', () => {
    const text = conf(
      `    ${csp}\n    location / {\n      location ~ [.]js$ {\n        add_header X-A "1";\n      }\n    }\n    if ($x) {\n      add_header X-B "2";\n    }`,
    );
    const problems = outsideServer(text);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('location / > location ~ [.]js$: add_header x-a');
    expect(problems[1]).toContain('if ($x): add_header x-b');
  });

  it('сверяемый заголовок на уровне http — проблема', () => {
    const text = conf('    add_header Cache-Control $dokey_cache always;', `  ${csp}`);
    expect(outsideServer(text)).toEqual([
      'http: content-security-policy задан вне уровня server — в nginx набор один, на уровне server',
    ]);
  });

  it('; # { } в кавычках и комментариях не ломают разбор блоков', () => {
    const text = conf(
      [
        '    # location /x { add_header X-C "3"; }',
        `    add_header Content-Security-Policy "a 'self'; b #c {d}" always; # хвост ; {`,
        '    location / {',
        '      try_files $uri =404; # add_header X-D "4";',
        '    }',
      ].join('\n'),
    );
    expect(fromNginxConf(text).get('content-security-policy')).toBe("a 'self'; b #c {d}");
    expect(outsideServer(text)).toEqual([]);
  });

  it('два блока server — проблема: второй шёл бы без сверки', () => {
    const text = `http {\n  server {\n    ${csp}\n  }\n  server {\n    listen 81;\n  }\n}`;
    expect(outsideServer(text)).toEqual([
      'infra/docker/nginx.conf: блоков server — 2, а набор сверяется в одном; остальные идут без проверки',
    ]);
  });

  it('нет блока server — проблема, а не пустой список', () => {
    expect(outsideServer(`http {\n  ${csp}\n}`)).toContain(
      'infra/docker/nginx.conf: нет блока server — набор заголовков сверять не с чем',
    );
  });

  it('несбалансированные скобки — проблема', () => {
    expect(outsideServer(conf('    location / {'))).toContain(
      'infra/docker/nginx.conf: скобки или кавычки не сбалансированы — блоки не разобраны',
    );
  });

  it('текущий infra/docker/nginx.conf — набор только на уровне server', async () => {
    const text = await readFile('infra/docker/nginx.conf', 'utf8');
    expect(outsideServer(text)).toEqual([]);
    expect(fromNginxConf(text).size).toBe(6);
  });
});
