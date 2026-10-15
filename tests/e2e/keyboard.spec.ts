import { expect, test } from './fixtures.ts';
import { routes } from './pages.ts';

// Всё проходится клавиатурой: каждый видимый элемент управления получает фокус по Tab.
// Из группы радиокнопок в порядок Tab входит одна (выбранная) — остальные выбираются стрелками.
for (const route of routes) {
  test(`${route}: каждый видимый элемент управления достижим по Tab`, async ({ page }) => {
    await page.goto(route);
    await page.waitForTimeout(300);
    // Свёрнутые блоки раскрыты: их содержимое тоже должно быть достижимо.
    await page.evaluate(() => {
      for (const d of document.querySelectorAll('details')) d.open = true;
    });

    const expected = await page.evaluate(() => {
      const els = [
        ...document.querySelectorAll<HTMLElement>(
          'a[href], button, input, textarea, select, summary, [tabindex="0"]',
        ),
      ];
      return els
        .filter((el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const hiddenRadio = el instanceof HTMLInputElement && el.type === 'radio' && !el.checked;
          const visible = rect.width > 0 || el.closest('label')?.getBoundingClientRect().width;
          return (
            !(el as HTMLButtonElement).disabled &&
            el.getAttribute('aria-hidden') !== 'true' &&
            style.visibility !== 'hidden' &&
            !el.closest('[hidden]') &&
            visible &&
            !hiddenRadio
          );
        })
        .map((el, i) => {
          el.dataset['kbd'] = String(i);
          return i;
        });
    });

    const reached = new Set<string>();
    await page.locator('body').focus();
    for (let i = 0; i < expected.length + 10; i += 1) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.dataset['kbd'],
      );
      if (id !== undefined) reached.add(id);
    }
    const missed = expected.filter((i) => !reached.has(String(i)));
    const described = await page.evaluate(
      (ids) =>
        ids.map((i) => document.querySelector(`[data-kbd="${i}"]`)?.outerHTML.slice(0, 80) ?? ''),
      missed,
    );
    expect(described).toEqual([]);
  });
}
