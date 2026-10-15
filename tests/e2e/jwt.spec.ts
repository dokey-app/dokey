import { createHmac } from 'node:crypto';
import { expect, test } from './fixtures.ts';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const b64url = (value: string): string => Buffer.from(value).toString('base64url');

function token(header: object, payload: object, key = 'secret-key'): string {
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  return `${input}.${createHmac('sha256', key).update(input).digest('base64url')}`;
}

// Уникальная подстрока, по которой ищем следы токена в DOM после ухода со страницы.
const MARKER = 'marker-5b1e0c';
const HS256 = token({ alg: 'HS256', typ: 'JWT' }, { sub: MARKER, exp: 1767236400 });

test.beforeEach(async ({ page }) => {
  await page.goto('/jwt');
});

test('до ввода — разобранный пример, поле в фокусе', async ({ page }) => {
  await expect(page.getByLabel('JWT', { exact: true })).toBeFocused();
  await expect(page.locator('[data-result-label]')).toHaveText('Пример');
  await expect(page.locator('[data-payload]')).toContainText('Ann Example');
});

test('вставил → header, payload, время → скопировал payload', async ({ page }) => {
  await page.getByLabel('JWT', { exact: true }).fill(`Bearer ${HS256}`);
  await expect(page.locator('[data-result-label]')).toHaveText('Результат');
  await expect(page.locator('[data-header]')).toContainText('"alg": "HS256"');
  await expect(page.locator('[data-payload]')).toContainText(MARKER);
  await expect(page.locator('[data-claims]')).toContainText(
    /Истёк · 1 января 2026, 03:00 UTC · .+ назад/,
  );
  await page.getByRole('button', { name: 'Скопировать payload' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(MARKER);
});

test('проверка подписи: верна, не совпала, сброс при смене ключа', async ({ page }) => {
  await page.getByLabel('JWT', { exact: true }).fill(HS256);
  const verdict = page.locator('[data-verdict]');
  await expect(verdict).toHaveText('Подпись не проверялась');

  await page.getByText('Проверить подпись', { exact: true }).first().click();
  const key = page.getByLabel('Ключ подписи');
  const verify = page.getByRole('button', { name: 'Проверить подпись' });
  await expect(verify).toBeDisabled();

  await key.fill('secret-key');
  await verify.click();
  await expect(verdict).toHaveText('Подпись верна');

  await key.fill('wrong');
  await expect(verdict).toHaveText('Подпись не проверялась');
  await verify.click();
  await expect(verdict).toHaveText('Подпись не совпала. Проверьте ключ подписи и алгоритм');
});

test('ключ замаскирован и показывается по кнопке', async ({ page }) => {
  await page.getByText('Проверить подпись', { exact: true }).first().click();
  const key = page.getByLabel('Ключ подписи');
  await expect(key).toHaveAttribute('type', 'text');
  await expect(key).toHaveClass(/masked/);
  await page.getByRole('button', { name: 'Показать' }).click();
  await expect(key).not.toHaveClass(/masked/);
  await expect(page.getByRole('button', { name: 'Скрыть' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('alg none и RS256 не проверяются, но разбираются', async ({ page }) => {
  const input = page.getByLabel('JWT', { exact: true });
  await input.fill(`${b64url('{"alg":"none"}')}.${b64url('{"sub":"x"}')}.`);
  await expect(page.locator('[data-verdict]')).toHaveText(
    'Токен не подписан (alg: none). Подтвердить его подлинность нечем.',
  );

  await input.fill(`${b64url('{"alg":"RS256"}')}.${b64url('{"sub":"x"}')}.c2ln`);
  await expect(page.locator('[data-payload]')).toContainText('"sub": "x"');
  await expect(page.locator('[data-verify-hint]')).toHaveText(
    'Подпись RS256 локально не проверяется — нужен открытый ключ. header и payload разобраны',
  );
});

test('не три сегмента — понятная ошибка, ввод сохраняется', async ({ page }) => {
  const input = page.getByLabel('JWT', { exact: true });
  await input.fill('abc.def');
  await expect(page.getByRole('alert').filter({ hasText: 'сегмент' })).toHaveText(
    'Ожидались три сегмента, разделённые точкой. Найдено сегментов: 2',
  );
  await expect(input).toHaveValue('abc.def');
});

test('уход со страницы стирает токен и ключ', async ({ page }) => {
  await page.getByLabel('JWT', { exact: true }).fill(HS256);
  await page.getByText('Проверить подпись', { exact: true }).first().click();
  await page.getByLabel('Ключ подписи').fill('secret-key');
  await expect(page.locator('[data-payload]')).toContainText(MARKER);

  await page.goto('/');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Декодировать JWT и проверить подпись');
  await expect(page.getByLabel('JWT', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Ключ подписи')).toHaveValue('');
  expect(await page.content()).not.toContain(MARKER);
});
