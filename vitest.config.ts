import { defineConfig } from 'vitest/config';

// Юнит-тесты чистой логики (парсеры, детектор) в node.
// Всё, что требует настоящего браузера, проверяет Playwright в tests/e2e.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
