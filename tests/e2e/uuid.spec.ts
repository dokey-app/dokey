import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const values = (page: Page) => page.locator('[data-values] code').allTextContents();

test.beforeEach(async ({ page }) => {
  await page.goto('/uuid');
});

test('одно значение v4 уже при открытии, фокус на «Сгенерировать»', async ({ page }) => {
  await expect(page.locator('[data-values] li')).toHaveCount(1);
  const [value] = await values(page);
  expect(value).toMatch(UUID);
  expect(value![14]).toBe('4');
  await expect(page.getByRole('button', { name: 'Сгенерировать' })).toBeFocused();
});

test('пакет v7: различные, упорядоченные; «Скопировать все» — по строке на значение', async ({
  page,
}) => {
  await page.locator('[data-kind] label', { hasText: 'v7' }).click();
  await page.getByLabel('Количество').fill('50');
  await page.getByRole('button', { name: 'Сгенерировать' }).click();
  await expect(page.locator('[data-values] li')).toHaveCount(50);
  const list = await values(page);
  expect(new Set(list).size).toBe(50);
  expect(list.toSorted()).toEqual(list);
  for (const v of list) expect(v[14]).toBe('7');

  await page.getByRole('button', { name: 'Скопировать все' }).click();
  expect(await clipboard(page)).toBe(list.join('\n'));
  await page.getByRole('button', { name: 'Скопировать значение 3', exact: true }).click();
  expect(await clipboard(page)).toBe(list[2]);
});

test('ULID по Enter в поле количества', async ({ page }) => {
  await page.locator('[data-kind] label', { hasText: 'ULID' }).click();
  const count = page.getByLabel('Количество');
  await count.fill('3');
  await count.press('Enter');
  await expect(page.locator('[data-values] li')).toHaveCount(3);
  for (const v of await values(page)) expect(v).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
});

test('недопустимое количество — понятная ошибка, прежние значения на месте', async ({ page }) => {
  const before = await values(page);
  await page.getByLabel('Количество').fill('0');
  await page.getByRole('button', { name: 'Сгенерировать' }).click();
  await expect(page.locator('[data-count-error]')).toHaveText(
    'Количество — целое число от 1 до 1000',
  );
  await expect(page.getByLabel('Количество')).toHaveAttribute('aria-invalid', 'true');
  expect(await values(page)).toEqual(before);
});

test('проверка: версия, вариант, время; ошибка — с позицией', async ({ page }) => {
  const input = page.getByLabel('Проверить UUID или ULID');
  await input.fill('{0190F0C3-6D2A-7000-8000-000000000000}');
  const fields = page.locator('[data-fields]');
  await expect(fields).toContainText('7');
  await expect(fields).toContainText('RFC 9562');
  await expect(fields).toContainText('2024-07-');
  await expect(fields).toContainText('0190f0c3-6d2a-7000-8000-000000000000');

  await input.fill('0190f0c3-6d2a-7000-8000-00000000000x');
  await expect(page.locator('[data-inspect-error]')).toHaveText(
    'Недопустимый символ на позиции 36',
  );
});

test('без crypto.getRandomValues значений нет и подделки нет', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'getRandomValues', { value: undefined });
  });
  await page.goto('/uuid');
  await expect(page.locator('[data-unavailable]')).toBeVisible();
  await expect(page.locator('[data-values] li')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Сгенерировать' })).toBeDisabled();
});
