#!/bin/sh
# SessionStart hook: prints the pipeline state into the context of
# every new session (stdout of a SessionStart hook is injected).
[ -d docs ] || { echo "=== Pipeline state: empty project — /go to start ==="; exit 0; }
cnt() { c=$(grep -c "$1" "$2" 2>/dev/null); echo "${c:-0}"; }
echo "=== Pipeline state ==="
sh "$(dirname "$0")/docs-inventory.sh" docs | grep -v '^registry\|^CLAUDE'

if [ -f docs/open-questions.md ]; then
  p1=$(cnt '| P1 *| open' docs/open-questions.md)
  p2=$(cnt '| P2 *| open' docs/open-questions.md)
  p3=$(cnt '| P3 *| open' docs/open-questions.md)
  echo "open questions: P1=$p1 P2=$p2 P3=$p3"
  [ "$p1" -gt 0 ] && grep '| P1 *| open' docs/open-questions.md | head -3 | cut -c1-120
fi

if [ -f docs/tasks.md ]; then
  echo "tasks: $(cnt '^- \[x\] T-' docs/tasks.md)/$(cnt '^- \[[ x]\] T-' docs/tasks.md) done; next:"
  grep '^- \[ \] T-' docs/tasks.md | head -3 | cut -c1-120
fi

for p in docs/plans/T-*.md; do
  [ -f "$p" ] || continue
  echo "active plan: $p ($(cnt '^- \[x\]' "$p")/$(cnt '^- \[' "$p") steps)"
done

[ -f docs/LESSONS.md ] && echo "lessons pending: $(cnt '^-' docs/LESSONS.md)"
[ -f CLAUDE.md ] || echo "CLAUDE.md missing -> /adopt (docs ready) or /delivery"
echo "hint: /status for details, /go to continue"
