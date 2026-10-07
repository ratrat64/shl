---
title: Consistent modular UI foundations
type: refactor
created: 2026-10-07
status: done
baseline_commit: 053844fe08b546f6a4690c029d19b09d00a92822
route: dispatch
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Reusing header markup has not prevented page-specific CSS from changing its appearance. Document wrappers, entry interpretation, theme declarations, and action styles also repeat responsibilities, allowing implementations to diverge.

**Approach:** Solidify the existing framework-free modular architecture with one owner per shared responsibility. Update the existing architecture spine, rewrite contradictory instructions, and align code with the contract. Reuse common document, theme, and style foundations on every HTML page. Links, nested directories, Guide, and 404 compose the same shell; destination and legacy redirects remain minimal. Shared header/footer are borderless everywhere; Guide content separators remain.

## Boundaries & Constraints

**Always:** Preserve validated link-map publication, escaping, launcher behavior, root/project-prefix routing, native navigation without JavaScript, accessible controls, and persistent shell behavior during app navigation. Share components by responsibility, with explicit purpose/state variants rather than page-identity overrides. Preserve stable architecture AD identifiers. Consolidate existing repeated responsibilities in touched modules, including link-field interpretation, directory traversal, theme tokens, document wrappers, and common control styles. Keep page-specific content local.

**Never:** Add a frontend framework, dependencies, a general component registry, or runtime application services. Do not change destinations, short-link paths, directory search semantics, tag disclosures, or launcher contracts. Do not treat identical markup as proof of rendered consistency or promise that every unrelated line of code is identical.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Shared shell | Home, nested directory, Guide, or 404 | Same header/footer components, geometry, tokens, controls, and responsive rules; only active navigation differs | 404 foundations work without resolving an asset base |
| Minimal documents | Destination redirect or legacy informational URL | Shared themed document foundations, no header/footer; existing canonical, refresh, and fallback links | Preserve context-specific escaping and native forwarding |
| 404 recovery | Wrong-case or missing path at root/project prefix | Existing map lookup; rebase shell links to discovered site base | Offline/missing maps show themed not-found content; no routing promise beyond existing relative fallback before base discovery |
| Theme | System preference, saved light/dark override, blocked storage | Same theme roles on all documents, including documents without a theme button | Storage failure cannot interrupt redirect/recovery |
| Link input | String/object leaves, nested directories, hidden/script/tags | One interpretation of fields; unchanged public map and rendered/searchable entries | Existing validation errors precede output replacement |

</frozen-after-approval>

## Code Map

- `src/layout.mjs`: existing escaping, navigation, shell; introduce one document foundation beneath shell composition.
- `src/styles.mjs`: tokens and global CSS; repeated light/dark declarations, action geometry, and directory-only chrome override.
- `src/browser.mjs`: theme/search/copy/navigation; theme early exit without control, body-class transition override.
- `src/pages.mjs`: Guide plus duplicated redirect/legacy/404 wrappers; preserve recovery's first-readable-map boundary.
- `src/directory.mjs`: row/group renderers; repeated normalization and recursive iteration between walking/listing.
- `src/links.mjs`: schema validation and builder link collection; share validated leaf interpretation without masking malformed-input errors.
- `src/build.mjs`: generated asset and page wiring; supply shared document resources without broken nested asset paths.
- `test/build.test.mjs`: build fixtures, VM browser simulations, and installed-Chrome layout checks; inline-script extraction assumptions need explicit script selection.
- `AGENTS.md`, UX `DESIGN.md`/`EXPERIENCE.md`, existing `ARCHITECTURE-SPINE.md` and `.memlog.md`: reconcile ownership, border rules, stale runtime/source pointers, and deferred modularity.

## Tasks & Acceptance

**Execution:**
- [x] Existing architecture spine and memlog -- ratify component ownership, dependency direction, variants, lifecycle, and verification; reconcile stale statements against current code.
- [x] `AGENTS.md` and UX design/experience documents -- replace conflicting page-specific chrome allowances with binding shared-component rules.
- [x] `src/layout.mjs`, `src/pages.mjs`, `src/browser.mjs`, `src/styles.mjs`, `src/build.mjs` -- compose shared document/shell foundations, robust 404 resources, distinct theme hook, borderless chrome, and grouped token/control declarations.
- [x] `src/links.mjs`, `src/directory.mjs` -- consolidate field interpretation and directory traversal while preserving validated output and UI behavior.
- [x] `test/build.test.mjs` -- adapt affected harness assumptions; verify matrix edge cases and rendered consistency at desktop/mobile in both themes, direct loads and in-app navigation.
- [x] `README.md` -- update component ownership and verification guidance where changed.

**Acceptance Criteria:**
- Given independently maintained pages, when they render a shared responsibility, then they compose its single owner instead of duplicating markup, logic, or declarations.
- Given all shell pages at equal theme/viewport, when loaded directly or through app navigation, then shared chrome has equal computed appearance apart from active navigation, and content styles do not override it.
- Given future builders reading repository instructions, when they implement UI, then the architecture, agent rules, and UX documents prescribe the same ownership and consistency contract.

## Implementation Notes

- Worktree: `/home/rat/Git/shl/shl-modular-ui`; baseline Bun 1.4.2 install and 20 tests pass. Agent skills/tooling are untracked in the main worktree; this task's committed code/docs are in the task worktree.
- Architecture AD-7–AD-9 and conflicting AGENTS/UX instructions are already drafted and synchronized; preserve these edits. Architecture linter passes with zero findings; final independent architecture gate remains with the parent after code verification. Implement remaining unchecked tasks, then report tests/matrix coverage. Do not commit/push/open PR from the implementation handoff; parent performs final workflow checks.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and disposition |
| --- | --- | --- |
| Edge: routing normalizes malformed unrelated tags | medium | `linkFields(entry)` may throw before forwarding and resume ancestor lookup. Recovery only needs URL extraction; share that operation and cover malformed metadata at the first readable map. Patch. |
| Blind 1: processing errors resume ancestor probing | medium | Same demonstrated malformed-tags failure; narrow URL interpretation fixes the reachable regression without altering lookup semantics. Patch with Edge finding. |
| Blind 2: redirects carry full component CSS | low | Exact embedded shared stylesheet is about 8.6KB; no measured performance failure or payload target exists. Minimal variant means no chrome. Splitting resource variants adds complexity without an established user-visible need; reject under low-impact complexity rule. |
| Blind 3: saved-theme first-paint flash | maybe-false | Asset-backed deferred theme loading predates this task; embedded theme runs synchronously after content. No first-paint trace demonstrates a new flash. Record unverified pre-existing theme-paint concern; defer pending browser paint evidence. |
| Blind 4: script-disabled 404 has pending heading | medium | Original 404 also defaults to Checking/One moment with noscript explanation. This task preserves its recovery states; pre-existing issue, defer. |
| Blind 5: rendered gate can skip | medium | Checks explicitly skip without Chrome; required invocation lacks an enforceable mode. Add a required-browser test mode and use it in CI/verification, preserving optional local runs. Patch. |
| Blind 6: navigation styles excluded too broadly | medium | Snapshot omits all nav color/border/decoration, including inactive links. Normalize active state explicitly and compare remaining styles. Patch. |
| Blind 7: footer placement/vertical position unchecked | medium | Snapshot omits y, so equality can miss displaced header or overlapping footer. Add explicit header-position/footer-flow assertions instead of comparing content-dependent footer y. Patch. |
| Blind 8: no rendered system preference | medium | Saved overrides or manually injected data-theme cover every rendered case. Default CSS media selection could regress undetected. Patch with Verification gap 2. |
| Blind 9: minimal forwards lack browser checks | medium | VM verifies JavaScript, not native refresh and fallback presentation. Add local-target native forward and parsed metadata checks using existing Chrome harness. Patch with Verification gap 3. |
| Blind 10: focus/hover/control interaction unchecked | medium | Resting snapshots omit focus outline and actual shared theme-control interaction. Add focused shared-control appearance/interaction assertions within the existing browser matrix. Patch. |
| Verification gap 1: equality permits borders everywhere | medium | Baseline equality and selector-specific regex cannot establish borderless chrome. Assert computed header-bottom/footer-top widths are zero. Patch. |
| Verification gap 2: native default palette bypassed | medium | Explicit overrides cannot detect a reversed prefers-color-scheme condition. Assert default computed palette under system-light and system-dark without setting data-theme. Patch. |
| Verification gap 3: native refresh target unchecked | medium | Presence and separate JS destination checks tolerate wrong refresh URLs. Assert resolved refresh/canonical targets and script-disabled local forwarding. Patch. |

## Verification

- `bun ci`, using Bun 1.4.2.
- `bun test --timeout 30000 ./test/build.test.mjs` -- existing regressions and focused new checks pass.
- `bun build.mjs` -- current link map builds successfully.
- Architecture linter and independent architecture/code review -- resolve actionable contract gaps before handoff.
- Reuse headless Chrome checks for light/dark, desktop/mobile, direct/app-navigation appearance. Simulated routing does not establish actual GitHub Pages fallback behavior; deployed routing smoke test remains required after deployment.
- `git diff --check` -- no whitespace errors.

### Implementation handoff evidence (2026-10-07)

- Bun 1.4.2: `bun ci` succeeded; `bun test --timeout 30000 ./test/build.test.mjs` passed 23 tests, with both installed-Chrome checks executed; `bun build.mjs` generated 26 links.
- Shared-shell matrix: Chrome computed-style/geometry comparisons for Links, nested directories, Guide, and missing nested URLs served as 404, at 390px/1440px, light/dark, root/project prefixes, direct/script-disabled loads, and applicable in-app transitions. Persistent header/footer/theme-control identity and Guide content separators are asserted. Native pages use their system-label baseline; the harness sets theme tokens externally because scripts are disabled.
- Minimal/theme matrix: shared embedded styles and exact theme script, no chrome, native refresh/canonical/fallback and JavaScript forwarding; saved light/dark, invalid/missing preferences, blocked reads/writes, and absence of a theme control. Explicit behavior-script selection replaces positional extraction.
- Routing/input matrix: existing wrong-case links/directories, hidden entries, nested root/project paths, public-map preservation, escaping, search/tags/copy, launchers, and invalid-input-before-replacement checks pass. Added assertions for shell-link rebasing, offline nested relative fallback, and first-readable-map termination.
- Resources are composed by the document owner; existing `src/build.mjs` wiring already publishes those same shared styles/theme definitions and needs no additional asset paths. Minimal documents and 404 embed foundations to avoid path-dependent resources.
- Stable scrollbar gutter fixes a real rendered short/long-page geometry difference. No page-identity chrome selectors or body-class transitions remain.
- Architecture linter returned `ok: true` with zero findings; `git diff --check` passed.
- Independent architecture/code gates and deployed GitHub Pages smoke testing remain with the parent; this implementation handoff does not commit, push, or open a PR.

### Reconciliation corrections

- Independent architecture input checks exposed stale hidden-link exclusions, runtime/file pointers, and action colors in the live PRD/addendum/epic inventory. Rewrote them against current product and architecture rather than leaving contradictory downstream rules. Historical completed specs and append-only decision history remain evidence snapshots.
- Architecture gate clarified acyclic imports, read-only source versus view-owned projections, navigation resets/history/focus/failure behavior, dual-use component hook contracts, unbounded existing recovery requests, and executed-versus-skipped browser evidence.
- Removed the inappropriate `aria-hidden` from the numeric live heading to satisfy the existing accessibility contract; consolidated root/child count aggregation and repeated tag-label/legacy-URL derivation. The 23-test suite passes after these corrections.

### Final verification and review

- Patched the demonstrated routing regression with shared `linkUrl`, leaving tag normalization outside recovery; matching malformed metadata cannot make recovery probe a parent map. Root/project-prefix regression tests cover the failure.
- Required-browser mode is enforced in CI. Shared Chrome helpers and the existing matrix now check explicit zero chrome borders, header/footer flow, inactive navigation styles, focus and hover-rule states, actual theme-control interaction, no-override system-light/system-dark palettes, parsed native refresh/canonical targets, script-blocked local forwarding, and minimal fallback layout.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`: 24 passed, zero failed, browser checks executed. `bun build.mjs`: 26 links. Architecture linter: zero findings. `git diff --check`: passed.
- Independent architecture rubric/divergence gates pass after clarifications; routing and verification-gap reviewers confirmed their patches closed. Code triage records all findings; the pre-existing script-disabled 404 copy and unverified theme first-paint concern are deferred in `deferred-work.md`. No known unresolved task-contract blocker remains.
- Post-deployment GitHub Pages routing smoke testing remains the recorded operational requirement; local browser/VM checks do not claim deployed behavior.
