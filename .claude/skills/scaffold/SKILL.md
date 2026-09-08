---
name: scaffold
description: Execute stage 0 - skeleton from docs/tech (or SPEC.md), CI, verification, first commit
disable-model-invocation: true
---

# Scaffold — stage 0

Read docs/implementation-plan.md (stage 0) and
docs/tech-stack.md + architecture.md; on the lite path read
SPEC.md. Build exactly the skeleton they describe: repo layout
from architecture, dependencies pinned to the ADR versions,
lint/typecheck/test wired, CI workflow, .env.example (never .env).

Non-negotiable verification — show real output of each:

1. install, build, lint, typecheck, test all pass
2. services (db, api) start and a health endpoint answers
3. fix until green
4. git init if needed; conventional first commit
5. replace the lint placeholder hook in .claude/settings.json
   with the real linter command

Then tick the stage-0 tasks in docs/tasks.md, append a log
line, and remind: /rules (tighten CLAUDE.md from the real code),
then /clear and /go.
