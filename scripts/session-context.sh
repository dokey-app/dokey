#!/bin/sh
# SessionStart hook: prints the pipeline state into the context of
# every new session (stdout of a SessionStart hook is injected).
[ -d docs ] || { echo "=== Pipeline state: empty project — /go to start ==="; exit 0; }
cnt() { c=$(grep -c "$1" "$2" 2>/dev/null); echo "${c:-0}"; }
echo "=== Pipeline state ==="
sh "$(dirname "$0")/docs-inventory.sh" docs | grep -v '^registry\|^CLAUDE'

if [ -f docs/open-questions.md ]; then
  # Open and closed live in separate sections, so the section is the status —
  # there is no per-row "open" column. Priority is the last column, written P1
  # or **P1**; a row closed in place says "закрыт"/"closed" there instead and
  # is skipped, as are struck-through ~~Q-NN~~ ids.
  OQ=$(awk '/^## /{f=0} /^## (Открытые вопросы|Open questions)/{f=1;next} f' docs/open-questions.md)
  qrow() { printf '%s\n' "$OQ" | grep -E "^\|[[:space:]]*\*{0,2}Q-[0-9]+\*{0,2}[[:space:]]*\|.*\|[[:space:]]*\*{0,2}$1\*{0,2}[[:space:]]*\|[[:space:]]*$"; }
  p1=$(qrow P1 | wc -l); p2=$(qrow P2 | wc -l); p3=$(qrow P3 | wc -l)
  echo "open questions: P1=$p1 P2=$p2 P3=$p3"
  [ "$p1" -gt 0 ] && qrow P1 | head -3 | cut -c1-120
fi

if [ -f docs/tasks.md ]; then
  # Strip fenced blocks first: §0.1 carries a format example (T-042) that is
  # not a task and must not be counted or offered as "next".
  TM=$(awk '/^```/{f=!f;next} !f' docs/tasks.md)
  echo "tasks: $(printf '%s\n' "$TM" | grep -c '^- \[x\] T-')/$(printf '%s\n' "$TM" | grep -c '^- \[[ x]\] T-') done; next:"
  printf '%s\n' "$TM" | grep '^- \[ \] T-' | head -3 | cut -c1-120
fi

for p in docs/plans/T-*.md; do
  [ -f "$p" ] || continue
  echo "active plan: $p ($(cnt '^- \[x\]' "$p")/$(cnt '^- \[' "$p") steps)"
done

[ -f docs/LESSONS.md ] && echo "lessons pending: $(cnt '^-' docs/LESSONS.md)"
[ -f CLAUDE.md ] || echo "CLAUDE.md missing -> /adopt (docs ready) or /delivery"
echo "hint: /status for details, /go to continue"
