---
title: 'Persistent search and tag filters across shl navigation'
type: 'feature'
created: '2026-10-09'
status: 'done'
baseline_commit: 'a268ff660ad0d1b2c0377134be68a736c9e11597'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Cross-page mounts currently discard the visitor's filters. Browsing another directory, visiting Guide or 404, reloading, and using history should retain the latest shared filters.

**Approach:** One site-scoped browser-tab session record stores exact search text, insertion-ordered canonical selected identities, and picker visibility in sessionStorage. Each searchable directory applies it to its own subtree; searchless pages preserve it.

## Boundaries & Constraints

**Always:** Namespace by canonical site base from generated links/metadata, never arbitrary directory/unknown-404 paths. Validate stored data; tolerate malformed JSON and inaccessible storage, retaining document-memory state for app navigation. Save immediately after user edits/token processing, selection/removal and visibility changes. Restore without token commitment. Retain selected tags absent from the subtree as visible removable chips; AND filtering may yield zero. Available tags remain subtree catalog minus selections, never separately stored. Clone renderer-owned labels/colors without browser hashing. Preserve clearing-text semantics, hidden admission, catalog order, accessibility, focus, scroll, theme/shell identity, cleanup, stale-work suppression and native fallbacks. Back/Forward uses latest shared state, not historical snapshots. Cross-page mounts reset only transient feedback and disclosures; filtering expands matches. Fragments retain live controls.

**Never:** Add dependencies/frameworks, localStorage filter persistence, URL/history snapshots, or search controls to Guide, 404, minimal documents or empty directories. Searchless mounts must not overwrite saved state. Keep historical evidence historical while amending live contracts.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected behavior | Error handling |
| --- | --- | --- | --- |
| Directory transition | Search, ordered tags, open picker | Restore exactly; apply destination AND/text filter | Absent-subtree chips remain removable |
| Searchless transition | Guide/404/empty/minimal document | Saved record untouched | Unknown 404 base never selects a namespace |
| Reload/native/history | Existing session record | Latest shared state, not entry snapshot | Storage failure falls back to memory during app navigation |
| Token restoration | Pending or unknown input, including delimiters | Exact text, no new commit/error | Transient token feedback clears |
| Removal/clear | Restored chip or cleared text | Persist removal; clearing text retains selections | Returned local tag resumes catalog order |
| Bad storage | Malformed JSON/types/identities or throwing access | Usable fresh controls or existing in-memory record | No exception escapes |
| Site isolation | Root and same-origin project sites | Independent base-path records | Future independent session starts fresh |
| Outgoing work | Detached controls or obsolete navigation | No duplicate listeners or stale state writes | Existing cancellation/native fallback retained |

</frozen-after-approval>

## Code Map

- `src/assets/search.js`: `initSearch`, catalog/selections, chips/select, token processor, filter/update and cleanup. Own shared record and synchronous save/restore here; retain token and predicate logic.
- `src/assets/navigation.js`: sole mount/cleanup controller, same-page branch, fetch replacement/history/native exits. Preserve identity/scroll/focus; resolve generated base metadata before mounting and guard obsolete writes. Account for persisted native Back restoration.
- `src/directory.mjs`: tagCatalog/tagIdentity/tagStyle and directory tools own identity/label/color markup. Reuse one chip renderer for subtree choices and inert site-wide restoration metadata.
- `src/build.mjs`: complete validated map is available when rendering root/nested directories; pass shared metadata without mutating borrowed entries.
- `src/layout.mjs`: depth and generated site links establish regular-page canonical base. 404's depth is not a known base.
- `src/pages.mjs`, `src/assets/recovery.js`, `src/browser.mjs`: searchless/minimal boundaries, readable-map shell rebasing, native/embedded identical behaviors. Preserve recovery ownership and stale guards.
- `test/build.test.mjs`: existing fixtures, browserServer, browserControls CDP, colored-filter/navigation/404/state matrices. Replace reset assertions rather than creating a harness.

## Tasks & Acceptance

**Execution:**
- [x] `src/directory.mjs`, `src/build.mjs`, `src/layout.mjs` — publish canonical base and reusable restoration chip metadata; keep available choices local.
- [x] `src/assets/search.js`, `src/assets/navigation.js` — implement validated session record with memory fallback, exact noncommitting restoration and synchronous mutation saves; preserve lifecycle/native behavior.
- [x] `src/pages.mjs`, `README.md`, `docs/reference.md`, `docs/development.md`, `AGENTS.md` — document session scope and updated contributor/navigation expectations.
- [x] `aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md`, adjacent UX `PRODUCT.md`, `DESIGN.md`, `EXPERIENCE.md`, `aid-docs/specs/spec-colored-tag-filters/{SPEC.md,tag-filter-behavior.md,architecture-alignment.md}` — replace live page-local/reset prohibitions, especially AD-1/AD-9; retain historical specs/reviews/logs.
- [x] `test/build.test.mjs` — replace reset expectations and extend existing harness for the matrix, exact labels/colors and stale/duplicate-listener regressions.

**Acceptance Criteria:**
- Given saved filters, when Links → directory → another directory, Directory → Guide → Links, or Directory → 404 → Links occurs, then controls and filtered results reflect the same latest record with unchanged shared shell identity.
- Given an absent-subtree selection, when restored and removed, then its renderer-colored chip remains available for removal, results enforce AND, and local available choices retain canonical order.
- Given native loads/reload/Back/Forward or same-page fragments, when visited under root/project prefixes, then shared filters persist according to session scope while transient feedback/disclosures follow mount rules.
- Given empty/all-hidden directories or malformed/unavailable storage, when mounting or editing, then controls/native foundations remain usable and searchless pages do not clear state.
- Given cleaned outgoing content, when old controls/events or asynchronous results complete, then no saved state or new content is mutated and each active interaction runs once.

## Implementation Notes

- Search owns `shl:filters:v1:<canonical-base-path>` records. App mounts prefer document-memory state so failed writes cannot restore stale readable storage; fresh documents and persisted native `pageshow` refresh from guarded session storage. Initialization/cleanup do not write storage.
- One renderer-owned chip helper supplies local choices and inert site-wide restoration templates. Generated canonical base metadata is resolved against the incoming page URL before mounting. Searchless/404/minimal pages never select or write filter records; recovery and embedded asset composition retain existing owners unchanged.
- Navigation pauses outgoing search handlers during cross-page fetches, resumes existing controls when a fragment intent supersedes the request, and cleans detached listeners. Persisted native Back mounts reset disclosures and consume latest shared state once.
- Live contracts and Guide explain tab/site scope; historical evidence remains unchanged. No dependencies, routing or publication migration was introduced.

### Executed verification — 2026-10-10

- Bun 1.4.2; `bun ci`, `bun run format`, `bun run format:check`, and `bun build.mjs` succeeded (68 short links).
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`: 42 passed, 0 failed; all browser gates executed using installed Google Chrome.
- Existing colored-filter, native keyboard/touch, shell, 404/history and state matrices cover directory transitions, fragments, latest app Back/Forward, all-hidden/untagged/native foundations, focus/scroll/theme/shell identity and listener cleanup.
- Added CDP session matrix covers root/project × light/dark × 390/1440px: exact noncommitting pending/unknown restoration, ordered absent-subtree chips with exact labels/style/computed colors, AND-zero results, canonical local availability/removal, Guide/404 preservation, detached/pending/stale-fetch writes and superseding fragments, throwing storage access and write-only quota failures, malformed JSON/types/unknown/noncanonical/duplicate identities, native repeated loads/Back/Forward and persisted-pageshow single mounting, independent site bases, empty-site preservation, and fresh storage after session clearing.
- Existing rendered contrast gate passed 54,592 generated and 46,080 envelope surface checks, minimum 4.6279:1. Redirect/minimal and root/project recovery checks passed. Routing semantics were unchanged, so no deployed routing smoke proof was needed.
- Post-review patches preserve failed-write memory while storage is unchanged (including empty readable storage), accept newer native records, and distinguish successful record removal from unavailable reads. Paused input is read-only and resumes consistently without stale saves. Absent selected tokens use the duplicate path. Actual native BFCache traversal proves document identity, latest filters, chip/search focus, scroll and single mounting; picker exhaustion is verified with foreign selections.
- Final full verification after review patches: Bun 1.4.2; formatting and format-check passed; required-Chrome suite 42 passed, 0 failed in 64.36 seconds; build succeeded with 68 short links. No findings deferred.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and route |
| --- | --- | --- |
| Blind 1: paused edits diverge on fragment resume | medium | Handlers are paused but native input remains editable; resume only flips active. Patch: make paused input read-only and reconcile suppressed input on resume without saving obsolete edits. |
| Blind 2: failed write lost on persisted Back | medium | refreshStorage replaces memory with any valid older storage record after a caught write failure. Patch: retain unsaved memory during refresh. |
| Blind 3: removed storage record resurrected | low | A successful null read leaves existing memory on persisted restoration. Patch: distinguish absent record from inaccessible storage and restore fresh defaults after successful removal. |
| Blind 4: untagged picker cannot close | false | Existing live contract expressly disables the no-tag picker; restored visibility is a persisted preference and there are no actionable local choices. No selection or saved state is lost; changing this is not required. |
| Blind 5: absent selected token not idempotent | medium | Token recognition checks local catalog before existing selections, producing unknown feedback for a selected identity. Patch: admit already-selected identities to the existing duplicate path. |
| Blind 6: removed site-wide tag invalidates record | false | Stored identities are validated against renderer-owned site metadata; unknown stored identities are malformed under this implementation. Deployment reconciliation for removed tags is not specified; absent-subtree identities within the site are retained and tested. |
| Blind 7: persisted chip focus discarded | medium | selected.replaceChildren removes the focused selected chip during persisted pageshow mounting. Patch: retain focused identity and focus its replacement or search without changing scroll. |
| Blind 8: actual BFCache proof absent | medium | Native history is exercised, but persisted-pageshow evidence is synthetic and does not prove cached-document ordering. Patch: extend existing CDP history proof with actual persisted lifecycle and document identity where the harness permits BFCache. |
| Blind 9: site metadata build/output costs | maybe-false | Repeated site-wide traversal and metadata are real; no measured slowdown or scale target establishes user harm at this project's hundreds-of-links scope. Low unverified scaling concern rejected rather than introducing another asset or cache. |
| Blind 10: independent session opener inheritance | false | sessionStorage intentionally follows native tab-session semantics; copied opener/duplicated sessions are not independent sessions. A new independent context starts without this site's record; localStorage is not used. |
| Edge 1: failed write lost on persisted Back | medium | Same verified defect as Blind 2; patch with shared unsaved-memory restoration guard. |
| Verification 1: local picker exhaustion with foreign selections untested | medium | Existing tests check local order but not exhaustion in the foreign-selection case; the old size comparison would pass. Patch: assert both local exhaustion states while foreign selections remain. |

## Design Notes

Keep state in the existing search behavior's document-lifetime closure, with a small versioned record and guarded storage access. Publish inert renderer-owned site-wide chip metadata separately from local availability. Initialization/cleanup never save defaults. No irreversible migration or deployment is required; scope spans browser lifecycle, rendering, tests and live contracts, so this follows the dispatch approval route.

## Verification

- `bun --version` — 1.4.2.
- `bun ci` — locked dependencies installed in task worktree.
- `bun run format` and `bun run format:check` — clean application formatting.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` — all regressions and executed light/dark desktop/mobile root/project browser matrices pass; set CHROME_BIN when needed.
- `bun build.mjs` — validated static generation succeeds.
- Inspect git status/diff/history; commit intended files, push task branch and open PR against main. Check latest-main merge conflicts and report PR URL/status. Routing behavior remains unchanged; any discovered routing change requires deployed Pages smoke proof.
