# Эксплуатация

Логинов, кодов, адресов пересылки и имени доверенного лица здесь нет и не будет — только факты
и порядок действий. Подробные прежние рунбуки — [archive/infra-access.md](archive/infra-access.md),
[archive/infra-dns.md](archive/infra-dns.md).

## Сроки

| Что                                               | Когда          |
| ------------------------------------------------- | -------------- |
| Сверка вторых факторов (раз в квартал)            | **2026-12-17** |
| Истекает `CLOUDFLARE_API_TOKEN`                   | **2027-01-01** |
| Истекает домен `dokey.ru` (автопродление по году) | 2027-08-28     |

## Учётные записи

| Запись                          | Что даёт                                 |
| ------------------------------- | ---------------------------------------- |
| GitHub, организация `dokey-app` | Код, Actions, секреты, деплой            |
| Cloudflare                      | Прод `dokey.ru`, DNS-зона, Email Routing |
| REG.RU (регистратор)            | Домен — отказ без обходного пути         |

Везде TOTP (не SMS), резервные коды офлайн и не на устройстве со вторым фактором. Второго
владельца нет; у доверенного лица — отложенный аварийный доступ к набору восстановления. При
потере фактора: войти резервным кодом → новый TOTP → новые резервные коды → обновить набор
восстановления. Порядок, если мейнтейнер выбыл: регистратор → Cloudflare → GitHub, ничего не
деплоить руками.

## Домен и зона

- NS: `kellen.ns.cloudflare.com`, `penny.ns.cloudflare.com`; TLS — Universal SSL.
- `www` → apex редиректом, «Always Use HTTPS» включён.
- В зоне **выключены** Managed robots.txt (источник — репозиторий) и Network Error Logging
  (иначе браузер шлёт отчёты на сторонний origin).
- Почта (Cloudflare Email Routing): `privacy@`, `security@`, `conduct@dokey.ru`.
- Registrar lock и автопродление включены у регистратора.

```bash
dig NS dokey.ru +short
curl -sI https://dokey.ru | grep -ciE '^(nel|report-to|reporting-endpoints):'   # 0
```

## Деплой

Push в `main` → CI (`check`, `e2e`) → job `deploy` в environment `production`:
`wrangler versions upload --tag <sha>` и `wrangler versions deploy --version-tag <sha>@100%`
(маршруты не трогаются — у токена нет на них права), затем сверка CSP прода
(край Cloudflare переключается ~40 с). Custom Domain привязан в панели один раз; у токена одно
право — **Account · Workers Scripts · Edit**.

Environment `production` должен разрешать развёртывание с ветки `main`
(Settings → Environments → production → Deployment branches).

**Откат:** `pnpm exec wrangler rollback` (к предыдущей версии Worker) — либо `git revert` и
push в `main`. Ручной деплой с ноутбука — только при аварии.

## Локальный просмотр через Traefik

На dev-машине сборка поднимается за общим Traefik (`/srv/dev/stacks/traefik`, только file
provider, порт `127.0.0.1:18080`):

```bash
deploy/local-traefik/up.sh        # pnpm build → образ nginx → маршрут dokey.localhost → проверки
deploy/local-traefik/up.sh check  # только проверки
deploy/local-traefik/down.sh      # остановить и убрать маршрут
```

Открывать `http://dokey.localhost:18080` (с ноутбука — проброс порта 18080). nginx повторяет
поведение Cloudflare: `/jwt` → `jwt.html`, 404-страница, кеш `/_astro/*`. Заголовки
безопасности `up.sh` генерирует из `public/_headers` и проверяет, что отдаваемая CSP совпадает с
файлом. Это только просмотр: прод — Cloudflare Workers.

## Ротация токена (раз в 6 месяцев)

1. Cloudflare → My Profile → API Tokens → Create Token → Custom: одно право
   Account · Workers Scripts · Edit, только аккаунт проекта, TTL ≤ 6 месяцев.
2. `gh secret set CLOUDFLARE_API_TOKEN --env production -R dokey-app/dokey` (значение из
   приглашения, не из файла).
3. Удалить старый токен; проверить следующим деплоем; обновить таблицу «Сроки».

## Грабли

- `astro preview` уходит в фон сам только в окружении агента (`CLAUDECODE` и т. п.); на
  раннере — нет. Поэтому e2e поднимает сервер с явным `--background` и таймаутом, а у каждого
  job в CI есть `timeout-minutes`.
- Cloudflare `_headers` дописывает одноимённые заголовки через запятую — частное правило
  начинается с `! Cache-Control`.
