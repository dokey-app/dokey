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
  // Сжатие оставляет между тегом и текстом голый перевод строки («</strong>\nзаголовок»),
  // и на скриншотах Chromium он рисовался нулевой ширины: «Headersзаголовок». В DOM и в
  // геометрии пробел есть, поэтому тестом это не ловится — проверено скриншотами до и после.
  compressHTML: false,
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
