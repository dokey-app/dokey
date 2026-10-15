import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './tests/e2e/preview-server.ts';

// Прогон идёт против собранного статического каталога, а не против dev-сервера:
// бюджет JS и состав разметки — свойства сборки, а не режима разработки.
// Заголовки отдаёт хостинг: здесь проверяется файл public/_headers (build.spec.ts),
// а живой прод — шагом после деплоя в ci.yml.
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : '50%',
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './tests/e2e/preview-server.ts',
  globalTeardown: './tests/e2e/preview-teardown.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
