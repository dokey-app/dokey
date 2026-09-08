# DoKey — CLAUDE.md

Каталог браузерных инструментов для разработчика (JSON, JWT, Base64, URL, timestamp, UUID/ULID).
**Ввод физически не покидает вкладку:** сервера, аккаунтов, истории и хранения нет по построению.
Кода ещё нет — этап Э-0 «труба» (T-001…T-032 из 206), релиз `v1.0.0` 2026-12-21. Здесь только то,
что нужно каждую сессию; полный черновик — `docs/agent-rules.md`.

## Команды

- `pnpm dev` · `build` — каркас · статическая сборка · `pnpm lint` · `format:check` · `typecheck` — oxlint · Prettier · tsc
- `pnpm test:unit` · `test:int` (Vitest browser mode, **не jsdom**) · `test:e2e` — RUN-01…RUN-03
- `pnpm gates` — все 14 (`gate:size|lh|persist|egress|fields|meta|sitemap|ladder|a11y|provisional|nomouse|words|subset|toolids`)
- Версии пиннятся **точно**; `^` в манифесте запрещён (tech-stack §3, ADR-01…ADR-18)

## Структура и имена

`src/registry` — единственный источник маршрутов; рядом `shell router detect palette egress
analytics tools/<toolId> worker virtual editor sw pages content ui styles` — по компоненту КМП-NN
(architecture §2.1). Вне `src`: `infra/ scripts/gates/ fixtures/ tests/`.
Сущности, поля, роли — **английские из `docs/glossary.md`**, единственное число (`Tool`, `Route`,
`TypeDetector`, `AppShell`, `Maintainer`); интерфейс и документы — русская колонка; синоним из
glossary §6 — дефект, а не стиль. Файлы lowercase-kebab, типы и `.astro` — PascalCase.
События — `объект_действие` (analytics-spec).

## Запрещено — инварианты architecture §10, причины и гейты в agent-rules §6

- **IMPORTANT: ввод и результат не покидают вкладку.** `script-src`/`connect-src` = `'self'`; ни CDN, ни Google Fonts, ни Sentry, ни SDK телеметрии — сторонних origin ровно 0 (ИНВ-01, `gate:egress`)
- **Ввод никуда не пишется:** `localStorage`, `sessionStorage`, URL, query, фрагмент, история — персистентность равна нулю (ИНВ-02, `gate:persist`)
- **Маршрут не заводится мимо `src/registry`**, и сам `registry` не импортирует `shell` и `tools` (ИНВ-06)
- **`Tool.id` после релиза неизменен** (ИНВ-07) · **поля аналитики не добавляются** — наружу идёт только закрытый список ENT-29 (ИНВ-05, `gate:fields`)
- **Ни React/Preact/Svelte/Vue/Tailwind/Lucide бандлом** — initial JS ≤ 40 KB gzip (`gate:size`) · **ни сервера, ни БД, ни очереди, ни аутентификации, ни шеринга** — красные линии D-05, это не «пока»
- **Возможность браузерного API не подделывается:** `Math.random` вместо `getRandomValues`, «Скопировано» без копирования, своя криптография ради `http`
- **`docs/openapi.yaml` генерируется** из api-spec.md — руками не править · **архитектурное решение внутри задачи не принимается**, оно идёт в `open-questions.md` как Q-NN

## Работа

Одна сессия = одна задача из `docs/tasks.md`. Взять **верхнюю** `- [ ]` (`⚠ Q-NN` — не брать,
`блок: T-NNN` — сначала та): `/plan T-NNN` → человек одобряет → `/clear` → `/build` → `/check` →
`/ship` → `/clear` → `/go`. План не влезает на экран, трогает > 5–7 файлов или требует решения,
которого нет ни в decisions, ни в tasks, — задача режется. Ветка `t-042-json-tree`, один коммит
`T-042: дерево JSON (US-020)`, отметка `- [x]` в нём же; PR обязателен — гейты живут на PR, прямой
пуш в `main` закрыт. **Найденное попутно не чинить:** строка `- [ ]` в tasks.md либо `Q-NN` в
open-questions.md; правка не по теме задачи в диффе — дефект PR, а не бонус.
**Перед коммитом:** `pnpm lint && pnpm format:check && pnpm typecheck` → затронутые уровни тестов
целиком → команда из графы «готово» плюс гейты по предмету (при сомнении `pnpm gates`). Тексты —
дословно из content-guide и glossary §4. Трогали лестницу — фикстуры в том же PR.

## Куда смотреть

Очередь `tasks.md` · этапы `implementation-plan.md` · компоненты и ИНВ `architecture.md` · версии
`tech-stack.md` · имена `glossary.md` · поля и пороги `data-model.md` · критерии `user-stories.md` ·
проверки `test-plan.md` · «почему так» `decisions.md` · чего не знаем `open-questions.md` · тексты
`content-guide.md` и `Design System/` · контракты `api-spec.md` `analytics-spec.md`
`security-and-access.md` · экраны `screen-map.md` `user-flows.md`
