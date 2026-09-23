import { describe, expect, it } from 'vitest';
import { failureOf } from './harness.ts';

// Негативный прогон G-02 (D-106 п. 2, NFR-17, US-047 крит. 3): гейт бюджетов веса обязан
// краснеть на нарушающей сборке. Предмет суда здесь — **сборка целиком**; разбор HTML и
// импортов судит RUN-01 (tests/unit/size-gate.test.ts).

const BUDGET = {
  name: 'initial JS',
  measure: 'initial-js',
  path: 'dist/**/*.html',
  limit: '40 kB',
  gzip: true,
};

// Бюджет считается по сжатому размеру: повторяющаяся набивка ужалась бы до пары сотен байт и
// порога не тронула бы. Генератор — xorshift32 с постоянным зерном: ввод псевдослучайный, но
// один и тот же от прогона к прогону.
function incompressible(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const out: string[] = [];
  let seed = 0x20260923;
  for (let index = 0; index < length; index += 1) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    out.push(alphabet.charAt((seed >>> 0) % alphabet.length));
  }
  return out.join('');
}

function heavyModule(length: number): string {
  return `export const blob=${JSON.stringify(incompressible(length))};\n`;
}

describe('G-02 на нарушающей сборке', () => {
  it('валит сборку, чей initial JS больше бюджета, и называет маршрут', async () => {
    const detail = await failureOf('G-02', {
      '.size-limit.json': JSON.stringify([BUDGET]),
      'dist/index.html': '<script type="module" src="/big.js"></script>',
      'dist/big.js': heavyModule(100_000),
    });
    expect(detail).toContain('initial JS: /');
    expect(detail).toContain('> 40000 B');
  }, 60_000);
});
