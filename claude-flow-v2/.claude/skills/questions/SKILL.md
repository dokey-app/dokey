---
name: questions
description: Manage docs/open-questions.md - list, add, resolve; open P1 questions block planning
disable-model-invocation: true
---
# Questions: $ARGUMENTS

Registry: docs/open-questions.md — one row per question:
| Q-NN | question | source (doc, stage) | priority | status | owner | resolution |
Priority: P1 blocks the next track, P2 blocks development,
P3 decided by data after launch.

No arguments -> list open questions grouped by priority, oldest
first; say which P1/P2 block /plan right now.

"add <text>" -> next Q-NN, ask for source and priority if not
obvious, append the row.

"resolve Q-NN <decision>" -> write the decision INTO the document
the question came from (prd, tech-stack, ...) as a real change,
then set status=resolved and put a link to that document in the
resolution column. The registry keeps the history; the decision
lives in one place only.

Rules: a question is one testable sentence; every open row has an
owner; never delete rows.
