import { describe, expect, it } from 'vitest';
import {
  FILE_CHUNK,
  classify,
  decodeBase64,
  encodeBytes,
  encodeText,
  formatSize,
  hexPreview,
  looksLikeBase64,
} from '../../src/tools/base64/logic.ts';

const text = (input: string): string => {
  const decoded = decodeBase64(input);
  if (!decoded.ok) throw new Error(decoded.error);
  const content = classify(decoded.bytes);
  if (content.kind !== 'text') throw new Error('ожидался текст');
  return content.text;
};

const error = (input: string): string => {
  const decoded = decodeBase64(input);
  if (decoded.ok) throw new Error(`ожидалась ошибка для ${input}`);
  return decoded.error;
};

describe('кодирование', () => {
  it('UTF-8, включая кириллицу и эмодзи', () => {
    expect(encodeText('Привет 👋', false)).toBe(Buffer.from('Привет 👋').toString('base64'));
  });

  it('URL-safe: - и _ вместо + и /, без паддинга', () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf]);
    expect(encodeBytes(bytes, false)).toBe('+/+/');
    expect(encodeBytes(bytes, true)).toBe('-_-_');
    expect(encodeText('a', true)).toBe('YQ');
  });

  it('большой буфер не переполняет стек', () => {
    const bytes = new Uint8Array(1_000_000).fill(7);
    expect(encodeBytes(bytes, false)).toBe(Buffer.from(bytes).toString('base64'));
  });

  it('base64 порций, кратных 3, склеивается в base64 целого', () => {
    const bytes = Uint8Array.from({ length: FILE_CHUNK * 2 + 5 }, (_, i) => i % 251);
    const parts = [];
    for (let i = 0; i < bytes.length; i += FILE_CHUNK) {
      parts.push(encodeBytes(bytes.subarray(i, i + FILE_CHUNK), false));
    }
    expect(parts.join('')).toBe(encodeBytes(bytes, false));
  });
});

describe('декодирование', () => {
  it.each([
    ['0J/RgNC40LLQtdGC', 'Привет'],
    ['YQ==', 'a'],
    ['YQ', 'a'],
    ['YWI=', 'ab'],
    ['YWI', 'ab'],
    ['  YWJj\nZGVm\r\n', 'abcdef'],
  ])('%j → %j', (input, expected) => {
    expect(text(input)).toBe(expected);
  });

  it('URL-safe алфавит', () => {
    const decoded = decodeBase64('-_-_');
    expect(decoded.ok && [...decoded.bytes]).toEqual([0xfb, 0xff, 0xbf]);
  });

  it.each([
    [
      'YWJjZ',
      'Некорректная base64-строка: длина не кратна четырём. Возможно, при копировании потерялся хвост',
    ],
    [
      'YQ=',
      'Некорректная base64-строка: длина не кратна четырём. Возможно, при копировании потерялся хвост',
    ],
    ['YW*j', 'Некорректная base64-строка: недопустимый символ на позиции 3'],
    ['YQ==YQ', 'Некорректная base64-строка: недопустимый символ на позиции 5'],
    ['Y===', 'Некорректная base64-строка: лишний знак = на позиции 4'],
    ['  ', 'Некорректная base64-строка: она пустая'],
  ])('ошибка для %j', (input, message) => {
    expect(error(input)).toBe(message);
  });

  it('ошибки не длиннее 120 знаков и не цитируют ввод', () => {
    const message = error('secret*value');
    expect(message.length).toBeLessThanOrEqual(120);
    expect(message).not.toContain('secret');
  });
});

describe('текст или двоичные данные', () => {
  it('UTF-8 с переводами строк — текст', () => {
    expect(classify(new TextEncoder().encode('a\tb\nc'))).toEqual({
      kind: 'text',
      text: 'a\tb\nc',
    });
  });

  it('невалидный UTF-8 и управляющие символы — двоичные данные', () => {
    expect(classify(new Uint8Array([0xff, 0xfe])).kind).toBe('binary');
    expect(classify(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).kind).toBe(
      'binary',
    );
    expect(classify(new Uint8Array([0x61, 0x00])).kind).toBe('binary');
  });

  it('looksLikeBase64: декодируется в текст — да; слово или мусор — нет', () => {
    expect(looksLikeBase64('0J/RgNC40LLQtdGC')).toBe(true);
    expect(looksLikeBase64('test')).toBe(false);
    expect(looksLikeBase64('hello world')).toBe(false);
    expect(looksLikeBase64('Привет')).toBe(false);
  });
});

describe('форматирование', () => {
  it('hex-превью: смещение и 16 байт в строке, обрезка с многоточием', () => {
    const bytes = Uint8Array.from({ length: 20 }, (_, i) => i);
    expect(hexPreview(bytes)).toBe(
      '00000000  00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f\n00000010  10 11 12 13',
    );
    expect(hexPreview(bytes, 16).endsWith('…')).toBe(true);
  });

  it('размер в десятичных единицах по-русски', () => {
    expect(formatSize(840)).toBe('840 Б');
    expect(formatSize(12_000)).toBe('12 КБ');
    expect(formatSize(1_400_000)).toBe('1,4 МБ');
  });
});
