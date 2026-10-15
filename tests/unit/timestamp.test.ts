import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  EXAMPLE,
  detectUnit,
  formatInstant,
  isoLocal,
  parseTimestamp,
  relative,
  rows,
} from '../../src/tools/timestamp/logic.ts';

// Местное время проверяется в зоне со смещением в часах и минутах: UTC+5:45.
const originalTz = process.env['TZ'];
beforeAll(() => {
  process.env['TZ'] = 'Asia/Kathmandu';
});
afterAll(() => {
  process.env['TZ'] = originalTz;
});

const ms = (input: string, unit: 's' | 'ms' | null = null): number => {
  const parsed = parseTimestamp(input, unit);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.ms;
};

describe('единицы по числу цифр', () => {
  it.each([
    ['1767236400', 's'],
    ['0', 's'],
    ['-86400', 's'],
    ['1767236400.5', 's'],
    ['1767236400000', 'ms'],
    ['17672364000000', 'ms'],
    ['1767236400000000', null],
    ['abc', null],
  ] as const)('%s → %s', (input, unit) => {
    expect(detectUnit(input)).toBe(unit);
  });
});

describe('разбор', () => {
  it('секунды, миллисекунды, дробные секунды, отрицательные', () => {
    expect(ms('1767236400')).toBe(1767236400000);
    expect(ms(' 1767236400123 ')).toBe(1767236400123);
    expect(ms('1767236400.5')).toBe(1767236400500);
    expect(ms('-1')).toBe(-1000);
  });

  it('ручной выбор единиц сильнее числа цифр', () => {
    expect(ms('1767236400', 'ms')).toBe(1767236400);
    expect(ms('17672364', 'ms')).toBe(17672364);
  });

  it('ISO 8601 с зоной и без', () => {
    expect(parseTimestamp('2026-01-01T03:00:00Z')).toEqual({
      ok: true,
      ms: 1767236400000,
      source: 'iso',
      zoneAssumed: false,
    });
    expect(ms('2026-01-01T06:00:00+03:00')).toBe(1767236400000);
    expect(ms('2026-01-01 06:00+0300')).toBe(1767236400000);
    expect(ms('2026-01-01T03:00:00.123456Z')).toBe(1767236400123);
    expect(parseTimestamp('2026-01-01')).toMatchObject({ ms: 1767225600000, zoneAssumed: true });
  });

  it.each([
    ['', 'Ожидалось число секунд или миллисекунд Unix-времени либо дата ISO 8601'],
    ['вчера', 'Ожидалось число секунд или миллисекунд Unix-времени либо дата ISO 8601'],
    ['1767236400000000', 'Значение вне диапазона: ожидались секунды или миллисекунды Unix-времени'],
    ['2026-02-31', 'Некорректная дата: проверьте месяц, день и время'],
    ['2026-13-01T00:00Z', 'Некорректная дата: проверьте месяц, день и время'],
    ['2026-01-01T24:00Z', 'Некорректная дата: проверьте месяц, день и время'],
  ])('ошибка для %j', (input, error) => {
    expect(parseTimestamp(input)).toEqual({ ok: false, error });
  });

  it('секунды, выбранные вручную для 13 цифр, — вне диапазона', () => {
    expect(parseTimestamp('1767236400000', 's').ok).toBe(false);
  });
});

describe('вывод', () => {
  it('UTC и местное время всегда с зоной', () => {
    expect(formatInstant(1767236400, 'UTC', true)).toBe('1 января 2026, 03:00:00 UTC');
    expect(formatInstant(1767236400, undefined, true)).toBe('1 января 2026, 08:45:00 UTC+5:45');
  });

  it('ISO 8601 в местной зоне', () => {
    expect(isoLocal(1767236400000)).toBe('2026-01-01T08:45:00+05:45');
    expect(isoLocal(1767236400123)).toBe('2026-01-01T08:45:00.123+05:45');
  });

  it('относительное время', () => {
    expect(relative(0, 3600)).toBe('1 час назад');
  });

  it('строки результата: на сборке — без местного и относительного', () => {
    const built = rows(ms(EXAMPLE), false, null);
    expect(built).toEqual([
      { name: 'Секунды', value: '1767236400' },
      { name: 'Миллисекунды', value: '1767236400000' },
      { name: 'ISO 8601, UTC', value: '2026-01-01T03:00:00.000Z' },
      { name: 'UTC', value: '1 января 2026, 03:00:00 UTC' },
    ]);
    const full = rows(ms(EXAMPLE), true, 1767236400000 + 4 * 3600_000);
    expect(full.map((r) => r.name)).toEqual([
      'Секунды',
      'Миллисекунды',
      'ISO 8601, UTC',
      'UTC',
      'Местное время',
      'ISO 8601, местное',
      'Относительно сейчас',
    ]);
    expect(full.at(-1)?.value).toBe('4 часа назад');
  });

  it('секунды без разделителей разрядов и с округлением вниз для отрицательных', () => {
    expect(rows(-1500, false, null)[0]).toEqual({ name: 'Секунды', value: '-2' });
  });
});
