// Рыбный текст из словаря Lorem Ipsum (Цицерон, общественное достояние).
// Случайность передаётся параметром: в браузере — crypto.getRandomValues, в тестах — фиксированная.

const WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  );

const OPENING = 'Lorem ipsum dolor sit amet';

export interface LoremOptions {
  paragraphs: number;
  sentencesMin: number;
  sentencesMax: number;
  wordsMin: number;
  wordsMax: number;
  startWithLorem: boolean;
  asHtml: boolean;
}

/** Случайное целое в [0, bound). */
export type RandomInt = (bound: number) => number;

const between = (random: RandomInt, min: number, max: number): number =>
  min + random(max - min + 1);

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

function sentence(random: RandomInt, length: number): string {
  const words = Array.from({ length }, () => WORDS[random(WORDS.length)]);
  return `${capitalize(words.join(' '))}.`;
}

export function generateLorem(options: LoremOptions, random: RandomInt): string {
  const paragraphs = Array.from({ length: options.paragraphs }, (_, index) => {
    const count = between(random, options.sentencesMin, options.sentencesMax);
    const sentences = Array.from({ length: count }, (__, position) => {
      const text = sentence(random, between(random, options.wordsMin, options.wordsMax));
      if (!options.startWithLorem || index !== 0 || position !== 0) return text;
      return `${OPENING}, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
    });
    return sentences.join(' ');
  });
  if (options.asHtml) return paragraphs.map((text) => `<p>${text}</p>`).join('\n');
  return paragraphs.join('\n\n');
}

/** Равномерно, без смещения по модулю: только crypto.getRandomValues. */
export const cryptoRandom: RandomInt = (bound) => {
  const limit = Math.floor(0x1_0000_0000 / bound) * bound;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0]! >= limit);
  return buffer[0]! % bound;
};
