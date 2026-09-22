# T-234 — кеш-правила `_headers` заменяют `Cache-Control`, а не дописывают

## Request
- [ ] T-234 — развести кеш-правила `_headers` так, чтобы частное правило заменяло `Cache-Control` из `/*`, а не дописывало: Cloudflare склеивает одноимённые заголовки подходящих правил через запятую, и прод отдаёт на `/_astro/*` `public, max-age=0, must-revalidate, public, max-age=31536000, immutable`, а комментарий в файле утверждает обратное (найдено в T-011 2026-09-18): границы — `infra/headers/_headers`, `scripts/gates/headers-parity.ts`; готово — после релиза `curl -sI https://dokey.ru/_astro/<файл>` отдаёт ровно `cache-control: public, max-age=31536000, immutable`, `/sw.js` — ровно `no-cache`, `pnpm gate:headers-parity` зелёный
Links: architecture §5 «Ответы хостинга» · api-spec §4.6 ЭП-06, ЭП-07 · D-107 · ST-03 · TECH-02

## Context
- Docs read: architecture §5 (строка 578), api-spec §4.6 (ЭП-06 — длинный TTL и `immutable`,
  ЭП-07 `/sw.js` — короткий), `infra/headers/_headers`, `infra/docker/nginx.conf` (кеш через
  `map`, склейки там нет — копию не трогаем), `scripts/gates/headers-parity.ts`,
  `scripts/check-headers.ts`, `wrangler.toml` (Workers static assets, ADR-10),
  `.github/workflows/release.yml` (деплой по тегу `v*`).
- Механизм проверен по коду: `miniflare/dist/src/workers/assets/assets.worker.js:8243` (тот же
  asset-worker из workers-shared, что на проде) — для каждого подошедшего правила сначала
  `headers.delete` по списку `! Name`, затем `set`; одноимённый заголовок, уже поставленный
  прошлым правилом, идёт через `append` — отсюда склейка. Удалённый и затем дописанный
  заголовок даёт одно значение.
- Decisions applied: новых нет, Q-NN не требуется.

## Approach
В каждом частном правиле (`/_astro/*`, `/fonts/*`, `/sw.js`, `/robots.txt`) строкой перед новым
значением отсоединить унаследованный заголовок — `! Cache-Control`. Комментарий над правилами
исправить: Cloudflare не переопределяет одноимённые заголовки, а склеивает их; `!` — единственный
способ заменить значение. В `headers-parity.ts` добавить статическую проверку `_headers`: любое
правило кроме `/*`, задающее заголовок, который уже задан в `/*`, обязано его отсоединить — иначе
`fail` с именем правила и заголовка. Так ошибка ловится на каждой сборке, а не на проде.
Rejected:
- убрать `Cache-Control` из `/*` и перечислить HTML-пути — маршруты без расширения, маской «всё
  кроме ассетов» их не описать, а список путей дублирует `src/registry`;
- Worker-скрипт, правящий заголовки, — серверный код ради заголовка, против ADR-13;
- Cache Rules в панели Cloudflare — заголовки живут в репозитории, а не в панели (ST-03).

## Out of scope
- `infra/docker/nginx.conf` — там склейки нет, `map` уже даёт одно значение.
- Генератор из `infra/headers/policy.ts` (T-021).
- Юнит-тест и негативная сборка для новой проверки гейта — вне границ задачи; нужна —
  строкой `- [ ]` в `docs/tasks.md`.
- Слияние открытых PR #7 и #8 и сам релиз — решение ROLE-03.

## Steps
- [x] Проверка склейки в гейте — сначала красная: files `scripts/gates/headers-parity.ts`;
  verify: `pnpm gate:headers-parity` — `fail` с четырьмя правилами × `cache-control` на
  текущем `_headers`
- [x] Отсоединение в правилах и исправленный комментарий: files `infra/headers/_headers`;
  verify: `pnpm gate:headers-parity` зелёный; `pnpm build`, затем `pnpm exec wrangler dev
  --port 8788` и `curl -sI` на `/`, `/_astro/<файл из dist>`, `/sw.js` (если в `dist` есть),
  `/robots.txt` — у каждого ровно одна строка `cache-control` с одним значением; CSP и прочий
  набор из `/*` на `/_astro/*` на месте
- [x] Приёмка и отметка: files `docs/tasks.md`; verify: чек-лист
  `.github/pull_request_template.md` целиком (`pnpm lint`, `format:check`, `typecheck`,
  `test:unit`, `pnpm gates`), коммит `T-234: …` с `- [x]`, PR

## Done when
- `pnpm gate:headers-parity` зелёный на исправленном `_headers` и красный, если убрать любую
  строку `! Cache-Control` (проверяется руками на шаге 1).
- `wrangler dev`: `/_astro/<файл>` → ровно `cache-control: public, max-age=31536000, immutable`,
  `/sw.js` → ровно `no-cache`, `/` → `public, max-age=0, must-revalidate`.
- После релиза (тег `v*`, ROLE-03): `curl -sI https://dokey.ru/_astro/<файл>` и
  `curl -sI https://dokey.ru/sw.js` дают те же значения — это закрывает графу «готово»;
  до релиза задача остаётся в PR.
- Итог 2026-09-22: PR #9 слит; своего тега у выкладки нет — `v0.0.0` занят (D-178), `v0.0.1`
  отведён T-015 и T-032. Выбор PO: ждать `v0.0.1`, промежуточный тег не заводить. Проверка на
  проде вынесена строкой T-237 (блок: T-032); до неё прод отдаёт склейку, ассеты кешируются
  на `max-age=0`.
