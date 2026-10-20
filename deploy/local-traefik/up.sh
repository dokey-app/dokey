#!/usr/bin/env bash
# Builds DoKey and serves it behind the shared Traefik of the dev machine.
#   deploy/local-traefik/up.sh          build, start, install the route, check
#   deploy/local-traefik/up.sh check    only check
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$ROOT/deploy/local-traefik"
TRAEFIK_DYNAMIC="${TRAEFIK_DYNAMIC:-/srv/dev/stacks/traefik/dynamic}"
EDGE="http://127.0.0.1:18080"
HOST="dokey.localhost"
PUBLIC="http://$HOST:18080"

log() { printf '[%s] [dokey] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

if docker info >/dev/null 2>&1; then DOCKER=(docker); else DOCKER=(sudo docker); fi
compose() { "${DOCKER[@]}" compose -f "$HERE/compose.yml" "$@"; }

wait_http() { # path, expected code
  local code=""
  for _ in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $HOST" "$EDGE$1" || true)"
    [[ "$code" == "$2" ]] && { log "ok {path: $1, code: $code}"; return 0; }
    sleep 1
  done
  log "FAIL {path: $1, want: $2, got: $code}"; return 1
}

header() { # path, header name → value
  curl -s -D - -o /dev/null -H "Host: $HOST" "$EDGE$1" | tr -d '\r' \
    | awk -v h="$(tr '[:upper:]' '[:lower:]' <<<"$2")" -F': ' 'tolower($1)==h {print $2}'
}

check() {
  local rc=0 page csp want asset
  wait_http / 200 || rc=1
  for page in "$ROOT"/dist/*.html; do
    page="$(basename "$page" .html)"
    [[ "$page" == index || "$page" == 404 ]] && continue
    wait_http "/$page" 200 || rc=1
  done
  wait_http /jwt/ 200 || rc=1
  wait_http /no-such-page 404 || rc=1
  wait_http /sitemap.xml 200 || rc=1
  # The promise of the product: the served CSP is exactly the one in public/_headers.
  want="$(sed -n 's/^  Content-Security-Policy: //p' "$ROOT/public/_headers")"
  csp="$(header / Content-Security-Policy)"
  if [[ "$csp" == "$want" ]]; then log "ok {csp: matches public/_headers}"
  else log "FAIL {csp: '$csp'}"; rc=1; fi
  asset="$(cd "$ROOT/dist" && ls _astro/*.css | head -1)"
  [[ "$(header "/$asset" Cache-Control)" == *immutable* ]] \
    && log "ok {cache: /$asset immutable}" || { log "FAIL {cache: /$asset}"; rc=1; }
  return $rc
}

[[ "${1:-up}" == check ]] && { check; exit $?; }

"${DOCKER[@]}" network inspect dev-proxy >/dev/null 2>&1 \
  || die "сеть dev-proxy не найдена — общий Traefik (/srv/dev/stacks/traefik) не поднят"

log "build start"
(cd "$ROOT" && pnpm build >/dev/null)
rm -rf "$HERE/dist" && cp -r "$ROOT/dist" "$HERE/dist"

# public/_headers (block `/*`) → nginx add_header. Cache-Control comes from the map in nginx.conf.
awk '
  /^\/\*$/ { inblock = 1; next }
  /^[^ ]/  { inblock = 0 }
  inblock && /^  [A-Za-z-]+: / {
    name = $1; sub(/:$/, "", name)
    if (name == "Cache-Control") next
    value = $0; sub(/^  [A-Za-z-]+: /, "", value)
    printf "add_header %s \"%s\" always;\n", name, value
  }
' "$ROOT/public/_headers" > "$HERE/headers.conf"
[[ -s "$HERE/headers.conf" ]] || die "в public/_headers нет блока /*"
log "headers {from: public/_headers, count: $(wc -l < "$HERE/headers.conf")}"

compose build
compose up -d
# Atomic: Traefik's watcher may read the file between create and chmod of `install`.
install -m 644 "$HERE/traefik-dokey.yaml" "$TRAEFIK_DYNAMIC/.dokey.yaml.tmp"
mv -f "$TRAEFIK_DYNAMIC/.dokey.yaml.tmp" "$TRAEFIK_DYNAMIC/dokey.yaml"
log "traefik route installed {file: $TRAEFIK_DYNAMIC/dokey.yaml}"

check && log "сайт поднят: $PUBLIC (с ноутбука — проброс порта 18080)" \
      || die "проверка не прошла — docker logs dokey-web"
