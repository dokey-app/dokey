import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const copy = (page: Page) => page.getByRole('button', { name: 'Скопировать' }).click();

test('Lorem Ipsum: текст уже есть, настройки применяются, копируется', async ({ page }) => {
  await page.goto('/lorem-ipsum');
  const output = page.locator('[data-output]');
  await expect(output).toContainText('Lorem ipsum dolor sit amet');

  await page.getByLabel('Абзацы', { exact: true }).fill('1');
  await page.getByLabel('Абзацы в тегах p').check({ force: true });
  await expect(output).toHaveText(/^<p>.*<\/p>$/);
  await copy(page);
  expect(await clipboard(page)).toBe(await output.textContent());

  await page.getByLabel('Предложений от').fill('9');
  await page.getByLabel('Предложений до').fill('2');
  await expect(page.locator('[data-error]')).toContainText('«от» не больше «до»');
});

test('Text Statistics: вставил текст — получил числа', async ({ page }) => {
  await page.goto('/text-statistics');
  await expect(page.getByLabel('Текст')).toBeFocused();
  await page.getByLabel('Текст').fill('ключ подписи\nвторая');
  await expect(page.locator('[data-stat="words"]')).toHaveText('3');
  await expect(page.locator('[data-stat="lines"]')).toHaveText('2');
  await expect(page.locator('[data-stat="bytes"]')).toHaveText('36');
  await page.getByRole('button', { name: 'Очистить' }).click();
  await expect(page.locator('[data-stat="words"]')).toHaveText('0');
});

test('String Obfuscator: скрывает середину, при уходе всё стирается', async ({ page }) => {
  await page.goto('/string-obfuscator');
  await page.getByLabel('Строка').fill('sk-1234567890abcd');
  await expect(page.locator('[data-output]')).toHaveText('sk-1*********abcd');
  await copy(page);
  expect(await clipboard(page)).toBe('sk-1*********abcd');

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(page.getByLabel('Строка')).toHaveValue('');
  await expect(page.locator('[data-output]')).toHaveText('');
});

test('Numeronym: пример до ввода, сокращение, копирование', async ({ page }) => {
  await page.goto('/numeronym');
  await expect(page.locator('[data-label]')).toHaveText('Пример');
  await page.getByLabel('Слова').fill('kubernetes');
  await expect(page.locator('[data-output]')).toHaveText('k8s');
  await expect(page.locator('[data-label]')).toHaveText('Результат');
  await copy(page);
  expect(await clipboard(page)).toBe('k8s');
});

test('Text Diff: отличия со знаками, копирование сразу после ввода', async ({ page }) => {
  await page.goto('/text-diff');
  await page.getByLabel('Было').fill('один\nдва\nтри');
  await page.getByLabel('Стало').fill('один\nтри\nчетыре');
  // Копирование сразу после ввода: отложенный пересчёт обязан выполниться первым.
  await copy(page);
  expect(await clipboard(page)).toBe('  один\n- два\n  три\n+ четыре');
  await expect(page.locator('[data-summary]')).toHaveText('+1 −1');
  await expect(page.locator('.diff-add')).toHaveText('+четыре');
  await expect(page.locator('.diff-del')).toHaveText('−два');
});

test('Text Diff: совпадающие тексты названы словами', async ({ page }) => {
  await page.goto('/text-diff');
  await page.getByLabel('Было').fill('одно и то же');
  await page.getByLabel('Стало').fill('одно и то же');
  await expect(page.getByText('Тексты совпадают')).toBeVisible();
});

test('ASCII Art: рисует без внешних запросов, шрифт переключается', async ({ page }) => {
  await page.goto('/ascii-art');
  const output = page.locator('[data-output]');
  await expect(output).toContainText('|');
  await expect(page.locator('[data-label]')).toHaveText('Пример');

  await page.getByLabel('Текст').fill('Hi');
  await expect(page.locator('[data-label]')).toHaveText('Результат');
  const standard = await output.textContent();
  await page.locator('[data-fonts] label', { hasText: 'Slant' }).click();
  await expect(output).not.toHaveText(standard ?? '');
  await expect(output).toContainText('/');
  await copy(page);
  expect(await clipboard(page)).toBe(await output.textContent());
});

test('ASCII Art: кириллица не пропадает молча', async ({ page }) => {
  await page.goto('/ascii-art');
  await expect(page.locator('[data-output]')).toContainText('|');
  await page.getByLabel('Текст').fill('Привет');
  await expect(page.locator('[data-warning]')).toBeVisible();
});

test('Emoji Picker: поиск по-русски и копирование нажатием', async ({ page }) => {
  await page.goto('/emoji');
  await expect(page.getByLabel('Поиск', { exact: true })).toBeFocused();
  await expect(page.locator('.emoji-btn').first()).toBeVisible();
  await page.getByLabel('Поиск', { exact: true }).fill('морда кошки');
  await expect(page.locator('[data-count]')).toHaveText('1');
  await page.locator('.emoji-btn').first().click();
  await expect(page.locator('[data-picked]')).toContainText('Скопировано: 🐱');
  expect(await clipboard(page)).toBe('🐱');

  await page.getByLabel('Поиск', { exact: true }).fill('такого нет');
  await expect(page.locator('[data-empty]')).toBeVisible();
});
