# T-235 — выключить NEL в зоне `dokey.ru`, RUN-16 падает на заголовках отчётов

## Request

- [ ] T-235 — выключить NEL в зоне `dokey.ru` и научить RUN-16 падать на заголовках отчётов (ИНВ-01, D-180): Cloudflare дописывает к каждому ответу прода `Report-To` и `NEL` с адресом `a.nel.cloudflare.com` (найдено в T-011 2026-09-18): границы — настройка зоны (ROLE-03), `infra/dns/README.md`, `scripts/check-headers.ts`; готово — `curl -sI https://dokey.ru` не содержит ни `nel`, ни `report-to`, ни `reporting-endpoints`, `DOKEY_TARGET=https://dokey.ru pnpm check:headers` зелёный и красный на ответе с любым из трёх, в таблице результата `infra/dns/README.md` есть строка «Network Error Logging Cloudflare — выключен»

Links: ИНВ-01 · D-180 (закрывает Q-244) · ADR-10 · ADR-13 · ST-03 · D-164 п. 4 · RUN-16

## Context

- Прочитано: D-180 целиком, Q-244, architecture ИНВ-01 (строка уже правлена D-180), test-plan
  RUN-16, `infra/dns/README.md`, `scripts/check-headers.ts`, `scripts/gates/gate.ts`,
  `tests/unit/size-gate.test.ts` (образец теста гейта отдельным процессом), `release.yml`,
  `synthetic.yml`.
- Решения: Q-244 → D-180. Пункт 7 и блок проверки T-235 в `infra/dns/README.md` D-180 уже дописал.
  Остались настройка зоны, строка в таблице «Результат» и проверка в RUN-16.
- Сейчас `check-headers.ts` проверяет, что три заголовка **есть**
  (`content-security-policy`, `strict-transport-security`, `cache-control`). Проверки, что каких-то
  заголовков **нет**, в нём не существует. `TARGET` читается из `DOKEY_TARGET` при загрузке
  модуля.
- RUN-16 зовут два места: задание «Прод» в `release.yml` (шесть попыток с шагом 10 с) и
  `synthetic.yml` (раз в 6 часов, при провале заводит issue).

## Approach

**RUN-16.** В `check-headers.ts` рядом с `EXPECTED` появляется
`FORBIDDEN = ['nel', 'report-to', 'reporting-endpoints']`. Ответ, где есть хотя бы один из них,
даёт `fail`: в выводе стоят имя и значение заголовка и ссылка на D-180. Если нарушений два вида
(заголовка из `EXPECTED` нет, а запрещённый есть), в `fail` перечисляются оба. `claim` становится
«живой origin отдаёт объявленные заголовки и не объявляет адресов отчётов».

**Тест, RUN-01.** Новый `tests/unit/check-headers.test.ts` устроен как `size-gate.test.ts`.
`node:http` поднимает сервер на `127.0.0.1:0`, скрипт запускается отдельным процессом с
`DOKEY_TARGET` на этот сервер, по коду выхода видно, что вышло. Случаев пять:

- три ожидаемых заголовка → 0;
- к ним добавлен `nel` → 1;
- к ним добавлен `report-to` → 1;
- к ним добавлен `reporting-endpoints` → 1;
- нет `content-security-policy` → 1 (прежнее поведение не сломано).

Это и есть негативная проверка из чек-листа PR. RUN-16 — не G-гейт и собранный `dist` не читает,
поэтому `tests/gates/negative` сюда не подходит.

**Порядок, из-за `synthetic.yml`.** Если слить новую проверку в `main` до выключения NEL,
синтетика будет краснеть и заводить issue каждые 6 часов. Поэтому ROLE-03 выключает NEL до
слияния, а сам PR сливается только после зелёного прогона против прода.

Rejected:

- **Выключить NEL из агента через `PATCH /zones/{id}/settings/nel`.** У токена деплоя одно право
  `Workers Scripts:Edit` (D-179), права на настройки зоны нет. Новый токен ради одного
  переключателя расширил бы поверхность доступа. D-180 п. 2 отдаёт это ROLE-03.
- **Сделать сверку функцией от `Headers` и тестировать без процесса.** Код выхода, `runGate` и
  чтение `DOKEY_TARGET` остались бы без проверки. Процесс ближе к тому, как RUN-16 зовут
  `release.yml` и `synthetic.yml`.
- **Ловить заодно `report-uri` и `report-to` в CSP.** D-180 п. 1 их называет, но граница задачи —
  три заголовка. CSP — наша собственная политика в `_headers`, и её сторожит headers-parity.

## Out of scope

- Отзыв политики через `NEL: {"max_age":0}`: хвост в 7 суток принят (D-180 п. 4).
- Директивы отчётов в CSP (см. Rejected) и полная сверка ответа с `_headers` (T-019, T-021).
- Постоянный отказ от NEL через поддержку (флаг `nel___enable`) — отвергнут в D-180.
- Кеш-правила `_headers` — это T-234.

## Steps

- [x] 1. RUN-16 падает на заголовках отчётов, тест на пять случаев. Файлы:
      `scripts/check-headers.ts`, `tests/unit/check-headers.test.ts`. Проверка:
      `pnpm test:unit && pnpm lint && pnpm format:check && pnpm typecheck`. Коммит
      `T-235: RUN-16 падает на заголовках отчётов (D-180)` на ветке `t-235-nel-off`.
- [x] 2. Красный прогон на живом проде, пока NEL ещё включён. Это доказательство, что проверка
      ловит настоящий ответ, а не только фикстуру. Файлов нет, коммита нет. Проверка:
      `DOKEY_TARGET=https://dokey.ru pnpm check:headers`, ожидается `ПРОВАЛ` с `nel` и
      `report-to` и код 1.
- [x] 3. **ROLE-03 (человек)** выключает «Network Error Logging» в панели зоны `dokey.ru`
      (Speed → Settings или Network, в зависимости от версии панели). Агент останавливается и
      ждёт подтверждения. Файлов нет. Проверка:
      `curl -sI https://dokey.ru | grep -ciE '^(nel|report-to|reporting-endpoints):'` → `0`
      на `/`, на `/_astro/<файл>` и на заведомо несуществующем пути (404). Все три пути названы
      в D-180. Если край ещё отдаёт заголовки, повторять до нескольких минут.
- [x] 4. Строка в таблице «Результат» и отметка задачи. Файлы: `infra/dns/README.md` (строка
      `| Network Error Logging Cloudflare | выключен 2026-MM-DD (**D-180**) |` после строки Managed
      robots.txt), `docs/tasks.md` (`- [x] T-235`), этот план переезжает в `docs/plans/done/`.
      Проверка: `DOKEY_TARGET=https://dokey.ru pnpm check:headers` зелёный,
      `pnpm format:check`. Коммит `T-235: NEL Cloudflare выключен, RUN-16 зелёный на проде`.
      Затем PR и слияние. После слияния один ручной запуск `synthetic.yml`
      (`gh workflow run synthetic.yml`), чтобы убедиться, что он зелёный.

## Done when

- `pnpm test:unit` зелёный, в `tests/unit/check-headers.test.ts` пять случаев: чистый ответ →
  0, `nel` / `report-to` / `reporting-endpoints` → 1, нет CSP → 1.
- `DOKEY_TARGET=https://dokey.ru pnpm check:headers` был красным до выключения NEL (шаг 2) и
  стал зелёным после (шаг 4).
- `curl -sI https://dokey.ru | grep -ciE '^(nel|report-to|reporting-endpoints):'` → `0`.
- В таблице «Результат» `infra/dns/README.md` есть строка «Network Error Logging Cloudflare —
  выключен».
- Чек-лист `.github/pull_request_template.md` пройден целиком.
