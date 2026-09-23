import { describe, expect, it } from 'vitest';
import { failureOf } from './harness.ts';

// Негативный прогон G-02 (D-106 п. 2, NFR-17, US-047 крит. 3): гейт бюджетов веса обязан
// краснеть на нарушающей сборке. Предмет суда здесь — **сборка целиком**; разбор HTML и
// импортов судит RUN-01 (tests/unit/size-gate.test.ts).

const BUDGET = {
  name: 'initial JS',
  measure: 'initial-js',
  path: 'dist/**/*.html',
  limit: '40 kB',
  gzip: true,
};

// Бюджет считается по сжатому размеру: повторяющаяся набивка ужалась бы до пары сотен байт и
// порога не тронула бы. Генератор — xorshift32 с постоянным зерном: ввод псевдослучайный, но
// один и тот же от прогона к прогону.
function incompressible(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const out: string[] = [];
  let seed = 0x20260923;
  for (let index = 0; index < length; index += 1) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    out.push(alphabet.charAt((seed >>> 0) % alphabet.length));
  }
  return out.join('');
}

function heavyModule(length: number): string {
  return `export const blob=${JSON.stringify(incompressible(length))};\n`;
}

// Спецификатор, не разрешающийся в файл сборки, — провал: неразрешённое не может молча выпасть
// из счёта. Проверяется класс, а не найденная форма, — все шесть способов не дать файла сборки:
// корень и относительный путь без файла, выход за `dist`, голое имя пакета, URL и `//хост`.
const UNRESOLVED: Record<string, string> = {
  'от корня сборки, файла нет': '/nope.js',
  'относительный, файла нет': './nope.js',
  'за пределами dist': '../outside.js',
  'голое имя пакета': 'lodash-es',
  'URL стороннего origin': 'https://cdn.example.com/a.js',
  'от протокола, чужой хост': '//cdn.example.com/a.js',
};

describe('G-02 на нарушающей сборке', () => {
  it('валит сборку, чей initial JS больше бюджета, и называет маршрут', async () => {
    const detail = await failureOf('G-02', {
      '.size-limit.json': JSON.stringify([BUDGET]),
      'dist/index.html': '<script type="module" src="/big.js"></script>',
      'dist/big.js': heavyModule(100_000),
    });
    expect(detail).toContain('initial JS: /');
    expect(detail).toContain('> 40000 B');
  }, 60_000);

  // Путь бюджета, не нашедший файла, когда соседние нашли, — провал, а не счёт части предмета
  // за целое: иначе выпавший из сборки шрифт делал бы бюджет зелёным. Когда файла нет ни у
  // одного пути, предмета нет вовсе — это другой исход, и здесь он не проверяется.
  it('валит бюджет, чей путь не нашёл файла при нашедших соседях', async () => {
    const detail = await failureOf('G-02', {
      '.size-limit.json': JSON.stringify([
        {
          name: 'шрифты критического пути',
          path: ['dist/fonts/manrope-400.woff2', 'dist/fonts/jetbrains-mono-400.woff2'],
          limit: '48 kB',
          gzip: true,
        },
      ]),
      'dist/fonts/manrope-400.woff2': 'woff2',
    });
    expect(detail).toContain(
      'шрифты критического пути: в сборке нет dist/fonts/jetbrains-mono-400.woff2',
    );
    expect(detail).toContain('часть предмета за целое не мерится');
  }, 60_000);

  it('валит маршрут на спецификаторе, не разрешающемся в файл сборки, в каждой форме', async () => {
    const tags = Object.values(UNRESOLVED)
      .map((specifier) => `<script type="module" src="${specifier}"></script>`)
      .join('');
    const detail = await failureOf('G-02', {
      '.size-limit.json': JSON.stringify([BUDGET]),
      // `../outside.js` лежит на диске: ребро отбито границей `dist`, а не отсутствием файла.
      'outside.js': 'export const outside = 1;\n',
      'dist/index.html': `${tags}<script type="module" src="/app.js"></script>`,
      'dist/app.js': 'import "./gone.js";\n',
    });
    for (const [form, specifier] of Object.entries(UNRESOLVED)) {
      expect(detail, form).toContain(
        `/: «${specifier}» из index.html не разрешается в файл сборки`,
      );
    }
    // Ребро из самого модуля, а не из HTML: обход графа отбивает его так же.
    expect(detail).toContain('/: «./gone.js» из app.js не разрешается в файл сборки');
  }, 60_000);
});
