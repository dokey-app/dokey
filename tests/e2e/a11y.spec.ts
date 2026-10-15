import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures.ts';
import { routes } from './pages.ts';

// WCAG 2.2 AA на каждой странице сборки, в обеих темах — до ввода и с вводом.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const route of routes) {
      test(`${route}: нет нарушений axe`, async ({ page }) => {
        await page.goto(route);
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

        // Второе состояние — с вводом: невалидный для JSON и JWT, обычный текст для Base64.
        const textarea = page.locator('textarea').first();
        if ((await textarea.count()) > 0) {
          await textarea.fill('{"a":1 "b":2}');
          await page.waitForTimeout(600); // пересчёт идёт с задержкой до 400 мс
          const withInput = await new AxeBuilder({ page }).withTags(TAGS).analyze();
          expect(withInput.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
        }
      });
    }
  });
}
