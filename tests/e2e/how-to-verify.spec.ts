import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures.ts';

test('ссылка «Как это проверить» есть в шапке каждой страницы и ведёт на процедуру', async ({
  page,
}) => {
  await page.goto('/json');
  await page.getByRole('banner').getByRole('link', { name: 'Как это проверить' }).click();
  await expect(page).toHaveURL(/\/how-to-verify$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Как это проверить');
});

test('политика на странице совпадает с public/_headers', async ({ page }) => {
  const csp = readFileSync('public/_headers', 'utf8').match(/Content-Security-Policy:\s*(.+)/)![1]!;
  await page.goto('/how-to-verify');
  const shown = (await page.locator('[data-csp]').textContent())!.replaceAll('\n', ' ');
  expect(shown).toBe(csp);
});

test('нет запрещённых формулировок', async ({ page }) => {
  await page.goto('/how-to-verify');
  const text = (await page.locator('main').textContent()) ?? '';
  for (const banned of [
    /приватность/i,
    /политика конфиденциальности/i,
    /мы ничего не отправляем/i,
    /в безопасности/i,
    /гарантируем/i,
    /100\s*%/,
  ]) {
    expect(text).not.toMatch(banned);
  }
});
