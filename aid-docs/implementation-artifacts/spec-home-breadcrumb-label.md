---
title: 'Home breadcrumb label'
type: 'bugfix'
created: '2026-10-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

The default breadcrumb on the homepage should say Home instead of Links.

</frozen-after-approval>

## Implementation Notes

- Change the static homepage label in `src/directory.mjs`, reusing the existing breadcrumb markup and styles.
- Update the existing generated-homepage assertion in `test/build.test.mjs` to expect Home.
- Prior PR #81 is merged; this correction uses the separate `fix/home-breadcrumb-label` branch and worktree.
- Verification: Bun 1.4.2, formatting and format check passed; browser-required suite passed all 39 tests with the 30000ms timeout; build produced 68 short links.
- Read-only review found no actionable defects; label scope/consistency and regression coverage were checked.
