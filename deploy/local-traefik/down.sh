#!/usr/bin/env bash
# Stops the local preview and removes its route from the shared Traefik.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TRAEFIK_DYNAMIC="${TRAEFIK_DYNAMIC:-/srv/dev/stacks/traefik/dynamic}"
if docker info >/dev/null 2>&1; then DOCKER=(docker); else DOCKER=(sudo docker); fi

rm -f "$TRAEFIK_DYNAMIC/dokey.yaml"
echo "[dokey] traefik route removed {file: $TRAEFIK_DYNAMIC/dokey.yaml}"
"${DOCKER[@]}" compose -f "$ROOT/deploy/local-traefik/compose.yml" down --remove-orphans
