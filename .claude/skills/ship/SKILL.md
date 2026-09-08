---
name: ship
description: Final gate - check, commit, push, PR, docs, tick tasks/backlog, archive the plan
disable-model-invocation: true
---

# Ship

1. GATE. If /check has not passed in this session — run it now.
   Real gaps get fixed before anything ships.
2. COMMIT & PR. Conventional commit for anything uncommitted,
   push the branch, open a PR via gh: title with T-NNN, body with
   US-NNN link, approach, changes, how to verify (commands +
   expected output). The human merges; never merge yourself.
3. DOCS, while context is warm: if code deviated from api-spec /
   data-model / architecture — update the doc in this PR
   (regenerate openapi.yaml from api-spec). ADR if a decision
   was made. Concise.
4. TICK. In docs/tasks.md: [x] the T-NNN and append a log
   line "- YYYY-MM-DD T-NNN <commit> — one line". If every task
   of the US is done: [x] the US in docs/backlog.md;
   milestone done -> tick in roadmap.md.
5. ARCHIVE. Move the plan file to docs/plans/done/.
6. Remind: /clear, then /go.
