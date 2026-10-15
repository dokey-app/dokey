import { expect, test } from './fixtures.ts';
import { routes } from './pages.ts';

test('главная открывается и называет себя', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Утилиты разработчика');
  await expect(page.getByRole('link', { name: 'DoKey' })).toHaveAttribute('href', '/');
});

test('индексация открыта, robots.txt указывает sitemap', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Allow: /');
  expect(robots).not.toContain('Disallow');
  expect(robots).toContain('Sitemap: https://dokey.ru/sitemap.xml');
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

test('элементы с атрибутом hidden не видны ни на одной странице', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    const visible = await page.$$eval('[hidden]', (els) =>
      els
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(visible, route).toEqual([]);
  }
});
