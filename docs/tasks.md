# DoKey — Очередь задач

**Дата:** 2026-09-07 · **Статус:** черновик к согласованию
**Опирается на:** [implementation-plan.md](implementation-plan.md) (этапы Э-0…Э-11, §1.1 чек-лист
вертикали, §4 ветвление), [backlog.md](backlog.md) (US-001…US-067, TECH-01…TECH-15, §1.12
зависимости), [user-stories.md](user-stories.md) (критерии приёмки),
[architecture.md](architecture.md) (КМП-01…КМП-20, ИНВ-01…ИНВ-12),
[tech-stack.md](tech-stack.md) (ADR-01…ADR-18), [test-plan.md](test-plan.md) (RUN-01…RUN-18,
G-01…G-14, §7.2 чек-лист приёмки истории), [data-model.md](data-model.md) (ENT-03, ENT-19,
ENT-21…ENT-30).
**Не содержит:** критериев приёмки (они в user-stories — задача ссылается на историю, а не
пересказывает её), оценок в днях (они в implementation-plan §6), обоснований решений (decisions).
**Новые вопросы:** Q-211…Q-220 в [open-questions.md](open-questions.md).

---

## 0. Соглашения

### 0.1. Форма задачи

```
- [ ] T-042 — что сделать (US-014): границы — какие файлы и модули; готово — какая команда проходит
```

**Что сделать** — одно действие в повелительном наклонении, без «и»: два действия через «и» — это
две задачи. **US-NNN** в скобках — история, чей чекбокс двинется; `TECH-NN` — работа без истории;
прочерк — работа этапа Э-0. **Границы** — файлы и каталоги, которые задача имеет право трогать;
всё, что за ними, — предмет другой задачи. **Готово** — команда, чей зелёный статус закрывает
задачу; «посмотрел глазами» готовым не является нигде, кроме пунктов ручного чек-листа RUN-17.

### 0.2. Размер

**Один план, одна сессия, один коммит.** Три признака того, что задачу нужно резать:

1. План задачи не помещается на экран.
2. Задача трогает больше 5–7 файлов.
3. Внутри задачи нужно принять решение, которого нет ни в decisions, ни в этом документе.

Третий признак — самый дорогой: решение, принятое посреди задачи, не проходит ни через чей обзор и
всплывает через месяц как «почему так». Такие решения выносятся **заранее** в
[open-questions.md](open-questions.md) как Q-NN, а задача помечается `⚠ Q-NN` и не берётся, пока
вопрос открыт. Правило закрытия задано D-75 п. 4: вопрос закрывается **до начала этапа**, где он
нужен, а счётчик блокировок входит в чек-лист готовности этапа.

### 0.3. Порядок и блокировки

Порядок задач следует этапам [implementation-plan §3](implementation-plan.md). Внутри этапа
порядок — сверху вниз: задача ниже может зависеть от задачи выше, обратное запрещено. Зависимости,
пересекающие этап, помечены строкой `блок: T-NNN` — это те же зависимости backlog §1.12, где
нарушение порядка означает переписывание, а не неудобство.

**Запись в реестр (`src/registry/tools.ts`) — всегда последняя задача среза.** Незаконченная
позиция не имеет маршрута, не попадает в sitemap и не показывается палитрой; попавший в релиз
`Tool.id` необратим (ИНВ-07, G-14).

### 0.4. Когда задача закрыта

Задача закрыта, когда команда из графы «готово» проходит **в CI**, а не только локально, и коммит
влит в `main` через PR. История в [backlog.md](backlog.md) отмечается, когда закрыты все её задачи
— не раньше (backlog §0). Приёмка истории идёт по чек-листу test-plan §7.2.

### 0.5. Команды

Гейты и прогоны названы адресами test-plan; сокращения ниже используются в графе «готово».

| Команда | Что запускает |
|---|---|
| `pnpm lint`, `pnpm format:check`, `pnpm typecheck` | oxlint, Prettier, tsc |
| `pnpm test:unit` / `test:int` / `test:e2e` | RUN-01 / RUN-02 / RUN-03 |
| `pnpm gate:lh` · `gate:size` | G-01 · G-02 |
| `pnpm gate:persist` · `gate:egress` · `gate:fields` | G-03 · G-04 · G-05 |
| `pnpm gate:meta` · `gate:sitemap` · `gate:ladder` | G-06 · G-07 · G-08 |
| `pnpm gate:a11y` · `gate:provisional` · `gate:nomouse` | G-09 · G-10 · G-11 |
| `pnpm gate:words` · `gate:subset` · `gate:toolids` | G-12 · G-13 · G-14 |
| `pnpm gates` | все четырнадцать подряд |
| `pnpm test:gates:negative` | негативные проверки гейтов (Q-207) |
| `pnpm test:matrix` · `test:image` · `verify:supply` | RUN-04 · RUN-14 · RUN-15 |
| `pnpm bench:ttr` · `bench:compare` · `check:prod` | RUN-09 · RUN-09 против площадок · RUN-16 |

### 0.6. Вопросы, закрываемые до старта этапа

| Этап | Обязаны быть закрыты | Почему до, а не по ходу |
|---|---|---|
| **Э-0** | Q-217, Q-218 | Оба про состав самого этапа: где стоит образ и открыт ли прод наружу |
| **Э-1** | **Q-149** (P1), Q-147, Q-220 | Без определения «initial JS» бюджет NFR-03 проверяется на глаз, а он — первый гейт каркаса |
| **Э-2** | **Q-212, Q-213** (P1), Q-138, Q-139 | Оба P1 — про бюджет и дату; Э-2 — первая встреча плана с календарём |
| **Э-5** | Q-205 | Ввод «за порогом» нечем породить |
| **Э-6** | Q-151, Q-215 | Service worker в незащищённом контексте и предмет staging |
| **Э-9** | Q-152, Q-155 | Два выключателя расписания и 429 от Docker Hub |
| **Э-10** | Q-153, Q-157 | Ретенция событий и поведение прокси при исчерпании лимита |
| **Релиз** | Q-206, Q-209, Q-210, Q-214 | Все четыре про допуск релиза: кто принимает, что блокирует, сколько гейтов |

---

## 1. Э-0 — труба

**Готово этапа:** шесть пунктов демонстрации implementation-plan §2.4. Функционального кода в
этапе нет.

- [ ] T-001 — зарегистрировать `dokey.app`, делегировать зону, проверить TLS и HSTS (TECH-01): границы — `infra/dns/README.md`; готово — `curl -sI https://dokey.app` возвращает ответ хостинга и заголовок `strict-transport-security`
- [ ] T-002 — занять имя `dokey` на GitHub и создать публичный репозиторий (TECH-13): границы — настройки репозитория, `README.md` в одну строку; готово — репозиторий открывается анонимно
- [x] T-003 — положить LICENSE Apache-2.0, NOTICE, CONTRIBUTING, CODE_OF_CONDUCT (TECH-12): границы — четыре файла в корне; готово — GitHub показывает лицензию Apache-2.0 в шапке репозитория
- [x] T-004 — завести шаблоны issue и PR по контракту D-21 (TECH-12, готовит US-050): границы — `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`; готово — форма нового issue предлагает шаблон «предложить инструмент» с семью пунктами контракта
- [x] T-005 — поднять каркас Astro 7.3.1, `output: 'static'`, ноль интеграций фреймворков (TECH-04, ADR-01): границы — `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`; готово — `pnpm build` даёт статический каталог
- [x] T-006 — разложить дерево каталогов по компонентам architecture §2.1 (TECH-04): границы — `src/README.md`, пустые каталоги с `.gitkeep`; готово — `pnpm typecheck`, каждый КМП-NN имеет строку назначения
- [x] T-007 — настроить oxlint 1.81.0 и Prettier 3.9.6 (ADR-16): границы — `.oxlintrc.json`, `.prettierrc`, `package.json`; готово — `pnpm lint && pnpm format:check`
- [x] T-008 — настроить Vitest 5.0.0 двумя проектами: node и browser mode (RUN-01, RUN-02): границы — `vitest.config.ts`, `tests/unit/smoke.test.ts`, `tests/integration/smoke.test.ts`; готово — `pnpm test:unit && pnpm test:int`
- [x] T-009 — настроить Playwright 1.63.0 и первый сценарий (RUN-03): границы — `playwright.config.ts`, `tests/e2e/smoke.spec.ts`; готово — `pnpm test:e2e`
- [x] T-010 — описать заголовки ответа единым источником: CSP `'self'` без исключений, HSTS, правила кеша (TECH-02, ИНВ-01): границы — `infra/headers/_headers`; готово — `pnpm check:headers` на `wrangler dev` печатает три заголовка ожидаемого вида
- [ ] T-011 — задеплоить заглушку на `dokey.app` через wrangler (TECH-02, ADR-10): границы — `wrangler.toml`, `.github/workflows/release.yml`; готово — страница открывается, заголовки совпадают с `_headers`
- [ ] T-012 — закрыть индексацию до тега релиза: `Disallow: /` и `noindex` (⚠ Q-218): границы — `public/robots.txt`, `src/layouts/Base.astro`; готово — `curl https://dokey.app/robots.txt` отдаёт запрет обхода
- [ ] T-013 — собрать конвейер PR: линт, типы, RUN-01…RUN-03, сборка (TECH-05, US-047): границы — `.github/workflows/pr.yml`; готово — PR показывает шесть зелёных проверок
- [ ] T-014 — включить защиту `main`: PR обязателен, статусы обязательны, история линейная (US-047, ⚠ Q-220): границы — настройки репозитория, раздел в `CONTRIBUTING.md`; готово — прямой пуш в `main` отклоняется
- [ ] T-015 — собрать релизный конвейер: тег → сборка → гейты → деплой (TECH-05, US-047): границы — `.github/workflows/release.yml`; готово — тег `v0.0.1` доезжает до прода одним шагом
- [ ] T-016 — завести size-limit и G-02 на initial JS, чанк, шрифты, precache (US-047, ⚠ Q-149): границы — `.size-limit.json`, `scripts/gates/size.ts`, `package.json`; готово — `pnpm gate:size` зелёный, определение «initial JS» записано машинно
- [x] T-017 — завести Lighthouse CI и G-01 на запиннутом пресете (US-047, NFR-01): границы — `lighthouserc.json`, `.github/workflows/release.yml`; готово — `pnpm gate:lh`
- [x] T-018 — завести адреса двенадцати оставшихся гейтов заглушками и общий раннер: границы — `scripts/gates/*.ts`, `scripts/gates/README.md`, `package.json`; готово — `pnpm gates` зелёный и печатает список выключенных с пометкой «включается в Э-N»
- [ ] T-019 — написать негативные проверки для G-01, G-02, G-06 (⚠ Q-207): границы — `tests/gates/negative/*`; готово — `pnpm test:gates:negative`: три намеренно нарушающие сборки валят конвейер
- [x] T-020 — собрать образ multi-stage на nginx 1.30.4-alpine, non-root (TECH-09, ADR-14): границы — `infra/docker/Dockerfile`, `infra/docker/nginx.conf`, `.dockerignore`; готово — `docker build && docker run` отдаёт заглушку
- [ ] T-021 — повторить заголовки в nginx и сверить две копии прогоном (TECH-09, ⚠ Q-158): границы — `infra/docker/nginx.conf`, `scripts/gates/headers-parity.ts`; готово — `pnpm gate:headers-parity` красный при расхождении
- [ ] T-022 — публиковать образ в GHCR из релизного конвейера (US-048): границы — `.github/workflows/release.yml`; готово — `docker pull ghcr.io/<org>/dokey:v0.0.1` анонимно
- [ ] T-023 — подписывать образ cosign keyless, прикладывать provenance и SBOM (TECH-10, US-048, ADR-15): границы — `.github/workflows/release.yml`; готово — `cosign verify` и проверка аттестации проходят на свежем теге
- [ ] T-024 — написать инструкцию сверки образа для ROLE-05 (US-048): границы — `README.md`, `SECURITY.md`; готово — три команды из инструкции выполняются как есть на чистой машине
- [ ] T-025 — проверить образ системным прогоном: ноль сетевых обращений, первый ответ ≤ 5 с (RUN-14, NFR-16): границы — `tests/system/image.spec.ts`, `.github/workflows/release.yml`; готово — `pnpm test:image`
- [ ] T-026 — поднять VPS: Umami 3.3.1 и PostgreSQL 18.6 по digest, дамп базы в процедуре (TECH-03, ADR-11): границы — `infra/vps/docker-compose.umami.yml`, `infra/vps/README.md`; готово — панель Umami отвечает, дамп снимается одной командой
- [ ] T-027 — завести прокси `/s/*` на своём origin (TECH-03, КМП-18): границы — `wrangler.toml`, `src/pages/s/[...path].ts`; готово — `POST /s/event` доезжает до Umami, панель приёмника снаружи недостижима
- [ ] T-028 — собрать сабсеты четырёх woff2 и отчёт покрытия символов (TECH-15, ADR-17): границы — `scripts/subset-fonts.ts`, `src/styles/fonts.css`, `public/fonts/*`; готово — `pnpm build:fonts`, шрифты ≤ 48 KB gzip в `pnpm gate:size`
- [ ] T-029 — собрать SVG-спрайт из восьми глифов (TECH-15, D-54 п. 3): границы — `scripts/build-sprite.ts`, `src/ui/sprite.svg`; готово — `pnpm build:sprite`, зависимость иконочной библиотеки отсутствует в `package.json`
- [ ] T-030 — перенести токены дизайн-системы и контрастные правки (TECH-15, D-53): границы — `src/styles/tokens.css`, `src/styles/base.css`; готово — `pnpm gate:a11y` по контрасту на заглушке в обеих темах
- [ ] T-031 — завести синтетическую проверку прода в расписании Actions (⚠ Q-156): границы — `.github/workflows/synthetic.yml`, `scripts/check-prod.ts`; готово — `pnpm check:prod`, провал заводит issue
- [ ] T-032 — выпустить тег `v0.0.1` и пройти демонстрацию Э-0 по шести пунктам: границы — `README.md` раздел «Как проверить сборку», `CHANGELOG.md`; готово — шесть пунктов повторены по README посторонним человеком

---

## 2. Э-1 — каркас в объёме первого среза

**Готово этапа:** два демо-маршрута из реестра; переход с переносом одного значения; teardown
обнуляет поля; в шапке «Внешних запросов: 0»; 10 МБ в воркере с прогрессом и отменой; двенадцать
гейтов красные на нарушающей сборке.
**Граница этапа:** не пишется ничего, чем не пользуется первый инструмент (implementation-plan §1.3).

- [ ] T-033 — описать схему реестра под Zod: `Tool.id`, маршрут, `sensitiveInput`, `continuable`, `chunk-budget`, ступень лестницы, пороги (US-002, ENT-03, ADR-06): границы — `src/registry/schema.ts`, `src/registry/types.ts`; готово — `pnpm test:unit -t registry-schema`
- [ ] T-034 — написать модуль реестра с двумя демо-записями и производными множествами (US-002, ИНВ-06): границы — `src/registry/tools.ts`, `src/registry/derive.ts`; готово — `pnpm test:unit -t registry-derive`: маршруты, sitemap, `hreflang` и палитра выводятся из одного источника
- [ ] T-035 — генерировать маршруты и `sitemap.xml` из реестра (US-002): границы — `src/pages/[...route].astro`, `src/pages/sitemap.xml.ts`; готово — `pnpm build` даёт ровно по странице на запись реестра
- [ ] T-036 — включить G-07 «sitemap ≡ реестр» с негативной проверкой (US-002, US-047): границы — `scripts/gates/sitemap.ts`, `tests/gates/negative/sitemap.spec.ts`; готово — `pnpm gate:sitemap`
- [ ] T-037 — включить G-14 «множество `Tool.id` — надмножество предыдущего релиза» (US-002, D-82 п. 2): границы — `scripts/gates/tool-ids.ts`, `.github/workflows/release.yml`; готово — `pnpm gate:toolids` красный при исчезнувшем id
- [ ] T-038 — включить G-08 «лестница ≡ реестр»: ступени отсутствующих инструментов не активны (US-002, D-49): границы — `src/registry/ladder.ts`, `scripts/gates/ladder.ts`; готово — `pnpm gate:ladder` красный на висящей ступени
- [ ] T-039 — показать сообщение на маршруте, которого нет в реестре (US-002 крит. 4, D-63): границы — `src/pages/404.astro`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "маршрута нет"`
- [ ] T-040 — завести служебную страницу записью того же реестра (US-002 крит. 6, D-82 п. 1): границы — `src/registry/tools.ts`, `src/pages/[...route].astro`; готово — `pnpm gate:sitemap`
- [ ] T-041 — собрать SSG-шаблон лендинга: `title`, `description`, H1, вводный абзац, FAQ на сборке (US-001): границы — `src/layouts/Tool.astro`, `src/content/tools/`, `src/pages/[...route].astro`; готово — `pnpm test:e2e -g "FL-01 без JS"` при отключённом JS
- [ ] T-042 — положить поле ввода в DOM как textarea, пустое и в фокусе на первом кадре (US-001 крит. 2): границы — `src/ui/InputField.astro`; готово — `pnpm test:e2e -g "фокус на первом кадре"`
- [ ] T-043 — включить G-06 «уникальность `title` и `description`» с негативной проверкой (US-001 крит. 4): границы — `scripts/gates/meta.ts`, `tests/gates/negative/meta.spec.ts`; готово — `pnpm gate:meta`
- [ ] T-044 — уложить лендинг в LCP ≤ 1,2 с и Lighthouse mobile ≥ 95 (US-001 крит. 3, NFR-04): границы — `lighthouserc.json`, `src/layouts/Tool.astro`; готово — `pnpm gate:lh`
- [ ] T-045 — написать роутер над `<ClientRouter />`: карта `path → Route` из реестра, `replaceState` при подмене (US-003, ADR-02, D-47): границы — `src/router/router.ts`, `src/layouts/Base.astro`; готово — `pnpm test:int -t router`
- [ ] T-046 — написать буфер переноса: одно значение, обнуляется чтением (US-003, ENT-30, ИНВ-03): границы — `src/router/handoff.ts`; готово — `pnpm test:int -t handoff`: второе чтение отдаёт пусто
- [ ] T-047 — уложить переход в ≤ 300 мс и вернуть по «назад» маршрут без значения (US-003 крит. 1, 5; NFR-05, D-46 п. 6): границы — `tests/e2e/fl-09.spec.ts`; готово — `pnpm test:e2e -g "FL-09"`
- [ ] T-048 — написать teardown маршрута по перечню контракта на событии свопа (US-038, ENT-23, ENT-25, ⚠ Q-147): границы — `src/router/teardown.ts`, `src/registry/schema.ts`; готово — `pnpm test:int -t teardown`
- [ ] T-049 — включить G-03 «нулевая персистентность»: три условия после каждой навигации (US-038, NFR-10, ИНВ-02): границы — `scripts/gates/persistence.ts`, `tests/invariants/persistence.spec.ts`; готово — `pnpm gate:persist`, негативная проверка красная
- [ ] T-050 — применить CSP без исключений на всех маршрутах и в образе (US-037, ИНВ-01): границы — `infra/headers/_headers`, `infra/docker/nginx.conf`, `tests/invariants/csp.spec.ts`; готово — `pnpm test:e2e -g "CSP"`
- [ ] T-051 — включить G-04 «сторонних origin = 0» с положительной проверкой по подстроке фикстуры (US-037, NFR-09): границы — `scripts/gates/egress.ts`, `tests/invariants/egress.spec.ts`; готово — `pnpm gate:egress`
- [ ] T-052 — задать границы чанков: по чанку на инструмент, бюджет 90 KB (US-005, NFR-06): границы — `astro.config.mjs`, `.size-limit.json`, `src/router/loadTool.ts`; готово — `pnpm gate:size`
- [ ] T-053 — показать состояние «логика не приехала» с текстом и путём восстановления (US-005 крит. 4, US-067, D-63): границы — `src/shell/toolSlot.ts`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "чанк не приехал"` с блокировкой запроса
- [ ] T-054 — заложить EN-ветку маршрутов в реестре и `hreflang`; пустая ветка не публикуется (US-006): границы — `src/registry/schema.ts`, `src/registry/derive.ts`, `src/pages/sitemap.xml.ts`; готово — `pnpm gate:sitemap`
- [ ] T-055 — сделать системную тему средствами CSS, ноль JS (US-007, D-58): границы — `src/styles/tokens.css`, `src/styles/base.css`; готово — `pnpm gate:a11y` в обеих темах, `pnpm gate:size` без прироста initial JS
- [ ] T-056 — написать протокол воркера: задача, прогресс, отмена, падение (US-031, КМП-09, ADR-08): границы — `src/worker/protocol.ts`, `src/worker/worker.ts`, `src/worker/client.ts`; готово — `pnpm test:int -t worker`
- [ ] T-057 — прогнать демо-операцию 10 МБ без блокировки главного потока > 50 мс (US-031, NFR-07, ИНВ-09): границы — `tests/integration/worker-load.spec.ts`, `scripts/gen-large-input.ts`; готово — `pnpm test:int -t worker-load`
- [ ] T-058 — написать обёртку виртуализации: число узлов DOM не растёт с размером (US-032, ADR-08): границы — `src/virtual/list.ts`; готово — `pnpm test:int -t virtual`
- [ ] T-059 — описать контракт инструмента: поля, перечень teardown, `chunk-budget`, `continuable`, `sensitiveInput` (US-029, ENT-25): границы — `src/registry/schema.ts`, `src/tools/contract.ts`; готово — `pnpm test:unit -t contract`
- [ ] T-060 — собрать единую форму: ввод, действия, область результата, копирование, «Очистить» (US-029, REQ-INPUT-07, REQ-INPUT-08): границы — `src/ui/ToolForm.astro`, `src/ui/actions.ts`; готово — `pnpm test:e2e -g "единая форма"`
- [ ] T-061 — завести статусные регионы `role="status"` и `role="alert"` в оболочке (US-029, REQ-CORE-08, D-50): границы — `src/shell/status.ts`, `src/shell/Shell.astro`; готово — `pnpm test:int -t status-regions`
- [ ] T-062 — обработать отказ буфера обмена: сообщение и оставшийся путь (US-029, D-64, ИНВ-12): границы — `src/ui/copy.ts`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "буфер недоступен"`
- [ ] T-063 — включить G-09: axe до и после JS, обе темы, все маршруты реестра (RUN-05, NFR-13, D-50): границы — `scripts/gates/a11y.ts`, `tests/invariants/a11y.spec.ts`; готово — `pnpm gate:a11y` — ноль нарушений A и AA
- [ ] T-064 — собрать каркас прогона без мыши и печатать долю (RUN-06, D-75; порог включается в Э-4): границы — `scripts/gates/no-mouse.ts`, `tests/e2e/no-mouse/`; готово — `pnpm gate:nomouse` печатает долю сценариев
- [ ] T-065 — собрать обвязку оболочки: шапка, вордмарк, статус сети, версия и дата сборки, ссылки (REQ-CORE-09, D-74): границы — `src/shell/Shell.astro`, `src/shell/network.ts`, `src/content/nav.ts`; готово — `pnpm test:e2e -g "обвязка оболочки"`
- [ ] T-066 — держать «недавние» ≤ 5 в памяти оболочки (КМП-01): границы — `src/shell/recent.ts`; готово — `pnpm test:int -t recent`: перезагрузку не переживают
- [ ] T-067 — включить G-05 «закрытый список полей» на схеме события (US-047, US-055 частично, ИНВ-05): границы — `src/analytics/schema.ts`, `scripts/gates/fields.ts`; готово — `pnpm gate:fields` красный на восьмом поле
- [ ] T-068 — включить G-10 «ноль порогов `provisional` в релизной сборке» (US-047, D-51): границы — `src/registry/thresholds.ts`, `scripts/gates/provisional.ts`; готово — `pnpm gate:provisional`
- [ ] T-069 — включить G-12 «слова-маркеры публичных обязательств = 0» (US-047, CB-08, D-77 п. 4): границы — `scripts/gates/marker-words.ts`, `scripts/gates/marker-words.list.txt`; готово — `pnpm gate:words` красный на подсаженной фразе про SLA
- [ ] T-070 — включить G-13 «все символы текстов продукта в сабсете» (US-047, D-79): границы — `scripts/gates/font-subset.ts`; готово — `pnpm gate:subset` красный на символе вне сабсета
- [ ] T-071 — написать негативные проверки для G-03…G-14 (US-047, ⚠ Q-207): границы — `tests/gates/negative/`; готово — `pnpm test:gates:negative`: каждый гейт хотя бы раз упал
- [ ] T-072 — выпустить тег `v0.1.0` и пройти демонстрацию Э-1: границы — `CHANGELOG.md`, `README.md`; готово — пять пунктов демонстрации воспроизведены на проде

---

## 3. Э-2 — первая позиция целиком

**Готово этапа:** человек вставляет ответ API на `dokey.app`, получает дерево, находит поле,
копирует путь; ошибочный JSON даёт позицию за ≤ 300 мс; корпус фикстур останавливает сборку.
**Здесь же M-03** — две раздельные сверки (D-75 п. 3).

- [ ] T-073 — описать формат записи фикстуры и генератор синтетических токенов (TECH-11, ENT-21a): границы — `fixtures/schema.ts`, `fixtures/generate.ts`; готово — `pnpm test:unit -t fixtures-schema`
- [ ] T-074 — завести гейт против реальных секретов в репозитории (TECH-11, REQ-TRUST-06): границы — `scripts/gates/no-secrets.ts`, `.github/workflows/pr.yml`; готово — `pnpm gate:secrets` красный на подсаженном боевом токене
- [ ] T-075 — набрать корпус фикстур по ступеням с `expectedStep` и `expectedChips` (US-013, D-73 п. 3, ⚠ Q-138): границы — `fixtures/corpus/`; готово — `pnpm test:unit -t corpus`
- [ ] T-076 — останавливать сборку при регрессии корпуса и группировать отчёт по ступеням (US-013 крит. 2): границы — `tests/unit/corpus.test.ts`; готово — `pnpm test:unit -t corpus` красный при подмене одного образца
- [ ] T-077 — написать лестницу специфичности: девять ступеней, порядок, интерфейс ступени (US-008, ENT-19): границы — `src/detect/ladder.ts`, `src/detect/types.ts`; готово — `pnpm test:unit -t ladder`
- [ ] T-078 — написать предикат осмысленности `meaningfulWhen` для каждой ступени (US-008, D-73 п. 3, ⚠ Q-139): границы — `src/detect/steps/`; готово — `pnpm test:unit -t meaningful`
- [ ] T-079 — применять самого специфичного кандидата немедленно, менять маршрут через `replaceState` (US-008, D-47): границы — `src/detect/apply.ts`, `src/router/router.ts`; готово — `pnpm test:e2e -g "FL-02"`
- [ ] T-080 — объявлять применённого кандидата статусным регионом (US-008 крит. 7): границы — `src/detect/apply.ts`, `src/shell/status.ts`; готово — `pnpm test:int -t status-regions`
- [ ] T-081 — показать чипсы всех применимых кандидатов плюс «Текст» в порядке лестницы (US-009, D-66): границы — `src/detect/chips.ts`, `src/ui/Chips.astro`; готово — `pnpm test:e2e -g "FL-03"`
- [ ] T-082 — сделать ручной выбор чипса побеждающим всегда, без перестановки позиций (US-009, D-66): границы — `src/detect/chips.ts`; готово — `pnpm test:int -t chips`
- [ ] T-083 — запретить замену исходного ввода результатом (US-010, REQ-INPUT-03): границы — `src/ui/ToolForm.astro`, `src/detect/apply.ts`; готово — `pnpm test:e2e -g "ввод не заменяется"`
- [ ] T-084 — посчитать ввод: символы, байты UTF-8, строки, слова, суррогатные пары (US-011 крит. 5): границы — `src/detect/counter.ts`, `src/ui/Counter.astro`; готово — `pnpm test:unit -t counter`
- [ ] T-085 — показать чипсы кодирования вместо пустого ответа (US-011, REQ-INPUT-04): границы — `src/detect/chips.ts`, `src/content/empty.ts`; готово — `pnpm test:e2e -g "нет кандидата"`
- [ ] T-086 — собрать стенд замеров TTR: устройство, профиль, троттлинг slow 4G, воспроизводимый скрипт (TECH-07, NFR-02): границы — `scripts/bench-ttr.ts`, `docs/bench/README.md`; готово — `pnpm bench:ttr` дважды с расхождением < 10 %
- [ ] T-087 — написать разбор JSON с позицией ошибки: строка и колонка (US-019 крит. 4): границы — `src/tools/json/parse.ts`; готово — `pnpm test:unit -t json-parse`
- [ ] T-088 — написать форматирование, минификацию и сортировку ключей по собственным ключам (US-019 крит. 1–3, SEC-23): границы — `src/tools/json/format.ts`; готово — `pnpm test:unit -t json-format`
- [ ] T-089 — показать ошибку разбора за ≤ 300 мс без очистки ввода (US-019, NFR-15): границы — `src/tools/json/ui.ts`, `tests/e2e/fl-06.spec.ts`; готово — `pnpm test:e2e -g "FL-06 ошибка"`
- [ ] T-090 — унести операции JSON в воркер поверх протокола Э-1 (US-019, US-031): границы — `src/tools/json/worker-ops.ts`, `src/worker/worker.ts`; готово — `pnpm test:int -t json-worker`; блок: T-056
- [ ] T-091 — объявить и применить ось порога `jsonDepth` (US-019 крит. 6, D-73 п. 1): границы — `src/registry/thresholds.ts`, `src/tools/json/parse.ts`; готово — `pnpm test:unit -t depth`
- [ ] T-092 — ответить вердиктом на явно запрошенную валидацию (US-019 крит. 7, D-52 п. 3): границы — `src/tools/json/ui.ts`; готово — `pnpm test:e2e -g "валидация запрошена"`
- [ ] T-093 — построить модель дерева потоковым обходом (US-020 крит. 1): границы — `src/tools/json/tree.ts`; готово — `pnpm test:unit -t tree`
- [ ] T-094 — отрисовать дерево через виртуализатор: в DOM только видимые узлы (US-020, REQ-LIMIT-02): границы — `src/tools/json/tree-view.ts`, `src/virtual/list.ts`; готово — `pnpm test:int -t virtual-tree`; блок: T-058
- [ ] T-095 — искать по ключам и значениям сразу (US-020 крит. 2, 6; D-72): границы — `src/tools/json/search.ts`; готово — `pnpm test:unit -t json-search`
- [ ] T-096 — скопировать путь узла подписью «Скопировать путь» (US-020 крит. 4): границы — `src/tools/json/path.ts`, `src/ui/copy.ts`; готово — `pnpm test:e2e -g "копировать путь"`
- [ ] T-097 — показать сообщение, когда поиск ничего не нашёл (US-064, REQ-LIMIT-04): границы — `src/tools/json/search.ts`, `src/content/empty.ts`; готово — `pnpm test:e2e -g "поиск пуст"`
- [ ] T-098 — показать разобранный пример на первом экране до ввода (US-059, REQ-CONTENT-02): границы — `src/tools/json/example.ts`, `src/content/tools/json.md`; готово — `pnpm test:e2e -g "первый экран"`
- [ ] T-099 — развести тексты пустой вставки и пустого поля (US-060, REQ-INPUT-04): границы — `src/ui/ToolForm.astro`, `src/content/empty.ts`; готово — `pnpm test:e2e -g "пустая вставка"`
- [ ] T-100 — написать лендинг JSON Workbench без длинного SEO-текста (US-044, REQ-CONTENT-03): границы — `src/content/tools/json.md`; готово — `pnpm gate:meta && pnpm gate:lh`
- [ ] T-101 — показать счётчик внешних запросов в шапке на всех маршрутах (US-040, ENT-24): границы — `src/egress/counter.ts`, `src/shell/Shell.astro`; готово — `pnpm test:int -t egress-counter`
- [ ] T-102 — снять числа порогов по процедуре D-51 и записать их в реестр (Ф-4, REQ-LIMIT-03): границы — `scripts/bench-thresholds.ts`, `src/registry/thresholds.ts`; готово — `pnpm gate:provisional` зелёный по осям JSON
- [ ] T-103 — добавить запись JSON Workbench в реестр (US-002, ИНВ-07): границы — `src/registry/tools.ts`, `src/registry/ladder.ts`; готово — `pnpm gates`
- [ ] T-104 — снять M-03 двумя раздельными сверками: каркас Э-1 и позиция Э-2 (D-75 п. 3): границы — `docs/estimates.md`; готово — документ содержит два коэффициента, дату и способ переноса на семь позиций
- [ ] T-105 — выпустить тег `v0.2.0` и пройти демонстрацию Э-2: границы — `CHANGELOG.md`; готово — сценарий этапа воспроизведён на проде посторонним человеком

---

## 4. Э-3 — каталог Must и петля

**Готово этапа:** четыре инструмента; токен разобран и подпись проверена локально; уход с маршрута
обнулил ключ и токен, и это показывает гейт; результат уезжает в следующий инструмент одним
действием.

- [ ] T-106 — разобрать JWT на header, payload и claim-ы; поле ключа свёрнуто (US-021 крит. 1): границы — `src/tools/jwt/parse.ts`, `src/tools/jwt/ui.ts`; готово — `pnpm test:unit -t jwt-parse`
- [ ] T-107 — показать `exp`, `iat`, `nbf` и срок действия; «Истёк», отсутствие `exp` — не ошибка (US-021 крит. 2, 3): границы — `src/tools/jwt/claims.ts`, `src/content/tools/jwt.md`; готово — `pnpm test:unit -t jwt-claims`
- [ ] T-108 — показать ошибку разбора обрезанного токена за ≤ 300 мс без очистки ввода (US-021 крит. 4, NFR-15): границы — `src/tools/jwt/parse.ts`; готово — `pnpm test:e2e -g "обрезанный токен"`
- [ ] T-109 — описать контракт JWT: `sensitiveInput = true`, перечень teardown, `continuable = false` (US-021, ИНВ-04, D-48): границы — `src/tools/jwt/contract.ts`; готово — `pnpm gate:persist`: подстрока токена-фикстуры не найдена ни на одной поверхности
- [ ] T-110 — проверить подпись HS256 на Web Crypto: три вердикта и `alg: none` (US-022, D-68, ADR-18): границы — `src/tools/jwt/verify.ts`; готово — `pnpm test:unit -t jwt-verify`
- [ ] T-111 — проверять `crypto.subtle` до показа действия и называть путь при отказе (US-022, D-64, ИНВ-12): границы — `src/tools/jwt/ui.ts`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "незащищённый контекст"`
- [ ] T-112 — замаскировать поле ключа без `type="password"` (US-041, REQ-TRUST-05): границы — `src/ui/SecretField.astro`; готово — `pnpm test:e2e -g "поле ключа"`, менеджер паролей не предлагает сохранение (пункт RUN-17)
- [ ] T-113 — закодировать и раскодировать Base64 текста в обоих алфавитах (US-023, REQ-TOOL-03): границы — `src/tools/base64/codec.ts`; готово — `pnpm test:unit -t base64`
- [ ] T-114 — закодировать файл чанками через воркер (US-024, REQ-LIMIT-05): границы — `src/tools/base64/file.ts`, `src/worker/worker.ts`; готово — `pnpm test:int -t base64-file`; блок: T-056
- [ ] T-115 — объяснить отказ по размеру файла позиционированием, а не извинением (US-024, REQ-LIMIT-04): границы — `src/tools/base64/file.ts`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "файл за порогом"`
- [ ] T-116 — закодировать и раскодировать URL, разобрать query (US-025, REQ-TOOL-04): границы — `src/tools/url/codec.ts`; готово — `pnpm test:unit -t url`
- [ ] T-117 — показать чипсы кодирования на вводе URL (US-025, REQ-INPUT-04): границы — `src/tools/url/ui.ts`, `src/detect/chips.ts`; готово — `pnpm test:e2e -g "чипсы кодирования"`
- [ ] T-118 — сделать «Продолжить с этим»: одно значение через буфер, отдельное событие на шаг (US-012, FL-07): границы — `src/ui/actions.ts`, `src/router/handoff.ts`; готово — `pnpm test:e2e -g "FL-07"`; блок: T-046
- [ ] T-119 — запретить перенос из инструмента с `sensitiveInput` (US-012, D-46 п. 4, ИНВ-04): границы — `src/router/handoff.ts`, `tests/invariants/persistence.spec.ts`; готово — `pnpm gate:persist`
- [ ] T-120 — добавить записи `jwt`, `base64`, `url` в реестр и активировать их ступени (US-002): границы — `src/registry/tools.ts`, `src/registry/ladder.ts`; готово — `pnpm gates`
- [ ] T-121 — написать лендинги трёх позиций (US-044 на каждую позицию): границы — `src/content/tools/jwt.md`, `base64.md`, `url.md`; готово — `pnpm gate:meta`
- [ ] T-122 — добавить фикстуры трёх новых типов в корпус (US-013): границы — `fixtures/corpus/`; готово — `pnpm test:unit -t corpus`
- [ ] T-123 — выпустить тег `v0.3.0` и пройти демонстрацию Э-3: границы — `CHANGELOG.md`; готово — сценарий этапа воспроизведён на проде

---

## 5. Э-4 — вход за два нажатия

**Готово этапа:** Ctrl/Cmd + K из любого места, две буквы, инструмент открыт; `жсон` находит JSON
Workbench; неприехавшая логика объясняет себя текстом. **Жёсткий минимум RISK-06 собран** — в
редакции roadmap §2.5.

- [ ] T-124 — открыть палитру по Ctrl/Cmd + K, кнопке в шапке и `/` (US-014, REQ-ENTRY-01): границы — `src/palette/palette.ts`, `src/shell/Shell.astro`; готово — `pnpm test:e2e -g "FL-08"`
- [ ] T-125 — искать по трём источникам имени и по недавним точным совпадением подстроки (US-014, backlog §4.2 п. 7): границы — `src/palette/search.ts`, `src/registry/derive.ts`; готово — `pnpm test:unit -t palette-search`
- [ ] T-126 — нормализовать раскладку: `жсон` находит JSON Workbench (US-014 крит. 8): границы — `src/palette/layout-map.ts`; готово — `pnpm test:unit -t layout-map`
- [ ] T-127 — уложить вход в два нажатия и ≤ 300 мс до открытого инструмента (US-014, NFR-05, CB-05): границы — `src/palette/palette.ts`, `src/router/loadTool.ts`; готово — `pnpm test:e2e -g "два нажатия"`
- [ ] T-128 — уложить палитру в бюджет initial JS или вынести чанком с предзагрузкой на `idle` (US-014, NFR-03, РР-01): границы — `.size-limit.json`, `src/palette/index.ts`; готово — `pnpm gate:size`
- [ ] T-129 — показать сообщение, когда палитра не нашла ни одной позиции (US-063, REQ-LIMIT-04): границы — `src/palette/empty.ts`, `src/content/empty.ts`; готово — `pnpm test:e2e -g "палитра пуста"`
- [ ] T-130 — развести четыре состояния недоступной логики разными текстами (US-067, D-63): границы — `src/shell/toolSlot.ts`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "четыре состояния"`
- [ ] T-131 — включить порог G-11 ≥ 60 % сценариев без мыши (NFR-08, D-75): границы — `scripts/gates/no-mouse.ts`, `tests/e2e/no-mouse/`; готово — `pnpm gate:nomouse` красный ниже 60 %
- [ ] T-132 — сделать палитру доступной: ловушка фокуса, Esc, объявление числа результатов (US-014, NFR-13): границы — `src/palette/a11y.ts`; готово — `pnpm gate:a11y`
- [ ] T-133 — выпустить тег `v0.4.0`, зафиксировать сбор жёсткого минимума: границы — `CHANGELOG.md`, `docs/release-checklist.md`; готово — сценарий этапа воспроизведён; состав жёсткого минимума записан в редакции roadmap §2.5

---

## 6. Э-5 — объявленные пороги

**Готово этапа:** число порога напечатано в интерфейсе и совпадает с реестром; отказ объяснён
позиционированием; сборка с `provisional` не выпускается.

- [ ] T-134 — показать мягкий порог: предупреждение с числом и действием «Обработать» (US-033, REQ-LIMIT-03): границы — `src/ui/Threshold.astro`, `src/registry/thresholds.ts`; готово — `pnpm test:e2e -g "мягкий порог"`
- [ ] T-135 — показать жёсткий порог: отказ, объяснённый позиционированием (US-034, REQ-METR-02): границы — `src/ui/Threshold.astro`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "жёсткий порог"`
- [ ] T-136 — проверить арифметику порогов: `hard > soft`, ось, класс платформы, флаг `provisional` (US-033, US-034, ENT-22): границы — `src/registry/thresholds.ts`; готово — `pnpm test:unit -t thresholds`
- [ ] T-137 — показать прогресс и отмену: после «Отменить» область возвращается к состоянию до запуска (US-035, D-71): границы — `src/worker/client.ts`, `src/ui/Progress.astro`; готово — `pnpm test:int -t cancel`
- [ ] T-138 — прогнать инвариант «молчаливого отказа нет» по всем маршрутам реестра (US-035, REQ-LIMIT-04): границы — `tests/invariants/no-silent-failure.spec.ts`; готово — `pnpm test:e2e -g "инвариант отказа"`
- [ ] T-139 — сгенерировать большие вводы из зерна по числу порога (⚠ Q-205): границы — `scripts/gen-large-input.ts`, `tests/e2e/thresholds.spec.ts`; готово — `pnpm test:e2e -g "порог"` без единого мегабайта в репозитории
- [ ] T-140 — прогнать матрицу браузеров: три движка и мобильные профили (TECH-08, NFR-14, RUN-04): границы — `playwright.config.ts`, `.github/workflows/matrix.yml`; готово — `pnpm test:matrix`
- [ ] T-141 — задать класс порогов `mobileSafari` по результатам матрицы (D-51): границы — `src/registry/thresholds.ts`; готово — `pnpm gate:provisional`; блок: T-140
- [ ] T-142 — выпустить тег `v0.5.0` и пройти демонстрацию Э-5: границы — `CHANGELOG.md`; готово — числа порогов на странице совпадают с реестром

---

## 7. Э-6 — офлайн и входы снаружи

**Готово этапа:** выключенная сеть — любой инструмент каталога работает, в шапке «Офлайн», событие
не ушло и не скопилось; новая сборка предлагает «Обновить» строкой.
**Единственный этап без дешёвого отката** (implementation-plan §4.3).

- [ ] T-143 — собрать service worker на `injectManifest`: precache оболочки и ядра (US-004, ADR-09): границы — `src/sw/sw.ts`, `astro.config.mjs`; готово — `pnpm test:e2e -g "офлайн оболочка"`
- [ ] T-144 — докачивать чанки всего каталога после первой отрисовки; редактор — только runtime-кеш (US-004, D-63, NFR-18): границы — `src/sw/sw.ts`, `.size-limit.json`; готово — `pnpm gate:size`: precache ≤ 120 KB gzip
- [ ] T-145 — версионировать кеш идентификатором сборки и чистить прошлые на `activate` (US-004, ИНВ-10): границы — `src/sw/sw.ts`; готово — `pnpm test:e2e -g "смена версии"`
- [ ] T-146 — показать тихую строку «Вышла новая версия» и вызывать `skipWaiting` только по действию (D-67, ИНВ-10): границы — `src/sw/update.ts`, `src/shell/Shell.astro`; готово — `pnpm test:e2e -g "обновление"`
- [ ] T-147 — оставлять файлы прошлых сборок на 30 дней правилом деплоя (D-67 п. 1): границы — `.github/workflows/release.yml`, `wrangler.toml`; готово — чанк предыдущего тега доступен после нового деплоя
- [ ] T-148 — показать статус «Офлайн» и не отправлять события офлайн (US-058, REQ-CORE-09, D-44): границы — `src/shell/network.ts`, `src/analytics/send.ts`; готово — `pnpm test:int -t offline`
- [ ] T-149 — отработать первый визит без кеша, в том числе без сети (US-061, REQ-CORE-02): границы — `tests/e2e/fl-01.spec.ts`, `src/content/errors.ts`; готово — `pnpm test:e2e -g "первый визит"`
- [ ] T-150 — отработать первый запуск из установленного PWA (US-062, REQ-ENTRY-02): границы — `tests/e2e/fl-14.spec.ts`; готово — `pnpm test:e2e -g "запуск из PWA"`
- [ ] T-151 — сгенерировать манифест PWA из реестра (US-015, ИНВ-06): границы — `src/pages/manifest.webmanifest.ts`; готово — `pnpm build`, манифест содержит ровно маршруты реестра
- [ ] T-152 — обеспечить установимость и запуск из иконки (US-015, REQ-ENTRY-04): границы — `src/pages/manifest.webmanifest.ts`, `public/icons/`; готово — установка проходит в Chrome и Safari (пункт RUN-17)
- [ ] T-153 — сгенерировать `opensearch.xml` из реестра и объявить его в разметке (US-016, D-70): границы — `src/pages/opensearch.xml.ts`, `src/layouts/Base.astro`; готово — браузер принимает описание в четырёх движках эксперимента D-70
- [ ] T-154 — написать страницу «Держать под рукой» об обоих механизмах (US-017, REQ-ENTRY-04): границы — `src/content/pages/keep-handy.md`, `src/registry/tools.ts`; готово — `pnpm gate:sitemap && pnpm gate:words`; блок: T-152, T-153
- [ ] T-155 — прогнать инвариант офлайна и четырёх состояний по всем маршрутам (RUN-13, D-63): границы — `tests/invariants/offline.spec.ts`; готово — `pnpm test:e2e -g "инвариант офлайна"`
- [ ] T-156 — поднять staging на отдельном origin с профилем без аналитики (⚠ Q-215): границы — `wrangler.toml`, `.github/workflows/pr.yml`; готово — сборка PR по метке открывается по адресу staging, `noindex` на месте, событий в Umami ноль
- [ ] T-157 — выпустить тег `v0.6.0` и пройти демонстрацию Э-6: границы — `CHANGELOG.md`; готово — сценарий этапа воспроизведён, включая обновление с предыдущего тега на проде

---

## 8. Э-7 — каталог 8 из 8

**Готово этапа:** M-02 — шесть инструментов, палитра, определитель; единая форма принята на всех
восьми позициях одним прогоном.
**Первый кандидат на демонтаж** при срабатывании RISK-06 после Э-11.

- [ ] T-158 — конвертировать время: секунды и миллисекунды, ISO 8601, UTC и локальное (US-026, ADR-18): границы — `src/tools/unixtime/convert.ts`; готово — `pnpm test:unit -t unixtime`
- [ ] T-159 — добавить ступень лестницы для timestamp и фикстуры к ней (US-026, US-013): границы — `src/registry/ladder.ts`, `fixtures/corpus/`; готово — `pnpm test:unit -t corpus && pnpm gate:ladder`
- [ ] T-160 — сгенерировать UUID v4, v7 и ULID импортом по функциям (US-027, ADR-18): границы — `src/tools/uuid/generate.ts`; готово — `pnpm test:unit -t uuid && pnpm gate:size`
- [ ] T-161 — разобрать и проверить существующее значение UUID и ULID (US-028): границы — `src/tools/uuid/parse.ts`; готово — `pnpm test:unit -t uuid-parse`
- [ ] T-162 — сделать экран генератора, где ввода не нужно (US-066, REQ-TOOL-07): границы — `src/tools/uuid/ui.ts`, `src/ui/ToolForm.astro`; готово — `pnpm test:e2e -g "FL-12"`
- [ ] T-163 — добавить записи `unixtime` и `uuid` в реестр с лендингами (US-002, US-044): границы — `src/registry/tools.ts`, `src/content/tools/unixtime.md`, `uuid.md`; готово — `pnpm gates`
- [ ] T-164 — принять единую форму инвариантным прогоном по восьми позициям (US-029, REQ-TOOL-07): границы — `tests/invariants/tool-form.spec.ts`; готово — `pnpm test:e2e -g "единая форма"`
- [ ] T-165 — свести бюджет чанков каталога после шести позиций (NFR-18, РР-03): границы — `.size-limit.json`; готово — `pnpm gate:size`: сумма чанков в precache ≤ 120 KB gzip
- [ ] T-166 — выпустить тег `v0.7.0` и зафиксировать M-02 (8 из 8): границы — `CHANGELOG.md`, `docs/release-checklist.md`; готово — контракт M-02 отмечен с перечислением восьми позиций

---

## 9. Э-8 — доверие и контент

**Готово этапа:** страница бенчмарка с методикой, скриптом и проигранными замерами; чужой человек
повторяет замер по инструкции.

- [ ] T-167 — написать страницу «Как это проверить» с процедурой и списком служебных ключей (US-039, D-71): границы — `src/content/pages/how-to-verify.md`, `src/registry/tools.ts`; готово — `pnpm gate:sitemap && pnpm gate:words`
- [ ] T-168 — не пускать секреты в события, тексты ошибок и фикстуры (US-042, REQ-TRUST-06): границы — `scripts/gates/egress.ts`, `src/content/errors.ts`; готово — `pnpm gate:egress` с положительной проверкой по подстроке фикстуры
- [ ] T-169 — описать методику бенчмарка TTR и сделать её воспроизводимой (US-043, REQ-CONTENT-01): границы — `scripts/bench-ttr.ts`, `docs/bench/method.md`; готово — `pnpm bench:ttr` дважды с расхождением < 10 %; блок: T-086
- [ ] T-170 — снять замеры против пяти площадок и сохранить результат как есть (US-043, D-19 п. 5): границы — `docs/bench/results.json`, `scripts/bench-ttr.ts`; готово — `pnpm bench:compare`, проигранные замеры в файле не отредактированы
- [ ] T-171 — собрать страницу бенчмарка: числа, методика, дата, оговорки (US-043): границы — `src/content/pages/benchmark.md`, `src/registry/tools.ts`; готово — `pnpm gate:meta && pnpm gate:words`
- [ ] T-172 — написать страницу «Развёртывание в своей сети», сверенную с реальным образом (US-045, REQ-DIST-02): границы — `src/content/pages/self-hosting.md`; готово — команды со страницы выполняются как есть на чистой машине; блок: T-023
- [ ] T-173 — написать раздел об отсутствии обязательств и пополнить список слов-маркеров (US-046, CB-08): границы — `src/content/pages/no-commitments.md`, `scripts/gates/marker-words.list.txt`; готово — `pnpm gate:words`
- [ ] T-174 — выпустить тег `v0.8.0` и зафиксировать M-07: границы — `CHANGELOG.md`; готово — страница бенчмарка открыта на проде вместе с методикой и скриптом

---

## 10. Э-9 — профиль selfhosted и контракт

**Готово этапа:** в артефакте профиля `selfhosted` отправителя событий физически нет; шаблон issue
принимает предложение инструмента по семи пунктам контракта.

- [ ] T-175 — собрать профиль `selfhosted` без аналитики физически (US-049, ENT-26, ИНВ-11): границы — `astro.config.mjs`, `src/analytics/index.ts`, `.github/workflows/release.yml`; готово — поиск строки `/s/event` в артефакте профиля не даёт совпадений
- [ ] T-176 — завести гейт сборки образа: профиль, отсутствие аналитики, ноль сетевых обращений (US-049, NFR-16): границы — `scripts/gates/selfhosted.ts`, `tests/system/image.spec.ts`; готово — `pnpm test:image`
- [ ] T-177 — оформить контракт инструмента как документ и шаблон issue (US-050, D-21): границы — `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/tool-proposal.yml`; готово — шаблон содержит семь пунктов контракта, включая `chunk-budget`
- [ ] T-178 — завести расписание ежемесячной пересборки с тремя предохранителями (US-051, D-59, ⚠ Q-152): границы — `.github/workflows/rebuild.yml`; готово — ручной запуск проходит, провал заводит issue, три провала отключают расписание
- [ ] T-179 — публиковать дату последней успешной пересборки, а не периодичность (US-051, CB-08): границы — `README.md`, `src/content/pages/self-hosting.md`; готово — `pnpm gate:words`
- [ ] T-180 — принять US-048 на релизном образе: подпись, provenance, SBOM, инструкция (RUN-15): границы — `tests/system/supply-chain.spec.ts`; готово — `pnpm verify:supply`
- [ ] T-181 — выпустить тег `v0.9.0` и пройти демонстрацию Э-9: границы — `CHANGELOG.md`; готово — образ поднят в изолированном контуре по странице развёртывания

---

## 11. Э-10 — инструментовка

**Готово этапа:** в Umami видна доля визитов с результатом и категории отказа; перехват сети
показывает ровно семь полей; при DNT отправлено ноль событий.

- [ ] T-182 — описать закрытый список полей события и схему (US-055, ENT-29, ИНВ-05): границы — `src/analytics/schema.ts`; готово — `pnpm test:unit -t event-schema`
- [ ] T-183 — включить G-05 в боевом виде: множество полей ровно равно списку (US-055, REQ-METR-04): границы — `scripts/gates/fields.ts`, `tests/gates/negative/fields.spec.ts`; готово — `pnpm gate:fields` красный на восьмом поле
- [ ] T-184 — отправлять событие с таймаутом ≤ 1 с, нулём повторов и молчаливой деградацией (NFR-11): границы — `src/analytics/send.ts`; готово — `pnpm test:int -t analytics-degrade`: 429, 502 и обрыв дают 0 видимых ошибок
- [ ] T-185 — отправлять «результат получен» с `ttr` и `toolId` (US-052, EVT-01): границы — `src/analytics/events.ts`, `src/ui/ToolForm.astro`; готово — `pnpm test:int -t evt-success`
- [ ] T-186 — отправлять «результат не получен» с категорией причины (US-053, REQ-METR-02): границы — `src/analytics/events.ts`, `src/content/errors.ts`; готово — `pnpm test:int -t evt-failure`
- [ ] T-187 — отправлять событие ручного переключения чипса (US-054, REQ-METR-03): границы — `src/detect/chips.ts`, `src/analytics/events.ts`; готово — `pnpm test:int -t evt-chip`
- [ ] T-188 — отправлять событие открытия инструмента с источником входа (US-052, REQ-METR-08, D-74): границы — `src/router/router.ts`, `src/analytics/events.ts`; готово — `pnpm test:int -t evt-open`
- [ ] T-189 — уважать DoNotTrack и Global Privacy Control (US-056, REQ-METR-05): границы — `src/analytics/send.ts`; готово — `pnpm test:int -t dnt`: 0 событий, 0 мс прироста TTR
- [ ] T-190 — не отправлять и не копить события офлайн (US-058, D-44): границы — `src/analytics/send.ts`, `src/shell/network.ts`; готово — `pnpm test:int -t offline-events`: ни очереди, ни счётчиков
- [ ] T-191 — вывести полевой TTR одним несегментированным числом (US-057, REQ-METR-06): границы — `infra/vps/umami-queries.sql`, `docs/metrics.md`; готово — запрос возвращает одно число на тестовом наборе событий
- [ ] T-192 — выпустить тег `v0.10.0` и пройти демонстрацию Э-10: границы — `CHANGELOG.md`; готово — события видны в Umami, перехват сети показывает ровно семь полей

---

## 12. Э-11 — Could

**Демонтируется первым** при срабатывании плана реакции RISK-06 — целиком, до Э-7.

- [ ] T-193 — подключить CodeMirror 6 тонкой сборкой в JSON Workbench (US-030, ADR-07): границы — `src/editor/editor.ts`, `src/tools/json/ui.ts`; готово — `pnpm gate:size`: чанк редактора ≤ 90 KB gzip и вне precache
- [ ] T-194 — подменить textarea редактором после первой отрисовки, не двигая каретку (US-030, FL-06 A3): границы — `src/editor/mount.ts`; готово — `pnpm test:e2e -g "FL-06 A3"`
- [ ] T-195 — читать файлы чанками и завести отдельный порог хэширования (US-036, REQ-LIMIT-05): границы — `src/tools/base64/file.ts`, `src/registry/thresholds.ts`; готово — `pnpm test:int -t chunked-read`
- [ ] T-196 — показать одноразовую подсказку об активации ярлыка на единственном служебном ключе (US-018, D-71): границы — `src/shell/hint.ts`, `src/content/pages/how-to-verify.md`; готово — `pnpm gate:persist`: ключ найден в закрытом списке и опубликован
- [ ] T-197 — не показывать подсказку на первом визите (US-065, REQ-CONTENT-02): границы — `src/shell/hint.ts`; готово — `pnpm test:e2e -g "первый визит без подсказки"`
- [ ] T-198 — выпустить тег `v0.11.0` и пройти демонстрацию Э-11: границы — `CHANGELOG.md`; готово — редактор и чанковое чтение работают на проде

---

## 13. Релизная неделя

**Готово:** M-01 — три артефакта; двенадцать пунктов критерия готовности roadmap §2.4 отмечены с
доказательством.

- [ ] T-199 — составить список площадок обоих языков с разделением «с порогом» и «без порога» (M-12, D-77 п. 2; **срок 2026-11-16**): границы — `docs/channel/listings.md`; готово — каждая строка несёт критерий D-36 и отметку о пороге звёзд
- [ ] T-200 — пройти ручной релизный чек-лист (RUN-17: NFR-11, 12, 14, 15, 16, скринридер, PWA, ярлык, менеджер паролей): границы — `docs/release-checklist.md`; готово — чек-лист заполнен и приложен к тегу
- [ ] T-201 — открыть индексацию: снять `noindex` и запрет обхода (обратная к T-012): границы — `public/robots.txt`, `src/layouts/Base.astro`; готово — `curl https://dokey.app/robots.txt` разрешает обход
- [ ] T-202 — отметить двенадцать пунктов критерия готовности релиза (roadmap §2.4, ⚠ Q-214): границы — `docs/release-checklist.md`; готово — каждый пункт имеет ссылку на прогон или артефакт, а не отметку словом
- [ ] T-203 — выпустить тег `v1.0.0` и предъявить три артефакта (M-01): границы — `CHANGELOG.md`; готово — прод на `dokey.app`, git-тег, подписанный образ в GHCR
- [ ] T-204 — подать заявки в накопительные слои 2 и 3 (TECH-14, D-36): границы — `docs/channel/listings.md`; готово — по каждой строке проставлена дата подачи
- [ ] T-205 — опубликовать Show HN углом бенчмарка, один раз, после накопительных слоёв (TECH-14, D-36): границы — `docs/channel/listings.md`; готово — ссылка на публикацию записана
- [ ] T-206 — проверить выживание записей через семь дней (M-13): границы — `docs/channel/listings.md`; готово — столбец «на месте через 7 дней» заполнен по каждой поданной строке

---

## 14. Сводка

### 14.1. Задачи по этапам

| Этап | Задачи | Истории | Работа без истории |
|---|---|---|---|
| Э-0 | T-001…T-032 (32) | 1 (US-048, инфраструктура) | TECH-01…05, 09, 10, 12, 13, 15 |
| Э-1 | T-033…T-072 (40) | 12 | двенадцать гейтов, доступность |
| Э-2 | T-073…T-105 (33) | 12 | TECH-07, TECH-11, замер D-51, сверки M-03 |
| Э-3 | T-106…T-123 (18) | 7 | — |
| Э-4 | T-124…T-133 (10) | 3 | порог G-11 |
| Э-5 | T-134…T-142 (9) | 3 | TECH-08, генератор вводов |
| Э-6 | T-143…T-157 (15) | 6 | staging |
| Э-7 | T-158…T-166 (9) | 4 | приёмка US-029 |
| Э-8 | T-167…T-174 (8) | 5 | — |
| Э-9 | T-175…T-181 (7) | 3 | приёмка US-048 |
| Э-10 | T-182…T-192 (11) | 7 | — |
| Э-11 | T-193…T-198 (6) | 4 | — |
| Релиз | T-199…T-206 (8) | — | M-12, TECH-14, RUN-17 |
| **Итого** | **206** | **67** | **пятнадцать TECH-задач** |

### 14.2. История → задачи

| US | Задачи | US | Задачи |
|---|---|---|---|
| US-001 | T-041…T-044 | US-035 | T-137, T-138 |
| US-002 | T-033…T-040, T-103, T-120, T-163 | US-036 | T-195 |
| US-003 | T-045…T-047 | US-037 | T-050, T-051 |
| US-004 | T-143…T-145, T-155 | US-038 | T-048, T-049 |
| US-005 | T-052, T-053 | US-039 | T-167 |
| US-006 | T-054 | US-040 | T-101 |
| US-007 | T-055 | US-041 | T-112 |
| US-008 | T-077…T-080 | US-042 | T-168 |
| US-009 | T-081, T-082 | US-043 | T-169…T-171 |
| US-010 | T-083 | US-044 | T-100, T-121, T-163 |
| US-011 | T-084, T-085 | US-045 | T-172 |
| US-012 | T-118, T-119 | US-046 | T-173 |
| US-013 | T-073…T-076, T-122, T-159 | US-047 | T-013…T-019, T-067…T-071 |
| US-014 | T-124…T-128, T-132 | US-048 | T-020…T-025, T-180 |
| US-015 | T-151, T-152 | US-049 | T-175, T-176 |
| US-016 | T-153 | US-050 | T-004, T-177 |
| US-017 | T-154 | US-051 | T-178, T-179 |
| US-018 | T-196 | US-052 | T-185, T-188 |
| US-019 | T-087…T-092 | US-053 | T-186 |
| US-020 | T-093…T-096 | US-054 | T-187 |
| US-021 | T-106…T-109 | US-055 | T-182, T-183 |
| US-022 | T-110, T-111 | US-056 | T-189 |
| US-023 | T-113 | US-057 | T-191 |
| US-024 | T-114, T-115 | US-058 | T-148, T-190 |
| US-025 | T-116, T-117 | US-059 | T-098 |
| US-026 | T-158, T-159 | US-060 | T-099 |
| US-027 | T-160 | US-061 | T-149 |
| US-028 | T-161 | US-062 | T-150 |
| US-029 | T-059…T-062, T-164 | US-063 | T-129 |
| US-030 | T-193, T-194 | US-064 | T-097 |
| US-031 | T-056, T-057 | US-065 | T-197 |
| US-032 | T-058 | US-066 | T-162 |
| US-033 | T-134, T-136 | US-067 | T-053, T-130 |
| US-034 | T-135, T-136 | | |

**Проверка:** 67 историй, ни одной без задачи; тринадцать задач служат больше чем одной истории и
перечислены в обеих строках — это места, где чекбокс истории закрывается не своим этапом
(US-002, US-013, US-044, US-047, US-048, US-058, US-067).

### 14.3. Задачи, заблокированные вопросом

Восемь задач помечены `⚠ Q-NN` и не берутся, пока вопрос открыт. Ни одна не блокирует Э-0 целиком.

| Задача | Вопрос | Этап |
|---|---|---|
| T-012 | Q-218 — публичность и индексация прода до релиза | Э-0 |
| T-014 | Q-220 — механизм против обхода гейтов | Э-0 |
| T-016 | **Q-149** — определение «initial JS» для size-limit | Э-0 |
| T-019, T-071 | Q-207 — гейты не проверены на срабатывание | Э-0, Э-1 |
| T-021 | Q-158 — две копии заголовков ответа | Э-0 |
| T-031 | Q-156 — прод не наблюдается ничем | Э-0 |
| T-048 | Q-147 — teardown подписан на своп, а не на выгрузку | Э-1 |
| T-075 | Q-138 — `expectedChips` зависит от состава сборки | Э-2 |
| T-078 | Q-139 — граница между данными реестра и его кодом | Э-2 |
| T-139 | Q-205 — генерация больших вводов | Э-5 |
| T-156 | Q-215 — предмет и границы staging | Э-6 |
| T-178 | Q-152 — два выключателя расписания пересборки | Э-9 |
| T-202 | Q-214 — сколько гейтов в критерии готовности | Релиз |

---

## 15. Журнал

Строка на закрытую задачу: дата, номер, коммит, что стало правдой. Пишется тем же коммитом,
что и отметка `- [x]`.
