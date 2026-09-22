# T-239 — путь ЭП-06: `/_astro/*` и `/fonts/*` вместо `/assets/`

## Request
- [ ] T-239 — привести путь ЭП-06 к факту: api-spec §4.6 и `openapi.yaml` называют хешированные ассеты `/assets/{name}.{hash}.{ext}`, а сборка Astro и оба файла заголовков отдают их из `/_astro/*` (найдено в /check T-234 2026-09-22): границы — `docs/api-spec.md`, `docs/openapi.yaml` (перегенерация, не правка руками); готово — ни api-spec, ни `openapi.yaml` не содержат `/assets/`, путь ЭП-06 совпадает с правилом `infra/headers/_headers`
Links: api-spec §4.0, §4.6 ЭП-06 · D-181 · D-107 · T-234 · **⚠ Q-246**

## Context
- Docs read: api-spec §4.0 (строка ЭП-06, стр. 400) и §4.6 (стр. 652–669, абзац про шрифт по
  D-181); `docs/openapi.yaml` (операция `getAsset` на `/assets/{assetFile}`, стр. 236–275);
  `infra/headers/_headers` (правила `/_astro/*` и `/fonts/*` — длинный TTL и `immutable`);
  `infra/docker/nginx.conf` (`map $uri`: `~^/_astro/` и `~^/fonts/`); `astro.config.mjs`
  (`build.assets` не задан — каталог по умолчанию `_astro`); `dist/_astro/Base.irFayD0l.css` —
  факт формы имени `{name}.{hash}.{ext}`; D-181 (шрифт — ассет ЭП-06, путь `/fonts/...`);
  план T-234; LESSONS (правка markdown скриптом съедает пустые строки).
- `/assets/` в `docs/` встречается только в api-spec (стр. 400, 652) и `openapi.yaml` (стр. 236);
  architecture, data-model, test-plan его не содержат — правок вне границ нет.
- Генератора `openapi.yaml` в репозитории нет: ни скрипта в `scripts/`, ни цели в `package.json`,
  ни описанной процедуры. `.claude/settings.json` запрещает `Edit`/`Write` файла; прошлые правки
  (997b99b, f6a9653) внесены точечно в обход запрета, а D-91, D-93, D-163, D-164 отложены
  фразой «подхватит при генерации», которая так и не случилась: в файле нет `/robots.txt`
  (ЭП-12), а упразднённый `/s/script.js` (ЭП-08) стоит.
- Decisions applied: D-181 п. 1 — `/fonts/*` входит в ЭП-06; новое решение нужно одно — **Q-246**
  (что значит «перегенерация» `openapi.yaml` без генератора). Задача помечена `⚠ Q-246`.

## Approach
Путь ЭП-06 — **два префикса, как в `_headers`**: `/_astro/{name}.{hash}.{ext}` (чанки, стили,
спрайт — хеш ставит сборщик) и `/fonts/{семейство}-{начертание}.{hash}.woff2` (хеш пишет сабсеттер,
D-181). Хеш назван так, как его делает каждый источник, — «хеш сборки» в имени `_astro` верен,
для шрифта уже записан D-181. В api-spec правятся строка сводки §4.0 и заголовок операции §4.6;
абзац про шрифт остаётся, меняется только ссылка на то, что это второй путь той же точки.
`openapi.yaml` — по ответу на Q-246; при варианте «точечная перегенерация операции» ЭП-06 становится
двумя path item (`/_astro/{assetFile}`, `/fonts/{fontFile}`), оба с `x-dokey-endpoint: [ЭП-06]`,
по образцу сведения ЭП-01/ЭП-02 в одну операцию, только в обратную сторону.
Rejected:
- один путь `/_astro/*`, шрифты за скобками — противоречит D-181 п. 1 и правилу `/fonts/*` в `_headers`;
- перенести ассеты в `/assets/` настройкой `build.assets` — меняет две копии политики заголовков
  и прод ради совпадения с документом; факт прав, документ нет;
- писать `scripts/gen-openapi.ts` внутри T-239 — это решение Q-246, а не шаг задачи, и
  api-spec — проза, из которой описания операций механически не выводятся;
- поправить `openapi.yaml` скриптом в обход `deny` — ровно то, что графа «границы» запрещает
  («не правка руками»), и запрет в `settings.json` — ограничение пользователя, не агента.

## Out of scope
- Остальной дрейф `openapi.yaml` (ЭП-08 после D-93, ЭП-12 по D-164, корень по D-91, профиль
  ЭП-03 по D-163) — предмет Q-246 и задачи, которую заведёт ответ.
- Генератор `openapi.yaml`, снятие запрета в `.claude/settings.json` — только решением PO.
- Строка tasks.md 514 «задач с пометкой ⚠ Q-NN не осталось» — сводка этапа, обновляется при
  закрытии Q-246.
- `infra/headers/*`, `infra/docker/nginx.conf`, `astro.config.mjs` — факт верен, не меняется.

## Steps
- [ ] Путь ЭП-06 в api-spec: files `docs/api-spec.md` (§4.0 строка ЭП-06, §4.6 заголовок
  операции и строка «Назначение» — чанк, стиль, спрайт в `/_astro/`, шрифт в `/fonts/`), правка
  инструментом Edit, не `sed`; verify: `grep -n "/assets/" docs/api-spec.md` пусто;
  `grep -n "/_astro/\|/fonts/" docs/api-spec.md` находит сводку и §4.6; `pnpm test:unit -t
  "структура документов"` зелёный
- [ ] `openapi.yaml` по ответу Q-246: files `docs/openapi.yaml` — способом, который назовёт
  решение (D-NN); verify: `grep -n "/assets/" docs/openapi.yaml` пусто; path item ЭП-06
  совпадают с `/_astro/*` и `/fonts/*` `infra/headers/_headers`;
  `pnpm dlx @redocly/cli lint docs/openapi.yaml` без ошибок (валидатор, которым ставился
  `info.license`, D-122)
- [ ] Приёмка: files `docs/tasks.md` (снять `⚠ Q-246`, `- [x]`, строка журнала); verify:
  чек-лист `.github/pull_request_template.md` целиком (`pnpm lint`, `format:check`, `typecheck`,
  `test:unit`), команда графы «готово»: `grep -rn "/assets/" docs/api-spec.md docs/openapi.yaml`
  пусто

## Done when
- `grep -rn "/assets/" docs/api-spec.md docs/openapi.yaml` ничего не находит.
- Путь ЭП-06 в api-spec §4.0, §4.6 и в `openapi.yaml` — `/_astro/…` и `/fonts/…`, то есть ровно
  правила `/_astro/*` и `/fonts/*` из `infra/headers/_headers` (и `map` в `nginx.conf`).
- `openapi.yaml` изменён способом, который назначил ответ на Q-246, а не правкой в обход запрета.
- `pnpm test:unit`, `lint`, `format:check`, `typecheck` зелёные.
