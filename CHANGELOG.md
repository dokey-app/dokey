# Изменения

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версии — [SemVer](https://semver.org/lang/ru/).

## [Не выпущено]

## [1.0.0] — 2026-12-21

Первый публичный релиз: шесть инструментов, ввод не покидает вкладку.

### Добавлено

- JSON Workbench (`/json`): форматирование, минификация, сортировка ключей, ошибки со строкой
  и позицией, дерево с копированием пути; числа не переписываются.
- JWT Inspector (`/jwt`): header и payload, `exp`/`iat`/`nbf` в UTC и местном времени, проверка
  подписи HS256/HS384/HS512 через WebCrypto; токен и ключ стираются при уходе со страницы.
- Base64 Encoder/Decoder (`/base64`): текст в UTF-8 и файлы, URL-safe, двоичный результат —
  hex-превью и скачивание.
- URL Encoder/Decoder (`/url`): разбор адреса, таблица query, строгое percent-декодирование.
- Unix Timestamp Converter (`/unix-timestamp`): секунды и миллисекунды ↔ ISO 8601, UTC и
  местное время.
- UUID/ULID Generator (`/uuid`): v4, v7 и ULID пакетом до 1000 значений, проверка UUID и ULID.
- Автоопределение ввода на главной; страница «Как это проверить»; счётчик внешних запросов.
- Проверки на каждой сборке: ни одного стороннего origin, ввод не пишется в хранилища, initial
  JS ≤ 40 KB gzip, WCAG 2.2 AA (axe), каждый элемент управления достижим с клавиатуры, правила
  текстов.

### Изменено

- Сайт открыт для индексации: `noindex` снят, `robots.txt` указывает sitemap.
- Процесс упрощён (2026-10): документы перенесены в `docs/archive/`, вместо них —
  `docs/product.md`, `architecture.md`, `decisions.md`, `ops.md` и `ROADMAP.md`; фреймворк из 14
  гейтов заменён тестами инвариантов; четыре workflow — одним `ci.yml` с автодеплоем `main`.

### Удалено

- Docker-образ, cosign/SBOM, Umami на VPS, Lighthouse CI, size-limit, Vitest browser mode,
  обвязка `claude-flow-v2` и проектные скиллы.

## Э-0 (2026-09)

Каркас Astro 7.3.1, oxlint, Prettier, Vitest, Playwright; заголовки ответа; деплой заглушки
на `dokey.ru` через wrangler; LICENSE Apache-2.0, NOTICE, CONTRIBUTING, SECURITY.
