---
name: fix
description: Regression-first bug fixing that leaves a lesson behind
disable-model-invocation: true
---

# Fix: $ARGUMENTS

1. REPRODUCE. Investigate, then write a FAILING test that
   reproduces the bug. Can't reproduce? Say so, investigate
   deeper, ask for missing context — never touch code blind.
2. FIX. Make the failing test pass without breaking the suite.
   Show before/after test output. Only the bug: anything else
   found on the way -> a T-NNN line in tasks.md.
3. LEARN. Append one line to docs/LESSONS.md:
   - <symptom> -> <root cause> -> <prevention>
     (/rules distills recurring lessons into CLAUDE.md rules or
     hooks, then removes the absorbed lines.)
4. If the bug was a contract violation (name, endpoint, event
   differs from the docs) — say which doc; /docs will check the
   invariant.
