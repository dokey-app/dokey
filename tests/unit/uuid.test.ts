import { describe, expect, it } from 'vitest';
import {
  MAX_BATCH,
  createGenerator,
  inspect,
  parseCount,
  type InspectResult,
} from '../../src/tools/uuid/logic.ts';

const cryptoFill = (bytes: Uint8Array<ArrayBuffer>): void => {
  crypto.getRandomValues(bytes);
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const field = (result: InspectResult, name: string): string | undefined =>
  result.ok ? result.fields.find((f) => f.name === name)?.value : undefined;

describe('генерация', () => {
  it('v4: формат, версия 4, вариант RFC; 1000 значений различны', () => {
    const gen = createGenerator(cryptoFill);
    const values = Array.from({ length: MAX_BATCH }, () => gen.next('v4'));
    for (const v of values) {
      expect(v).toMatch(UUID);
      expect(v[14]).toBe('4');
      expect('89ab').toContain(v[19]);
    }
    expect(new Set(values).size).toBe(MAX_BATCH);
  });

  it('v7: время в первых 48 битах, версия 7', () => {
    const ms = Date.UTC(2026, 0, 1, 3);
    const v = createGenerator(cryptoFill, () => ms).next('v7');
    expect(v).toMatch(UUID);
    expect(v[14]).toBe('7');
    expect(field(inspect(v), 'Время')).toBe('2026-01-01T03:00:00.000Z');
  });

  it('v7: монотонны в одной миллисекунде, в том числе после исчерпания счётчика', () => {
    const gen = createGenerator(cryptoFill, () => 1_767_236_400_000);
    const values = Array.from({ length: 5000 }, () => gen.next('v7'));
    expect(values.toSorted()).toEqual(values);
    expect(new Set(values).size).toBe(values.length);
  });

  it('v7: часы назад не ломают порядок', () => {
    let now = 2000;
    const gen = createGenerator(cryptoFill, () => now);
    const a = gen.next('v7');
    now = 1000;
    const b = gen.next('v7');
    expect(b > a).toBe(true);
  });

  it('ULID: 26 символов Crockford, время в префиксе, монотонны в одной миллисекунде', () => {
    const gen = createGenerator(cryptoFill, () => 1_767_236_400_000);
    const values = Array.from({ length: 1000 }, () => gen.next('ulid'));
    for (const v of values) expect(v).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(values.toSorted()).toEqual(values);
    expect(new Set(values).size).toBe(values.length);
    expect(field(inspect(values[0]!), 'Время')).toBe('2026-01-01T03:00:00.000Z');
  });

  it('берёт байты только из переданного источника', () => {
    const gen = createGenerator(
      (bytes) => bytes.fill(0xab),
      () => 0,
    );
    expect(gen.next('v4')).toBe('abababab-abab-4bab-abab-abababababab');
  });
});

describe('количество', () => {
  it.each(['1', ' 10 ', String(MAX_BATCH)])('%j — да', (input) => {
    expect(parseCount(input)).toEqual({ ok: true, count: Number(input) });
  });

  it.each(['0', '', 'abc', '1.5', '-1', String(MAX_BATCH + 1)])('%j — ошибка', (input) => {
    expect(parseCount(input)).toEqual({
      ok: false,
      error: `Количество — целое число от 1 до ${MAX_BATCH}`,
    });
  });
});

describe('разбор', () => {
  it('v4: версия, вариант, каноническая запись из любой обычной формы', () => {
    const canonical = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    for (const input of [
      canonical,
      canonical.toUpperCase(),
      `{${canonical}}`,
      `urn:uuid:${canonical}`,
      canonical.replaceAll('-', ''),
      `  ${canonical}\n`,
    ]) {
      const result = inspect(input);
      expect(field(result, 'Версия')).toBe('4');
      expect(field(result, 'Вариант')).toBe('RFC 9562');
      expect(field(result, 'Запись')).toBe(canonical);
    }
  });

  it('v1: время из 60-битной метки (namespace DNS из RFC)', () => {
    const result = inspect('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    expect(field(result, 'Версия')).toBe('1');
    expect(field(result, 'Время')).toMatch(/^1998-02-04T22:13:53/);
  });

  it('Nil и Max', () => {
    expect(field(inspect('00000000-0000-0000-0000-000000000000'), 'Формат')).toBe('UUID, Nil');
    expect(field(inspect('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'), 'Формат')).toBe('UUID, Max');
  });

  it('вариант вне RFC — замечание, а не ошибка', () => {
    const result = inspect('f47ac10b-58cc-4372-c567-0e02b2c3d479');
    expect(field(result, 'Вариант')).toBe('Microsoft (устаревший)');
    expect(field(result, 'Замечание')).toBe('Версия или вариант вне RFC 9562');
  });

  it.each([
    ['f47ac10b-58cc-4372-a567-0e02b2c3d47', 'Ожидалось 32 шестнадцатеричные цифры, найдено 31'],
    ['f47ac10b-58cc-4372-a567-0e02b2c3d47z', 'Недопустимый символ на позиции 36'],
    ['  g47ac10b', 'Недопустимый символ на позиции 3'],
    ['01ARZ3NDEKTSV4RRFFQ69G5FAU', 'Недопустимый символ ULID на позиции 26'],
    ['81ARZ3NDEKTSV4RRFFQ69G5FAV', 'ULID вне диапазона: первый символ должен быть от 0 до 7'],
    ['', 'Вставьте UUID или ULID'],
  ])('ошибка для %j', (input, error) => {
    expect(inspect(input)).toEqual({ ok: false, error });
  });

  it('ULID из спецификации', () => {
    const result = inspect('01arz3ndektsv4rrffq69g5fav');
    expect(field(result, 'Формат')).toBe('ULID');
    expect(field(result, 'Время')).toBe('2016-07-30T23:54:10.259Z');
    expect(field(result, 'Запись')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
  });
});
