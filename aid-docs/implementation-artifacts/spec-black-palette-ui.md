---
title: 'Black palette and directory states'
type: 'feature'
created: '2026-10-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Refresh the existing directory with a black dark-mode background and a fitting high-contrast, comfortable palette. Keep the footer at the bottom of short pages, highlight link rows on hover, distinguish revealed hidden links subtly, and display /shl/ in the header with colored slashes distinct from the middle text.

</frozen-after-approval>

## Implementation Notes

- Shared templates and CSS in `src/pages.mjs` serve home, nested directories and guide. Retain system theme selection and light-mode override; use teal actions, amber scripts, off-white primary text and readable muted text.
- Use flex page layout for the footer and row hover/focus-within washes. Hidden links retain their existing toggle behavior and gain muted codes plus a text label. No dependencies or routing changes.
- Update existing theme/branding assertions and UX spines; run the CI test and build commands with Bun 1.4.2.
- Verification: all 17 build tests passed; production build generated 26 links; `git diff --check` passed; Impeccable detector returned no findings.
- Headless Chrome checked 1280px, 375px and 320px in both themes: footer at viewport bottom on short pages, footer after long guide content without overlap, hover/focus row wash, no page overflow, and hidden-row text/action contrast at least 4.5:1. Inspected desktop/mobile screenshots.

## Review Triage Log

- Medium, patched: inline hidden label increased the max-content code width on narrow script rows. Below 740px the label now occupies a second line without widening the code column.
- Low, verified: footer geometry is outside the existing simulated-DOM regression suite. Headless Chrome verified short and long pages at desktop and mobile widths in both themes; no browser framework dependency added for this scoped CSS change.
