---
title: 'Shared two-part page title'
type: 'refactor'
created: '2026-10-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Refactor the link counter into a shared page title with an optional numeric counter and a title. Counts use the trailing logo slash's yellow/amber theme color. Links retain dynamic “1 link” / “N links”, including zero and filtered results. Guide uses the same component without a visible or announced counter, reserving its space so Guide aligns with the links label. Both use the existing sans-serif heading typography.

</frozen-after-approval>

## Implementation Notes

- Reuse `src/layout.mjs` for the renderer and shared CSS for geometry/color. Preserve existing count child hooks for search and regression compatibility. Guide has an empty aria-hidden counter slot.
- Merge latest origin/main before changes, preserving new breadcrumb and button changes. Continue PR #83 in its clean task worktree.
- Verify with the existing required-browser shared-shell matrix plus focused title assertions for alignment, font, color and filtering.
- The shared renderer uses block flex layout: required-browser checks caught and eliminated the former inline-flex baseline offset on Guide. Counter child hooks remain compatible with search; the heading styling class is now page-title.
- Verification passed in the task worktree with Bun 1.4.2: bun ci, bun run format, SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs (39 pass, no skips/failures), bun build.mjs (68 links), and bun run format:check. The rendered matrix covers direct/native loads and app navigation at 390/1440px, both themes, root/project prefixes, shared chrome, minimal foundations and 404 recovery. Added exact title position/font/color checks and live singular/zero/plural updates.

## Review Triage Log

- Low, rejected: four-character counter reservation can expand beyond four digits. This is the existing capacity behavior, outside normal hundreds-of-links use; changing overflow behavior would expand this task. Alignment is verified for normal counts.
- Low, patched: relative typography checks could miss a shared monospace or child override. Both title parts now assert inherited sans heading typography and tabular counter digits.
- Low, deferred: DESIGN.md still frames amber as script emphasis and does not yet describe the new shared-title exception. The approved intent here records the counter's logo-color reuse and Guide's reserved counter space; canonical design prose should be refreshed in a documentation change.
