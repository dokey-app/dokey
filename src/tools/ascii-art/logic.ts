export const FONT_NAMES = ['Standard', 'Slant', 'Small', 'Big', 'Doom'] as const;
export type FontName = (typeof FONT_NAMES)[number];

export const isFontName = (value: string): value is FontName =>
  (FONT_NAMES as readonly string[]).includes(value);

export const MAX_LENGTH = 200;

/** Шрифты FIGlet рисуют только ASCII: остальное выпало бы молча, поэтому оно называется. */
export const hasUnsupported = (text: string): boolean => /[^\x20-\x7e\r\n]/.test(text);
