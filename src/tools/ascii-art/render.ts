// Отдельный модуль: figlet и шрифты подгружаются динамически и не входят в initial JS.
// Шрифты лежат в сборке; загрузка по сети из figlet не вызывается.
import figlet from 'figlet';
import type { FontName } from './logic.ts';

const FONTS: Record<FontName, () => Promise<{ default: string }>> = {
  Standard: () => import('figlet/importable-fonts/Standard.js'),
  Slant: () => import('figlet/importable-fonts/Slant.js'),
  Small: () => import('figlet/importable-fonts/Small.js'),
  Big: () => import('figlet/importable-fonts/Big.js'),
  Doom: () => import('figlet/importable-fonts/Doom.js'),
};

const loaded = new Set<FontName>();

export async function render(text: string, font: FontName): Promise<string> {
  if (!loaded.has(font)) {
    figlet.parseFont(font, (await FONTS[font]()).default);
    loaded.add(font);
  }
  return figlet.textSync(text, { font });
}
