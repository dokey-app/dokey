export interface TextStats {
  characters: number;
  codePoints: number;
  words: number;
  lines: number;
  paragraphs: number;
  bytes: number;
}

const graphemes = new Intl.Segmenter('ru', { granularity: 'grapheme' });
const wordSegments = new Intl.Segmenter('ru', { granularity: 'word' });

const count = (segments: Iterable<unknown>): number => {
  let total = 0;
  for (const _ of segments) total += 1;
  return total;
};

export function textStats(text: string): TextStats {
  let words = 0;
  for (const segment of wordSegments.segment(text)) if (segment.isWordLike) words += 1;
  return {
    // Символ — то, что человек видит одним знаком: 👍🏽 это один символ и две кодовые точки.
    characters: count(graphemes.segment(text)),
    codePoints: count(text),
    words,
    lines: text === '' ? 0 : text.split(/\r\n|\r|\n/).length,
    paragraphs: text.split(/(?:\r\n|\r|\n)\s*(?:\r\n|\r|\n)/).filter((p) => p.trim() !== '').length,
    bytes: new TextEncoder().encode(text).length,
  };
}
