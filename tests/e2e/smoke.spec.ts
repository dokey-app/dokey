import { expect, test } from './fixtures.ts';

test('главная открывается и называет себя', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DoKey');
  await expect(page.getByRole('link', { name: 'DoKey' })).toHaveAttribute('href', '/');
});

test('индексация закрыта до релиза', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
});

test('счётчик внешних запросов показывает 0', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByText('Внешних запросов:')).toBeVisible();
  await expect(page.locator('[data-egress-count]')).toHaveText('0');
});

test('статус-регионы на месте', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
});

test('нет маршрута — 404 со своим текстом', async ({ page }) => {
  const response = await page.goto('/такого-маршрута-нет');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Такого инструмента нет.');
});

test('sitemap перечисляет главную', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('<loc>https://dokey.ru/</loc>');
});
