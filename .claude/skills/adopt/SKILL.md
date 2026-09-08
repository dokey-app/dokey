---
name: adopt
description: Entry point when docs/ already contains the methodology documents - inventory, audit, bridge into the dev loop
disable-model-invocation: true
---

# Adopt existing documentation

Use when the document set (all 25 or a part) was produced outside
this repo — in Chat, Cowork or another repo — and now lives in
docs/. Nothing is rewritten here; existing files are the source.

1. INVENTORY. Run `sh scripts/docs-inventory.sh docs` and show
   it. If files sit in subfolders (docs/discovery/… etc.) or use
   other names, propose `git mv` into the flat layout the
   methodology uses (docs/<name>.md, docs/screens/, docs/plans/)
   and wait for approval before moving.
2. AUDIT (report, never patch silently):
   - every doc has the header: status / version / "Опирается на" /
     Q-NN links; docs referring to open questions in their own
     tail instead of docs/open-questions.md -> list them
   - ID formats: REQ-MOD-NN, NFR-NN, ENT-NN, ROLE-NN, FL-NN,
     EP-NN, US-NNN, SCR-NN, ADR-NN, EVT-NN, Q-NN, T-NNN
   - invariants, by grep: US↔REQ matrix in backlog.md; FL↔SCR
     table in screen-map.md; every M-NN of brd.md appears in
     analytics-spec.md; every NFR-NN of prd.md appears in
     test-plan.md; every ROLE-NN of glossary.md appears in the
     matrix of security-and-access.md; openapi.yaml consistent
     with api-spec.md
   - open-questions.md: open P1/P2 with their sources
     Write the result to docs/INVENTORY.md (date, layout, per-track
     presence, gaps). Real gaps -> Q-NN in open-questions.md with
     source "adopt".
3. BRIDGE.
   - docs/tasks.md missing -> `/delivery tasks`
   - CLAUDE.md missing -> `/delivery claude` (built from
     docs/agent-rules.md; agent-rules.md then gets a top line
     "> Живёт в /CLAUDE.md с <date>; здесь — исходный черновик")
   - a whole track missing -> name the command (/design, /tech,
     /delivery); the user may also bring the files later
4. END with the next step: "/scaffold" if there is no code yet,
   "/rules" if there is code but no CLAUDE.md audit, else "/go".
