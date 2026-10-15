# Изменения

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версии — [SemVer](https://semver.org/lang/ru/).

## [Не выпущено]

### Изменено

- Процесс упрощён: документы перенесены в `docs/archive/`, вместо них — `docs/product.md`,
  `architecture.md`, `decisions.md`, `ops.md` и `ROADMAP.md`.
- Фреймворк из 14 гейтов заменён тестами трёх инвариантов (`tests/e2e/invariants.spec.ts`,
  `tests/e2e/build.spec.ts`); четыре workflow — одним `ci.yml` с автодеплоем `main`.
- `_headers` перенесён в `public/`.

### Удалено

- Docker-образ, cosign/SBOM, Umami на VPS, Lighthouse CI, size-limit, Vitest browser mode,
  обвязка `claude-flow-v2` и проектные скиллы.

## Э-0 (2026-09)

Каркас Astro 7.3.1, oxlint, Prettier, Vitest, Playwright; заголовки ответа; деплой заглушки
на `dokey.ru` через wrangler; LICENSE Apache-2.0, NOTICE, CONTRIBUTING, SECURITY.
