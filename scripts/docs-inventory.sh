#!/bin/sh
# Deterministic inventory of the 25-document methodology in docs/.
# Prints one line per track: present files, [missing] files, and a
# verdict. Used by the SessionStart hook, /adopt and /status.
# Exit 0 always — this script reports, it never decides.
D=${1:-docs}
[ -d "$D" ] || { echo "no $D/ — start with /discovery (or /adopt after copying docs)"; exit 0; }

track() { # name, files...
  name=$1; shift; have=""; miss=""; n=0; m=0
  for f in "$@"; do
    n=$((n+1))
    if [ -e "$D/$f" ]; then have="$have $f"; else miss="$miss [$f]"; m=$((m+1)); fi
  done
  if [ $m -eq 0 ]; then v="complete"; elif [ $m -eq $n ]; then v="MISSING"; else v="partial ($((n-m))/$n)"; fi
  echo "$name: $v$miss"
}

track "A discovery" research.md vision.md brd.md prd.md glossary.md user-flows.md user-stories.md backlog.md roadmap.md
if [ -f "$D/design-skipped.md" ]; then echo "B design: skipped (docs/design-skipped.md)"
else track "B design   " design-plan.md content-guide.md screen-map.md design-system-prompt.md component-library-prompt.md screens-prompt.md; fi
track "C tech     " data-model.md tech-stack.md architecture.md api-spec.md openapi.yaml security-and-access.md analytics-spec.md
track "D delivery " test-plan.md implementation-plan.md tasks.md agent-rules.md launch-checklist.md
[ -f SPEC.md ] && echo "lite: SPEC.md present"
[ -f "$D/open-questions.md" ] && echo "registry: open-questions.md present" || echo "registry: [open-questions.md]"
[ -f CLAUDE.md ] && echo "CLAUDE.md: present" || echo "CLAUDE.md: [missing]"
