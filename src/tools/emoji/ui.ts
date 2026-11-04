import { writeClipboard } from '../../ui/copy.ts';
import { pick } from '../../ui/dom.ts';
import { announce } from '../../ui/status.ts';
import { GROUPS, codePoints, matches, type Emoji } from './logic.ts';

// Таблица эмодзи ≈ 100 KB gzip: отдельный чанк, грузится только этой страницей.
async function loadEmoji(): Promise<Emoji[]> {
  const { default: data } = await import('emojibase-data/ru/compact.json');
  return data
    .filter((item) => item.group !== undefined && item.group !== 2)
    .map((item) => ({
      unicode: item.unicode,
      label: item.label,
      hexcode: item.hexcode,
      group: item.group ?? 0,
      tags: item.tags ?? [],
    }));
}

function emojiButton(emoji: Emoji): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'emoji-btn';
  button.textContent = emoji.unicode;
  button.title = `${emoji.label}, ${codePoints(emoji.hexcode)}`;
  button.setAttribute('aria-label', emoji.label);
  button.dataset['emoji'] = emoji.hexcode;
  return button;
}

function groupElement(name: string, emoji: Emoji[]): HTMLElement {
  const section = document.createElement('section');
  section.dataset['group'] = name;
  const title = document.createElement('h3');
  title.textContent = name;
  const grid = document.createElement('div');
  grid.className = 'emoji-grid';
  grid.append(...emoji.map(emojiButton));
  section.append(title, grid);
  return section;
}

const root = document.querySelector<HTMLElement>('[data-emoji-tool]');
if (root) void mount(root);

async function mount(tool: HTMLElement): Promise<void> {
  const search = pick<HTMLInputElement>(tool, '[data-search]');
  const groups = pick<HTMLElement>(tool, '[data-groups]');
  const picked = pick<HTMLElement>(tool, '[data-picked]');
  const empty = pick<HTMLElement>(tool, '[data-empty]');
  const count = pick<HTMLElement>(tool, '[data-count]');

  const all = await loadEmoji();
  const byHex = new Map(all.map((emoji) => [emoji.hexcode, emoji]));
  let timer = 0;

  function run(): void {
    const found = all.filter((emoji) => matches(emoji, search.value.trim()));
    groups.replaceChildren(
      ...GROUPS.flatMap(({ id, name }) => {
        const inGroup = found.filter((emoji) => emoji.group === id);
        return inGroup.length > 0 ? [groupElement(name, inGroup)] : [];
      }),
    );
    count.textContent = String(found.length);
    empty.hidden = found.length > 0;
  }

  search.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 120);
  });

  groups.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const hex = event.target.closest<HTMLElement>('[data-emoji]')?.dataset['emoji'];
    const emoji = hex ? byHex.get(hex) : undefined;
    if (!emoji) return;
    void writeClipboard(emoji.unicode).then((copied) => {
      if (!copied) return;
      picked.textContent = `Скопировано: ${emoji.unicode} ${emoji.label}, ${codePoints(emoji.hexcode)}`;
      announce('Скопировано');
    });
  });

  run();
}
