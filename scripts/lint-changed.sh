#!/bin/sh
# Хук PostToolUse: формат и линт только по тронутым файлам (ADR-16).
# Прогон по всему репозиторию стоил бы секунды на каждой правке — здесь важна дешевизна,
# а полную сверку всё равно делает `pnpm lint && pnpm format:check` перед коммитом.
set -eu

paths="${1:-}"
[ -z "$paths" ] && exit 0

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
