# Claude Flow v2 — конвейер документов + разработка в Claude Code

Доработка claude-flow под четырёхтрековый конвейер (25 документов,
open-questions.md, tasks.md). 18 команд, 2 сабагента, 2 хука
(+1 опциональный), всё из нативных примитивов: планы — markdown
с чекбоксами, память проекта — CLAUDE.md, гарантии — хуки и
permissions. Раскладка docs/ — плоская, ровно по методологии:
один файл на документ, теми же именами.

## Два входа

    ВАРИАНТ 1: документация готова     ВАРИАНТ 2: с нуля
    (docs/ собран по методологии       (пустая папка)
     в Chat, Cowork или другом репо)

    install.sh проект/                 install.sh проект/
         │  видит docs/prd.md               │  docs/ пуст
         ▼                                  ▼
      /adopt                             /discovery  ─ Фаза 0 + трек A
      инвентаризация 25 файлов,             │
      аудит инвариантов,                 /design     ─ трек B (или skip)
      INVENTORY.md, дыры → Q-NN             │
         │                               /tech       ─ трек C (lite: /spec)
         │ нет tasks.md / CLAUDE.md?        │
         ▼                               /delivery   ─ трек D + tasks.md
      /delivery tasks | claude              │           + CLAUDE.md
      (только недостающее)                  │
         │                                  │
         └──────────────┬───────────────────┘
                        ▼
                    /scaffold  ─ нулевой этап, первый коммит
                        │
                    /rules     ─ CLAUDE.md по реальному коду
                        │
                    /clear → /go → /clear → /go …   (цикл разработки)

/go сам различает режимы по артефактам: есть документы, но нет
docs/INVENTORY.md — значит, их принесли извне, и первый шаг —
/adopt. Частичный набор (например, только треки A–B из Chat) тоже
нормален: /adopt перечислит недостающее и назовёт команду трека.

## Схема цикла

    ОРКЕСТРАЦИЯ (в любой момент)

    /status    — где мы: треки, вопросы P1/P2/P3, очередь, планы
    /go        — определить этап по артефактам → подтвердить → выполнить
    /questions — реестр Q-NN: список / add / resolve
    SessionStart-хук — каждая сессия получает срез: инвентарь
                 треков, открытые P1, верх очереди, активные планы

    ЦИКЛ РАЗРАБОТКИ (повторяется; /go крутит его за вас)

         ┌──────────────────────────────────────────────────┐
         │                                                  │
         ▼                                                  │
      /plan T-NNN ── открытый P1/P2 у задачи? ──▶ /questions │
         │ fast? ──▶ сразу /build                            │
         │ full                                              │
         ▼                                                   │
      docs/plans/T-NNN-slug.md  ◀── план переживает /clear   │
         │ (одобрение человеком)                             │
         ▼                                                   │
      /build ──── чужой баг? ──▶ /fix ──┐                    │
         │  шаг = коммит "T-NNN US-NNN" │                    │
         ▼                              ▼                    │
      /check ◀── свежий контекст   docs/LESSONS.md           │
         │   + contract-reviewer       │                     │
         │   + security-reviewer       ▼                     │
         ▼                        /rules дистиллирует        │
      /ship ──▶ PR → docs → [x] T   в CLAUDE.md и хуки       │
         │      в tasks.md, [x] US                           │
         │      в backlog.md, архив                          │
         ▼                                                   │
      /clear ──────────────────────────────────────────────▶─┘

## Команды

| Команда | Этап | Что делает |
|---------|------|------------|
| /adopt | вход 1 | инвентаризация docs/ (scripts/docs-inventory.sh), аудит шапок, ID и инвариантов, docs/INVENTORY.md, дыры → Q-NN; мост в цикл |
| /discovery | A | Фаза 0 (интервью ≤3 вопросов × 2 раунда) → research … roadmap, чекпоинты 1–3, open-questions.md, INVENTORY.md |
| /design | B | design-plan … screens-prompt; нет UI → docs/design-skipped.md |
| /tech | C | data-model, tech-stack (ADR, версии — веб-поиском), architecture, api-spec + openapi.yaml, security, analytics; чекпоинт 5 |
| /spec | lite | SPEC.md для маленького проекта или крупной фичи внутри существующего |
| /delivery [tasks\|claude\|tests\|plan\|launch] | D | test-plan, implementation-plan, **tasks.md**, **CLAUDE.md** (из agent-rules.md), launch-checklist; идемпотентно — существующее не трогает |
| /scaffold | 0-й этап | скелет по architecture/ADR, CI, зелёные install/build/lint/test, health, первый коммит; заменить заглушку линтера в хуке |
| /rules | — | аудит реальных конвенций + LESSONS → CLAUDE.md (≤40 строк), хуки, permissions; отметка в INVENTORY.md |
| /architecture | — | обновить docs/architecture.md по коду, дрейф → решение |
| /docs | — | синхронизация docs/ с кодом + инварианты (имена, эндпоинты, события, NFR↔тесты, US↔T) |
| /questions | — | реестр Q-NN: список по приоритетам, add, resolve (решение уходит в профильный документ) |
| /go | — | определить этап по артефактам → подтвердить → выполнить |
| /status | — | read-only срез + «следующий шаг» |
| /plan [T-NNN \| refill \| текст] | цикл | исследование по ссылкам задачи → план-файл; refill — декомпозиция следующей US |
| /build | цикл | исполнить план с первого неотмеченного шага; шаг = коммит |
| /check | цикл | верификация свежим контекстом против плана, US и контрактов |
| /ship | цикл | гейт → коммит → PR → docs → отметки в tasks/backlog/roadmap → архив |
| /fix <баг> | цикл | падающий тест → фикс → урок в LESSONS.md |

## Вариант 1: документация готова

    sh claude-flow-v2/install.sh ~/projects/my-product   # docs/ уже там
    cd ~/projects/my-product && claude
    /adopt

install.sh ничего в docs/ не перезаписывает — добавляет только
недостающие служебные файлы (README-карту, LESSONS.md, шаблон
плана) и печатает инвентарь. Если ваши файлы лежат в подпапках или
названы иначе, /adopt предложит `git mv` в плоскую раскладку и
подождёт подтверждения.

Что делает /adopt:
1. Инвентарь по трекам: 25 файлов, что есть, чего нет.
2. Аудит без правок: шапки (статус, версия, «Опирается на», Q-NN),
   форматы ID, инварианты — US↔REQ в backlog, FL↔SCR в screen-map,
   M↔EVT, NFR↔test-plan, ROLE↔матрица прав, openapi ↔ api-spec.
   Результат — docs/INVENTORY.md; реальные дыры — Q-NN с источником
   «adopt».
3. Мост: нет tasks.md → `/delivery tasks`; нет CLAUDE.md →
   `/delivery claude` (собирается из docs/agent-rules.md, ≤40
   строк; в agent-rules.md появляется строка «живёт в /CLAUDE.md»).
4. Дальше: /scaffold, если кода нет; /rules, если есть; иначе /go.

Типичный путь: /adopt → /delivery claude → /scaffold → /rules →
/clear → /go. Полдня до первого PR.

## Вариант 2: с нуля

    sh claude-flow-v2/install.sh ~/projects/my-product   # пустая папка
    cp -r ~/.claude/skills/product-discovery-docs \
          ~/projects/my-product/.claude/skills/          # ваш скилл конвейера
    cd ~/projects/my-product && claude
    /go        # → /discovery

Треки по порядку, где нужен человек:

1. **/discovery** (полдня–день, с вами). Интервью, потом документы
   1–9 на идентификаторах друг друга. Три чекпоинта — после
   research, prd, roadmap — команда ждёт вашего «дальше». Спорьте о
   скоупе на чекпоинте 2: здесь ошибка дешевле всего. P1 не
   переходит границу трека.
2. **/design** (день; можно пропустить → design-skipped.md).
   Экраны вскрывают требования — они возвращаются в prd.md.
3. **/tech** (день, с вами на ADR). Отвергнутые альтернативы
   важнее выбранных. Маленький проект — /spec.
4. **/delivery** (полдня). Тест-план, план реализации, tasks.md
   (очередь T-NNN, одна задача = один план), CLAUDE.md (документ 24),
   чек-лист запуска. Прочитайте tasks.md и CLAUDE.md целиком.
5. **/scaffold**, **/rules** — как в варианте 1.

Треки A–B удобно проходить в Chat или Cowork (интервью, правка
текстов), а потом принести файлы: это превращает вариант 2 в
вариант 1 на середине — /go увидит docs/ без INVENTORY.md и
предложит /adopt.

## Цикл — дальше только /clear и /go

    /clear
    /go            # «этап: очередь; беру T-003 — <что>. Подтвердить?»
                   # → /plan T-003: читает US-001, REQ, FL, api-spec,
                   #   пишет docs/plans/T-003-slug.md, останавливается
    # вы: читаете план, правите файл при необходимости, «ок»
    /clear
    /go            # → /build: шаги по порядку, шаг = коммит
    /go            # → /check: свежий сабагент + contract/security-reviewer
    /go            # → /ship: PR, docs, [x] T-003, архив плана
    # вы: ревью PR (diff размером в задачу), merge
    /clear
    /go            # → следующая T-NNN … пока tasks.md не кончится
                   # → /plan refill: следующая US из backlog.md → новые T-NNN

/clear между шагами обязателен: план-файл несёт весь контекст,
история сессии — нет. Где остаётесь вы: утвердить план, отревьюить
PR, ответить на Q-NN, наполнить очередь на следующий этап.

## Что доработано относительно claude-flow

| Было | Стало | Зачем |
|------|-------|-------|
| один вход (/discovery) | два входа: /adopt для готового docs/, /discovery с нуля; /go различает по INVENTORY.md | документация часто рождается вне репо |
| /discovery → 4 файла | одна команда на трек: /discovery, /design, /tech, /delivery; /spec — lite-путь | сквозные ID, трассируемость |
| SPEC.md как контракт | docs/api-spec.md + openapi.yaml генерацией; permission-запрет на ручную правку yaml | «только генерацией» — правило, не проза |
| BACKLOG.md (фича = план) | docs/tasks.md: `T-NNN` чекбоксами + лог; docs/backlog.md — слой ценности (US) | задача агента ≠ история; одна US = 2–4 T |
| вопросы в чате | docs/open-questions.md, /questions; P1 блокирует границу трека, P2 — /plan | «ни одного решения посреди сессии» |
| — | CLAUDE.md = документ 24 из agent-rules.md; /rules ужимает по коду | без второй копии правил |
| план `<slug>.md` | `T-NNN-slug.md` с Context и Done when из Given/When/Then | приёмка переезжает в тесты |
| 1 сабагент | + contract-reviewer: имена vs глоссарий, api-spec, data-model, analytics-spec | дрейф контрактов ловится на /check |
| SessionStart: планы | + инвентарь треков, открытые P1, верх очереди | сессия начинается с состояния |
| /ship: PR + архив | + [x] T в tasks.md, [x] US в backlog.md, контракты в том же PR | документы стареют вместе с кодом |

Инвариант не изменился: план одобряет человек, PR мержит человек.

## Файлы в репозитории

    CLAUDE.md                  документ 24, ≤40 строк — единственный, что агент видит в каждой сессии
    .claude/settings.json      deny .env и docs/openapi.yaml; хуки SessionStart, PostToolUse(lint)
    .claude/skills/<18>/       команды
    .claude/agents/            security-reviewer, contract-reviewer
    .claude/skills/product-discovery-docs/   ваш скилл конвейера (копируете сами; нужен для варианта 2)
    scripts/docs-inventory.sh  детерминированный инвентарь 25 документов (хук, /adopt, /status)
    scripts/session-context.sh срез состояния в каждую сессию
    scripts/stop-gate.sh       опциональный Stop-гейт
    docs/<25 файлов>.md        документы методологии, плоско; screens/, openapi.yaml
    docs/open-questions.md     реестр Q-NN
    docs/tasks.md              очередь T-NNN + лог
    docs/INVENTORY.md          инвентарь и аудит (/adopt, /discovery), отметки /rules
    docs/LESSONS.md            уроки из /fix до дистилляции в /rules
    docs/plans/T-NNN-*.md      активные планы; done/ — архив; PLAN.template.md
    docs/README.md             карта
    PROMPTS.md                 одноразовые промпты: docker, CI с проверкой контрактов, make, инварианты, headless

## Уровни автоматизации

1. Команды руками: /plan → /build → /check → /ship.
2. Оркестрация: tasks.md заполнен → только /go, /clear, /go, /clear.
3. Хуки: SessionStart (включён); Stop-гейт (опционально, стабильный проект).
4. Headless/CI: авторевью PR, ночной /docs, прогон очереди пачкой —
   при пустом P1/P2 в open-questions.md. См. PROMPTS.md.

## Философия (дополнена)

- Каждый шаг оставляет артефакт; результат не испаряется с контекстом.
- Верификация — доказательствами (вывод команд), не заявлениями.
- План одобряет человек; ревьюит свежий контекст; мержит человек.
- Факт живёт в одном документе, остальные ссылаются по ID.
- Принесённая документация — источник, не черновик: /adopt читает и
  проверяет, но не переписывает.
- Задача = один план = одна сессия = один PR. Больше — режь.
- Найденное попутно — в очередь, не в diff.
- Файл, не приносящий пользы, удаляется. Набор должен сжиматься.
