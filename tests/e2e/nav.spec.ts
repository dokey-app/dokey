import { tools } from '../../src/registry/tools.ts';
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
  await nav.getByText('Инструменты', { exact: true }).click();
  await expect(link).toBeHidden();
  await nav.getByText('Инструменты', { exact: true }).click();
  await expect(link).toBeVisible();
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
