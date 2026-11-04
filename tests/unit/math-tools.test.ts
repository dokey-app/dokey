import { describe, expect, it } from 'vitest';
import { eta, formatDuration } from '../../src/tools/eta/logic.ts';
import { MAX_LENGTH, evaluate } from '../../src/tools/math/logic.ts';
import { changeBetween, percentOf, shareOf } from '../../src/tools/percentage/logic.ts';
import { formatNumber, parseDecimal } from '../../src/ui/number.ts';

const value = (input: string) => {
  const result = evaluate(input);
  if (!result.ok) throw new Error(`${input}: ${result.error}`);
  return result.text;
};

const error = (input: string) => {
  const result = evaluate(input);
  if (result.ok) throw new Error(`${input}: ожидалась ошибка, получено ${result.text}`);
  return result;
};

describe('разбор чисел', () => {
  it.each([
    ['15', 15],
    ['2,5', 2.5],
    [' 2.5 ', 2.5],
    ['-3', -3],
    ['1e3', 1000],
    ['.5', 0.5],
  ])('%s → %d', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(['', 'abc', '1,2,3', '1e999', 'Infinity', '0x10'])('«%s» — не число', (input) => {
    expect(parseDecimal(input)).toBeNull();
  });

  it('показывает без хвоста округления', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(1 / 3)).toBe('0.333333333333333');
  });
});

describe('калькулятор', () => {
  it.each([
    ['1 + 2 * 3', '7'],
    ['(1 + 2) * 3', '9'],
    ['10 / 4', '2.5'],
    ['10 % 3', '1'],
    ['2 ^ 10', '1024'],
    ['2 ^ 3 ^ 2', '512'],
    ['-2 ^ 2', '-4'],
    ['2 ^ -1', '0.5'],
    ['--3', '3'],
    ['5!', '120'],
    ['0!', '1'],
    ['3! + 1', '7'],
    ['sqrt(16)', '4'],
    ['log(100)', '2'],
    ['log(8, 2)', '3'],
    ['ln(e)', '1'],
    ['min(3, 1, 2)', '1'],
    ['max(3, 1, 2)', '3'],
    ['hypot(3, 4)', '5'],
    ['sin(0)', '0'],
    ['cos(pi)', '-1'],
    ['SQRT(4)', '2'],
    ['2 × 3 ÷ 2 − 1', '2'],
    ['1.5e3', '1500'],
    ['.5 + .5', '1'],
    ['0.1 + 0.2', '0.3'],
    ['  1  +  1  ', '2'],
  ])('%s = %s', (input, expected) => {
    expect(value(input)).toBe(expected);
  });

  it('ошибка называет причину и позицию', () => {
    expect(error('1 / 0')).toMatchObject({ error: 'Деление на ноль', position: 3 });
    expect(error('1 % 0')).toMatchObject({ error: 'Деление на ноль' });
    expect(error('(1 + 2')).toMatchObject({ error: 'Скобка не закрыта', position: 1 });
    expect(error('1 + 2)')).toMatchObject({ error: 'Лишняя закрывающая скобка', position: 6 });
    expect(error('1 +')).toMatchObject({ error: 'Выражение оборвано' });
    expect(error('2 $ 3')).toMatchObject({ position: 3 });
    expect(error('foo + 1')).toMatchObject({ error: 'Неизвестное имя «foo»', position: 1 });
    expect(error('foo(1)')).toMatchObject({ error: 'Неизвестная функция «foo»' });
    expect(error('3,14')).toMatchObject({ error: 'Дробную часть отделяйте точкой: 3.14' });
  });

  it('проверяет аргументы и диапазон', () => {
    expect(error('sqrt()').ok).toBe(false);
    expect(error('sqrt(1, 2)').error).toContain('аргументов должно быть 1');
    expect(error('sqrt(-1)').error).toContain('Результат не определён');
    expect(error('10 ^ 1000').error).toBe('Результат вне диапазона чисел');
    expect(error('171!').error).toBe('Результат вне диапазона чисел');
    expect(error('1.5!').error).toContain('Факториал');
  });

  it('имена из прототипа объекта — не функции и не константы', () => {
    expect(error('constructor(1)').error).toContain('Неизвестная функция');
    expect(error('toString').error).toContain('Неизвестное имя');
    expect(error('__proto__').error).toContain('Неизвестное имя');
    expect(error('constructor').error).toContain('Неизвестное имя');
  });

  it('глубокая вложенность и длинный ввод не роняют вкладку', () => {
    expect(error(`${'('.repeat(4000)}1${')'.repeat(4000)}`).error).toContain('Вложенность');
    expect(error('-'.repeat(5000)).error).toContain('Вложенность');
    expect(error('2^'.repeat(4000)).error).toContain('Вложенность');
    expect(error('1'.repeat(MAX_LENGTH + 1)).error).toContain('до 10000 знаков');
  });
});

describe('ETA', () => {
  const base = { total: 1000, done: 400, amount: 10, unitMs: 60_000, startMs: 0 };

  it('считает остаток, длительность и окончание', () => {
    expect(eta(base)).toEqual({
      ok: true,
      remaining: 600,
      durationMs: 3_600_000,
      finishMs: 3_600_000,
    });
  });

  it('объясняет невозможные числа', () => {
    expect(eta({ ...base, amount: 0 })).toMatchObject({ ok: false });
    expect(eta({ ...base, total: -1 })).toMatchObject({ ok: false });
    expect(eta({ ...base, done: 1001 })).toMatchObject({ ok: false });
    expect(eta({ ...base, total: 1e300, amount: 1e-300 })).toMatchObject({ ok: false });
  });

  it.each([
    [500, '500 мс'],
    [45_000, '45 с'],
    [3_600_000, '1 ч'],
    [5_400_000, '1 ч 30 мин'],
    [93_784_000, '1 дн 2 ч 3 мин'],
    [0, '0 мс'],
  ])('%d мс → %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe('проценты', () => {
  it('процент от числа', () => {
    expect(percentOf(15, 200)).toEqual({ ok: true, value: 30 });
  });

  it('доля', () => {
    expect(shareOf(30, 200)).toEqual({ ok: true, value: 15 });
    expect(shareOf(1, 0)).toMatchObject({ ok: false });
  });

  it('изменение', () => {
    expect(changeBetween(100, 120)).toEqual({ ok: true, value: 20 });
    expect(changeBetween(200, 100)).toEqual({ ok: true, value: -50 });
    expect(changeBetween(-100, -50)).toEqual({ ok: true, value: 50 });
    expect(changeBetween(0, 5)).toMatchObject({ ok: false });
  });
});
