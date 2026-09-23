import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// RUN-01 и RUN-02 — два проекта одного прогона (ADR-16); третий, `gates:negative`, — набор
// D-106 п. 1 и п. 3: каждый случай поднимает гейт отдельным процессом в каталоге фикстуры, и
// своего конфига рядом с набором нет — вторая точка описания прогонов разошлась бы с этой.
// Самопроверки покрытия по `GATES` (п. 2) в наборе пока нет — её заводит T-261.
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
      {
        test: {
          name: 'gates:negative',
          environment: 'node',
          include: ['tests/gates/negative/**/*.test.ts'],
        },
      },
    ],
  },
});
