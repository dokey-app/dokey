# T-011 — первая выкладка заглушки на `dokey.ru`

## Request

- [ ] T-011 — задеплоить заглушку на `dokey.ru` через wrangler (TECH-02, ADR-10, D-114, D-162, D-178, D-179): границы — `wrangler.toml`, `.github/workflows/release.yml`; готово — ROLE-03 привязал `dokey.ru` к Worker'у `dokey` в панели, после тега `v0.0.0` на `main` страница открывается, `curl -sI https://dokey.ru` возвращает ответ хостинга и `strict-transport-security`, заголовки совпадают с `_headers`, токен деплоя — со сроком ≤ 6 месяцев и одним правом `Workers Scripts:Edit`; блок: T-230

Links: TECH-02 · ADR-10 · D-86 · D-114 · D-162 · D-178 · D-179 · SEC-14, SEC-19 · RUN-16 · ЧЛ-92

## Context

- Прочитано: ADR-10, D-86, D-114, D-162, D-178, D-179, security-and-access SEC-14/SEC-19,
  implementation-plan §2.4 и §4.2, `infra/dns/README.md`, `infra/access/README.md`,
  `wrangler.toml`, `release.yml`, `scripts/check-headers.ts`, `infra/headers/_headers`.
- Решения: Q-242 → D-178 (тег `v0.0.0`), Q-243 → D-179 (домен привязывается в панели).
- Сейчас: у `release.yml` уже есть задание «Прод» (`cloudflare/wrangler-action@v3`, затем
  `check-headers.ts` на `https://dokey.ru`). В `wrangler.toml` нет привязки домена и выключения
  `workers.dev`. В environment `production` секретов пока нет; развёртывания разрешены только для
  тегов `v*`.
- Холостой деплой задуманного конфига (`wrangler deploy --dry-run`, wrangler 4.129.0) проходит:
  8 файлов, без предупреждений.
- Дефектов в задании «Прод» два:
  1. **Нет `setup-node`.** `check-headers.ts` запускается на Node раннера, а
     `--experimental-strip-types` там может не существовать.
  2. **Нет pnpm.** `wrangler-action` сам ставит wrangler через менеджер пакетов, который находит
     по lockfile, а pnpm в этом задании не установлен.
- Попутно найдено и вынесено отдельными задачами:
  - **T-230, блокирует T-011:** текст заглушки расходится с content-guide §5 (D-85), ссылка ведёт
    на `github.com/dokey/dokey`.
  - **T-231:** в `README.md` в команде `cosign` указана та же чужая организация.
  - **T-232:** `www` и редирект на apex.

## Approach

**Конфиг.** В `wrangler.toml` добавляются:

- `routes = [{ pattern = "dokey.ru", custom_domain = true }]` — повторяет привязку из панели
  (D-179 п. 2);
- `workers_dev = false` и `preview_urls = false` — иначе заглушка отдавалась бы со второго адреса
  `*.workers.dev`, мимо зоны.

**Задание «Прод».** Ставит Node 24 и pnpm так же, как задание гейтов, затем
`pnpm install --frozen-lockfile` и `pnpm exec wrangler deploy`. Токен и id аккаунта передаются
через env: `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`. Версию wrangler фиксирует lockfile
(4.129.0), а сверка RUN-16 идёт на Node 24. У задания появляется `timeout-minutes: 15`: висящий
деплой не должен занимать раннер 6 часов (урок T-228).

**Приёмка по D-178.** Тег ставится на `main` после слияния PR. Отметка `- [x]` уходит отдельным
коммитом `T-011: приёмка на проде` через PR, после проверки на проде.

Rejected:

- **Оставить `wrangler-action`.** Это сторонний action, которому доступен токен; wrangler он ставит
  сам, в обход lockfile, и без pnpm в задании падает.
- **Отдать `CLOUDFLARE_ACCOUNT_ID` через `vars`.** Рунбук T-215 уже держит его рядом с токеном в
  секретах environment; менять договор ради удобства незачем.
- **Расширить `check-headers.ts` до полной сверки с `_headers`.** Это вне границ задачи (T-019,
  T-021); полная сверка в приёмке делается командой ниже.

## Out of scope

- Текст заглушки — T-230 (должна быть в `main` до тега). `www` — T-232. Индексация — T-012
  (до неё заглушка на проде индексируется: окно принято порядком задач). HSTS-preload — T-223.
  Замер из России — T-227. Хеши и аттестация веб-артефакта — T-015. Публичность образа — T-022.
- `scripts/check-headers.ts`, `infra/headers/_headers`, задание образа в `release.yml` не меняются.

## Steps

Шаги 1–3 — один коммит `T-011: первая выкладка заглушки на dokey.ru (TECH-02)` и PR. Шаги 4–6
выполняются после слияния, шаг 7 — отдельный коммит.

- [x] 1. `wrangler.toml`: `routes` с `custom_domain`, `workers_dev = false`,
      `preview_urls = false`, комментарий со ссылкой на D-179.
      verify: `pnpm build && pnpm exec wrangler deploy --dry-run` — 8 файлов, без предупреждений
- [x] 2. `.github/workflows/release.yml`, задание «Прод»:
      - `timeout-minutes: 15`;
      - pnpm, Node 24, `pnpm install --frozen-lockfile`;
      - шаг `pnpm exec wrangler deploy` с `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID` из
        секретов вместо `wrangler-action`;
      - комментарий ADR-10 сохраняется.
      verify: `pnpm exec prettier --check .github/workflows/release.yml && pnpm exec wrangler --version` (4.129.0)
- [x] 3. Чек-лист PR целиком.
      verify: `pnpm lint && pnpm typecheck && pnpm build && pnpm gates`. Про `pnpm format:check`:
      красный до T-224, в диффе расхождений быть не должно. Затем PR и слияние.
- [ ] 4. **ROLE-03 (вы), до тега.** Порядок — рунбук `infra/access/README.md`, «Ротация токена
      деплоя»:
      - выпустить токен: одно право `Account · Workers Scripts · Edit`, срок ≤ 6 месяцев;
      - `gh secret set CLOUDFLARE_API_TOKEN --env production -R dokey-app/dokey`;
      - `gh secret set CLOUDFLARE_ACCOUNT_ID --env production -R dokey-app/dokey`;
      - убедиться, что T-230 уже в `main`.
      verify: `gh api repos/dokey-app/dokey/environments/production/secrets -q '.secrets[].name'` — оба имени
- [ ] 5. **ROLE-03 (вы), сразу перед тегом (D-179).** В панели Cloudflare создать Worker `dokey`
      из стартового шаблона, затем Settings → Domains & Routes → Custom Domain `dokey.ru`.
      verify: `curl -sI https://dokey.ru | head -1` — ответ стартового Worker'а
- [ ] 6. Тег `v0.0.0` на `main`: `git tag v0.0.0 && git push origin v0.0.0`, только с
      подтверждения PO в момент шага.
      verify: `gh run watch` — задания «Гейты релиза» и «Прод» зелёные.
      - При отказе на правах маршрута или `workers.dev` — новый Q-NN с журналом, токен не
        расширяется (D-179 п. 4).
      - Провал задания образа не валит T-011, он записывается строкой в tasks.md.
      - Если G-01 не проходит из-за нестабильности — перезапуск (T-229).
- [ ] 7. Приёмка (ниже) и коммит `T-011: приёмка на проде` с `- [x]` через PR.

## Done when

- `curl -sI https://dokey.ru | head -1` — `HTTP/2 200`; `curl -sI https://dokey.ru | grep -i strict-transport-security` — `max-age=63072000; includeSubDomains; preload`
- `DOKEY_TARGET=https://dokey.ru pnpm check:headers` зелёный; задание «Прод» в релизе `v0.0.0` зелёное
- Заголовки совпадают с `_headers`: каждая строка блока `/*` есть в ответе.
  verify: `sed -n '/^\/\*$/,/^$/p' infra/headers/_headers | sed '1d;/^$/d;s/^ *//' | while IFS= read -r h; do curl -sI https://dokey.ru/ | tr -d '\r' | grep -qiF -- "$h" || echo "нет: $h"; done` — пусто
- `curl -sI https://dokey.ru/_astro/<файл>` отдаёт `cache-control: public, max-age=31536000, immutable`
- `workers.dev` выключен: адрес `dokey.<поддомен>.workers.dev` не отдаёт заглушку
- Токен: в панели Cloudflare (API Tokens) одна строка прав `Workers Scripts:Edit` и дата окончания
  ≤ 6 месяцев от выпуска — сверяет ROLE-03 (токен на устройство не копируется, D-162 п. 3)
- Журнал деплоев Cloudflare показывает одну выкладку — из прогона `v0.0.0` (SEC-19)
