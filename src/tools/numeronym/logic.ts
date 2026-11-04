/** internationalization → i18n: первая буква, число букв между, последняя. */
function shorten(word: string): string {
  const chars = Array.from(word);
  if (chars.length < 4) return word;
  return `${chars[0]}${chars.length - 2}${chars.at(-1)}`;
}

/** Слово — непрерывная последовательность букв и цифр; остальное остаётся на месте. */
export const numeronym = (text: string): string => text.replace(/[\p{L}\p{N}]+/gu, shorten);
