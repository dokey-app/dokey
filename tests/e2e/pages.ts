import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Все страницы сборки: маршруты берутся из dist, а не перечисляются руками.
export const DIST = 'dist';

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html'));

export const routes = htmlFiles
  .filter((file) => !file.endsWith(`${sep}404.html`))
  .map((file) => {
    const path = relative(DIST, file).split(sep).join('/');
    // build.format = 'file': index.html → /, jwt.html → /jwt
    return '/' + path.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
  })
  .toSorted();
