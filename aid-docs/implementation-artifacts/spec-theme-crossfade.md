---
title: Smooth light and dark theme crossfade
type: feature
created: 2026-10-10
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Replace abrupt visitor-triggered light/dark switching with a stationary whole-page crossfade lasting 240ms with ease-out. Reuse the native View Transition API and shared theme/style foundations, including the embedded 404. Keep theme inks and surfaces synchronized underneath the fade and keep labels, icons and saved preference consistent. Initial saved-theme restoration, system-preference changes, reduced motion and unsupported browsers switch immediately. Repeated toggles honor the latest choice, and navigation ends an outgoing theme fade. Preserve existing shell identity, filtering, focus and navigation behavior. Update the UX spines and decision log, verify rendered intermediate/completed states on desktop/mobile across shell pages, and retain minimal-document restoration.

</frozen-after-approval>

## Implementation Notes

- No unresolved intent gaps or irreversible data/configuration changes. Small shared behavior change using existing browser APIs and test harness; no dependencies.
- `src/assets/theme.js` owns restoration, toggling and transition cancellation; `src/assets/site.css` owns timings. `src/assets/navigation.js` consumes cancellation at navigation intent. `src/browser.mjs` and `src/layout.mjs` already distribute identical theme assets to native and embedded documents.
- Extend `test/build.test.mjs` for crossfade and interruptions; synchronize `DESIGN.md`, `EXPERIENCE.md` and `.memlog.md` in the existing UX workspace.
- Implemented pending-choice settlement and superseded-callback suppression in the shared theme controller; cancellation is consumed by app navigation, external navigation, pagehide and preference changes.
- Native root snapshots exclude their descendants from pointer hit-testing even with a pointer-transparent overlay (CSS View Transitions Level 1 §4.2; reproduced in Chrome). The update marks the new root as uncaptured so only the old snapshot fades over the live new theme. Native pointer activation during the fade is covered by the rendered regression.
- Focused checks passed with Bun 1.4.2 and required Chrome. Rendered matrix covers root/project prefixes, home/nested/Guide/404, 390/1440px, both directions, stationary geometry, intermediate opacity, focus/shell identity, pointer interaction, cancellation and immediate fallbacks. Screenshots of home desktop, Guide mobile and 404 mobile were inspected at light, intermediate and dark states from `/tmp/opencode/theme-fade-*.png`.
- Review follow-up: capture-phase pointer/keyboard/input/disclosure/scroll events settle the snapshot before layout-changing work. Incoming content replacement also settles fades started while a fetch is outstanding. Regression checks now cover system preference changes before/during updates, delayed navigation completion, completed navigation metadata/focus/identity and interruption events.
- Final verification passed: `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (49 passed, none skipped/failed), `bun build.mjs` (68 short links), and `git diff --check`, using Bun 1.4.2 and installed Chrome. Existing contrast gates retain a 4.6279:1 minimum on settled tag treatments.
- End-flicker correction: Chrome reproduced old-snapshot opacity jumping from 0.0000326524 at 239ms to 1 at 240/260ms. The group's `animation: none` shorthand reset its fill mode, which the snapshot inherits. Use only `animation-name: none` to suppress geometry animation while preserving the browser's fill mode. The rendered matrix now holds the animation exactly at and beyond its endpoint and requires opacity 0; it failed with [1,1] before the fix. Synchronized the branch with main's directory-tools stability changes, retaining both UX contracts and theme cancellation hooks.
- End-flicker verification passed: focused Chrome theme tests (2 passed), `bun run format`, `bun run format:check`, required-browser full suite (50 passed), build (68 links), and staged/unstaged whitespace checks.

## Review Triage Log

- Low, accepted inherent effect: aligned opposite-theme text/backgrounds briefly soften contrast during a crossfade. The chosen 240ms fade, reduced-motion immediate path and fully readable settled palettes remain; EXPERIENCE now describes native focus retention rather than claiming continuous mid-fade contrast. Replacing the chosen fade with a different visual treatment is outside this change.
- Medium, patched: filtering/disclosure/scroll could invalidate old-snapshot geometry over live controls. Capture-phase interaction cancellation now retires the image before mutations; rendered interruption and native-pointer checks pass.
- Medium, patched: a theme fade started after navigation intent could survive incoming content replacement. The navigation owner now settles again immediately before replacement, with a delayed-response regression.
- Low verification gap, patched: system color preference cancellation lacked coverage. VM checks before/during updates and a real emulated color preference change verify settlement, saved override and labels.
- Low verification gap, patched: navigation cancellation alone did not establish completed navigation. The regression awaits incoming Guide and asserts URL/title/current navigation, focus and shell identity.
