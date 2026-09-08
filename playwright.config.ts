import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './tests/e2e/preview-server.ts';

// RUN-03. Прогон идёт против собранного статического каталога, а не против dev-сервера:
// отсутствие клиентского JS и состав разметки — свойства сборки, а не режима разработки.
//
// Заголовки ответа этим уровнем не проверяются намеренно: их отдаёт хостинг, а не каркас.
// Равенство двух копий политики сверяет `pnpm gate:headers-parity`, а живой origin —
// `pnpm check:headers` (RUN-16) в release.yml и synthetic.yml.
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
