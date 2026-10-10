---
title: Fix color fixture tag coverage
type: bugfix
created: 2026-10-10
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Production link edits must not break the seeded-color test through missing expected fixture colors. Include the fixture's release-notes tag in its samples while preserving spectrum, current-map and state coverage.

</frozen-after-approval>

## Implementation Notes

Added release-notes to seeded color samples in test/build.test.mjs, covering the tag stateMap always injects independently of production links. Focused browser test, full 50-test browser-required suite, formatting and build passed with the user's two-link map. Review found no correctness issues.
