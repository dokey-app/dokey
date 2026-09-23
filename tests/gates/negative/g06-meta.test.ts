import { describe, expect, it } from 'vitest';
import { failureOf } from './harness.ts';

// Негативный прогон G-06 (D-106 п. 2, NFR-17, US-047 крит. 3): гейт уникальности `title` и
// `description` обязан краснеть на нарушающей сборке. Предмет суда — **сборка целиком**.
//
// Повтор и пустота — два разных исхода одного гейта, и пустота в нём судится первой: страница
// без `description` в фикстуре повтора закрыла бы собой повтор, и случай проходил бы не тем
// приговором, каким кажется. Поэтому фикстуры раздельные.

function page(title: string, description: string | undefined): string {
  const meta =
    description === undefined ? '' : `<meta name="description" content="${description}">`;
  return `<!doctype html><html lang="ru"><head><title>${title}</title>${meta}</head><body></body></html>`;
}

// Порядок маршрутов в приговоре задаёт `readdir`, а не набор: случай сверяет, что названы обе
// страницы, а не в каком порядке их перечислила файловая система.
function both(kind: string, value: string): RegExp {
  return new RegExp(`${kind} «${value}» на (a\\.html, b\\.html|b\\.html, a\\.html)`);
}

// «Пустой description» — класс, а не одна форма: пустое значение атрибута, одни пробелы в нём
// (гейт снимает их `trim`) и вовсе отсутствующий тег дают у гейта ту же пустоту.
const EMPTY: Record<string, string | undefined> = {
  'пустое значение content': '',
  'одни пробелы в content': '   ',
  'тега description нет вовсе': undefined,
};

describe('G-06 на нарушающей сборке', () => {
  it('валит две страницы с одинаковым title и называет обе', async () => {
    const detail = await failureOf('G-06', {
      'dist/a.html': page('DoKey — инструменты', 'Каталог инструментов разработчика'),
      'dist/b.html': page('DoKey — инструменты', 'Дерево JSON без отправки на сервер'),
    });
    expect(detail).toMatch(both('title', 'DoKey — инструменты'));
  }, 60_000);

  it('валит две страницы с одинаковым description и называет обе', async () => {
    const detail = await failureOf('G-06', {
      'dist/a.html': page('Каталог инструментов', 'Ввод не покидает вкладку'),
      'dist/b.html': page('Дерево JSON', 'Ввод не покидает вкладку'),
    });
    expect(detail).toMatch(both('description', 'Ввод не покидает вкладку'));
  }, 60_000);

  // Соседняя страница с непустым и неповторяющимся description — чтобы приговор назвал именно
  // пустоту и именно ту страницу, а не повтор пустых значений на двух сразу.
  it.each(Object.entries(EMPTY))(
    'валит страницу с пустым description: %s',
    async (_, description) => {
      const detail = await failureOf('G-06', {
        'dist/index.html': page('Каталог инструментов', description),
        'dist/other.html': page('Дерево JSON', 'Ввод не покидает вкладку'),
      });
      expect(detail).toBe('пустой title или description: index.html');
    },
    60_000,
  );
});
