import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { type Gate, fail, pass, pending, runGate } from './gate.ts';

const DIST = 'dist';

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

function extract(html: string, pattern: RegExp): string {
  return (pattern.exec(html)?.[1] ?? '').trim();
}

// G-06 «уникальность title и description» — US-001 крит. 4.
// Полностью включается в Э-1 вместе с реестром (T-043); на заглушке предмет уже есть,
// поэтому гейт исполняется с первого дня (implementation-plan §2.2).
export const gate: Gate = {
  id: 'G-06',
  command: 'gate:meta',
  claim: 'title и description уникальны на всех маршрутах',
  enabledIn: 'Э-0',
  async run() {
    let files: string[];
    try {
      files = await htmlFiles(DIST);
    } catch {
      return pending('Э-0 — нет каталога dist, сначала pnpm build');
    }
    if (files.length === 0) return pending('Э-0 — в dist нет ни одной страницы');

    const titles = new Map<string, string[]>();
    const descriptions = new Map<string, string[]>();
    const empty: string[] = [];

    for (const file of files) {
      const html = await readFile(file, 'utf8');
      const route = relative(DIST, file).split(sep).join('/');
      const title = extract(html, /<title>([\s\S]*?)<\/title>/i);
      const description = extract(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
      if (title === '' || description === '') empty.push(route);
      titles.set(title, [...(titles.get(title) ?? []), route]);
      descriptions.set(description, [...(descriptions.get(description) ?? []), route]);
    }

    const duplicates: string[] = [];
    for (const [value, routes] of titles) {
      if (routes.length > 1) duplicates.push(`title «${value}» на ${routes.join(', ')}`);
    }
    for (const [value, routes] of descriptions) {
      if (routes.length > 1) duplicates.push(`description «${value}» на ${routes.join(', ')}`);
    }

    if (empty.length > 0) return fail(`пустой title или description: ${empty.join(', ')}`);
    if (duplicates.length > 0) return fail(duplicates.join('; '));
    return pass(`${files.length} страниц, повторов нет`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
