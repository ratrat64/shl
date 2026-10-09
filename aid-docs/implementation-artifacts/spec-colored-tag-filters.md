---
title: 'Implement colored tag filters'
type: 'feature'
created: '2026-10-09'
status: 'in-review'
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
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`: **35 passed, 0 failed**, no browser skips (26.88 seconds, final run).
- New executed filter matrix: root/nested × light/dark × 320px/1440px × root/project hosting; catalog/AND/text/hidden, token/error/caret/IME, full-label tracks/focus, all-selected/untagged/all-hidden, same-page retention, Back/Forward reset, one mount and outgoing listener isolation.
- Chrome DevTools native input checks: root/nested × light/dark × 320px/1440px; Enter/Space select/remove, typed space/comma/Enter commits, native popover open/Escape dismissal, touch activation and coarse-pointer destination visibility.
- Existing rendered matrices passed for shell native/app loads, 16 script/non-script state combinations, all six tag inks on dimmed/wash backgrounds and disabled popovers, neutral disabled actions, copies, download cancellation, minimal foundations and root/project-prefix 404 recovery.
- `bun build.mjs`: **68 short links** generated successfully.
- Impeccable detector over directory/search/styles/navigation/Guide UI targets: `[]` (no findings).
- Implementation committed and pushed on `feat/colored-tag-filters`; [PR #77](https://github.com/ratrat64/shl/pull/77) targets `main`. GitHub reported `MERGEABLE` against `34a55f3b0d88d98b339238b5b6c46ff8a5669254`; PR validation was running at the initial mergeability check. No unresolved merge conflicts or known incomplete implementation tasks.
