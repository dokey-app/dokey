# T-002 — организация `dokey-app` и публичный репозиторий `dokey` на GitHub

## Request

- [x] T-002 — занять на GitHub организацию `dokey-app` и создать в ней публичный репозиторий `dokey` (TECH-13, D-155): границы — настройки репозитория, `README.md` в одну строку; готово — `github.com/dokey-app/dokey` открывается анонимно

Links: TECH-13 · D-20 п. 3 · **D-155** · D-98 · ROLE-03 · SEC-11 · SEC-15 · roadmap §4 (T0)

## Context

- Прочитано: D-20, D-155, backlog TECH-13, security-and-access ROLE-03, §3.2–3.3, SEC-11,
  SEC-15, SEC-16; триггеры `.github/workflows/*`; tasks T-011…T-015, T-213, T-215, T-224.
- 2026-09-16: `gh api orgs/dokey-app` и `users/dokey-app` → 404, имя свободно.
- **`README.md` в одну строку устарел:** README на 91 строку уже лёг каркасом Э-0. Репозиторий
  создаётся **пустым** (без README, лицензии, `.gitignore`), иначе история на GitHub разойдётся
  с локальной. README не трогаем.
- **Локальная история — один линейный стек:** `main` = 2 коммита (каркас и журнал Э-0),
  `d-177-domain-yearly` = +14 коммитов; все остальные ветки — его предки. Remote ещё нет, ни
  один из 14 коммитов не прошёл PR.
- **Триггеры:** `pr.yml` — push/PR в `main` (конвейер доводит T-013, красный ожидаем:
  `format:check` — T-224); `release.yml` — только теги `v*`; `rebuild.yml` — только вручную;
  **`synthetic.yml` — cron каждые 6 ч** против прода, которого до T-011 нет → будет падать.
- `gh` залогинен как **`prakht`**, а git-автор — `tmpapr`; скоупов `admin:org` нет.
  Владелец организации — учётная запись ROLE-03 со вторым фактором.
- Секреты: `git grep` по токенам пуст, `CLOUDFLARE_API_TOKEN` — только имя в `.env.example`
  и `secrets.` в workflow. Пуш публичный и необратимый — вся история проверяется до него (SEC-15).

## Approach

Организацию заводит человек в веб-интерфейсе: API создания организаций на github.com нет.
Дальше `gh`: пустой публичный репозиторий, секретное сканирование с блокировкой push **до
первого пуша**, пуш `main` как есть (2 коммита — это создание remote, а не обход PR), затем
ветка `t-002-github-org` поверх стека с отметкой задачи — **одним PR** в `main`, слияние
rebase (линейная история D-98). `synthetic.yml` выключается `gh workflow disable` до T-011.

Rejected: перемотать `main` на стек и запушить — 14 коммитов мимо PR, против правила ·
8 PR по старым веткам — стек линейный, выйдет одна и та же история за 8 кругов · репозиторий
с README от GitHub — расходится с локальной историей · личный `tmpapr/dokey` — отвергнут D-155 ·
удалить cron из `synthetic.yml` — правка кода не по теме.

## Out of scope

- Адреса `github.com/dokey/dokey` в `src/pages/index.astro`, `README.md`, `ISSUE_TEMPLATE` — **T-213**.
- Защита `main`, слепок `infra/github/branch-protection.json` — T-014. Environment `production` — T-215.
- Секрет `CLOUDFLARE_API_TOKEN` — T-011. Зелёный конвейер PR — T-013, T-224.
- GHCR и образ — T-022. Письмо владельцу логина `dokey` — окно D-155 п. 4, не задача.

## Steps

Ч — мейнтейнер руками, А — сессия /build. Коммит один (отметка + план).

- [x] Ч1 github.com → New organization `dokey-app`, Free, владелец — учётная запись ROLE-03
      с 2FA (TOTP/passkey). Settings → Authentication security → **Require 2FA** (SEC-11).
      `gh auth refresh -h github.com -s admin:org` под этой учётной записью;
      verify: `gh api orgs/dokey-app --jq '.login,.two_factor_requirement_enabled'` → `dokey-app`, `true`
- [x] А1 Проверить всю историю на секреты перед публикацией;
      verify: `git log -p --all | grep -nE "gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|-----BEGIN [A-Z ]*PRIVATE KEY|CLOUDFLARE_API_TOKEN=\S"` пуст
- [x] А2 `gh repo create dokey-app/dokey --public --description "<первая строка README>"`
      без `--add-readme`/`--license`/`--gitignore`; включить `secret_scanning` и
      `secret_scanning_push_protection`;
      verify: `gh api repos/dokey-app/dokey --jq '.visibility,.size,.security_and_analysis'` → `public`, `0`, оба `enabled`
- [x] А3 **С подтверждения мейнтейнера:** `git remote add origin https://github.com/dokey-app/dokey.git`,
      `git push -u origin main`, сразу `gh workflow disable synthetic.yml -R dokey-app/dokey`;
      verify: `gh workflow list -R dokey-app/dokey` — `synthetic` в `disabled_manually`
- [x] А4 Ветка `t-002-github-org` от `d-177-domain-yearly`: `- [x]` у T-002 в `docs/tasks.md`,
      план → `docs/plans/done/` с «Результатом»; коммит `T-002: организация dokey-app и репозиторий dokey (TECH-13)`;
      push, `gh pr create` (15 коммитов стека);
      verify: `pnpm lint && pnpm typecheck` зелёные, `gh pr view` открыт, `pr.yml` запустился
- [ ] Ч2 Мейнтейнер сливает PR способом **Rebase and merge**;
      verify: `git fetch && git log --oneline origin/main | wc -l` = 17

## Done when

- US нет (TECH-13); проверка — анонимный запрос:
  `curl -s -o /dev/null -w "%{http_code}" https://github.com/dokey-app/dokey` → `200` без cookies,
  `curl -s https://api.github.com/repos/dokey-app/dokey | grep '"private": false'` находит строку.
- `gh api orgs/dokey-app` — 2FA обязательна; у репозитория включена блокировка push при секретах.
- `origin/main` содержит весь стек, `synthetic` выключен до T-011.

## Результат

2026-09-17. Организация `dokey-app` (id 330186996) создана 2026-09-16T22:45Z; единственный
участник и владелец — `prakht` (ROLE-03), 2FA у него включена, «Require 2FA» в организации — `true`.
Git-автор коммитов — `tmpapr`: это локальное имя, адрес автора в истории публикуется (PD-07,
подтверждено PO перед пушем). Репозиторий `dokey-app/dokey` создан пустым и публичным, secret
scanning и push protection — `enabled` до первого пуша. История всех веток перед публикацией
проверена на токены, ключи и `.env` — пусто. `main` (2 коммита) запушен, `synthetic` —
`disabled_manually` до T-011; первый прогон `pr.yml` на `main` ожидаемо не зелёный (T-013, T-224).
Стек из 14 коммитов и эта отметка идут в `main` PR'ом из `t-002-github-org`, слияние — Rebase and merge.
