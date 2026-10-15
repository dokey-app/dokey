import { describe, expect, it } from 'vitest';
import { DETECT_LIMIT_CHARS, choose, detect } from '../../src/detect/detect.ts';
import { EXAMPLE as JWT } from '../../src/tools/jwt/logic.ts';

const NOW = Date.UTC(2026, 9, 15);
const ids = (input: string) => detect(input, NOW).map((c) => c.id);
const winner = (input: string) => choose(detect(input, NOW), null)?.id ?? null;

describe('победитель лестницы', () => {
  it.each([
    [JWT, 'jwt'],
    [`Bearer ${JWT}`, 'jwt'],
    ['{"a":[1,2]}', 'json'],
    ['[1,2,3]', 'json'],
    ['f47ac10b-58cc-4372-a567-0e02b2c3d479', 'uuid'],
    ['01ARZ3NDEKTSV4RRFFQ69G5FAV', 'uuid'],
    ['https://example.com/a?b=1', 'url'],
    ['%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82', 'percent'],
    ['1767236400', 'timestamp'],
    ['1767236400000', 'timestamp'],
    ['2026-01-01T03:00:00Z', 'timestamp'],
    ['0J/RgNC40LLQtdGC', 'base64'],
    ['dGVzdA==', 'base64'],
  ])('%j → %s', (input, expected) => {
    expect(winner(input)).toBe(expected);
  });

  it.each([
    ['просто текст'],
    ['test'],
    ['42'],
    ['"строка JSON"'],
    ['1234567'],
    ['4102444800'], // 2100-01-01 — за верхней границей
    ['https://exa mple.com'],
    ['hello world'],
  ])('текст без кандидатов: %j — ничего не применяется само', (input) => {
    expect(winner(input)).toBeNull();
    expect(ids(input)).toEqual(['base64-encode', 'url-encode']);
  });
});

describe('кандидаты и порядок', () => {
  it('URL с percent-путём: URL побеждает, percent — следующим чипсом', () => {
    expect(ids('https://example.com/%D1%82')).toEqual([
      'url',
      'percent',
      'base64-encode',
      'url-encode',
    ]);
  });

  it('кодирование всегда в конце и не применяется само', () => {
    const candidates = detect('{"a":1}', NOW);
    expect(candidates.at(-2)).toMatchObject({ id: 'base64-encode', auto: false });
    expect(candidates.at(-1)).toMatchObject({
      id: 'url-encode',
      auto: false,
      output: '%7B%22a%22%3A1%7D',
    });
  });

  it('ручной выбор сильнее; исчезнувший ручной кандидат — снова автоматика', () => {
    const candidates = detect('1767236400', NOW);
    expect(choose(candidates, 'base64-encode')?.output).toBe('MTc2NzIzNjQwMA==');
    expect(choose(detect('{"a":1}', NOW), 'timestamp')?.id).toBe('json');
  });

  it('пустой и слишком большой ввод — без кандидатов', () => {
    expect(detect('   ', NOW)).toEqual([]);
    expect(detect('a'.repeat(DETECT_LIMIT_CHARS + 1), NOW)).toEqual([]);
  });
});

describe('результат кандидата', () => {
  it('JWT — header и payload', () => {
    const jwt = detect(JWT, NOW)[0]!;
    expect(jwt.output).toContain('"alg": "HS256"');
    expect(jwt.output).toContain('"name": "Ann Example"');
  });

  it('timestamp — строки с зоной', () => {
    const ts = detect('1767236400', NOW)[0]!;
    expect(ts.output).toContain('UTC: 1 января 2026, 03:00:00 UTC');
  });

  it('URL — компоненты и query', () => {
    const url = detect('https://example.com/a?tag=1&tag=2', NOW)[0]!;
    expect(url.output).toContain('Хост: example.com');
    expect(url.output).toContain('tag = 2');
  });
});
