---
name: plan
description: Research a task from tasks.md and write a persistent, resumable plan with per-step verification
disable-model-invocation: true
---

# Plan: $ARGUMENTS

Resolve the task:

- "T-NNN" -> that line of docs/tasks.md
- no argument -> the TOP unchecked T-NNN (say which you took)
- "refill" -> tasks.md has no unchecked tasks: take the next
  unchecked US(s) from docs/backlog.md (next epic in
  implementation-plan order), decompose into T-NNN lines by the
  size rule in tasks.md, append them, show, STOP.
- free text -> an ad-hoc task: add it to tasks.md as T-NNN
  first (with "US: none — ad hoc"), then plan it.

Blocked? If the task's US/REQ has an open P1/P2 in
docs/open-questions.md — STOP and point to /questions.

1. RESEARCH. Read the docs the task points to: its US acceptance
   criteria, REQ, FL steps, SCR, api-spec endpoints, data-model
   entities. Then the relevant code (subagents for anything big).
   A decision you cannot make -> add Q-NN via /questions rules and
   STOP; never guess silently.
2. DEPTH. Say which you chose:
   - FAST — the diff fits one sentence: propose inline, no plan
     file, offer to go straight to /build.
   - FULL — write docs/plans/T-NNN-<slug>.md from
     templates/docs/plans/PLAN.template.md:
     Request (task line verbatim + links), Context (docs read,
     Q-NN applied), Approach (+ rejected alternatives, 1 line
     each), Out of scope, Steps (ordered [ ] each naming files and
     its own verification command; one step = one commit), Done
     when (US acceptance criteria as tests + end-to-end check).
     Plan does not fit one screen or touches > 5-7 files? Split the
     task: edit tasks.md, say so, plan the first part.
3. STOP. Wait for the user to approve or edit the plan file.
   Recommend /clear before /build — the plan carries everything
   the next session needs.
