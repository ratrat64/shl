---
title: 'Separate directory row highlights'
type: 'bugfix'
created: '2026-10-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Adjacent link highlights touch when one row is hovered and another contains focus.

**Approach:** Add a small consistent vertical gap between directory entries on the homepage and nested lists, preserving existing row heights, padding, actions, and hidden/search behavior.

</frozen-after-approval>

## Implementation Notes

- Shared `.links` lists use a 4px grid gap and a zero-minimum single track to preserve local horizontal scrolling for long entries. Row heights and highlight styling remain unchanged.
- Extended the existing Chrome layout check to inspect adjacent entries in root and expanded nested lists, and guard against viewport/list overflow at 320px, 390px, and 1440px in both themes.
- Verification: Bun 1.4.2, `bun ci`, formatting, required-browser suite (30 passing tests), build, and format check. Mechanical UI detector reported no findings.

## Review Triage Log

- medium, patched: Grid automatic minimum sizing expanded long entries outside the viewport; constrained the track with `minmax(0, 1fr)`.
- medium, patched: The spacing assertion did not detect page-level overflow; added viewport and direct-list-item bounds assertions to the rendered check.
