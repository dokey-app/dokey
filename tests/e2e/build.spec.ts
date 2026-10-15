import { expect, test } from '@playwright/test';
import { init, parse } from 'es-module-lexer';
import { readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { gzipSync } from 'node:zlib';
import { DIST, htmlFiles } from './pages.ts';

// Проверки собранного каталога без браузера.
const INITIAL_JS_LIMIT = 40 * 1024; // gzip, на страницу

// Initial JS страницы = инлайновые скрипты + <script src> + всё, что они тянут статическим
// import (рекурсивно). Динамический import() — ленивый чанк, в бюджет не входит.
function staticClosure(entry: string, seen: Set<string>): void {
  if (seen.has(entry)) return;
  seen.add(entry);
  const [imports] = parse(readFileSync(join(DIST, entry), 'utf8'));
  for (const imp of imports) {
    if (imp.d !== -1 || !imp.n?.startsWith('.')) continue;
    staticClosure(posix.join(posix.dirname(entry), imp.n), seen);
  }
}

test('initial JS каждой страницы ≤ 40 KB gzip', async () => {
  await init;
  const over: string[] = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const files = new Set<string>();
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
      const src = m[1]!.startsWith('/')
        ? m[1]!.slice(1)
        : posix.join(dirname(file.slice(DIST.length + 1)), m[1]!);
      staticClosure(src, files);
    }
    const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
    const bytes =
      [...files].reduce((sum, f) => sum + gzipSync(readFileSync(join(DIST, f))).length, 0) +
      inline.reduce((sum, m) => sum + gzipSync(m[1]!).length, 0);
    if (bytes > INITIAL_JS_LIMIT) over.push(`${file}: ${bytes} B`);
  }
  expect(over).toEqual([]);
});

test('CSP разрешает скрипты и запросы только своему origin', () => {
  const headers = readFileSync(join(DIST, '_headers'), 'utf8');
  const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? '';
  const directive = (name: string) =>
    csp
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${name} `));

  expect(directive('default-src')).toBe("default-src 'self'");
  expect(directive('script-src')).toBe("script-src 'self'");
  expect(directive('connect-src')).toBe("connect-src 'self'");
  expect(csp).not.toMatch(/https?:|\*/);
});
