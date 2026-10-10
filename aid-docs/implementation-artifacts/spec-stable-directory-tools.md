---
title: Keep directory filter controls live during browsing
type: bugfix
created: 2026-10-10
status: in-review
route: dispatch
review_loop_iteration: 0
context: []
baseline_commit: dcd324fe9c0cf4d08afef1edfe3e0bd73335f0d6
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Switching between link directories replaces the search section and replays its entrance, although the visitor's search text, selected tags and picker preference are shared between directories. This makes persistent controls appear to refresh along with the listing.

**Approach:** Keep the existing directory toolbar and its controls live during same-site directory browsing. Update directory-specific results and available tag choices in place, retaining the visitor's filter state. Animate incoming directory content without fading the toolbar again.

## Boundaries & Constraints

**Always:** Preserve the search input, selected track and existing selected-chip buttons, tag toggle and available track during navigation between searchable directories at the same canonical site base. Keep exact text, input selection, chip order, track scroll positions and picker preference. Refresh subtree-local available choices, count, breadcrumbs and listing; absent-subtree selections remain removable and constrain results. Preserve renderer-owned labels, colors, accessibility metadata and the recently merged action icons. Keep search as the single filter/state owner and navigation as the single navigation/lifecycle owner. Reset transient token/copy/download feedback and directory disclosures on cross-page navigation. Retain title, heading/fragment focus, complete-URL scroll restoration, history and stale-work cancellation. Save filters only after visitor mutations. Reuse native JavaScript, existing helpers and the browser harness.

**Never:** Add a frontend framework, dependency, generic DOM-diff system, second filter store or independently hardcoded tag metadata. Do not commit pending #tokens during navigation. Directory reuse must not cross site-base boundaries or make Guide, 404, minimal redirects or external URLs directory content.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Directory browse | Searchable root/nested directory to another at the same base | Live toolbar stays visible; destination subtree supplies choices, breadcrumbs, count and results | Existing native navigation fallback on enhanced-load failure |
| Different catalog | Selected tags absent from the destination | Same selected buttons remain removable; AND may produce zero results; available choices reflect the destination | No unknown-token feedback from restoration |
| Untagged directory | Nonempty destination with no tags | Search and selections remain live; toggle becomes disabled; picker preference survives returning to a tagged directory | No initialization writes |
| History | Back/Forward between directories | Latest session filters apply with retained controls and existing scroll/focus behavior | Superseded requests cannot mutate controls or save state |
| Searchless boundary | Guide, 404 or an empty-site document | Use the existing page mount path; preserve the filter record for the next directory | Unknown 404 paths do not establish a namespace |
| No JavaScript / reduced motion | Native load or reduced-motion preference | Static browsing remains usable; reduced motion updates immediately | No reliance on animation completion |

</frozen-after-approval>

## Code Map

- `src/directory.mjs:131–192` — shared toolbar, catalog, restoration metadata and directory content renderer; introduce an explicit content boundary below the toolbar.
- `src/assets/navigation.js:13–25,118–151` — cleanup/mount, validated replacement and entrance ownership; add the narrow same-base directory update path.
- `src/assets/search.js:4–128,213–274,505–512` — closure captures listing/catalog/count; remount bindings while adopting retained controls and selections rather than clearing them. Reconcile catalogs here using incoming renderer metadata.
- `src/assets/site.css:876–887` — chip/count/main entrances; scope the directory entrance to changed content so retained controls do not replay.
- `test/build.test.mjs:432–617,678–857,5240–5328` — real Chrome session/history/navigation checks and CDP helpers. Navigation completion must use URL/content readiness rather than assuming every directory changes main identity. The navigation VM stubs search and cannot prove integration alone.
- `DESIGN.md` and `EXPERIENCE.md` in `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/` — synchronize the directory-specific lifecycle/motion contract.

## Tasks & Acceptance

**Execution:**
- [x] `src/directory.mjs`, `src/assets/navigation.js` — expose the changing-content boundary and keep the connected directory toolbar during eligible navigation; preserve cancellation and native page boundaries.
- [x] `src/assets/search.js` — rebind to incoming content, adopt existing selections, reconcile subtree catalog, update toggle availability and reset transient state without assigning unchanged input text or saving defaults.
- [x] `src/assets/site.css` — retain content entrances without toolbar or existing-chip reentrance on directory updates.
- [x] `test/build.test.mjs` — extend real-browser checks for identity, caret, scroll, catalog changes, no-tag transitions, Back/Forward, stale work and one effective listener; preserve shell and recovery checks.
- [x] `DESIGN.md`, `EXPERIENCE.md` — document the directory-specific retained toolbar and content-only entrance.

**Acceptance Criteria:**
- Given active search and selected chips, when a visitor browses between same-base directories or traverses their history, then the same input, toggle, tracks and selected buttons remain connected, with exact text and input selection retained.
- Given a visible picker, when a directory changes, then only destination-relevant available choices remain and the count/results reflect the existing AND/text filters.
- Given normal motion, when directory content changes, then retained toolbar controls do not fade or replay chip entrances; given reduced motion, updates are immediate.
- Given repeated directory navigation, when the visitor toggles tags, types or removes a chip, then each action runs once and synchronously saves the resulting state.
- Given a cancelled outgoing request or local action, when it completes late, then it cannot alter the current toolbar, results, stored filters, feedback or navigation.

## Implementation Notes

- Planning baseline: `dcd324fe9c0cf4d08afef1edfe3e0bd73335f0d6`, Bun 1.4.2. Worktree: `/home/rat/Git/shl/shl-stable-directory-tools`; branch: `fix/stable-directory-tools`. Existing untracked work in the main worktree is preserved.
- Investigation found no unresolved intent questions or irreversible application changes. Dispatch is appropriate because the fix changes shared lifecycle responsibility, markup boundaries and rendered motion rather than a single cosmetic rule.
- Prefer keeping the directory main/section connected and replacing its content region; physically detaching/reinserting a toolbar can restart descendant CSS animations. Search still cleans outgoing listeners and mounts the incoming listing once, but adopts retained DOM instead of recreating controls.

## Verification

- `bun ci` and `bun run format`.
- Required-Chrome focused session-filter, navigation, motion and toolbar checks, followed by `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`.
- Execute root/project-prefix, desktop/mobile and light/dark directory transitions, including tagged/untagged destinations, and existing Guide/404/minimal-foundation matrices.
- `bun build.mjs`, `bun run format:check` and `git diff --check` must pass.

### Executed evidence — 2026-10-10

- Bun 1.4.2: `bun ci`, `bun run format`, `bun build.mjs`, `bun run format:check` and `git diff --check` passed. The build generated 68 short links.
- Required Chrome 155: focused session-filter, stable-toolbar, motion, toolbar and recovery/navigation checks passed; the final `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` run passed all 48 tests without skips or failures.
- The stable-toolbar browser matrix executed root/project prefixes, 390px/1440px, light/dark and normal/reduced motion. It verifies connected main/section/control/selected-button identity, exact text and selection direction, both tracks' scroll offsets, renderer-published incoming labels, subtree choices, untagged round trips, disclosure/feedback reset, Back/Forward, synchronous single-listener saves, and superseded HTML/copy/download suppression.
- Existing executed checks cover absent-subtree AND selections, native/BFCache latest-filter restoration, Guide/404 and empty-site boundaries, same-page fragments, complete-URL scroll/focus/history, no-JavaScript browsing, shared shell appearance and minimal-document/root/project recovery foundations. Different canonical bases and an enhanced empty-site round trip also explicitly use normal content replacement.
- No application dependencies were added. Deployment and a live GitHub Pages smoke test remain outside this local implementation run.
