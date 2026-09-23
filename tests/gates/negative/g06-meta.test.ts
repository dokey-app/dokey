import { describe, expect, it } from 'vitest';
import { failureOf } from './harness.ts';

// Негативный прогон G-06 (D-106 п. 1, NFR-17, US-047 крит. 3): гейт уникальности `title` и
// `description` обязан краснеть на нарушающей сборке. Предмет суда — **сборка целиком**.
//
// Повтор и пустота — два разных исхода одного гейта, и пустота в нём судится первой: страница
// без `description` в фикстуре повтора закрыла бы собой повтор, и случай проходил бы не тем
// приговором, каким кажется. Поэтому фикстуры раздельные.

function page(title: string | undefined, description: string | undefined): string {
  const head = [
    title === undefined ? '' : `<title>${title}</title>`,
    description === undefined ? '' : `<meta name="description" content="${description}">`,
  ].join('');
  return `<!doctype html><html lang="ru"><head>${head}</head><body></body></html>`;
}

// Порядок маршрутов в приговоре задаёт `readdir`, а не набор: случай сверяет, что названы обе
// страницы, а не в каком порядке их перечислила файловая система.
function both(kind: string, value: string): RegExp {
  return new RegExp(`${kind} «${value}» на (a\\.html, b\\.html|b\\.html, a\\.html)`);
}

// Пустота у гейта — одна ветка на два операнда: `title === '' || description === ''`. Класс
// закрывается целиком, обоими операндами: пока случаи подавали непустой `title`, снятие его
// половины из гейта оставляло прогон зелёным — гейт переставал проверять, не краснея.
// Формы пустоты тоже перечислены: пустое значение, одни пробелы (гейт снимает их `trim`) и
// вовсе отсутствующий тег дают у гейта одну и ту же пустоту.
const BLANK: Record<string, string | undefined> = {
  'пустое значение': '',
  'одни пробелы': '   ',
  'тега нет вовсе': undefined,
};

const BLANK_CASES = Object.entries(BLANK).flatMap(
  ([form, blank]): (readonly [string, string])[] => [
    [`title — ${form}`, page(blank, 'Ввод не покидает вкладку')],
    [`description — ${form}`, page('Каталог инструментов', blank)],
  ],
);

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

  // Соседняя страница с непустыми и неповторяющимися значениями — чтобы приговор назвал именно
  // пустоту и именно ту страницу, а не повтор пустых значений на двух сразу.
  it.each(BLANK_CASES)(
    'валит страницу, где пуст %s',
    async (_, offender) => {
      const detail = await failureOf('G-06', {
        'dist/index.html': offender,
        'dist/other.html': page('Дерево JSON', 'Инструмент работает во вкладке'),
      });
      expect(detail).toBe('пустой title или description: index.html');
    },
    60_000,
  );
});
