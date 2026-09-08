---
name: status
description: Read-only snapshot of the pipeline state
disable-model-invocation: true
---
# Status

Read-only. Run `sh scripts/docs-inventory.sh docs` and report
compactly:
- tracks A/B/C/D: complete / partial (missing files) / skipped;
  SPEC.md (lite path); docs/INVENTORY.md date if present
- docs/open-questions.md: open P1 / P2 / P3 counts; list P1
- docs/tasks.md: done / total; top 3 unchecked
- active plans in docs/plans/: name, steps ticked of total
- docs/backlog.md: US ticked / total by epic
- roadmap.md: milestones done / total
- docs/LESSONS.md: lines not absorbed (suggest /rules if > 5)
- last commit + branch; uncommitted changes yes/no

End with: "next step -> <command>" using the /go detection
order. Change nothing.
