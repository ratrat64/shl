---
title: Consistent directory row presentation
type: feature
created: 2026-10-07
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Give link rows and directory summaries matching highlight sizes with left/right padding and subtle corner rounding. Display tags in full. Destination URLs appear when hovering an item and remain on one line. Update UX specs and the working site from committed main in a separate worktree, preserving existing local edits.

</frozen-after-approval>

## Implementation Notes

- Reuse shared directory markup and styles; retain native tag disclosure for convenient viewing of complete labels on crowded rows. Remove tag width caps rather than introducing new behavior.
- Use a shared 50px minimum highlight height, 12px horizontal padding and existing 4px radius. Folder highlights cover only summaries, never expanded descendants.
- Preserve one-line tags and destinations with existing row scrolling and destination middle truncation. Reserve destination space to avoid movement on hover; keyboard focus reveals URLs and non-hover/coarse-pointer devices show them directly.
- Verify real computed styles using the existing Chrome harness at 320/390/1440px in both themes, plus the existing shell/direct/native/navigation/recovery matrix and full test/build commands.
- Rendered checks found fractional button geometry exceeded the initial minimum; settled on 10px vertical padding with exact 50px row/summary heights. Added minimum URL width to all row variants, one-line scrolling folder names, and a coarse-pointer override for hybrid devices.
- Verification passed with Bun 1.4.2: `bun ci`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (24 passed, no skips), `bun build.mjs` (26 links), and `git diff --check`. Chrome 154 executed the row state matrix and existing shared-shell/direct/native/app-navigation/root/project-prefix recovery checks. Input media and hover selectors are forced in the row dump-DOM harness; focus and scrolling use actual browser APIs. Impeccable's detector returned no findings for the changed styles and Guide template.

## Review Triage Log

- Medium, patched: untagged rows could collapse URLs to zero width with long codes; all variants now reserve 4rem (3rem on mobile), tested with long plain/script codes.
- Medium, patched: long folder names could increase summary height; one-line scrolling summaries preserve complete names and native disclosure marker.
- Low, rejected: hidden scrollbar discoverability is an existing documented compromise, not a new malfunction; retained compact chrome and optional tag popover. Rendered checks prove row scrolling reaches the Open action. Additional overflow decoration would extend this narrow visual refinement.
- Medium, patched: primary-pointer-only rules hid URLs on hybrid touch/mouse devices; any coarse input now keeps destinations visible.
- Medium, patched: missing rendered variants; added long folder/code, plain/script untagged, hidden row/folder, summary focus, hybrid input and actual scroll-access assertions.
- Low, patched: initial 10.4px padding log conflicted with verified 10px geometry; appended correction, aligned live specs and README, asserted vertical padding numerically.
