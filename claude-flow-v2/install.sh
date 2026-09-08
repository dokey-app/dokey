#!/bin/sh
# Usage: sh install.sh /path/to/project
#   empty folder            -> from-zero mode (/go starts with /discovery)
#   folder with docs/ ready -> adopt mode   (/go starts with /adopt)
set -e
cpn() { [ -e "$2" ] || cp "$1" "$2"; }   # copy if missing, never overwrite
KIT=$(cd "$(dirname "$0")" && pwd)
DST=${1:?target project path}
mkdir -p "$DST"
cp -r "$KIT/.claude" "$DST/"
cp -r "$KIT/scripts" "$DST/"
mkdir -p "$DST/docs/plans/done" "$DST/templates"
cpn "$KIT/templates/docs/README.md"              "$DST/docs/README.md"
cpn "$KIT/templates/docs/open-questions.md"      "$DST/docs/open-questions.md"
cpn "$KIT/templates/docs/LESSONS.md"             "$DST/docs/LESSONS.md"
cpn "$KIT/templates/docs/plans/PLAN.template.md" "$DST/docs/plans/PLAN.template.md"
cpn "$KIT/templates/CLAUDE.md.template"          "$DST/templates/CLAUDE.md.template"
cpn "$KIT/templates/docs/tasks.md"               "$DST/templates/tasks.md.template"
cpn "$KIT/PROMPTS.md"                            "$DST/PROMPTS.md"
chmod +x "$DST"/scripts/*.sh
cd "$DST" && { [ -d .git ] || git init -q; }
echo "installed into $DST"
sh "$DST/scripts/docs-inventory.sh" "$DST/docs" | sed 's/^/  /'
if [ -f "$DST/docs/prd.md" ]; then
  echo "mode: docs found -> cd $DST && claude, then /adopt"
else
  echo "mode: empty -> cd $DST && claude, then /discovery (or just /go)"
fi
echo "tip: copy your product-discovery-docs skill into $DST/.claude/skills/ for tracks A-D"
