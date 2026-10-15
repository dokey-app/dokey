# Архитектура

Статический сайт: Astro собирает HTML каждого маршрута, интерактивность — небольшие скрипты на
ванильном TypeScript. Фреймворка в бандле нет, сервера нет. Хостинг — Cloudflare Workers со
статическими ассетами; Worker только раздаёт `dist/`.

```mermaid
flowchart LR
  R[src/registry/tools.ts] --> P[src/pages/*]
  T[src/tools/&lt;id&gt;/logic.ts] --> U[src/tools/&lt;id&gt;/ui.ts]
  U --> P
  D[src/detect] --> H[/ главная/]
  T --> D
  P --> B[astro build → dist/] --> CF[Cloudflare Workers]
```

## Структура `src/`

| Каталог           | Что внутри                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| `registry/`       | `tools.ts` — список инструментов. Единственный источник маршрутов и sitemap |
| `tools/<id>/`     | `logic.ts` — чистые функции (тестируются в node); `ui.ts` — работа с DOM    |
| `detect/`         | Автоопределение: лестница распознавателей поверх `logic.ts` инструментов    |
| `pages/`          | Маршруты Astro: `<id>.astro` на инструмент, главная, 404, `sitemap.xml`     |
| `layouts/`, `ui/` | Макет страницы и общие элементы (кнопка копирования, чипсы, статус)         |
| `styles/`         | `tokens.css` (токены дизайн-системы, тёмная тема по системе), `base.css`    |
| `egress/`         | Счётчик внешних запросов (`PerformanceObserver` по ресурсам)                |
| `worker/`         | Не используется: см. решение 18 в decisions.md                              |

Правила зависимостей: `registry` не импортирует `tools` и `ui`; `logic.ts` не трогает DOM и
может брать чужой `logic.ts` (JWT — парсер JSON и вывод времени из timestamp);
новый инструмент — это каталог в `tools/`, страница `pages/<id>.astro` и запись в
`registry/tools.ts`; sitemap и ссылки на главной выводятся из реестра. Страница без записи в
реестре (или наоборот) валит `build.spec.ts`. Служебные индексируемые страницы — `staticPaths`
в `registry/sitemap.ts`.

Сборка — `build.format: 'file'`: `jwt.html` отдаётся по `/jwt` (без слеша). Инлайн-скриптов и
`style`-атрибутов нет — их блокирует CSP. Шрифты системные (самохостинг — после v1).

## Запись `Tool`

```ts
interface Tool {
  id: string; // kebab-case, = сегмент маршрута; после релиза не меняется никогда
  name: string; // продуктовое имя, не переводится: «JWT Inspector»
  title: string; // <title> и H1 с поисковой формулировкой
  description: string; // meta description и вводный абзац (≤ 240 знаков)
  faq: { q: string; a: string }[]; // 3–5 пунктов
  sensitiveInput: boolean; // true → обнуление ввода при уходе со страницы (JWT)
}
```

Идентификаторы v1: `json`, `jwt`, `base64`, `url`, `unix-timestamp`, `uuid`.

## Страница инструмента

Без клиентского роутера: переход между инструментами — обычная навигация, поэтому состояние
ввода живёт в переменных модуля и умирает вместе со страницей. Для `sensitiveInput` дополнительно
на `pagehide` обнуляются поля ввода, ключ и буферы, переданные в WebCrypto (bfcache иначе
сохранит их).

Пользовательские данные попадают в DOM **только** через `textContent` и создание узлов.
`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `srcdoc`, `document.write` запрещены линтом
(`.oxlintrc.json`); CSP `require-trusted-types-for 'script'` — второй рубеж в Chromium.

## Зависимости продукта

Прикладных зависимостей нет: свой разборщик JSON, WebCrypto (HMAC), `TextEncoder`/`TextDecoder`,
`URL`, `Intl`, `crypto.getRandomValues` (UUID v4/v7 и ULID — своя реализация по RFC 9562 и
спецификации ULID). Любая новая зависимость — запись в [decisions.md](decisions.md).

## Инварианты и их проверки

| Инвариант                                                                | Проверка                                        |
| ------------------------------------------------------------------------ | ----------------------------------------------- |
| Ни одного запроса на сторонний origin; CSP `'self'`                      | `tests/e2e/invariants.spec.ts`, `build.spec.ts` |
| Ввод не пишется в storage, cookie, IndexedDB, URL, history               | `tests/e2e/invariants.spec.ts`                  |
| Initial JS ≤ 40 KB gzip на страницу (статические импорты включены)       | `tests/e2e/build.spec.ts`                       |
| Ни одного нарушения CSP (инлайн-скрипты, `style`-атрибуты, чужие origin) | `tests/e2e/fixtures.ts` — в каждом e2e-тесте    |
| Разметка из ввода не строится                                            | `pnpm lint`                                     |
| `Tool.id` не меняется после релиза                                       | правило в `CLAUDE.md`                           |

Инвариантные тесты обходят **все** страницы `dist/` и вводят маркер во все поля — новые
инструменты попадают под проверку автоматически. `astro preview` не отдаёт `_headers`, поэтому
фикстура `tests/e2e/fixtures.ts` подставляет CSP из `dist/_headers` в каждый ответ: e2e
работают под той же политикой, что прод. e2e-тесты импортируют `test` из `./fixtures.ts`.

## Заголовки

`public/_headers` — единственный источник: CSP (`default-src 'self'`, `script-src 'self'`,
`connect-src 'self'`, `frame-ancestors 'none'`, `require-trusted-types-for 'script'`), HSTS,
`Referrer-Policy: no-referrer`, COOP/CORP, кеш для хешированных ассетов. Cloudflare не
заменяет одноимённый заголовок, а дописывает, поэтому частные правила начинаются с
`! Cache-Control`.

## Сборка, тесты, деплой

- `pnpm check` — lint, Prettier, `tsc`, Vitest (node), сборка и Playwright.
- CI (`.github/workflows/ci.yml`) делает то же на каждый PR и push; push в `main` после
  зелёного прогона выкатывает версию Worker (`wrangler versions upload/deploy`) и сверяет CSP прода.
- До релиза сайт закрыт от индексации (`noindex` в макете, `Disallow: /` в `robots.txt`).
