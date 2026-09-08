---
name: docs
description: Sync docs/ with the code and check the cross-document invariants
disable-model-invocation: true
---
# Docs

1. STALE. Compare docs/ and README.md against the code: list what
   is stale, missing, or contradicted. Setup instructions are
   verified by RUNNING them in a clean shell and pasting output.
2. INVARIANTS. Check and report, honestly, without patching:
   - entity names in code == English names in glossary.md
   - endpoints in code == api-spec.md; openapi.yaml regenerated
     from api-spec (never edited by hand)
   - analytics events in code == EVT-NN in analytics-spec.md
   - every NFR-NN has a test in test-plan.md and in the suite
   - every US ticked in backlog.md has all its T tasks ticked
3. Propose the minimal update set; wait for approval; apply.
   Tick milestones in docs/roadmap.md.

Never document aspirations as facts. A doc without a plausible
reader is proposed for deletion, not updated.
