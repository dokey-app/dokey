import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { concatenated, fromHeadersFile, outsideRoot } from '../../scripts/gates/headers-parity.ts';

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
