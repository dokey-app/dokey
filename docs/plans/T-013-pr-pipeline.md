# T-013 — собрать конвейер PR: линт, типы, RUN-01…RUN-03, сборка

## Request

- [ ] T-013 — собрать конвейер PR: линт, типы, RUN-01…RUN-03, сборка (TECH-05, US-047, D-129): границы — `.github/workflows/pr.yml`, `.oxlintrc.json`; готово — PR показывает шесть зелёных проверок, а присваивание `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `srcdoc` или вызов `document.write` в `src/**` останавливает `pnpm lint` (SEC-21)

Links: US-047 крит. 3 · TECH-05 · TECH-06 · D-129 · SEC-21 · THR-04 · ENT-25 `text-only-dom` ·
REQ-DIST-01 · NFR-17 · Q-185 (закрыт D-129)

## Context

**Прочитано:** [tasks.md](../tasks.md) строка T-013 (и соседние T-014, T-015, T-019, T-071 —
границы смежных задач), [decisions.md](../decisions.md) D-129 целиком,
[security-and-access.md](../security-and-access.md) §6 THR-04 и строка SEC-21 таблицы мер,
[user-stories.md](../user-stories.md) US-047, [backlog.md](../backlog.md) TECH-05, TECH-06,
[test-plan.md](../test-plan.md) строка SEC-21, [open-questions.md](../open-questions.md) Q-185,
[agent-rules.md](../agent-rules.md) §6–§8, `.github/workflows/pr.yml`, `.oxlintrc.json`,
`package.json`, `tests/unit/workflow-timeouts.test.ts`, `.github/pull_request_template.md`.

**Открытых P1/P2 нет** (open-questions §0: на 2026-09-22 открыты Q-238 и Q-239, оба P3). Задача
не блокирована.

### Что из «готово» уже выполнено — проверено фактом

**Половина «PR показывает шесть зелёных проверок» — выполнена; правки не требует.**

- `.github/workflows/pr.yml` существует, шапка файла уже помечена `T-013, TECH-05, US-047`.
  Шесть job'ов: «Линт и формат» (`pnpm lint`, `pnpm format:check`), «Типы» (`pnpm typecheck`),
  «RUN-01 unit», «RUN-02 browser mode», «RUN-03 e2e», «Сборка и гейты» (`pnpm build`,
  `pnpm gates`, `pnpm gate:headers-parity`). Конвейер собрали попутно более ранние задачи
  (T-228, T-244, T-249…T-254 правили его потолки времени).
- **Доказательство:** `gh run view 35808242071 --json jobs` (прогон `pull_request` последнего
  влитого PR #27, `t-255-audit-values`, 2026-09-23) — ровно шесть job'ов, у каждого
  `conclusion: success`. `gh run list --limit 12` — двенадцать последних прогонов `PR` зелёные.
- У каждого job есть `timeout-minutes`, и это машинное правило (`tests/unit/workflow-timeouts.test.ts`).

**Половина SEC-21 — не выполнена.** В `.oxlintrc.json` пять правил (`no-console`, `eqeqeq`,
`no-var`, `typescript/no-explicit-any`, `typescript/consistent-type-imports`) и ни одного запрета
`innerHTML` и соседей. Проверено: `node node_modules/oxlint/bin/oxlint` на дереве — зелёный;
на `src` — «Finished … on 3 files» (`src/layouts/Base.astro`, `src/pages/index.astro`,
`src/pages/health.astro`; файлов `.ts` в `src/**` пока нет вовсе).

### Чем закрывается SEC-21 в oxlint 1.81.0 — проверено пробой

Проба ставилась вне репозитория (временный каталог, тот же бинарь `node_modules/oxlint`).

- **`no-restricted-syntax` в 1.81.0 не реализовано**, плагина `no-unsanitized` нет (в `--help`
  списка плагинов он не значится, строки нет и в бинарнике `@oxlint/binding-win32-x64-msvc`).
- **`no-restricted-properties` реализовано** и принимает запись без `object` — «любой объект,
  это свойство». На пробе пойманы все пять имён:
  `el.innerHTML = …`, `el.outerHTML = …`, `el.insertAdjacentHTML(…)`, `iframe.srcdoc = …`,
  `document.write(…)` — пять ошибок, код выхода `1`.
- **Обходы закрыты:** вычисляемый доступ `el['innerHTML']`, деструктуризация `const { innerHTML } = el`
  и чтение `const s = el.innerHTML` тоже красные.
- **`.astro` линтуется:** нарушение внутри `<script>` компонента `.astro` поймано (`src/Bad.astro:7:6`).
  Это существенно: сегодня `src/**` состоит из `.astro`.
- **Глоб `src/**` в `overrides` берёт вложенность** (`src/tools/jwt/deep.astro`,
  `src/tools/nested/more/deep.ts`) и **не задевает соседей** (`tests/bad-outside.ts` при том же
  конфиге чист).
- **Комментарий в `.oxlintrc.json` допустим:** oxlint объявляет поддержку комментариев в конфиге
  (`--help`), проба с комментарием разобралась и правила применила; Prettier 3.9.6 комментарий
  сохраняет, `--check` на файле с ним зелёный. Причину запрета есть где записать рядом с ним.
- **Остаток, который правило не берёт** (назван честно, в «Вне предмета»): псевдоним
  `const d = document; d.write(…)` и `globalThis.document.write(…)` — запись привязана к объекту
  `document`; `set:html` в шаблоне `.astro`; `new Function`, `Reflect.set`.

## Approach

Одна запись в `.oxlintrc.json`: новый элемент `overrides` с `files: ["src/**"]` и правилом
`no-restricted-properties` уровня `error` на пять имён — `innerHTML`, `outerHTML`,
`insertAdjacentHTML`, `srcdoc` (без `object`, то есть у любого объекта) и `document.write`
(с `object: "document"`). Рядом — комментарий: SEC-21, D-129 п. 2 и п. 4, почему `write`
привязан к `document`. `pr.yml` не трогается: шаг линта в нём уже есть и уже зовёт `pnpm lint`.

Негативный случай сейчас — **воспроизводимая ручная проба по командам из шага 1**:
`tests/gates/negative` и `pnpm test:gates:negative` заводит T-019, и предмет там — гейты
(G-01…G-14), а запрет SEC-21 по D-129 п. 2 сознательно **не гейт**, а шаг линта. Команды пробы
записаны в плане дословно, чтобы проверяющий повторил их, а не поверил на слово.

Отвергнуто:

- **Пятнадцатый гейт** — отвергнут самим D-129: число гейтов зашито в критерий релиза и в десяток
  документов.
- **Правило в верхнем уровне `rules`, на всё дерево.** Шире, чем SEC-21: враждебный корпус T-075,
  негативные сборки T-019 и e2e имеют право строить враждебную разметку — это оснастка, а не
  продукт. D-129 и строка задачи говорят `src/**`.
- **`no-restricted-syntax` с селектором «только присваивание».** Точнее по букве строки задачи
  («присваивание»), но в oxlint 1.81.0 правила нет. Побочно: `no-restricted-properties` краснеет и
  на чтении `el.innerHTML` — расхождение со строкой задачи в сторону ложной красноты, а не
  молчания, и оно согласуется с D-129 п. 4 («исключений не заводится»).
- **Запись `{ "property": "write" }` без объекта.** Поймала бы `d.write(…)` через псевдоним, но
  заодно запретила бы `navigator.clipboard.write` — а перенос значения через буфер обмена это
  REQ-CORE-03, ядро продукта.
- **Свой JS-плагин oxlint** (`dist/plugins.js` в 1.81.0 есть). Выразил бы «только присваивание» и
  псевдонимы, но это новый файл кода вне границ задачи и своя реализация вместо настройки.
- **Тест RUN-01 на само правило** (по образцу `tests/unit/workflow-timeouts.test.ts`: временный
  каталог, копия `.oxlintrc.json`, проба в `src/`, ожидание кода `1`). Работоспособность проверена
  пробой — конфиг применяется только рядом со своим каталогом, копировать надо вместе с деревом.
  Отвергнут здесь: файл `tests/unit/*` за границами задачи (agent-rules §7.3), а ни у одного из
  пяти существующих правил конфига такого мета-теста нет — заводить его одному правилу означает
  решение о форме проверок линта, которого нет в decisions. Если постановщик решит иначе, это
  отдельная строка, а не «бонус» в этом PR.

## Out of scope

- **`.github/workflows/pr.yml`** — не правится: шесть проверок есть и зелёные, доказательство выше.
  Эта половина «готово» закрывается приёмкой, а не диффом.
- **Защита `main` и обязательность статусов** — T-014; **релизный конвейер** — T-015.
- **`tests/gates/negative/*` и `pnpm test:gates:negative`** — T-019 и T-071.
- **Враждебные образцы в корпусе фикстур** (D-129 п. 3) — T-075.
- **Одиннадцатый пункт контракта ENT-25 `text-only-dom`** — уже записан в data-model; кода
  контракта ещё нет, его заводит своя задача.
- **`document.writeln`, `set:html` в `.astro`, `new Function`, `Reflect.set`, псевдоним
  `document`.** Пяти имён строки задачи здесь достаточно; про `set:html` заводится строка
  `- [ ]` (шаг 3) — это настоящая дыра в SEC-21, а не придирка: атрибут шаблона линтеру не виден.

## Steps

- [ ] Запрет SEC-21 в конфиге линта: файлы `.oxlintrc.json` (новый элемент `overrides` с
      `files: ["src/**"]`, правило `no-restricted-properties` на пять имён, комментарий со
      ссылкой на SEC-21 и D-129); verify — `pnpm lint` и `pnpm format:check` зелёные на чистом
      дереве, затем негативная проба:

      printf '%s\n' "const el = document.body;" "el.innerHTML = 'x';" "el.outerHTML = 'x';" \
        "el.insertAdjacentHTML('beforeend', 'x');" "const f = document.createElement('iframe');" \
        "f.srcdoc = 'x';" "document.write('x');" > src/sec21-probe.ts
      pnpm lint; echo $?      # ожидается 1 и пять строк no-restricted-properties: innerHTML,
                              # outerHTML, insertAdjacentHTML, srcdoc, document.write
      cp src/sec21-probe.ts scripts/sec21-probe.ts
      pnpm lint               # та же проба вне src/** — про неё правило молчит (те же пять строк,
                              # ни одной новой): запрет не расползся за границу SEC-21
      rm src/sec21-probe.ts scripts/sec21-probe.ts
      pnpm lint; echo $?      # снова 0
      git status --short      # пусто: ни один файл пробы не уехал в коммит

      Вторая проба — та же разметка внутри `<script>` нового `.astro` в `src/pages/`: сегодня
      `src/**` состоит из `.astro`, и если правило их не берёт, «готово» не выполнено.

- [ ] Приёмка половины «шесть зелёных проверок»: файлов не трогает; verify —
      `gh run view <id прогона PR этой задачи> --json jobs --jq '.jobs[] | "\(.name) \(.conclusion)"'`
      даёт ровно шесть строк с `success`, и список имён совпадает с шестью job'ами `pr.yml`.
      Результат прогона вписывается в описание PR (номер прогона, шесть имён).

- [ ] Отметка `- [x] T-013` и строка остатка: файлы `docs/tasks.md`; verify — `pnpm test:unit`
      (`docs-structure.test.ts` держит форму документа) и чек-лист
      `.github/pull_request_template.md` целиком. Строка остатка по форме §0.1, в конце этапа
      Э-0:

      - [ ] T-256 — закрыть `set:html` в `src/**`: правило линта T-013 держит SEC-21 только в JS
        (`innerHTML` и соседи), а `set:html` — атрибут шаблона `.astro`, oxlint его не видит, и
        запрет D-129 п. 4 обходится одной директивой (найдено в T-013 2026-09-23): границы —
        `tests/unit/set-html.test.ts`; готово — `pnpm test:unit` красный на `set:html`,
        подсаженном в любой файл `src/**/*.astro`, и зелёный на текущем дереве

## Done when

- `pnpm lint` на чистом дереве зелёный, `pnpm format:check` и `pnpm typecheck` зелёные.
- Проба шага 1 воспроизводится: файл в `src/**` с пятью нарушениями даёт `pnpm lint` код `1` и
  пять findings `no-restricted-properties` — по одному на `innerHTML`, `outerHTML`,
  `insertAdjacentHTML`, `srcdoc`, `document.write`; тот же файл в `scripts/` молчит; после удаления
  пробы `pnpm lint` снова `0`, `git status --short` пуст.
- Проба в `<script>` компонента `.astro` под `src/pages/` даёт тот же результат.
- Прогон `pr.yml` на PR задачи: шесть job'ов, шесть `success` — проверено `gh run view`, номер
  прогона назван в описании PR (US-047 крит. 3 в части «мимо проверок не влить»; полная
  непроходимость — T-014 и T-015).
- Дифф — два файла: `.oxlintrc.json` и `docs/tasks.md`. Правок «попутно» нет: остаток по
  `set:html` вынесен строкой `- [ ] T-256`.
