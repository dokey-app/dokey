import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'Asia/Kathmandu' });

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test('Math Evaluator: пример, результат, ошибка с позицией, копирование', async ({ page }) => {
  await page.goto('/math');
  const input = page.getByLabel('Выражение');
  await expect(input).toBeFocused();
  await expect(page.locator('[data-label]')).toHaveText('Пример');

  await input.fill('(2 + 3) * 4');
  await expect(page.locator('[data-output]')).toHaveText('20');
  await page.getByRole('button', { name: 'Скопировать' }).click();
  expect(await clipboard(page)).toBe('20');

  await input.fill('1 / 0');
  await expect(page.locator('[data-error]')).toHaveText('Деление на ноль. Позиция 3');
  await expect(input).toHaveAttribute('aria-invalid', 'true');

  // Результата нет: кнопка не врёт, а буфер остаётся прежним.
  const button = page.getByRole('button', { name: 'Скопировать' });
  await button.click();
  await expect(page.getByRole('alert').first()).toBeAttached();
  await expect(page.locator('[data-alert]')).toHaveText('Копировать нечего: результата нет');
  await expect(button).toHaveText('Скопировать');
  expect(await clipboard(page)).toBe('20');
});

test('ETA Calculator: остаток, длительность, окончание в обеих зонах', async ({ page }) => {
  await page.goto('/eta');
  await expect(page.getByLabel('Всего')).toBeFocused();
  await page.getByLabel('Всего').fill('1200');
  await page.getByLabel('Готово').fill('200');
  await page.getByLabel('Скорость', { exact: true }).fill('2,5');
  await page.locator('[data-units] label', { hasText: 'Час' }).click();
  await page.getByLabel('Начало, местное время').fill('2026-01-01T00:00');

  await expect(page.locator('[data-eta="remaining"]')).toHaveText('1000');
  await expect(page.locator('[data-eta="duration"]')).toHaveText('16 дн 16 ч');
  await expect(page.locator('[data-eta="local"]')).toContainText('17 января 2026, 16:00:00');
  await expect(page.locator('[data-eta="utc"]')).toContainText('17 января 2026, 10:15:00 UTC');

  await page.getByRole('button', { name: 'Скопировать' }).click();
  expect(await clipboard(page)).toContain('17 января 2026, 16:00:00');

  await page.getByLabel('Скорость', { exact: true }).fill('0');
  await expect(page.locator('[data-error]')).toHaveText('Скорость должна быть больше нуля');
});

test('Percentage Calculator: три расчёта независимы, копируется число', async ({ page }) => {
  await page.goto('/percentage');
  const card = (id: string) => page.locator(`[data-calc="${id}"]`);

  await page.getByLabel('Процент', { exact: true }).fill('15');
  await page.getByLabel('От числа', { exact: true }).fill('200');
  await expect(card('of').locator('[data-value]')).toHaveText('30');

  await page.getByLabel('Часть').fill('1,5');
  await page.getByLabel('От целого').fill('3');
  await expect(card('share').locator('[data-value]')).toHaveText('50 %');
  await page.getByRole('button', { name: 'Скопировать: Доля в процентах' }).click();
  expect(await clipboard(page)).toBe('50');

  await page.getByLabel('Было').fill('0');
  await page.getByLabel('Стало').fill('5');
  await expect(card('change').locator('[data-error]')).toContainText('от нуля');
  await page.getByLabel('Было').fill('100');
  await expect(card('change').locator('[data-value]')).toHaveText('-95 %');
});
