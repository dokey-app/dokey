# Зона `dokey.app` (T-001, TECH-01)

Задача T-001 выполняется человеком с доступом к регистратору — здесь записано, что именно
должно получиться, чтобы результат можно было проверить, а не принять на слово.

## Что должно быть

1. Домен `dokey.app` зарегистрирован, зона делегирована на Cloudflare.
2. Записи `dokey.app` и `www.dokey.app` указывают на Workers-проект `dokey` (см.
   [wrangler.toml](../../wrangler.toml)).
3. TLS выдан и действует; `www` отвечает редиректом на apex.
4. HSTS отдаётся с продакшн-ответом: `max-age=63072000; includeSubDomains; preload`
   — значение живёт в [infra/headers/\_headers](../headers/_headers), а не в панели провайдера
   (ST-03).

Зона `.app` входит в HSTS preload по умолчанию: HTTP-схема к ней недоступна принципиально.

## Как проверить

```bash
curl -sI https://dokey.app | grep -i 'strict-transport-security'
curl -sI https://dokey.app | head -1
```

Ответ хостинга и заголовок `strict-transport-security` — форма приёмки T-001.
Полную сверку заголовков делает `pnpm check:headers` с `DOKEY_TARGET=https://dokey.app`.
