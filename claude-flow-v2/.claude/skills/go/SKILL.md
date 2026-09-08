---
name: go
description: Pipeline orchestrator - detect the current stage from artifacts and drive the next step (both entry modes)
disable-model-invocation: true
---
# Go

Detect the stage by checking artifacts IN ORDER. Name the stage
and why, confirm with the user, then run that stage's skill.
One stage per /go. Never skip the confirmation.

 1. docs/ has methodology files (docs/prd.md or any of the 25)
    but no docs/INVENTORY.md          -> /adopt   (docs brought in)
 2. docs/prd.md missing              -> /discovery (tiny? /spec)
 3. product has a UI, docs/design-plan.md missing,
    no docs/design-skipped.md        -> /design (or skip -> marker)
 4. docs/architecture.md missing AND SPEC.md missing
                                     -> /tech (lite: /spec)
 5. docs/tasks.md missing            -> /delivery tasks
 6. CLAUDE.md missing                -> /delivery claude
 7. no source code yet               -> /scaffold
 8. code exists, CLAUDE.md never audited (no /rules line in
    docs/INVENTORY.md)               -> /rules
 9. docs/open-questions.md has open P1 (or P2 once coding has
    started)                         -> /questions — resolve first
10. a plan in docs/plans/ has unchecked steps -> /build (resume)
11. a plan fully checked, not in done/ -> /check, then /ship
12. top unchecked T-NNN in docs/tasks.md -> /plan T-NNN
13. no unchecked tasks               -> /plan refill (next US from
    docs/backlog.md); backlog empty -> roadmap progress, ask

Several active plans? Ask which one before step 10.
