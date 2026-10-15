import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test.beforeEach(async ({ page }) => {
  await page.goto('/json');
});

test('до ввода — пример, поле ввода в фокусе', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Форматирование и проверка JSON',
  );
  await expect(page.getByLabel('JSON', { exact: true })).toBeFocused();
  await expect(page.locator('[data-result-label]')).toHaveText('Пример');
  await expect(page.locator('[data-output]')).toContainText('12345678901234567890');
});

test('вставил → получил результат → скопировал', async ({ page }) => {
  await page.getByLabel('JSON', { exact: true }).fill('{"b":[1,2],"a":12345678901234567890}');
  await expect(page.locator('[data-result-label]')).toHaveText('Результат');
  const expected = '{\n  "b": [\n    1,\n    2\n  ],\n  "a": 12345678901234567890\n}';
  await expect(page.locator('[data-output]')).toHaveText(expected);

  const copy = page.locator('[data-copy]');
  await copy.click();
  await expect(copy).toHaveText('Скопировано');
  expect(await clipboard(page)).toBe(expected);
  await expect(copy).toHaveText('Скопировать', { timeout: 3000 });
});

test('минификация и сортировка ключей', async ({ page }) => {
  await page.getByLabel('JSON', { exact: true }).fill('{"b":1,"a":{"d":2,"c":3}}');
  await page.getByText('Минифицировать').click();
  await expect(page.locator('[data-output]')).toHaveText('{"b":1,"a":{"d":2,"c":3}}');
  await page.getByLabel('Сортировать ключи').check();
  await expect(page.locator('[data-output]')).toHaveText('{"a":{"c":3,"d":2},"b":1}');
});

test('ошибка называет строку и позицию, ввод сохраняется, «Перейти к ошибке» выделяет место', async ({
  page,
}) => {
  const input = page.getByLabel('JSON', { exact: true });
  await input.fill('{"a":1 "b":2}');
  await expect(page.getByRole('alert').filter({ hasText: 'Ожидалась' })).toContainText(
    'Ожидалась запятая. Строка 1, позиция 8',
  );
  await expect(input).toHaveValue('{"a":1 "b":2}');
  await expect(page.locator('[data-copy]')).toBeDisabled();
  await page.getByRole('button', { name: 'Перейти к ошибке' }).click();
  await expect(input).toBeFocused();
  expect(await input.evaluate((el: HTMLTextAreaElement) => el.selectionStart)).toBe(7);
});

test('«Очистить» возвращает пример и фокус', async ({ page }) => {
  const input = page.getByLabel('JSON', { exact: true });
  await input.fill('[1]');
  await expect(page.locator('[data-result-label]')).toHaveText('Результат');
  await page.getByRole('button', { name: 'Очистить' }).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.locator('[data-result-label]')).toHaveText('Пример');
});

test('дерево: раскрытие и копирование пути', async ({ page }) => {
  await page.getByLabel('JSON', { exact: true }).fill('{"user":{"first name":"Ann","ids":[7,8]}}');
  const tree = page.locator('[data-tree]');
  await tree.getByText('user').click();
  await tree.getByText('ids').click();
  await tree.locator('li', { hasText: '8' }).last().click();
  await expect(page.locator('[data-selected-path]')).toHaveText('$.user.ids[1]');
  await page.getByRole('button', { name: 'Скопировать путь' }).click();
  expect(await clipboard(page)).toBe('$.user.ids[1]');

  // С клавиатуры: фокус на узле выбирает его путь.
  await tree.getByText('first name').locator('..').focus();
  await expect(page.locator('[data-selected-path]')).toHaveText('$.user["first name"]');

  await page.getByRole('button', { name: 'Свернуть' }).click();
  await expect(tree.getByText('ids')).toBeHidden();
  await page.getByRole('button', { name: 'Развернуть' }).click();
  await expect(tree.getByText('"Ann"')).toBeVisible();
});

test('выше мягкого порога — предупреждение и «Обработать»', async ({ page }) => {
  const big = '[' + Array.from({ length: 120_000 }, (_, i) => `"item-${i}-xxxx"`).join(',') + ']';
  await page.getByLabel('JSON', { exact: true }).fill(big);
  await expect(page.locator('[data-threshold]')).toContainText('больше порога 2 МБ');
  await page.getByRole('button', { name: 'Обработать' }).click();
  await expect(page.locator('[data-result-label]')).toHaveText('Результат');
  await expect(page.locator('[data-threshold]')).toBeHidden();
});
