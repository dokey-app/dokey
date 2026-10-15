// @ts-check
import { defineConfig } from 'astro/config';

// Astro 7, статический вывод, ванильный TypeScript. Интеграций фреймворков нет:
// бюджет initial JS 40 KB gzip (tests/e2e/build.spec.ts).
export default defineConfig({
  site: 'https://dokey.ru',
  output: 'static',
  integrations: [],
  // Канонический адрес инструмента — `/jwt`, без слеша: сборка кладёт jwt.html,
  // Cloudflare (html_handling = auto-trailing-slash) отдаёт его по /jwt.
  trailingSlash: 'never',
  build: {
    format: 'file',
    // CSS отдельными файлами: кешируется immutable и не раздувает HTML.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Никаких инлайн-скриптов и data:-ассетов: CSP script-src 'self' заблокирует инлайн.
      assetsInlineLimit: 0,
      // Ни один сторонний origin не попадает в сборку даже через sourcemap.
      sourcemap: false,
    },
  },
});
