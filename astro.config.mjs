// @ts-check
import { defineConfig } from 'astro/config';

// ADR-01: Astro 7, статический вывод, острова на ванильном TypeScript.
// Интеграций фреймворков ноль и не появится — D-05, бюджет initial JS 40 KB gzip (G-02).
export default defineConfig({
  site: 'https://dokey.app',
  output: 'static',
  integrations: [],
  build: {
    // Гейт G-02 считает вес по файлам сборки; инлайн прячет байты от счёта.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // ИНВ-01: ни один сторонний origin не попадает в сборку даже через sourcemap.
      sourcemap: false,
    },
  },
});
