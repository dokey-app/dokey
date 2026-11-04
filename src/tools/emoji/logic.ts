export interface Emoji {
  unicode: string;
  label: string;
  hexcode: string;
  group: number;
  tags: string[];
}

/** Группы Unicode по порядку emojibase; 2 — компоненты (оттенки кожи), их не показываем. */
export const GROUPS: { id: number; name: string }[] = [
  { id: 0, name: 'Смайлики и эмоции' },
  { id: 1, name: 'Люди и тело' },
  { id: 3, name: 'Животные и природа' },
  { id: 4, name: 'Еда и напитки' },
  { id: 5, name: 'Путешествия и места' },
  { id: 6, name: 'Занятия' },
  { id: 7, name: 'Предметы' },
  { id: 8, name: 'Символы' },
  { id: 9, name: 'Флаги' },
];

export const matches = (emoji: Emoji, query: string): boolean => {
  if (query === '') return true;
  const needle = query.toLowerCase();
  return (
    emoji.unicode === query ||
    emoji.label.toLowerCase().includes(needle) ||
    emoji.tags.some((tag) => tag.toLowerCase().includes(needle))
  );
};

/** U+1F600, для составных — через пробел; emojibase пишет их через дефис. */
export const codePoints = (hexcode: string): string =>
  hexcode
    .split('-')
    .map((part) => `U+${part}`)
    .join(' ');
