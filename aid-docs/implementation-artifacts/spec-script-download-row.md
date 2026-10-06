---
title: 'Fix script download action and row layout'
type: 'bugfix'
created: '2026-10-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Download on script links acts like Open because it targets the external destination, and the Open control wraps below the row because the grid has only three columns.

**Approach:** Link Download to the generated same-origin `.sh` launcher and keep the code, destination, Download, and Open in a single grid row, in that order.

</frozen-after-approval>

## Implementation Notes

- `pages.mjs` builds homepage and nested directory rows. `build.mjs` writes launchers at `dist/<path>.sh`; use a relative link from the listing. Keep ordinary three-column rows intact.
- `build.test.mjs` covers generated launcher links and CSS; verify nested paths, order, and non-script rows.
- `pages.mjs`: script rows have a fourth grid track; Download targets the generated relative `.sh` launcher while Open still targets the external URL. The existing three-column rows remain as before.
- `build.test.mjs`: checks launcher download hrefs on home and nested directory pages, action order, and script grid columns. Node 24 tests (15/15) and build passed.

## Review Triage Log

- low (rejected): On very narrow screens, long codes can require horizontal scrolling; the existing row already scrolls and this preserves all controls in one row. No simple correction preserves the requested row order and legibility.
- false: The generated `.sh` file is itself a Bash script; “Download script” correctly describes the action.
- false: The fixture contains only two script rows with distinct launcher paths, and each Download assertion requires Open to follow directly in the same row.
- low (rejected): A browser-served download check would require an extra browser harness; same-origin relative hrefs, `download`, and existing launcher file checks cover the behavior without that dependency.
