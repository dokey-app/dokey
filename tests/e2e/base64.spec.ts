import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const output = '[data-output]';

test.beforeEach(async ({ page }) => {
  await page.goto('/base64');
});

test('до ввода — пример, поле в фокусе', async ({ page }) => {
  await expect(page.getByLabel('Текст или base64')).toBeFocused();
  await expect(page.locator('[data-result-label]')).toHaveText('Пример');
  await expect(page.locator(output)).not.toBeEmpty();
});

test('текст кодируется, результат копируется', async ({ page }) => {
  await page.getByLabel('Текст или base64').fill('Привет 👋');
  await expect(page.locator(output)).toHaveText(Buffer.from('Привет 👋').toString('base64'));
  await expect(page.getByLabel('Кодировать', { exact: true })).toBeChecked();
  await page.locator('[data-copy]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    Buffer.from('Привет 👋').toString('base64'),
  );
});

test('base64 распознаётся и декодируется; ручной выбор сильнее', async ({ page }) => {
  const input = page.getByLabel('Текст или base64');
  await input.fill(Buffer.from('декодируй меня').toString('base64'));
  await expect(page.getByLabel('Декодировать', { exact: true })).toBeChecked();
  await expect(page.locator(output)).toHaveText('декодируй меня');

  await page.getByText('Кодировать', { exact: true }).click();
  await expect(page.locator(output)).toHaveText(
    Buffer.from(Buffer.from('декодируй меня').toString('base64')).toString('base64'),
  );
});

test('URL-safe алфавит', async ({ page }) => {
  await page.getByLabel('Текст или base64').fill('a?b>');
  await page.getByLabel('URL-safe').check();
  await expect(page.locator(output)).toHaveText(Buffer.from('a?b>').toString('base64url'));
});

test('ошибка декодирования — с позицией и подсказкой', async ({ page }) => {
  await page.getByText('Декодировать', { exact: true }).click();
  await page.getByLabel('Текст или base64').fill('YWJjZ');
  await expect(page.locator('[data-error]')).toHaveText(
    'Некорректная base64-строка: длина не кратна четырём. Возможно, при копировании потерялся хвост',
  );
  await expect(page.locator('[data-copy]')).toBeDisabled();
});

test('двоичный результат: hex-превью и «Скачать файл»', async ({ page }) => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
  await page.getByText('Декодировать', { exact: true }).click();
  await page.getByLabel('Текст или base64').fill(png.toString('base64'));
  await expect(page.locator('[data-binary-info]')).toHaveText('Двоичные данные · 12 Б');
  await expect(page.locator('[data-hex]')).toContainText('89 50 4e 47 0d 0a 1a 0a');

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать файл' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('decoded.bin');
  expect(readFileSync(await download.path())).toEqual(png);
});

test('файл кодируется частями и совпадает с base64 целого', async ({ page }) => {
  const bytes = Buffer.from(Array.from({ length: 100_000 }, (_, i) => i % 256));
  await page.getByText('Файл', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Выбрать файл' })).toBeFocused();
  await page.locator('[data-file]').setInputFiles({
    name: 'data.bin',
    mimeType: 'application/octet-stream',
    buffer: bytes,
  });
  await expect(page.locator('[data-file-info]')).toHaveText('data.bin · 100 КБ');
  await expect(page.locator(output)).toHaveText(bytes.toString('base64'));
});

test('файл больше мягкого порога — «Обработать»; «Очистить» возвращает исходное состояние', async ({
  page,
}) => {
  await page.getByText('Файл', { exact: true }).click();
  await page.locator('[data-file]').setInputFiles({
    name: 'big.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(2_500_000, 1),
  });
  await expect(page.locator('[data-threshold]')).toContainText('Файл 2,5 МБ — больше порога 2 МБ');
  await page.getByRole('button', { name: 'Обработать' }).click();
  await expect(page.locator('[data-result-label]')).toHaveText('Результат');
  await expect(page.locator(output)).toContainText('AQEB');

  await page.getByRole('button', { name: 'Очистить' }).click();
  await expect(page.locator('[data-result-label]')).toHaveText('Пример');
  await expect(page.locator('[data-file-info]')).toHaveText(
    'Файл читается в этой вкладке, внешних запросов — 0',
  );
});
