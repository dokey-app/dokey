import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// RUN-01. Каркас уровня: проверяет то, что уже существует, — манифест и его пины.
describe('манифест', () => {
  it('пиннит версии точно: каре в зависимостях запрещено', async () => {
    const manifest = JSON.parse(await readFile('package.json', 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = { ...manifest.dependencies, ...manifest.devDependencies };
    const ranged = Object.entries(all).filter(([, version]) => /^[\^~><*]/.test(version));
    expect(ranged).toEqual([]);
  });

  it('не содержит ни одного запрещённого фреймворка', async () => {
    const manifest = JSON.parse(await readFile('package.json', 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
    const forbidden = new Set([
      'react',
      'react-dom',
      'preact',
      'svelte',
      'vue',
      'tailwindcss',
      'lucide',
    ]);
    expect(all.filter((name) => forbidden.has(name))).toEqual([]);
  });
});
