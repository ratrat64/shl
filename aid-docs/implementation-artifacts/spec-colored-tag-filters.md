---
title: 'Implement colored tag filters'
type: 'feature'
created: '2026-10-09'
status: 'done'
baseline_commit: '34a55f3b0d88d98b339238b5b6c46ff8a5669254'
route: 'dispatch'
review_loop_iteration: 0
context:
  - aid-docs/specs/spec-colored-tag-filters/SPEC.md
  - aid-docs/specs/spec-colored-tag-filters/tag-filter-behavior.md
  - aid-docs/specs/spec-colored-tag-filters/architecture-alignment.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Visitors lack discoverable, composable tag filters and consistent colored labels. Existing hidden-toggle and initial-# query semantics conflict with the approved feature contract.

**Approach:** Implement the canonical SPEC and all companions in `aid-docs/specs/spec-colored-tag-filters/`. That contract remains authoritative; this document supplies execution tasks rather than a replacement specification. Replace the existing search controller's obsolete branches, reuse shared rendering and lifecycle owners, and synchronize conflicting live instructions.

**Approved decision:** Rename `links.yaml`'s `search-test-exact` tag `release notes` to `release-notes`, explicitly authorized by the user on 2026-10-09. Do not automatically rename other invalid input.

## Boundaries & Constraints

**Always:** Preserve all locked decisions except the user-approved amendments below, raw valid public values, validation-before-deletion, native browsing, disabled actions, hidden opacity, shared shell, lifecycle ownership, and root/project-prefix routing. Use seeded UTF-16 tag colors under the latest amendment; browser chips consume renderer-published catalog/color metadata. Require selected-tag AND plus one broad remaining-text substring; only reserved selections admit matching hidden leaves. Keep full labels, scroll tracks, focus behavior, independent token error and one live count.

**Approved visual amendment (2026-10-09):** Expand the automatic palette from six to sixteen stable light/dark slots to reduce collisions; preserve reserved hidden/disabled/broken/script slot identities. Full inline/popover labels and available/selected chips have backgrounds and borders tinted from their own ink palette, including disabled-row tags. Selected tags precede search in DOM/tab order and sit to its left on desktop; stack above search on narrow screens. Preserve full-label scrolling, 50px row geometry, accessible contrast and disabled non-tag styling. This user request supersedes the six-slot, neutral-tag-surface and right-side-selection decisions in the canonical companions and live instructions; synchronize those documents.

**Approved seeded-color/validation amendment (2026-10-09):** The user's next follow-up supersedes finite color slots entirely: generate every tag's light/dark inks from the tag string's deterministic UTF-16 FNV-1a seed, including state-tag labels. Use a broad HSL hue range and bounded readable saturation/lightness instead of selecting from a fixed palette. Publish generated color metadata once through the shared renderer; browser chips reuse it and shared color-mix backgrounds/borders remain. Keep row-state emphasis independent. Reject raw Unicode uppercase/titlecase characters and emojis in tags, alongside existing whitespace/comma restrictions, before output replacement; retain lowercase/uncased international text, digits and ordinary punctuation. Emoji detection covers pictographs, emoji-presentation symbols, regional indicators/flags and keycap markers without rejecting bare digits/#/*. Typed uppercase queries can still resolve known lowercase tags. The user explicitly approved renaming checked-in HiDdEn/BrOkEn/DiSaBlEd/emoji-🎉 to hidden/broken/disabled/emoji-party. Do not silently normalize future invalid names. Synchronize superseded sixteen-slot and uppercase/emoji-acceptance instructions and explicitly update affected fixtures into valid names or rejection cases.

**Never:** Add dependencies/frameworks, stored colors/filter state, OR filtering, autocomplete, row-tag filtering, result-dependent catalogs, automatic migration, color dots, grayscale-only disabled tags, or changes to redirects/launchers/copy/download semantics. Historical forge inputs and logs remain historical.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Selection | Two known tags plus prose | AND intersection and broad text; catalog unchanged | Zero matches retains choices and announces existing no-match state |
| Hidden | Reserved selection with ordinary selection/text | Only leaves satisfying all constraints and their ancestors | Removing last reserved selection excludes hidden leaves |
| Tokens | Space/comma/Enter, paste, mid-input caret, IME | Consume known syntax once, preserve prose/caret; duplicates idempotent | Unknown syntax remains with Tag not found; correction/removal clears error |
| Validation | Raw whitespace/comma in JSON/YAML/YML tags | Reject with source/path/value and explicit-renaming guidance | Existing dist sentinel survives |
| Baselines | Empty, untagged, all-hidden, all-selected | Correct tools, count and empty message; fresh mounts reset | No-JavaScript retains visible static listings and native foundations |

</frozen-after-approval>

## Code Map

- `src/links.mjs`: `loadLinks`/`collect` validation, `linkFields`, `linkStates`, `entryTree`, `entryCounts`; preserve public raw map and recovery's defensive interpretation.
- `src/directory.mjs`: `directoryContents`, `searchableListing`, `renderLinkRow`, `listing`; render subtree catalog, chip regions and individual tag spans once for root/nested pages.
- `src/assets/search.js`: `initSearch`, recursive `filter`/`update`, disclosure `opened` map; replace hidden-toggle and initial-# branches with one selection/token controller.
- `src/assets/site.css`: shared tokens, directory tools, row/tag/panel styles, disabled overrides; narrow exception for colored tags only.
- `src/assets/navigation.js`: `mount`, `navigate`, `samePage`; existing main replacement resets content state, same-page fragments retain it. Reuse, change only if integration requires it.
- `src/pages.mjs`: `guidePage` contains obsolete guidance. Minimal forwarding, launchers and recovery are preserved.
- `test/build.test.mjs`: `fixture`, `build`, VM checks, `availableChrome`, `runChrome`, `browserServer`; replace obsolete exact-search/toggle acceptance and padded/multiword fixtures while preserving unrelated checks.

## Tasks & Acceptance

**Execution:**
- [x] `src/links.mjs`, `links.yaml` -- reject whitespace/comma/Unicode uppercase/titlecase/emoji raw names and apply only explicitly approved renames; preserve valid lowercase/uncased Unicode, punctuation and raw order.
- [x] `src/directory.mjs`, `src/assets/site.css` -- publish deterministic string-seeded HSL theme inks/lossless identities/catalog with no finite slots, full colored tags with matched tints/borders and accessible tracks; selected tags precede search (left desktop, above mobile).
- [x] `src/assets/search.js` -- implement selection/focus, fixed catalog, AND/text/hidden predicate, token/error/caret/IME behavior and disclosure/count states.
- [x] `src/assets/navigation.js` -- verify one mount, resets/retention and outgoing listener isolation through existing lifecycle.
- [x] `AGENTS.md`, `README.md`, `docs/reference.md`, `src/pages.mjs`, PRODUCT/DESIGN/EXPERIENCE and ARCHITECTURE-SPINE -- rewrite conflicting live rules under the scoped amendment; record the authorized rename in canonical spec without rewriting historical logs.
- [x] `test/build.test.mjs` -- cover the companion's validation, color, catalog, predicate, token, lifecycle/native and executed rendered matrices; update intentional incompatible fixtures explicitly.
- [x] Task branch -- complete checks, commit/push, open PR against main and report current mergeability.

**Acceptance Criteria:**
- Given the canonical contract, when behavior and rendered checks execute, then every responsibility in its verification table passes without browser skips.
- Given root/nested pages in both themes and viewport classes, when native/app navigation and tag interactions execute, then full labels, focus, contrast, geometry and shell consistency meet the companions.
- Given conflicting active instructions, when implementation is delivered, then they express the amended semantics coherently and unrelated adopted invariants remain binding.

## Implementation Notes

- The approved [predefined-state tag colors follow-up](spec-predefined-state-tag-colors.md) supersedes this completed task's all-tags-generated instructions: descriptive tags remain seeded; broken/script/disabled labels reuse shared state tokens and hidden alone gets theme-aware neutral gray. All surfaces retain renderer metadata, selected-chip cloning and shared tint/border treatment. Earlier intent and verification below record historical behavior.

- Seeded-color follow-up uses fixed FNV-1a-derived HSL: hue=(seed%3600)/10, saturation=55+((seed>>>16)%21), light lightness=20+((seed>>>24)%3), dark=80+((seed>>>24)%5). Bounds are 0–359.9° hue, 55–75% saturation, 20–22% light and 80–84% dark lightness. Generated theme metadata and native light-dark replace finite slots, preserving tint/borders and selected-left layout.

- Follow-up work retains color-matched tag surfaces/borders and selected-left native grid, now superseding the earlier finite palette with per-string HSL generation. No new component, storage or dependency; verify generated hue/bounds plus selected geometry/tab order through the existing browser harness.

- Renderer owns UTF-16 hashing and generated HSL metadata for every tag (state labels included), lossless identities/catalog order and row-label deduplication. Browser selection clones published metadata without hashing; shared light-dark consumes the theme pair while row-state colors remain separate.
- Search replaces the old toggle/exact-query branches with one controller. Its cleanup is called by the existing navigation owner before main replacement; same-page fragments retain state.
- The native search input retains caret/selection APIs and its clear affordance. Pending tokens search the existing raw/prefixed tag metadata as broad text; only a bare `#` is explicitly excluded.
- Token errors track attempted candidate ranges across edits; a pending correction keeps its error until committed, while removal clears it independently of unrelated pending tokens.
- State fixtures explicitly rename padded names and `release notes`; ambiguous forms now have rejection/sentinel fixtures for every source format. Historical forge inputs/logs are untouched.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and route |
| --- | --- | --- |
| Blind: comma-containing URL fragments consumed | medium | The token regex admits a comma boundary inside a URL and consumes its fragment. Patch candidate exclusion for URL spans; preserve plain URL text. |
| Blind: multiline paste loses delimiters | medium | Native search inputs sanitize line breaks before input handling; newline-separated tokens merge. Patch paste handling before sanitization, preserving token separation and prose. |
| Blind: repeated unknown deletion transfers error | medium | Prefix/suffix comparison cannot locate the edited occurrence of identical tokens. Patch using the native edit range, with a regression for deleting the attempted occurrence. |
| Blind: NUL identity corrupts in HTML | medium | Validation accepts NUL, HTML attributes replace it, but JSON leaf identities retain it. Patch lossless identity publication without adding prohibited validation restrictions. |
| Blind: native undo does not reverse token-to-chip conversion | low | Filter conversion is reversed through selected chip removal under the locked contract; adding native selection-history undo would add unrequested state/behavior and is rejected. The incidental ordinary-edit undo disruption was directly corrected and now has native keyboard proof. |
| Blind: nested page omits its own folder path | medium | Existing traversal also began at the current subtree root; this pre-existing limitation is not introduced by the feature. Defer full-path search enhancement; preserve existing broad-search scope. |
| Blind: first live-region error might not announce | maybe-false | The independent role=status/aria-live region is synchronously revealed and populated; no screen-reader evidence establishes the claimed missed announcement. Defer unverified accessibility concern pending an executed screen-reader check. |
| Blind: legacy migration guidance preserves invalid tags | low | Existing instructions preserve raw tags while the new validation rejects padded names. Directly clarify that invalid names require explicit maintainer renaming in migration guidance. Patch. |
| Blind: native track scrolling proof missing | medium | Real browser checks use programmatic focus/scroll and a fitting touch target. Add native Tab and horizontal touch-track scrolling acceptance checks. Patch verification. |
| Blind: recursive catalog sorts discarded results | low | Each recursive call sorts the accumulated map before its parent ignores that result. Directly collect once and sort only the final catalog. Patch. |
| Edge: prepend known token clears existing unknown error | medium | Prefix matching can map the existing attempted range to the inserted candidate or none. Patch actual edit-range mapping and test native prepend. |
| Edge: NUL/FFFD identities conflate | medium | Same confirmed HTML identity boundary defect as the blind finding; share its lossless publication patch. |
| Edge claim: unrelated commit clears unresolved token error | medium | The unchanged unknown token can lose its tracked range after prepend. Share the edit-range patch and regression. |
| Edge claim: renderer identities disagree with leaf identities | medium | Same confirmed NUL replacement defect; share the lossless publication patch. |
| Verification: Enter outside unfinished candidate untested | medium | Existing Enter checks all place caret inside the candidate; mutation dropping bounds would survive. Add inside/outside caret assertions. Patch verification. |
| Verification: per-leaf dedup not asserted | medium | Existing duplicate fixture asserts catalog uniqueness only. Add inline/popover identity, casing/order and raw-public-preservation assertions. Patch verification. |

## Verification

- `bun ci` -- Bun 1.4.2 installs locked dependencies.
- `bun run format` and `bun run format:check` -- application formatting passes.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` -- all behavior and required rendered checks pass with installed `/usr/bin/google-chrome`.
- `bun build.mjs` -- valid map generates static output from the task worktree root.
- Impeccable mechanical detector over changed UI targets -- inspect once after finished UI; assess against pinned design and spec.
- PR mergeability against latest main -- no unresolved conflict before reporting ready.

### Executed evidence — 2026-10-09

- Bun `1.4.2`; `bun ci` installed the locked two packages.
- `bun run format` and `bun run format:check` passed.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`: **35 passed, 0 failed**, no browser skips (27.02 seconds, including oversized-label regression).
- New executed filter matrix: root/nested × light/dark × 320px/1440px × root/project hosting; catalog/AND/text/hidden, token/error/caret/IME, full-label tracks/focus, all-selected/untagged/all-hidden, same-page retention, Back/Forward reset, one mount and outgoing listener isolation.
- Chrome DevTools native input checks: root/nested × light/dark × 320px/1440px; Enter/Space select/remove, typed space/comma/Enter commits, native popover open/Escape dismissal, touch activation and coarse-pointer destination visibility.
- Existing rendered matrices passed for shell native/app loads, 16 script/non-script state combinations, all six tag inks on dimmed/wash backgrounds and disabled popovers, neutral disabled actions, copies, download cancellation, minimal foundations and root/project-prefix 404 recovery.
- `bun build.mjs`: **68 short links** generated successfully.
- Impeccable detector over directory/search/styles/navigation/Guide UI targets: `[]` (no findings).
- Implementation committed and pushed on `feat/colored-tag-filters`; [PR #77](https://github.com/ratrat64/shl/pull/77) targets `main`. GitHub reported `MERGEABLE` against `34a55f3b0d88d98b339238b5b6c46ff8a5669254`; PR validation was running at the initial mergeability check. No unresolved merge conflicts or known incomplete implementation tasks.
- Initial CI exposed a font-dependent test assumption that every full chip fits a 320px track. The rendered gate now requires fitting chips to be fully revealed, oversized chips to intersect the focused track, and both ends of oversized labels to remain reachable by scrolling; labels remain uncapped as required.
- Completed the three aid-build review layers and recorded every finding above. Patched token URL/paste/native-edit boundaries and lossless JSON-content identities, clarified migration guidance, sorted catalogs once, and strengthened caret/dedup/native Tab/touch regressions. Two follow-ups are recorded in deferred-work.md: pre-existing nested full-path search and unverified screen-reader first-error announcement.
- Final full verification after review patches: Bun 1.4.2 `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (**38 passed, 0 failed**, 33.76 seconds, no browser skips), and `bun build.mjs` (**68 short links**) all passed. Native multiline clipboard paste, ordinary editing/undo, NUL/FFFD identities, Tab and horizontal touch gestures executed in Chrome.
- Final instruction audit also replaced the obsolete hidden-toggle reference in docs/development.md's navigation smoke checklist. Frozen intent remains unchanged.

### Approved visual amendment verification — 2026-10-09

- Implemented modulo-16 UTF-16 assignment with reserved indices unchanged; retained the first six ink pairs and documented ten additional theme pairs in the canonical behavior companion. Slot-level --tag-tone variables feed shared 5%/8% resting/hover fills and 30%/45% borders, including disabled-row labels and popovers.
- Selected-track DOM order now precedes search; shared grid places it left on desktop and above on mobile. Native forward/reverse Tab proof follows the new order and horizontal touch gestures still reach both ends of oversized labels in both tracks. Corrected the harness's CDP Shift modifier from Alt (1) to Shift (8).
- Fixed UTF-16 fixture vectors explicitly cover every slot 0–15. Executed rendered checks assert all sixteen on each state row/popover and available/selected surfaces, palette-matched resting/hover fills/borders, ≥4.5:1 actual tinted-surface contrast with hidden opacity and row wash, 50px row heights, destination reserves, full-label overflow, desktop-left/mobile-above geometry and DOM/tab order. Existing lossless NUL/FFFD, token/native-paste/edit/undo, lifecycle, shell, disabled actions and routing gates passed.
- Bun 1.4.2 `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (**38 passed, 0 failed**, 24.09 seconds, no browser skips), `bun build.mjs` (**68 short links**) and `git diff --check` passed. Impeccable detector on directory/CSS targets returned `[]`.
- Canonical SPEC/companions and affected live agent/product/design/experience/architecture/README/reference instructions synchronized. Historical forge inputs, memory logs and earlier evidence retained. Final diff inspection confirmed the scoped visual amendment and preserved filter behavior; delivery updates the existing feature PR.

### Approved seeded-color/validation amendment verification — 2026-10-09

- Removed finite/reserved color assignments, per-slot CSS/tokens/data-slot metadata and slot-specific tests. Renderer now seeds every label (including hidden/broken/disabled/script) directly into fixed HSL theme inks, published through --tag-light/--tag-dark; selection clones metadata and shared --tag-tone uses native light-dark with the existing 5%/8% fills and 30%/45% borders. Row-state emphasis, lossless data-tag, left/above selected tracks and native behavior remain separately verified.
- Tightened raw tags with Unicode Uppercase + Lt, Extended_Pictographic + Emoji_Presentation + Regional_Indicator + U+20E3, alongside whitespace/comma rejection. JSON/YAML/YML source/path/offending-value rename guidance and sentinel preservation passed. Lowercase/uncased accented/Greek/Cyrillic/fullwidth/supplementary/CJK text, bare digits/#/*, punctuation and NUL remain valid/raw; uppercase typed tokens and defensive fetched uppercase state tags still resolve.
- Checked-in map changes are ONLY the approved HiDdEn → hidden, BrOkEn → broken, DiSaBlEd → disabled and emoji-🎉 → emoji-party renames, plus their fixture-description comment. Titles, URLs, codes and unrelated values are retained. Former valid uppercase/emoji fixture names were explicitly replaced by valid lowercase/emoji-party names or moved into rejection coverage; no silent migration exists.
- Fixed seed/color vectors include state labels, shell, accented text, supplementary lowercase and NUL. Structural/source reorder/add/remove checks and rendered root/nested/reload/all-surface metadata checks passed; representative generator produces 36 distinct inks. Actual generated identities span every integer hue degree 0–359, include all 67 current-map tag identities and exercise all state combinations in light/dark desktop/mobile.
- The original 23% lightness ceiling failed the hidden yellow envelope edge at 4.4268:1; fixed 20–22% light / 80–84% dark bounds passed. Executed **54,592 generated-color** and **46,080 HSL-envelope** actual resting/hover surface checks; minimum contrast **4.7232:1**. Existing 38 behavior/browser/native/lifecycle checks remain meaningful; one new spectrum gate brings the suite to 39.
- Bun **1.4.2**: `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (**39 passed, 0 failed**, **36.73 seconds**, no browser skips), `bun build.mjs` (**68 short links**) and `git diff --check` passed. Impeccable detector on renderer/CSS/Guide targets returned `[]`.
- Live canonical/agent/product/design/experience/architecture/README/reference/Guide rules synchronized; historical memory logs and prior evidence retained. Approved parent spec edits preserved. Final diff inspection confirmed the requested seeded generation and character restrictions; spectrum fixture generation is bounded so a regressed generator fails its coverage assertions instead of hanging. Delivery updates the existing feature PR.
