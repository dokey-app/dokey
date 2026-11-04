import { describe, expect, it } from 'vitest';
import { FONT_NAMES, hasUnsupported, isFontName } from '../../src/tools/ascii-art/logic.ts';
import { codePoints, matches, type Emoji } from '../../src/tools/emoji/logic.ts';
import { cryptoRandom, generateLorem } from '../../src/tools/lorem-ipsum/logic.ts';
import { numeronym } from '../../src/tools/numeronym/logic.ts';
import { obfuscate } from '../../src/tools/obfuscator/logic.ts';
import { MAX_CHANGES, MAX_LINES, diffLines, formatDiff } from '../../src/tools/text-diff/logic.ts';
import { textStats } from '../../src/tools/text-statistics/logic.ts';

describe('lorem ipsum', () => {
  const options = {
    paragraphs: 3,
    sentencesMin: 2,
    sentencesMax: 4,
    wordsMin: 5,
    wordsMax: 9,
    startWithLorem: true,
    asHtml: false,
  };

  it('соблюдает число абзацев, предложений и слов', () => {
    const paragraphs = generateLorem({ ...options, startWithLorem: false }, cryptoRandom).split(
      '\n\n',
    );
    expect(paragraphs).toHaveLength(3);
    for (const paragraph of paragraphs) {
      const sentences = paragraph.split('. ');
      expect(sentences.length).toBeGreaterThanOrEqual(2);
      expect(sentences.length).toBeLessThanOrEqual(4);
      for (const sentence of sentences) {
        const words = sentence.split(' ').length;
        expect(words).toBeGreaterThanOrEqual(5);
        expect(words).toBeLessThanOrEqual(9);
      }
    }
  });

  it('начинается с классической фразы и оборачивает абзацы по запросу', () => {
    const text = generateLorem({ ...options, asHtml: true }, cryptoRandom);
    expect(text.startsWith('<p>Lorem ipsum dolor sit amet, ')).toBe(true);
    expect(text.match(/<p>/g)).toHaveLength(3);
  });

  it('случайное целое остаётся в границах', () => {
    for (let i = 0; i < 1000; i += 1) {
      const value = cryptoRandom(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });
});

describe('статистика текста', () => {
  it('пустой текст — нули', () => {
    expect(textStats('')).toEqual({
      characters: 0,
      codePoints: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
      bytes: 0,
    });
  });

  it('символы, кодовые точки и байты считаются по-разному', () => {
    const stats = textStats('ключ 👍🏽');
    expect(stats.characters).toBe(6);
    expect(stats.codePoints).toBe(7);
    expect(stats.bytes).toBe(17);
  });

  it('слова, строки и абзацы', () => {
    const stats = textStats('Первая строка, ещё.\nВторая\n\nТретий абзац');
    expect(stats.words).toBe(6);
    expect(stats.lines).toBe(4);
    expect(stats.paragraphs).toBe(2);
  });
});

describe('маскирование строки', () => {
  const options = { keepFirst: 2, keepLast: 2, keepSpaces: true };

  it('скрывает середину', () => {
    expect(obfuscate('abcdefgh', options)).toBe('ab****gh');
  });

  it('пробелы сохраняются только по запросу', () => {
    expect(obfuscate('ab cd ef', options)).toBe('ab ** ef');
    expect(obfuscate('ab cd ef', { ...options, keepSpaces: false })).toBe('ab****ef');
  });

  it('эмодзи не режется пополам', () => {
    expect(obfuscate('a😀b😀c', { keepFirst: 1, keepLast: 1, keepSpaces: false })).toBe('a***c');
  });

  it('короткая строка остаётся целиком', () => {
    expect(obfuscate('abc', options)).toBe('abc');
  });
});

describe('нумероним', () => {
  it.each([
    ['internationalization', 'i18n'],
    ['kubernetes', 'k8s'],
    ['accessibility', 'a11y'],
    ['api', 'api'],
    ['ключ', 'к2ч'],
    ['big data, kubernetes!', 'big d2a, k8s!'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(numeronym(input)).toBe(expected);
  });
});

const kinds = (before: string, after: string) => {
  const result = diffLines(before, after);
  if (!result.ok) throw new Error(result.error);
  return result.lines.map((line) => `${line.kind}:${line.text}`);
};

describe('сравнение текстов', () => {
  it('равные тексты — без изменений', () => {
    const result = diffLines('a\nb', 'a\nb');
    expect(result).toMatchObject({ ok: true, added: 0, removed: 0 });
  });

  it('оба пустых — пустой результат', () => {
    expect(diffLines('', '')).toEqual({ ok: true, lines: [], added: 0, removed: 0 });
  });

  it('находит добавление, удаление и замену', () => {
    expect(kinds('a\nb\nc', 'a\nc\nd')).toEqual(['same:a', 'del:b', 'same:c', 'add:d']);
    expect(kinds('a\nb', 'a\nx')).toEqual(['same:a', 'del:b', 'add:x']);
    expect(kinds('', 'a')).toEqual(['add:a']);
    expect(kinds('a', '')).toEqual(['del:a']);
  });

  it('применённая правка даёт «стало»: проверка на случайных текстах', () => {
    const words = ['a', 'b', 'c', 'd'];
    for (let run = 0; run < 300; run += 1) {
      const text = () =>
        Array.from({ length: Math.floor(Math.random() * 12) }, () => {
          return words[Math.floor(Math.random() * words.length)];
        }).join('\n');
      const before = text();
      const after = text();
      const result = diffLines(before, after);
      if (!result.ok) throw new Error(result.error);
      const kept = (kind: string) =>
        result.lines.filter((line) => line.kind !== kind).map((line) => line.text);
      expect(kept('add').join('\n')).toBe(before);
      expect(kept('del').join('\n')).toBe(after);
    }
  });

  it('разные переводы строк не считаются отличием', () => {
    expect(diffLines('a\r\nb', 'a\nb')).toMatchObject({ added: 0, removed: 0 });
  });

  it('за порогами — объяснение, а не зависание', () => {
    const many = Array.from({ length: MAX_LINES + 1 }, (_, i) => i).join('\n');
    expect(diffLines(many, '')).toMatchObject({ ok: false });
    const left = Array.from({ length: MAX_CHANGES + 1 }, (_, i) => `a${i}`).join('\n');
    const right = Array.from({ length: MAX_CHANGES + 1 }, (_, i) => `b${i}`).join('\n');
    expect(diffLines(left, right)).toMatchObject({ ok: false });
  });

  it('текст для буфера — со знаками', () => {
    const result = diffLines('a\nb', 'a\nc');
    if (!result.ok) throw new Error(result.error);
    expect(formatDiff(result.lines)).toBe('  a\n- b\n+ c');
  });
});

describe('ASCII-арт', () => {
  it('имена шрифтов проверяются', () => {
    expect(FONT_NAMES).toContain('Standard');
    expect(isFontName('Slant')).toBe(true);
    expect(isFontName('Comic')).toBe(false);
  });

  it('неподдержанные символы распознаются', () => {
    expect(hasUnsupported('DoKey 123!\n')).toBe(false);
    expect(hasUnsupported('Привет')).toBe(true);
  });
});

describe('эмодзи', () => {
  const cat: Emoji = {
    unicode: '🐱',
    label: 'морда кота',
    hexcode: '1F431',
    group: 3,
    tags: ['животное'],
  };

  it('ищет по названию, метке и самому эмодзи', () => {
    expect(matches(cat, '')).toBe(true);
    expect(matches(cat, 'КОТА')).toBe(true);
    expect(matches(cat, 'животн')).toBe(true);
    expect(matches(cat, '🐱')).toBe(true);
    expect(matches(cat, 'собака')).toBe(false);
  });

  it('кодовые точки', () => {
    expect(codePoints('1F431')).toBe('U+1F431');
    expect(codePoints('1F468-200D-1F4BB')).toBe('U+1F468 U+200D U+1F4BB');
  });
});
