---
name: spec
description: Lite path - interview and produce a self-contained SPEC.md for a small project or one large feature
disable-model-invocation: true
---
# Spec (lite path / large feature)

Use instead of /tech for a small project, or for a large feature
inside an existing project. If docs/prd.md exists, read
it first and ask only about the "how".

Interview with AskUserQuestion: technical approach, UI/UX, edge
cases, tradeoffs, deployment target. No obvious questions.
Write SPEC.md (or docs/specs/<feature>.md for a feature):
- names concrete files and interfaces
- names entities exactly as docs/glossary.md if present
- explicit OUT of scope
- ends with an end-to-end check proving it works

Decisions you could not make -> docs/open-questions.md as Q-NN.
When done, tell the user to /clear before the next step.
