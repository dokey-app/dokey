import { getCategory, tools } from '../../src/registry/tools.ts';
import { expect, test } from './fixtures.ts';

test('сайдбар перечисляет инструменты реестра и отмечает текущий', async ({ page }) => {
  await page.goto('/json');
  const nav = page.getByRole('navigation', { name: 'Навигация' });
  for (const tool of tools) {
    await expect(nav.getByRole('link', { name: tool.name, exact: true })).toHaveAttribute(
      'href',
      `/${tool.id}`,
    );
  }
  await expect(nav.locator('[aria-current="page"]')).toHaveText('JSON Workbench');
});

test('секция сворачивается по заголовку', async ({ page }) => {
  await page.goto('/json');
  const nav = page.getByRole('navigation', { name: 'Навигация' });
  const link = nav.getByRole('link', { name: 'JWT Inspector', exact: true });
  const section = nav.getByText(getCategory('web'), { exact: true });
  await section.click();
  await expect(link).toBeHidden();
  await section.click();
  await expect(link).toBeVisible();
});

test('поиск оставляет подходящие инструменты, очистка возвращает меню', async ({ page }) => {
  await page.goto('/json');
  const nav = page.getByRole('navigation', { name: 'Навигация' });
  const search = nav.getByRole('searchbox', { name: 'Поиск инструмента' });
  const links = nav.locator('.scroll a:visible');

  await search.fill('подпись');
  await expect(links).toHaveText(['JWT Inspector']);

  await search.fill('такого нет');
  await expect(links).toHaveCount(0);
  await expect(nav.getByText('Ничего не найдено')).toBeVisible();

  await search.press('Escape');
  await expect(links).toHaveCount(tools.length + 1);
  await expect(nav.getByText('Ничего не найдено')).toBeHidden();
});

test('свёрнутый раздел после поиска остаётся свёрнутым', async ({ page }) => {
  await page.goto('/json');
  const nav = page.getByRole('navigation', { name: 'Навигация' });
  const link = nav.getByRole('link', { name: 'JWT Inspector', exact: true });
  await nav.getByText(getCategory('web'), { exact: true }).click();

  await nav.getByRole('searchbox').fill('jwt');
  await expect(link).toBeVisible();
  await nav.getByRole('searchbox').fill('');
  await expect(link).toBeHidden();
});

test('Ctrl+K ставит фокус в поиск; запрос никуда не пишется', async ({ page }) => {
  await page.goto('/json');
  await page.keyboard.press('Control+k');
  const search = page.getByRole('searchbox', { name: 'Поиск инструмента' });
  await expect(search).toBeFocused();
  await search.fill('секретный-запрос');
  expect(page.url()).not.toContain('секретный');
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test.describe('узкий экран', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('сайдбар скрыт, «Меню» открывает его, Esc закрывает', async ({ page }) => {
    await page.goto('/json');
    const nav = page.getByRole('navigation', { name: 'Навигация' });
    await expect(nav).toBeHidden();

    await page.getByRole('button', { name: 'Меню' }).click();
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();

    await page.getByRole('button', { name: 'Меню' }).click();
    await nav.getByRole('link', { name: 'JWT Inspector', exact: true }).click();
    await expect(page).toHaveURL(/\/jwt$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('JWT Inspector');
  });
});
