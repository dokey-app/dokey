import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test.beforeEach(async ({ page }) => {
  await page.goto('/url');
});

test('до ввода — разобранный пример', async ({ page }) => {
  await expect(page.getByLabel('URL или текст')).toBeFocused();
  await expect(page.locator('[data-result-label]')).toHaveText('Пример');
  await expect(page.locator('[data-components]')).toContainText('api.example.com');
  await expect(page.locator('[data-query] tr')).toHaveCount(4);
});

test('URL раскладывается на части; повторяющиеся ключи — отдельные строки', async ({ page }) => {
  await page
    .getByLabel('URL или текст')
    .fill('https://shop.test/cart?item=1&item=2&note=a+b%21#pay');
  await expect(page.getByLabel('Разобрать URL')).toBeChecked();
  const components = page.locator('[data-components]');
  await expect(components).toContainText('shop.test');
  await expect(components).toContainText('/cart');
  await expect(components).toContainText('pay');
  await expect(components).not.toContainText('Порт');

  const rows = page.locator('[data-query] tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('item');
  await expect(rows.nth(1)).toContainText('2');
  await expect(rows.nth(2)).toContainText('a b!');

  await page.getByRole('button', { name: 'Скопировать значение note' }).click();
  expect(await clipboard(page)).toBe('a b!');
  await page.getByRole('button', { name: 'Скопировать пару note' }).click();
  expect(await clipboard(page)).toBe('note=a+b%21');
  await page.getByRole('button', { name: 'Скопировать: Хост' }).click();
  expect(await clipboard(page)).toBe('shop.test');
});

test('percent-строка декодируется, ошибка — с позицией', async ({ page }) => {
  const input = page.getByLabel('URL или текст');
  await input.fill('%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82');
  await expect(page.getByLabel('Декодировать')).toBeChecked();
  await expect(page.locator('[data-output]')).toHaveText('привет');

  await input.fill('%D0%BF%E0%');
  await expect(page.locator('[data-error]')).toHaveText(
    'Оборванная percent-последовательность на позиции 10',
  );
  await expect(page.locator('[data-copy]')).toBeDisabled();
});

test('текст кодируется; ручной выбор сильнее автоопределения', async ({ page }) => {
  const input = page.getByLabel('URL или текст');
  await input.fill('a b&c');
  await expect(page.getByLabel('URL-кодировать')).toBeChecked();
  await expect(page.locator('[data-output]')).toHaveText('a%20b%26c');
  await page.locator('[data-copy]').click();
  expect(await clipboard(page)).toBe('a%20b%26c');

  await input.fill('https://example.com/?q=1');
  await page.getByText('URL-кодировать', { exact: true }).click();
  await expect(page.locator('[data-output]')).toHaveText('https%3A%2F%2Fexample.com%2F%3Fq%3D1');
});

test('адрес без схемы — подсказка добавить https://', async ({ page }) => {
  await page.getByLabel('URL или текст').fill('example.com/path?x=1');
  await expect(page.locator('[data-error]')).toHaveText(
    'Некорректный URL: нет схемы. Добавьте https:// в начало',
  );
});

test('чипсы переключаются стрелками, выбор закрепляется', async ({ page }) => {
  const input = page.getByLabel('URL или текст');
  await input.fill('a b');
  await expect(page.getByLabel('URL-кодировать')).toBeChecked();
  await page.getByLabel('URL-кодировать').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByLabel('Декодировать')).toBeChecked();
  await input.fill('x y');
  await expect(page.locator('[data-output]')).toHaveText('x y');
});
