import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE_URL } from './preview-server.ts';
import { DIST } from './pages.ts';

// `astro preview` не отдаёт заголовки из _headers, а прод отдаёт. Чтобы e2e видел то же,
// что пользователь, каждый ответ своего origin получает CSP из dist/_headers, а нарушения
// CSP собираются и валят тест: инлайн-скрипт или чужой origin не доживут до прода молча.
export const CSP = readFileSync(join(DIST, '_headers'), 'utf8').match(
  /Content-Security-Policy:\s*(.+)/,
)?.[1];

declare global {
  interface Window {
    dokeyCspViolations: string[];
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    if (!CSP) throw new Error('В dist/_headers нет Content-Security-Policy');
    await page.route(`${BASE_URL}/**`, async (route) => {
      try {
        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: { ...response.headers(), 'content-security-policy': CSP },
        });
      } catch (error) {
        // Тест закончился или страница ушла по ссылке, пока грузились шрифты: запрос уже
        // никому не нужен. Любая другая ошибка — настоящая.
        if (!/disposed|closed/i.test(String(error))) throw error;
      }
    });
    await page.addInitScript(() => {
      window.dokeyCspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.dokeyCspViolations.push(`${event.violatedDirective}: ${event.blockedURI}`);
      });
    });
    await use(page);
  },
});

test.afterEach(async ({ page }) => {
  if (page.url().startsWith(BASE_URL)) {
    const violations = await page.evaluate(() => window.dokeyCspViolations ?? []);
    expect(violations, 'нарушения CSP').toEqual([]);
  }
});

export { expect };
