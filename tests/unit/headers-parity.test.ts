import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { concatenated } from '../../scripts/gates/headers-parity.ts';

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
