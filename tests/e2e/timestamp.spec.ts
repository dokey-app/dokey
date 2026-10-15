import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'Asia/Kathmandu' });

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const row = (page: Page, name: string) =>
  page.locator('[data-rows] .row').filter({ has: page.getByText(name, { exact: true }) });

test.beforeEach(async ({ page }) => {
  await page.goto('/unix-timestamp');
});

test('до ввода — пример с местным временем, текущее время не показывается', async ({ page }) => {
  await expect(page.getByLabel('Метка времени или дата')).toBeFocused();
  await expect(page.locator('[data-result-label]')).toHaveText('Пример');
  await expect(row(page, 'Местное время')).toContainText('1 января 2026, 08:45:00 UTC+5:45');
});

test('секунды → все представления; копирование строки', async ({ page }) => {
  await page.getByLabel('Метка времени или дата').fill('1700000000');
  await expect(page.getByRole('radio', { name: 'Секунды', exact: true })).toBeChecked();
  await expect(row(page, 'ISO 8601, UTC')).toContainText('2023-11-14T22:13:20.000Z');
  await expect(row(page, 'UTC')).toContainText('14 ноября 2023, 22:13:20 UTC');
  await expect(row(page, 'ISO 8601, местное')).toContainText('2023-11-15T03:58:20+05:45');
  await page.getByRole('button', { name: 'Скопировать: Миллисекунды' }).click();
  expect(await clipboard(page)).toBe('1700000000000');
});

test('13 цифр — миллисекунды; ручной выбор единиц сильнее', async ({ page }) => {
  await page.getByLabel('Метка времени или дата').fill('1700000000000');
  await expect(page.getByRole('radio', { name: 'Миллисекунды' })).toBeChecked();
  await expect(row(page, 'Секунды')).toContainText('1700000000');
  await page.locator('[data-units] label', { hasText: /^Секунды$/ }).click();
  await expect(page.locator('[data-error]')).toHaveText(
    'Значение вне диапазона: ожидались секунды или миллисекунды Unix-времени',
  );
});

test('ISO 8601 без зоны — пометка про UTC', async ({ page }) => {
  await page.getByLabel('Метка времени или дата').fill('2026-01-01T03:00:00');
  await expect(page.locator('[data-note]')).toHaveText('Зона не указана — дата прочитана как UTC');
  await expect(row(page, 'Секунды')).toContainText('1767236400');
  await expect(page.locator('[data-units]')).toBeHidden();
});

test('«Вставить текущее» подставляет текущие секунды', async ({ page }) => {
  const before = Math.floor(Date.now() / 1000);
  await page.getByRole('button', { name: 'Вставить текущее' }).click();
  const value = Number(await page.getByLabel('Метка времени или дата').inputValue());
  expect(value).toBeGreaterThanOrEqual(before);
  expect(value).toBeLessThan(before + 30);
  await expect(row(page, 'Относительно сейчас')).toContainText(/секунд|сейчас/);
});

test('«Скопировать» сразу после ввода копирует новое значение', async ({ page }) => {
  await page.getByLabel('Метка времени или дата').fill('42');
  await page.getByRole('button', { name: 'Скопировать: Миллисекунды' }).click();
  expect(await clipboard(page)).toBe('42000');
});
