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

**Половина «PR показывает шесть зелёных проверок» — выполнена; правки требует только шапка файла.**

- `.github/workflows/pr.yml` существует, шапка файла уже помечена `T-013, TECH-05, US-047`.
  Шесть job'ов: «Линт и формат» (`pnpm lint`, `pnpm format:check`), «Типы» (`pnpm typecheck`),
  «RUN-01 unit», «RUN-02 browser mode», «RUN-03 e2e», «Сборка и гейты» (`pnpm build`,
  `pnpm gates`, `pnpm gate:headers-parity`). Конвейер собрали попутно более ранние задачи
  (T-228, T-244, T-249…T-254 правили его потолки времени).
- **Доказательство:** `gh run view 35808242071 --json jobs` (прогон `pull_request` последнего
  влитого PR #27, `t-255-audit-values`, 2026-09-23) — ровно шесть job'ов, у каждого
  `conclusion: success`. `gh run list --limit 12` — двенадцать последних прогонов `PR` зелёные.
- У каждого job есть `timeout-minutes`, и это машинное правило (`tests/unit/workflow-timeouts.test.ts`).

### Шапка `pr.yml` утверждает о GitHub то, чего в GitHub нет

Строка 1 файла: «Шесть проверок; **способа влить мимо них нет**». Вторая половина ложна —
спрошено у самой внешней системы 2026-09-23:

- `gh api repos/dokey-app/dokey/branches/main/protection` → `404 {"message":"Branch not protected"}`;
- `gh api repos/dokey-app/dokey/rulesets` → `[]` (ни одного ruleset, то есть защиты и «новым» путём нет);
- `gh api repos/dokey-app/dokey/branches/main --jq '{name, protected}'` → `{"name":"main","protected":false}`.

Обязательность статусов и защиту `main` заводит **T-014** («PR обязателен, статусы обязательны,
история линейная»). Пока её нет, шесть job'ов — это сигнал, а не преграда: зелёные они или красные,
влитию и прямому пушу в `main` они не мешают.

Это ровно класс T-251/T-252/T-254 и урок LESSONS «состояние внешней системы берётся у неё самой»:
утверждение о настройке GitHub держалось на блоке `on:` в репозитории, а не на ответе GitHub.
Файл — в границах задачи, строка — про предмет задачи, поэтому претензия снимается **здесь**, а не
выносится строкой остатка (шаг 2).

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
  это свойство». На пробе пойманы все шесть имён — по шесть ошибок на файл, код выхода `1`:
  `el.innerHTML = …`, `el.outerHTML = …`, `el.insertAdjacentHTML(…)`, `iframe.srcdoc = …`,
  `document.write(…)`, `document.writeln(…)`; ни `await navigator.clipboard.writeText('x')`, ни
  `await navigator.clipboard.write([])` в том же файле **не краснеют** — запись `write`/`writeln`
  привязана к `document`.
- **Обходы закрыты:** вычисляемый доступ `el['innerHTML']`, деструктуризация `const { innerHTML } = el`
  и чтение `const s = el.innerHTML` тоже красные.
- **`.astro` линтуется:** те же шесть нарушений внутри `<script>` компонента
  `src/layouts/Probe.astro` пойманы поимённо. Это существенно: сегодня `src/**` состоит из `.astro`.
- **Глоб `src/**` в `overrides` берёт вложенность** (`src/layouts/Probe.astro`,
  `src/tools/nested/more/deep.ts`) и **не задевает соседей**: копия того же файла в `scripts/`
  при том же конфиге чиста.
- **Опция `allowObjects` (расширение oxlint над ESLint, есть в
  `node_modules/oxlint/configuration_schema.json`) задачу не решает — проверено пробой.**
  Она применима только вместе с `property` и без `object`, то есть была бы единственным способом
  запретить `write` у любого объекта, выведя из-под запрета буфер обмена. Но и
  `{ "property": "write", "allowObjects": ["clipboard"] }`, и
  `{ … "allowObjects": ["navigator.clipboard"] }` красят `await navigator.clipboard.write([])`
  («Property 'write' is only allowed on these objects: …»), и точно так же красят
  `const c = navigator.clipboard; c.write(…)`. Список сверяется не с тем выражением, каким записан
  доступ. Значит, отказ от записи без `object` верен: единственный способ не запретить
  **REQ-INPUT-07** (prd.md:96, «Скопировать»; правило отказа — D-64) — привязать `write` и
  `writeln` к объекту `document`. Довод при этом меряется точно: REQ-INPUT-07 копирует **текст**, то есть
  `navigator.clipboard.writeText`, а его запись без `object` не трогает вовсе (проверено: строка
  `writeText` молчит при всех трёх формах записи). Красит она `navigator.clipboard.write` — форму
  того же требования через `ClipboardItem`, то есть «в том числе», а не «единственно». Вывод от
  этого не меняется: запрещать `write` у любого объекта незачем, объект известен и он `document`.
- **Комментарий в `.oxlintrc.json` допустим:** oxlint объявляет поддержку комментариев в конфиге
  (`--help`), проба с комментарием разобралась и правила применила; Prettier 3.9.6 комментарий
  сохраняет, `--check` на файле с ним зелёный. Причину запрета есть где записать рядом с ним.
- **Остаток, который правило не берёт** (назван честно, в «Вне предмета»): псевдоним
  `const d = document; d.write(…)` и `globalThis.document.write(…)` — запись привязана к объекту
  `document`; `set:html` в шаблоне `.astro` (выносится строкой T-256); `new Function`, `Reflect.set`.

## Approach

Одна запись в `.oxlintrc.json`: новый элемент `overrides` с `files: ["src/**"]` и правилом
`no-restricted-properties` уровня `error` на шесть имён — `innerHTML`, `outerHTML`,
`insertAdjacentHTML`, `srcdoc` (без `object`, то есть у любого объекта) и `document.write`,
`document.writeln` (с `object: "document"`). `writeln` — тот же сток документа и та же форма
записи: закрывается класс, а не найденная форма.

Рядом — комментарий, и он называет три вещи: SEC-21 с D-129 п. 2 и п. 4; почему `write`/`writeln`
привязаны к `document` (иначе под запрет попадает `navigator.clipboard.write` — форма
**REQ-INPUT-07** (D-64) через `ClipboardItem`, и вывести буфер `allowObjects`-ом не выходит, проба
выше); и то, что правило краснеет **и на чтении**
`const s = el.innerHTML`, а не только на присваивании, — расширение в сторону строгости,
согласное с D-129 п. 4 («исключений не заводится»). То же расхождение со строкой задачи
(в ней — «присваивание») называется в описании PR, чтобы его не приняли за случайность.

В `.github/workflows/pr.yml` правится **только шапка** — строка 1: её вторая половина утверждает о
GitHub то, чего в GitHub нет (см. Context). Ни один job, шаг, потолок времени и триггер не
меняются; шаг линта уже есть и уже зовёт `pnpm lint`.

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
- **Запись `{ "property": "write" }` без объекта** — и она же с `allowObjects`. Поймала бы
  `d.write(…)` через псевдоним, но запрещает `navigator.clipboard.write` — в том числе форму
  «Скопировать» через `ClipboardItem`, а копирование результата это **REQ-INPUT-07** (prd.md:96,
  правило отказа D-64), Must. Основную форму, `writeText`, эта запись не трогает, поэтому довод
  слабее, чем выглядит, — но он и не нужен сильным: вывести буфер из-под запрета всё равно нечем
  (`allowObjects` с `"clipboard"` и с `"navigator.clipboard"` на пробе краснеет, Context), а
  запрещать `write` у любого объекта незачем — объект известен. Поэтому `write` и `writeln`
  записаны с `object: "document"`, а псевдоним `document` назван остатком.
- **Свой JS-плагин oxlint** (`dist/plugins.js` в 1.81.0 есть). Выразил бы «только присваивание» и
  псевдонимы, но это новый файл кода вне границ задачи и своя реализация вместо настройки.
- **Тест RUN-01 на само правило** (по образцу `tests/unit/workflow-timeouts.test.ts`: временный
  каталог, копия `.oxlintrc.json`, проба в `src/`, ожидание кода `1`). Работоспособность проверена
  пробой — конфиг применяется только рядом со своим каталогом, копировать надо вместе с деревом.
  Отвергнут здесь: файл `tests/unit/*` за границами задачи (agent-rules §7.3), а ни у одного из
  пяти существующих правил конфига такого мета-теста нет — заводить его одному правилу означает
  решение о форме проверок линта, которого нет в decisions. Здесь не делается; сторож самого
  запрета входит в «готово» T-256 — в тот же файл `tests/unit/set-html.test.ts`, который закрывает
  дыру, а не отдельным мета-тестом «бонусом» в этом PR.

## Out of scope

- **Состав `.github/workflows/pr.yml`** — job'ы, шаги, потолки времени и триггеры не правятся:
  шесть проверок есть и зелёные, доказательство выше. Эта половина «готово» закрывается приёмкой,
  а не диффом. Правится одна строка — шапка (шаг 2).
- **Защита `main` и обязательность статусов** — T-014: здесь она только называется в шапке как
  незакрытая, а сами настройки GitHub, `infra/github/branch-protection.json` и
  `pnpm check:protection` — предмет T-014. Датированный факт в шапке `pr.yml` живёт ровно до
  T-014 и снимается ею; `pr.yml` в границы T-014 не входит, поэтому просьба снять эти строки
  ставится в описании PR (см. «Done when»), а отдельной задачи под неё не заводится.
  **Релизный конвейер** — T-015.
- **`tests/gates/negative/*` и `pnpm test:gates:negative`** — T-019 и T-071.
- **Враждебные образцы в корпусе фикстур** (D-129 п. 3) — T-075.
- **Одиннадцатый пункт контракта ENT-25 `text-only-dom`** — уже записан в data-model; кода
  контракта ещё нет, его заводит своя задача.
- **`set:html` в `.astro`, `new Function`, `Reflect.set`, псевдоним `document`.** Про `set:html`
  заводится строка `- [ ] T-256` (шаг 3) — это настоящая дыра в SEC-21, а не придирка: атрибут
  шаблона линтеру не виден. `new Function`, `Reflect.set` и псевдоним `document` — остаток,
  названный честно: строки задачи они не касаются, отдельной задачи под них здесь не заводится.
- **Мета-тест на само правило линта** (`tests/unit/*`) — за границами задачи (agent-rules §7.3);
  сторож запрета SEC-21 входит в «готово» T-256 (шаг 3).

## Steps

**Шаг 1 — коммит.** Запрет SEC-21 в конфиге линта: файлы `.oxlintrc.json` (новый элемент
`overrides` с `files: ["src/**"]`, правило `no-restricted-properties` уровня `error` на шесть
имён, комментарий: SEC-21 и D-129 п. 2/п. 4, привязка `write`/`writeln` к `document` ради
REQ-INPUT-07 (D-64), и что правило краснеет также на чтении `el.innerHTML`).

- [ ] verify — `pnpm lint` и `pnpm format:check` зелёные на чистом дереве, затем негативная проба
      **одной непрерывной последовательностью**: `.ts`-файл, его копия вне `src/**`, `.astro`-файл
      — и только потом уборка. Порядок важен: `.astro`-проба собирается, **пока `.ts`-проба ещё
      лежит в дереве**, поэтому ожидаемое число строк на этом шаге — двенадцать, а не шесть.
      Подмен вида `… || printf …` в командах нет: файл либо собрался из источника, либо проба
      провалена — молчаливого пропуска здесь не бывает (ровно то, чего требует «готово» T-256).
      Команды дословные, из корня репозитория, bash:

      printf '%s\n' "const el = document.body;" "el.innerHTML = 'x';" "el.outerHTML = 'x';" \
        "el.insertAdjacentHTML('beforeend', 'x');" "const f = document.createElement('iframe');" \
        "f.srcdoc = 'x';" "document.write('x');" "document.writeln('x');" \
        "await navigator.clipboard.writeText('x');" "await navigator.clipboard.write([]);" \
        > src/sec21-probe.ts
      pnpm lint; echo $?      # ожидается 1 и ровно шесть строк no-restricted-properties, все по
                              # src/sec21-probe.ts: innerHTML, outerHTML, insertAdjacentHTML,
                              # srcdoc, document.write, document.writeln; про
                              # navigator.clipboard.writeText и navigator.clipboard.write — ни строки

      cp src/sec21-probe.ts scripts/sec21-probe.ts
      pnpm lint               # та же проба вне src/** — про неё правило молчит: по-прежнему ровно
                              # шесть строк и все по src/sec21-probe.ts, ни одной по scripts/.
                              # Запрет не расползся за границу SEC-21

      Вторая проба — та же разметка внутри `<script>` компонента `.astro`, и собирается она **до**
      уборки, из ещё живого `src/sec21-probe.ts`. Класть её в `src/layouts/`, **не в `src/pages/`**:
      каталог страниц Astro — файловый маршрутизатор, файл там заводит маршрут мимо `src/registry`
      (ИНВ-06). Сегодня `src/**` состоит из `.astro`, и если правило их не берёт, «готово» не
      выполнено:

      { printf -- '---\n---\n<script>\n'; cat src/sec21-probe.ts; printf '</script>\n'; } \
        > src/layouts/Sec21Probe.astro
      pnpm lint; echo $?      # 1 и ровно двенадцать строк no-restricted-properties: шесть по
                              # src/sec21-probe.ts (он ещё в дереве) и шесть по
                              # src/layouts/Sec21Probe.astro — те же шесть имён;
                              # по scripts/sec21-probe.ts — по-прежнему ни одной

      rm src/sec21-probe.ts scripts/sec21-probe.ts src/layouts/Sec21Probe.astro
      pnpm lint; echo $?      # снова 0
      git status --short      # пусто: ни один файл пробы не уехал в коммит

**Шаг 2 — приёмка и одна строка шапки.** Половина «шесть зелёных проверок» закрывается приёмкой:
файл `.github/workflows/pr.yml` правится ровно в шапке, ни один job не меняется.

- [ ] Приёмка (диффа не даёт): `gh run view <id прогона PR этой задачи> --json jobs --jq '.jobs[] | "\(.name) \(.conclusion)"'`
      даёт ровно шесть строк с `success`, и список имён совпадает с шестью job'ами `pr.yml`.
      Результат прогона вписывается в описание PR (номер прогона, шесть имён).
- [ ] Шапка: строка 1 `pr.yml` — вместо «способа влить мимо них нет» претензия, проверенная у
      самого GitHub. Предлагаемый текст:

      # Конвейер PR (T-013, TECH-05, US-047). Шесть проверок; защита `main` и обязательность
      # статусов — T-014: на 2026-09-23 `main` не защищён (`gh api
      # repos/dokey-app/dokey/branches/main/protection` → 404 «Branch not protected»,
      # `gh api repos/dokey-app/dokey/rulesets` → `[]`), то есть исход этих шести проверок
      # влитию пока не препятствует. Состояние проверяется у GitHub, а не по блоку `on:`.
      # Эти две строки с датой снимает T-014 — вместе с включением защиты.

      verify — `git diff .github/workflows/pr.yml` трогает только строки шапки; `pnpm test:unit`
      (`workflow-timeouts.test.ts` читает тот же файл) и `pnpm format:check` зелёные; утверждение
      шапки повторно сверено у GitHub теми же двумя `gh api` в день коммита.

**Шаг 3 — коммит.** Отметка `- [x] T-013` и строка остатка: файлы `docs/tasks.md`.

- [ ] verify — `pnpm test:unit` (`docs-structure.test.ts` держит форму документа) и чек-лист
      `.github/pull_request_template.md` целиком. Строка остатка по форме §0.1, в конце этапа Э-0:

      - [ ] T-256 — закрыть `set:html` в `src/**`: правило линта T-013 держит SEC-21 только в JS
        (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `srcdoc`, `document.write`/`writeln`), а
        `set:html` — атрибут шаблона `.astro`, oxlint его не видит, и запрет D-129 п. 4 обходится
        одной директивой (найдено в T-013 2026-09-23): границы — `tests/unit/set-html.test.ts`;
        готово — `pnpm test:unit` красный на `set:html`, подсаженном в любой файл
        `src/**/*.astro`, и зелёный на текущем дереве; `.astro` разбирается парсером своего
        инструментария (`@astrojs/compiler`), а не регуляркой, и файл, не разобравшийся по
        грамматике, — провал проверки, а не молчаливый пропуск; тот же тест сторожит и сам запрет —
        в `.oxlintrc.json` есть правило SEC-21 на шесть имён, и его удаление краснит
        `pnpm test:unit`

      Прочие директивы шаблона (`is:raw` и соседи) в «готово» T-256 намеренно **не названы**:
      здесь не проверено, что они вообще стоки разметки и что парсер отдаёт их тем же проходом.
      Обещания «закроются даром» в строке задачи нет — расширение состава решается в T-256 по
      факту, на живом парсере.

## Done when

- `pnpm lint` на чистом дереве зелёный, `pnpm format:check` и `pnpm typecheck` зелёные.
- Проба шага 1 воспроизводится в записанном порядке: файл в `src/**` с шестью нарушениями даёт
  `pnpm lint` код `1` и ровно шесть findings `no-restricted-properties` — по одному на `innerHTML`,
  `outerHTML`, `insertAdjacentHTML`, `srcdoc`, `document.write`, `document.writeln`; обе строки
  буфера обмена (`navigator.clipboard.writeText`, `navigator.clipboard.write`) в том же файле
  молчат; копия файла в `scripts/` молчит целиком — строк по-прежнему шесть.
- Проба в `<script>` компонента `.astro` под `src/layouts/`, собранная **до уборки**, пока
  `.ts`-проба ещё в дереве, даёт код `1` и **двенадцать** строк: шесть по `src/sec21-probe.ts` и
  шесть по `src/layouts/Sec21Probe.astro`, те же шесть имён. После удаления всех трёх файлов
  `pnpm lint` снова `0`, `git status --short` пуст.
- Прогон `pr.yml` на PR задачи: шесть job'ов, шесть `success` — проверено `gh run view`, номер
  прогона назван в описании PR.
- Шапка `pr.yml` не утверждает о GitHub непроверенного: «мимо них не влить» снято, вместо него —
  отсылка к T-014 и факт с датой, полученный от самого GitHub (`branches/main/protection` → 404,
  `rulesets` → `[]`). US-047 крит. 3 в части «мимо проверок не влить» этой задачей **не
  закрывается** и здесь не объявляется закрытым: его закрывают T-014 и T-015.
- Описание PR называет: номер прогона и шесть имён job'ов; что правило краснеет и на чтении
  `el.innerHTML` (расширение в сторону строгости, D-129 п. 4); что `write`/`writeln` привязаны к
  `document` ради REQ-INPUT-07 (D-64) — форма «Скопировать» через `ClipboardItem`; что шапка
  `pr.yml` уточнена по ответу GitHub — **и что датированная строка шапки снимается вместе с
  T-014**: T-014 включает защиту `main`, после чего факт «на 2026-09-23 `main` не защищён»
  протухает, а `pr.yml` в границы T-014 (настройки репозитория,
  `infra/github/branch-protection.json`, `scripts/check-protection.ts`, `CONTRIBUTING.md`) не
  входит — снять строку должен исполнитель T-014, и просьба об этом стоит в описании PR.
- Дифф — три файла: `.oxlintrc.json`, `.github/workflows/pr.yml` (только шапка) и `docs/tasks.md`.
  Правок «попутно» нет: остаток по `set:html` вынесен строкой `- [ ] T-256`.
