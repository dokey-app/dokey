# DoKey

Каталог браузерных инструментов для разработчика: JSON, JWT, Base64, URL, timestamp,
UUID и ULID.

**Ввод физически не покидает вкладку.** Не «мы не храним» — сервера, аккаунтов, истории и
хранения нет по построению: `script-src 'self'`, `connect-src 'self'`, сторонних origin ровно
ноль, и это проверяется гейтом на каждой сборке, а не обещанием на странице «О проекте».

Состояние: **этап Э-0, труба.** Продукта ещё нет — собирается конвейер сборки, поставки и
проверок. Прод отдаёт заглушку и закрыт от индексации до тега релиза.

## Требования

- Node.js 24 LTS (`.nvmrc`)
- pnpm 12.3.4 — `npm i -g pnpm@12.3.4`

## Работа

```bash
pnpm install
pnpm dev                 # каркас на http://localhost:4321
pnpm build               # статическая сборка в dist/
pnpm preview             # раздать собранное
```

## Проверки

```bash
pnpm lint                # oxlint 1.81.0
pnpm format:check        # Prettier 3.9.6
pnpm typecheck           # tsc 7.0.2, --noEmit

pnpm test:unit           # RUN-01, Vitest, node
pnpm test:int            # RUN-02, Vitest browser mode (не jsdom)
pnpm test:e2e            # RUN-03, Playwright

pnpm gates               # четырнадцать гейтов G-01…G-14
pnpm gate:headers-parity # две копии заголовков ответа совпадают
```

`pnpm gates` печатает исполненные гейты и отдельно — те, у кого предмета ещё нет, с этапом
включения. Зелёный «потому что проверено» и зелёный «потому что пусто» в выводе различимы
намеренно: состав гейтов — в [scripts/gates/README.md](scripts/gates/README.md).

## Как проверить сборку

Ровно то, что обещано, проверяется руками, а не читается на слово.

**1. Заголовки ответа.**

```bash
curl -sI https://dokey.app | grep -iE 'content-security-policy|strict-transport-security'
```

`script-src 'self'` и `connect-src 'self'` — то самое место, где обещание либо держится,
либо нет. Полная сверка: `DOKEY_TARGET=https://dokey.app pnpm check:headers`.

**2. Ни одного стороннего запроса.** Откройте вкладку «Сеть» в инструментах разработчика и
перезагрузите страницу: чужих origin быть не должно ни одного.

**3. Образ и его подпись.**

```bash
docker pull ghcr.io/dokey/dokey:v0.0.1
cosign verify ghcr.io/dokey/dokey:v0.0.1 \
  --certificate-identity-regexp 'https://github.com/dokey/dokey/.github/workflows/release.yml@.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
syft ghcr.io/dokey/dokey:v0.0.1
```

**4. Тот же продукт у себя.**

```bash
docker run --rm -p 8080:8080 ghcr.io/dokey/dokey:v0.0.1
curl -sI http://127.0.0.1:8080/ | grep -i content-security-policy
```

Образ не обращается в сеть в рантайме — ни за шрифтами, ни за счётчиком, ни за обновлениями
(ИНВ-11). Это проверяется системным прогоном RUN-14, а не заявляется.

## Устройство

- [CONTRIBUTING.md](CONTRIBUTING.md) — контракт инструмента, красные линии, порядок работы
- [SECURITY.md](SECURITY.md) — что защищается, куда сообщать, что уязвимостью не считается
- [src/README.md](src/README.md) — по компоненту на каталог
- [docs/](docs/) — корпус документов: решения, архитектура, задачи, тесты

## Лицензия

[Apache-2.0](LICENSE). См. [NOTICE](NOTICE).
