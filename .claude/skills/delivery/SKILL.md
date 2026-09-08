---
name: delivery
description: Track D (docs 22-25) - test plan, implementation plan, tasks.md queue (T-NNN), CLAUDE.md, launch checklist; idempotent
disable-model-invocation: true
---

# Delivery — Track D: $ARGUMENTS

Requires track C (docs/architecture.md) or SPEC.md on the lite
path. IDEMPOTENT: existing files are never overwritten — say what
was skipped. Arguments narrow the scope: `tasks`, `claude`,
`tests`, `plan`, `launch`; none = everything missing.

1. docs/test-plan.md — levels, critical paths from FL, a table
   NFR-NN → how verified (every NFR needs one), test data without
   prod PII, acceptance
2. docs/implementation-plan.md — stage 0 (skeleton, CI/CD,
   hello-world on prod), then epics as vertical slices; each stage
   ends with something demonstrable; honest estimate vs roadmap
3. docs/tasks.md — THE AGENT QUEUE (template:
   templates/tasks.md.template). Decompose every US of
   docs/backlog.md — stage 0 and the first epic at least — into:
   - [ ] T-001 — what (US-014) | scope: files/modules | done: cmd
         Size rule: one task = one plan = one session; its plan fits on
         one screen, touches <= 5-7 files, has a binary "done" command,
         needs no human decision mid-way (else create Q-NN first).
         Order follows the implementation stages; name blockers.
         If tasks.md exists but has no T- lines, convert its items.
4. CLAUDE.md — document 24. Source, in this order: existing
   docs/agent-rules.md (trim to <= 40 lines, keep only what every
   session needs), else templates/CLAUDE.md.template filled from
   tech-stack, architecture, glossary, implementation-plan.
   Then put at the top of docs/agent-rules.md:
   "> Живёт в /CLAUDE.md с <date>; здесь — исходный черновик."
5. docs/launch-checklist.md — binary items only, grouped product /
   tech / analytics / legal / support / kill-switches, each with
   an owner.

Show CLAUDE.md and tasks.md, wait for approval. End:
"next -> /scaffold (stage 0)" if no code, else "/rules".
