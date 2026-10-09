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

**Always:** Preserve all locked decisions, raw valid public values, validation-before-deletion, native browsing, disabled actions, hidden opacity, shared shell, lifecycle ownership, and root/project-prefix routing. Use the fixed UTF-16 hash/palette and reserved slots; browser chips consume renderer-published catalog/color metadata. Require selected-tag AND plus one broad remaining-text substring; only reserved selections admit matching hidden leaves. Keep full labels, scroll tracks, focus behavior, independent token error and one live count.

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
- [x] `src/links.mjs`, `links.yaml` -- reject ambiguous raw names and perform the approved explicit rename; preserve valid case/Unicode/order.
- [x] `src/directory.mjs`, `src/assets/site.css` -- publish deterministic identities/slots/catalog, full colored tags and accessible available/selected tracks with neutral surfaces.
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

- Renderer owns UTF-16 hashing, reserved slots, canonical catalog labels/order and row-label deduplication; the browser clones published chip metadata and never hashes tags independently.
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
