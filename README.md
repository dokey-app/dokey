# DoKey

Утилиты разработчика в браузере: JSON, JWT, Base64, URL, Unix timestamp, UUID и ULID.

**Ввод не покидает вкладку.** Не «мы не храним» — сервера, аккаунтов и хранения нет по
построению: `script-src 'self'`, `connect-src 'self'`, сторонних origin ноль, и это проверяется
тестами на каждой сборке.

Состояние: идёт разработка v1 (релиз 2026-12-21), план — [ROADMAP.md](ROADMAP.md).
Прод `dokey.ru` закрыт от индексации до релиза.

## Работа

Node.js 24 (`.nvmrc`), pnpm 12.3.4.

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm check    # lint, формат, типы, юнит-тесты, сборка и e2e — то же, что CI
```

## Как проверить обещание

```bash
curl -sI https://dokey.ru | grep -i content-security-policy
```

`script-src 'self'` и `connect-src 'self'` — место, где обещание либо держится, либо нет.
Откройте DevTools → Network и поработайте с инструментом: запросов на чужие origin быть не
должно ни одного. Полная процедура — на странице
[Как это проверить](https://dokey.ru/how-to-verify).

## Документы

- [docs/product.md](docs/product.md) — что и для кого
- [docs/architecture.md](docs/architecture.md) — как устроено
- [docs/decisions.md](docs/decisions.md) — решения, которые дорого отменить
- [docs/ops.md](docs/ops.md) — домен, деплой, доступы
- [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md)

## Лицензия

[Apache-2.0](LICENSE). См. [NOTICE](NOTICE).
