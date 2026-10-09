---
title: 'Single-owner shared UI values'
type: 'refactor'
created: '2026-10-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Refactor shl to remove competing sources of truth for counted page-title labels, tag-toggle labels, theme-control labels, dark-theme tokens and Guide navigation metadata. Consumers must reuse responsibility-owned values; browser behavior consumes renderer-published metadata where appropriate. Preserve behavior, accessibility, no-JavaScript output, themes, routing and browser lifecycle. Add focused regression checks for static/browser drift, preserve existing edits, work on a separate branch/worktree, and publish a PR after required checks pass. Do not extract unrelated similar code.

</frozen-after-approval>

## Implementation Notes

- Investigation: `layout.mjs:pageTitle` renders headings, but `directory.mjs` and `search.js` independently choose Link/Links. Publish both count labels from the heading renderer; retain its non-counted Guide variant.
- `directory.mjs` renders Show tags; `search.js` repeats Show/Hide tags. Publish collapsed/expanded labels on the button and use them for both render and update.
- `layout.mjs` renders Theme: system; `theme.js` independently constructs labels. Publish complete system/light/dark labels on the dedicated theme hook; keep storage restoration before the optional control lookup.
- `site.css` repeats the entire dark palette in media and explicit override selectors. Native light-dark color pairs can own each palette value once; retain numeric opacity as a shared dark value referenced by both activation paths.
- `NAV_ITEMS` already owns Guide navigation. Footer, Guide title/legacy forward and 404 footer fallback repeat its metadata. Reuse the Guide item and publish route paths for shell links; recovery rebases those paths without inferring destinations from presentation classes. Keep active-nav hooks distinct from route hooks.
- No intent gaps, irreversible changes or new callable module boundaries. Scope: existing layout/directory/pages renderers, theme/search scripts, stylesheet and regression test file. No new dependencies.
- Baseline: Bun 1.4.2, `bun ci`; required-browser suite: 38 pass, 1 browser scrolling check fails at about:blank before page load. Rerun focused check before judging it as a regression.
- Proof: existing full shell direct/native/app light/dark desktop/mobile matrix, minimal foundations, root/project recovery and lifecycle tests; add focused checks that substitute renderer metadata and observe count/toggle/theme updates.
- Implemented the five ownership boundaries without new modules. Guide build output also consumes the navigation path; app navigation consumes the renderer's supported navigation keys rather than repeating them.
- Corrected the baseline diagnosis: reverse touch scrolling invoked Chrome's overscroll history navigation back to about:blank. Disabled `OverscrollHistoryNavigation` only in the CDP test launcher; application behavior is unchanged. The focused scrolling check then passed.
- Regression coverage substitutes count/picker/theme metadata to detect hardcoded browser copy, checks static label/metadata agreement on native and enhanced pages, repeats through app directory remounts, and compares every palette role and hidden opacity between system/explicit themes against independent pre-refactor values.
- Initial final gate passed: Bun 1.4.2, formatting/check, 39 required-browser tests, build (68 short links). Final review requested stronger independent palette expectations; these were added and will be checked before publication.
- Final gate after review: `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (39 pass, 0 fail, executed Chrome matrix), `bun build.mjs` (68 short links), and `git diff --check` all passed. Rendered checks include Links/nested/Guide/404, light/dark, desktop/mobile, direct/native/app loads, minimal documents, root/project recovery, and lifecycle behavior. Generated tag contrast minimum remains 4.7232:1.
- Latest fetched main remains the task baseline `59a8dcbd96ed18f09fc61302b41260815184fc13`; no alignment changes were needed. All changes are confined to the separate task worktree; the original worktree and other branches were preserved.

## Review Triage Log

- Namespace owner — false: `guide` is an independently binding reserved-name constraint in AGENTS.md/AD-3, not configurable navigation metadata. The fixed current Guide path is still rejected before output replacement; arbitrary route renaming is outside this refactor.
- Guide depth — false: the only supported Guide route remains the fixed one-segment `guide/`; no nesting configuration was added. Current root/project assets and shell links pass direct/native/app checks. Deriving arbitrary nesting support would expand scope.
- Core light-dark browser floor — rejected low: the approved shared stylesheet already requires native `light-dark`/`color-mix` for tag treatments (AD-5/AD-8), with no legacy-browser fallback contract. Palette values are preserved in the required browser matrix, including minimal/native documents. A new fallback implementation for an older capability floor is outside this refactor.
- Independent palette oracle — medium, patched: system/explicit agreement alone could miss changed colors. Added pre-refactor expected values for all 12 color roles and numeric opacity, resolved through real computed CSS.
- Navigation allowlist hook — false: renderer `NAV_ITEMS.key` already supplies both `data-nav` and shell `data-app-page`; the supported page identities and active state intentionally share this component contract. All current [data-nav] hooks belong to the shared navigation, not arbitrary content; unsupported-page native fallback and lifecycle checks remain in the existing suite. No configurable navigation items or new mounted page types were added.
