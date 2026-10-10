---
title: 'Prevent unselected tag entrance flicker'
type: 'bugfix'
created: '2026-10-10'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Available tag chips rest at opacity 0.7, but their entrance animation ends at opacity 1 before dropping back to 0.7. This creates a visible flash when they appear.

**Approach:** Fade chips directly to their CSS-owned final opacity, retaining the existing entrance motion and full-opacity hover/focus treatment. Verify picker opening and tags returning after removal, including reduced motion, both themes and desktop/mobile layouts.

</frozen-after-approval>

## Implementation Notes

- Base revision: `d676658d2397fbb915c7f21b8c5806da25eb41d5`. Work is isolated on `fix/tag-chip-flicker`; existing main-worktree notes are preserved.
- Removed the explicit `to { opacity: 1 }` endpoint from shared `feedback-appear` in `src/assets/site.css`. Native CSS supplies each consumer's underlying opacity: available chips 0.7, selected chips and feedback/content 1, and hovered/focused available chips 1.
- Extended the existing browser motion matrix in `test/build.test.mjs` to sample opening/returning available-chip fades, require monotonic opacity up to the resting 0.7, and verify full-opacity focus. No browser controller change is needed.
- Regression proof before the CSS fix: the focused required-Chrome motion check failed for both opening and returning fades (390px/light/no-preference), reproducing the reported flash.
- Strengthened the browser check to require genuine interpolation in normal-motion mode and to focus a chip during its entrance, requiring final opacity 1 and return to 0.7 after blur.
- Verification with Bun 1.4.2 and Chrome 155: `bun run format`, `bun run format:check`, focused required-browser motion/session checks (2 pass), and `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (48 pass). The full suite executes shared shell, minimal foundations, tag surfaces, root/project-prefix recovery, and navigation checks. `bun build.mjs` built 68 links. Impeccable's CSS detector returned no findings.
- The first full-suite run hit a transient native-history/BFCache check (`cachedDocument` unavailable). The unchanged-main focused check and the task-worktree focused rerun passed; the final full suite passed without modifying history behavior or its tests.

## Review Triage Log

- Low, patched: monotonic opacity alone would accept a flat or instant appearance. Normal-motion samples now require opacity 0 at the start and a strictly intermediate midpoint.
- Low, patched: focus was only checked after entrance completion. The test now focuses during a fresh entrance and verifies settlement at 1 and return to 0.7 after blur; existing native-pointer checks continue covering hover treatment.
