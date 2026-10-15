import { describe, expect, it } from 'vitest';
import {
  EXAMPLE,
  detectMode,
  parseQuery,
  parseUrl,
  percentDecode,
  percentEncode,
} from '../../src/tools/url/logic.ts';

describe('percent-декодирование', () => {
  it.each([
    ['%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82', 'привет'],
    ['a%20b', 'a b'],
    ['a+b', 'a+b'],
    ['%F0%9F%91%8B', '👋'],
    ['без процентов', 'без процентов'],
    ['%2541', '%41'],
  ])('%j → %j', (input, expected) => {
    expect(percentDecode(input)).toEqual({ ok: true, text: expected });
  });

  it.each([
    ['%E0%', 'Оборванная percent-последовательность на позиции 4'],
    ['abc%4', 'Оборванная percent-последовательность на позиции 4'],
    ['%zz', 'Оборванная percent-последовательность на позиции 1'],
    ['ok%E0', 'Percent-последовательность на позиции 3 не складывается в символ UTF-8'],
    ['%FF%FE', 'Percent-последовательность на позиции 1 не складывается в символ UTF-8'],
  ])('ошибка для %j', (input, error) => {
    expect(percentDecode(input)).toEqual({ ok: false, error });
  });
});

describe('percent-кодирование', () => {
  it('как компонент URL', () => {
    expect(percentEncode('привет мир?&=/')).toEqual({
      ok: true,
      text: '%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82%20%D0%BC%D0%B8%D1%80%3F%26%3D%2F',
    });
  });

  it('непарный суррогат — понятная ошибка, а не исключение', () => {
    expect(percentEncode('\uD800').ok).toBe(false);
  });
});

describe('разбор URL', () => {
  it('пример: компоненты и query с повторяющимся ключом', () => {
    const result = parseUrl(EXAMPLE);
    if (!result.ok) throw new Error(result.error);
    expect(result.components).toEqual([
      { name: 'Схема', value: 'https' },
      { name: 'Хост', value: 'api.example.com' },
      { name: 'Порт', value: '8443' },
      { name: 'Путь', value: '/v1/search' },
      { name: 'Query', value: 'q=%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82&tag=json&tag=jwt&page=2' },
      { name: 'Фрагмент', value: 'results' },
    ]);
    expect(result.query.map((r) => [r.key, r.value])).toEqual([
      ['q', 'привет'],
      ['tag', 'json'],
      ['tag', 'jwt'],
      ['page', '2'],
    ]);
    expect(result.query[0]?.raw).toBe('q=%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82');
  });

  it('пустые компоненты не показываются', () => {
    const result = parseUrl('https://example.com');
    expect(result.ok && result.components.map((c) => c.name)).toEqual(['Схема', 'Хост', 'Путь']);
  });

  it('закодированный путь показывается ещё и декодированным', () => {
    const result = parseUrl('https://shop.test/cart/%D1%82%D0%BE%D0%B2%D0%B0%D1%80');
    expect(result.ok && result.components.filter((c) => c.name.startsWith('Путь'))).toEqual([
      { name: 'Путь', value: '/cart/%D1%82%D0%BE%D0%B2%D0%B0%D1%80' },
      { name: 'Путь, декодирован', value: '/cart/товар' },
    ]);
  });

  it('пользователь и пароль', () => {
    const result = parseUrl('ftp://user:pass@files.example.com/a');
    expect(result.ok && result.components.slice(0, 3)).toEqual([
      { name: 'Схема', value: 'ftp' },
      { name: 'Пользователь', value: 'user' },
      { name: 'Пароль', value: 'pass' },
    ]);
  });

  it.each([
    ['example.com/path', 'Некорректный URL: нет схемы. Добавьте https:// в начало'],
    ['mailto:a@b.c', 'Эта схема не разбирается — поддерживаются http, https, ws, wss, ftp, file'],
    ['https://exa mple.com', 'Некорректный URL: проверьте хост и порт'],
    ['http://example.com:99999', 'Некорректный URL: проверьте хост и порт'],
  ])('ошибка для %j', (input, error) => {
    expect(parseUrl(input)).toEqual({ ok: false, error });
  });
});

describe('query', () => {
  it('«+» — пробел, ключ без значения, пустые пары пропускаются, битое — как есть', () => {
    expect(parseQuery('?a=1+2&flag&&b=%E0&c=')).toEqual([
      { raw: 'a=1+2', key: 'a', value: '1 2' },
      { raw: 'flag', key: 'flag', value: '' },
      { raw: 'b=%E0', key: 'b', value: '%E0' },
      { raw: 'c=', key: 'c', value: '' },
    ]);
  });

  it('= внутри значения', () => {
    expect(parseQuery('token=a=b==')[0]).toEqual({
      raw: 'token=a=b==',
      key: 'token',
      value: 'a=b==',
    });
  });
});

describe('режим по вводу', () => {
  it.each([
    [EXAMPLE, 'parse'],
    ['  http://localhost:3000/x  ', 'parse'],
    ['example.com/path?x=1', 'parse'],
    ['localhost:8080', 'parse'],
    ['a%20b', 'decode'],
    ['mailto:a%40b.c', 'decode'],
    ['просто текст', 'encode'],
    ['a+b=c', 'encode'],
  ] as const)('%j → %s', (input, mode) => {
    expect(detectMode(input)).toBe(mode);
  });
});
