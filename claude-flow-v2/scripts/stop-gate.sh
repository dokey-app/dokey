#!/bin/sh
# Optional Stop hook: refuse to end the turn while fast tests are red.
# Wire it in settings.json only on a stable project (see PROMPTS.md).
# Replace the command below with your fast test target.
if ! make test-fast >/tmp/stop-gate.log 2>&1; then
  echo "Tests are red — fix before finishing:"
  tail -20 /tmp/stop-gate.log
  exit 2
fi
exit 0
