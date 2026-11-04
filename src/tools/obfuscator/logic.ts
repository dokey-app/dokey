export interface ObfuscateOptions {
  keepFirst: number;
  keepLast: number;
  keepSpaces: boolean;
}

const MASK = '*';

/** Скрывает середину строки. Считает кодовыми точками, чтобы не резать эмодзи пополам. */
export function obfuscate(text: string, options: ObfuscateOptions): string {
  const chars = Array.from(text);
  const tail = chars.length - options.keepLast;
  return chars
    .map((char, index) => {
      if (index < options.keepFirst || index >= tail) return char;
      if (options.keepSpaces && /\s/.test(char)) return char;
      return MASK;
    })
    .join('');
}
