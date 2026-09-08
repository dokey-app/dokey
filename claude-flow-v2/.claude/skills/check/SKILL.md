---
name: check
description: Fresh-context verification of the implementation against the plan, the story and the contracts
disable-model-invocation: true
---
# Check

Resolve the active plan (same rules as /build). Launch a
fresh-context subagent that sees only the diff, the plan and the
linked US, and have it verify:
1. every step's requirement is actually implemented
2. every Given/When/Then of the linked US has a test
3. nothing outside the plan's scope changed
4. build, tests, lint, typecheck pass — with real output
5. leftovers: TODOs, debug prints, undocumented env vars

Also run:
- contract-reviewer agent — if the diff touches models, API,
  events or user-facing text (names vs glossary, api-spec,
  analytics-spec)
- security-reviewer agent — if it touches auth, input parsing
  or data handling

Report only gaps that affect correctness, the plan or the
contracts, not style. Verdict: PASS, or a gap list with a route
per gap: /build (unfinished step), /fix (bug), /questions
(needs a decision).
