import type { Page } from '@playwright/test';
import { EXAMPLE as JWT } from '../../src/tools/jwt/logic.ts';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const chip = (page: Page, name: string) =>
  page.locator('[data-chips]').getByRole('radio', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('до ввода — поле в фокусе, результата нет, каталог из реестра', async ({ page }) => {
  await expect(page.getByLabel('Вставьте что угодно')).toBeFocused();
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('.catalog li')).toHaveCount(6);
});

test('JWT распознаётся и применяется сразу; ссылка ведёт в инструмент', async ({ page }) => {
  await page.getByLabel('Вставьте что угодно').fill(JWT);
  await expect(chip(page, 'JWT')).toBeChecked();
  await expect(page.locator('[data-output]')).toContainText('"alg": "HS256"');
  await expect(page.getByRole('link', { name: 'Открыть JWT Inspector' })).toHaveAttribute(
    'href',
    '/jwt',
  );
  await expect(page.getByRole('status')).toHaveText('JWT');
});

test('timestamp; остальные кандидаты — чипсами; ручной выбор сильнее', async ({ page }) => {
  const input = page.getByLabel('Вставьте что угодно');
  await input.fill('1767236400');
  await expect(chip(page, 'Timestamp')).toBeChecked();
  await expect(page.locator('[data-output]')).toContainText('UTC: 1 января 2026, 03:00:00 UTC');

  await page.locator('[data-chips] label', { hasText: 'Base64-кодировать' }).click();
  await expect(page.locator('[data-output]')).toHaveText('MTc2NzIzNjQwMA==');
  await page.locator('[data-copy]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('MTc2NzIzNjQwMA==');

  await input.fill('1767236401');
  await expect(chip(page, 'Base64-кодировать')).toBeChecked();
});

test('простой текст: только чипсы кодирования, ничего не применяется само', async ({ page }) => {
  await page.getByLabel('Вставьте что угодно').fill('просто текст');
  await expect(page.locator('[data-chips] input')).toHaveCount(2);
  await expect(page.locator('[data-chips] input:checked')).toHaveCount(0);
  await expect(page.locator('[data-output]')).toBeHidden();
  await expect(page.getByText(/распознан/i)).toHaveCount(0);

  await page.locator('[data-chips] label', { hasText: 'URL-кодировать' }).click();
  await expect(page.locator('[data-output]')).toHaveText(
    '%D0%BF%D1%80%D0%BE%D1%81%D1%82%D0%BE%20%D1%82%D0%B5%D0%BA%D1%81%D1%82',
  );
});

test('очистка поля сбрасывает ручной выбор', async ({ page }) => {
  const input = page.getByLabel('Вставьте что угодно');
  await input.fill('{"a":1}');
  await page.locator('[data-chips] label', { hasText: 'URL-кодировать' }).click();
  await input.fill('');
  await input.fill('{"b":2}');
  await expect(chip(page, 'JSON')).toBeChecked();
});

test('ручной выбор сбрасывается, когда вставлен другой тип данных', async ({ page }) => {
  const input = page.getByLabel('Вставьте что угодно');
  await input.fill('1767236400');
  await page.locator('[data-chips] label', { hasText: 'URL-кодировать' }).click();
  await input.fill('{"a":1}');
  await expect(chip(page, 'JSON')).toBeChecked();
});
