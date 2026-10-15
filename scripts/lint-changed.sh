#!/bin/sh
# Хук PostToolUse (Edit|Write): Prettier и oxlint по одному изменённому файлу.
# Claude Code передаёт событие JSON-ом на stdin; путь — в tool_input.file_path.
# Ошибки линта возвращаются агенту через exit 2, формат исправляется молча.
set -eu

path=$(jq -r '.tool_input.file_path // empty')
[ -n "$path" ] && [ -f "$path" ] || exit 0

case "$path" in
  *.ts | *.js | *.mjs | *.astro | *.json | *.md | *.css | *.yml | *.yaml) ;;
  *) exit 0 ;;
esac
case "$path" in */docs/archive/*) exit 0 ;; esac

pnpm exec prettier --write --log-level warn "$path" >/dev/null 2>&1 || true

case "$path" in
  *.ts | *.js | *.mjs | *.astro)
    if ! out=$(pnpm exec oxlint --quiet "$path" 2>&1); then
      echo "$out" >&2
      exit 2
    fi
    ;;
esac
