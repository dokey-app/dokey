import { expect, test } from '@playwright/test';
import { BASE_URL } from './preview-server.ts';

// RUN-03. Каркас уровня на заглушке Э-0: страница открывается, индексация закрыта,
// сторонних origin ноль (ИНВ-01), несуществующий маршрут отвечает 404, а не отказом.
test('заглушка открывается и называет себя', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DoKey');
  await expect(page).toHaveTitle('DoKey');
});

test('индексация закрыта до тега релиза', async ({ page }) => {
  await page.goto('/');
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
});

test('ни одного стороннего origin на первом экране (ИНВ-01)', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', (request) => {
    const origin = new URL(request.url()).origin;
    if (origin !== BASE_URL) foreign.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(foreign).toEqual([]);
});

test('на первом экране нет клиентского JS', async ({ page }) => {
  await page.goto('/');
  const scripts = await page.locator('script').count();
  expect(scripts).toBe(0);
});

test('страница живости отвечает ok', async ({ page }) => {
  const response = await page.goto('/health/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ok');
  await expect(page.locator('[data-health="version"]')).toHaveText('0.0.1');
});

test('маршрута нет — 404, а не отказ сервера', async ({ request }) => {
  const response = await request.get('/такого-маршрута-нет');
  expect(response.status()).toBe(404);
});
