import { expect, test } from '@playwright/test';
import { BASE_URL } from './preview-server.ts';
import { routes } from './pages.ts';

// Главное обещание продукта: ввод и результат не покидают вкладку.
// Каждая страница сборки получает «секрет» во все поля ввода, после чего проверяем,
// что ни один запрос не ушёл на чужой origin и секрет не осел ни в одном хранилище.
const SECRET = 'dokey-secret-7f3a9c';

test('страниц в сборке больше нуля', () => {
  expect(routes.length).toBeGreaterThan(0);
});

for (const route of routes) {
  test(`${route}: ввод не покидает вкладку`, async ({ page }) => {
    const foreign: string[] = [];
    const leaked: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== BASE_URL) foreign.push(request.url());
      if (request.url().includes(SECRET) || request.postData()?.includes(SECRET)) {
        leaked.push(request.url());
      }
    });

    await page.goto(route, { waitUntil: 'networkidle' });
    const historyBefore = await page.evaluate(() => history.length);

    const fields = page.locator('textarea, input:not([type=file]):not([type=checkbox])');
    for (const field of await fields.all()) {
      if (await field.isEditable()) await field.fill(SECRET);
    }
    await page.waitForLoadState('networkidle');

    // Тело evaluate сериализуется в браузер, поэтому вспомогательных функций снаружи нет.
    const stored = await page.evaluate(async () => {
      const dbs = (await indexedDB.databases?.()) ?? [];
      return {
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
        indexedDB: dbs.map((db) => db.name ?? ''),
        cookie: document.cookie,
        url: location.href,
        history: history.length,
      };
    });

    expect(foreign, 'запросы на сторонний origin').toEqual([]);
    expect(leaked, 'запросы с вводом').toEqual([]);
    expect(stored.local).toEqual([]);
    expect(stored.session).toEqual([]);
    expect(stored.indexedDB).toEqual([]);
    expect(stored.cookie).toBe('');
    expect(stored.url).not.toContain(SECRET);
    expect(stored.history).toBe(historyBefore);
  });
}
