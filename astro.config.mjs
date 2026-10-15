// @ts-check
import { defineConfig } from 'astro/config';

// Astro 7, статический вывод, ванильный TypeScript. Интеграций фреймворков нет:
// бюджет initial JS 40 KB gzip (tests/e2e/build.spec.ts).
export default defineConfig({
  site: 'https://dokey.ru',
  output: 'static',
  integrations: [],
  build: {
    // CSS отдельными файлами: кешируется immutable и не раздувает HTML.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Ни один сторонний origin не попадает в сборку даже через sourcemap.
      sourcemap: false,
    },
  },
});
