#!/bin/sh
# Хук PostToolUse: формат и линт только по тронутым файлам (ADR-16).
# Прогон по всему репозиторию стоил бы секунды на каждой правке — здесь важна дешевизна,
# а полную сверку всё равно делает `pnpm lint && pnpm format:check` перед коммитом.
set -eu

paths="${1:-}"
[ -z "$paths" ] && exit 0

# Политика заголовков живёт в двух копиях, и `pnpm gates` их не сверяет: сверка идёт
# отдельной командой (run-all.ts, ST-03, Q-158). Правка одной копии обязана сойтись со
# второй сразу, иначе расхождение доживает до релиза. Проверка стоит до отбора по
# расширениям: ни `_headers`, ни `nginx.conf` в него не попадают.
case " $paths " in
  *infra/headers/* | *infra/docker/nginx.conf*)
    if ! parity=$(pnpm gate:headers-parity 2>&1); then
      echo "$parity" >&2
      exit 2
    fi
    ;;
esac

# Файлы, которые Prettier и oxlint у нас разбирают. Остальное пропускаем молча.
targets=""
for path in $paths; do
  case "$path" in
    *.ts | *.tsx | *.js | *.mjs | *.astro | *.json | *.md | *.css)
      [ -f "$path" ] && targets="$targets $path"
      ;;
  esac
done
[ -z "$targets" ] && exit 0

# shellcheck disable=SC2086
pnpm exec prettier --write --log-level warn $targets || true
# shellcheck disable=SC2086
pnpm exec oxlint --quiet $targets || true

# Скрипты и гейты исполняет `node --experimental-strip-types`. Относительный импорт без
# расширения tsc пропускает (moduleResolution: bundler), а рантайм файла не находит — и
# узнаётся это на прогоне в CI, а не здесь. Поэтому здесь.
code=""
for path in $targets; do
  case "$path" in *.ts | *.astro) code="$code $path" ;; esac
done
if [ -n "$code" ]; then
  # shellcheck disable=SC2086
  bare=$(grep -nE "from [\"']\.\.?/[^\"']*[\"']" $code | grep -vE "\.(ts|astro|json|css|svg)[\"']" || true)
  if [ -n "$bare" ]; then
    echo "Относительный импорт без расширения — node --experimental-strip-types его не найдёт:" >&2
    echo "$bare" >&2
    exit 2
  fi
fi
