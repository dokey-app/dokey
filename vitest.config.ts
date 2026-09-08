import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// RUN-01 и RUN-02 — два проекта одного прогона (ADR-16).
// Интеграционный уровень идёт в **browser mode**, а не в jsdom: инварианты ИНВ-02
// (носители пусты) и ИНВ-01 (сторонних origin ноль) проверяются про настоящий браузер,
// а подделка окружения показала бы зелёное там, где продукт красный.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
