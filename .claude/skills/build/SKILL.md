---
name: build
description: Execute the approved plan step by step, resumable, one step = one commit
disable-model-invocation: true
---

# Build

Resolve the plan: $ARGUMENTS if given, otherwise the single
active file in docs/plans/ (several? ask which).

Execute steps strictly in order from the FIRST UNCHECKED one
(this makes /build resumable after /clear):

- implement + tests for the step's edge cases; acceptance
  criteria from "Done when" become tests, not comments
- run the step's verification + typecheck; iterate to green
- tick the checkbox in the plan file
- commit: conventional message + "T-NNN US-NNN" in the body;
  one step = one commit

Scope discipline: only what the plan says. A good idea outside
the plan -> its "Out of scope" section or a new T-NNN line in
tasks.md, never into code. An unrelated bug on the way? Stop and
suggest /fix. Code that must deviate from api-spec / data-model?
Stop, explain, and ask — the doc changes in the same PR or not
at all.

Finish by running "Done when" and showing the evidence.
