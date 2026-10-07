---
title: Inline directory tag labels
type: feature
created: 2026-10-07
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Rat selected inline labels from the compact tag comparison. Put tags on one line beside the short code so they do not increase link-row height. Long labels truncate and selecting them reveals the full tags without shifting rows. Preserve tag search, copying, downloads, hidden-link behavior, nested directory navigation, and keyboard/touch access.

</frozen-after-approval>

## Implementation Notes

- Current main moved the shared row renderer and styles to `src/directory.mjs` and `src/styles.mjs`; implementation uses these paths. Native HTML popovers and progressive CSS anchor positioning supply the disclosure without additional JavaScript or dependencies.
- Labels use capped, nonwrapping grid tracks with minimum widths for both tag and destination targets. Existing row-local scrolling handles long codes; suppress scrollbar chrome so horizontal overflow cannot add row height. Popovers are focusable, viewport-constrained and independently scrollable. Unsupported popover browsers keep the full panel hidden instead of rendering duplicate tags below the row; full tag text is retained in the button's accessible name and title.
- Updated the guide, README, PRODUCT, design/experience contracts and UX memory log to reflect Rat's selection. Comparison mock remains as historical exploration.
- Bun 1.4.2: `bun ci`, `bun test --timeout 30000 ./test/build.test.mjs` (20 passed), `bun build.mjs`, and `git diff --check` passed. Added a real Chrome layout regression test using the existing fixture builder and Chrome CLI, without installing a browser framework; skips where Chrome is unavailable. It checks 320/390/1440px, both themes, script/long-code rows, nonzero targets, row-height equality with/without tags, and panel disclosure. Existing search/escaping tests also cover the changed markup and duplicate codes in distinct folders.
- Additional browser checks (`/tmp/opencode/check-inline-tags.mjs`) passed: desktop/mobile, home/nested/script pages, light/dark, unchanged row heights, viewport-constrained panels, Enter/Escape/outside-click, SPA navigation, tag filtering, copying, 200% zoom, and disclosure with application JavaScript disabled. Inspected desktop and mobile screenshots. Impeccable detector reported no findings for the changed renderer/styles.

## Review Triage Log

- Medium, patched: tags could reduce narrow-script destinations to zero width. Added a destination minimum track, tighter mobile gaps and horizontal scrolling for extreme codes; Chrome regression checks assert usable widths.
- Medium, patched: tags could themselves shrink to zero width. Added a minimum tag track and the same browser regression.
- Medium, patched: unsupported HTML-popover browsers could render the full panel in normal flow and increase height. Explicitly hide panels by default and display only `:popover-open`; retained the full button text and title.
- Low, patched: keyboard scrolling of long panels relied on browser-specific focusability. Added `tabindex="0"` to the labelled panel.
- Low, patched: markup-only checks missed narrow-layout failures. Added the Chrome CLI regression to the committed test suite; it caught scrollbar height and verified the fix.
