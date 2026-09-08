---
name: rules
description: Audit codebase conventions and lessons, distill them into CLAUDE.md rules, hooks or permissions
disable-model-invocation: true
---

# Rules

Audit the codebase for ACTUAL conventions: naming, layout, error
handling, test patterns, imports. Subagents for large codebases.
Cross-check names against docs/glossary.md — drift in
entity names is a rule candidate.

Propose changes to CLAUDE.md:

- add only rules Claude would otherwise get wrong
- drop rules the codebase already enforces by tooling
- for each MUST rule suggest hook or permission instead of prose
  (deterministic > advisory); openapi.yaml and .env are already
  protected by permissions — keep them out of prose

Read docs/LESSONS.md: promote recurring lessons into rules or
hooks, then delete the absorbed lines.

Show the diff of CLAUDE.md and wait for approval. After applying,
append "- <date> /rules: CLAUDE.md audited" to docs/INVENTORY.md. Never let
CLAUDE.md grow past ~40 lines — propose cuts to make room.
