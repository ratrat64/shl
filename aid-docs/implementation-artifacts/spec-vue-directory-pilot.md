---
title: Vue directory pilot
type: refactor
created: '2026-10-27'
status: done
followup_review_recommended: false
deferred:
  - summary: >-
      Deployed GitHub Pages browser smoke verification remains outstanding.
    evidence: |-
      Local generated HTTP-404 root/project-prefix matrices pass. This unmerged task branch has no configured preview deployment; production currently serves main. A deployed pilot revision is required to establish actual Pages fallback behavior. Do not merge automatically to obtain it.
    location: >-
      GitHub Pages root/project-prefix recovery
    severity: low
route: dispatch
review_loop_iteration: 0
context:
  - '{project-root}/aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md'
  - '{project-root}/aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md'
baseline_commit: ada54d867926dbd12b60f6a83e780580a02b9116
baseline_revision: ada54d867926dbd12b60f6a83e780580a02b9116
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Directory rendering/filtering requires manual DOM reconciliation and complex session/navigation coordination. The maintainer selected Vue based on experience.

**Approach:** Share Vue rendering between build and browser. Replace imperative reconciliation and measure simplification before further migration.

## Boundaries & Constraints

**Always:** Authorize Vue for directories; synchronize conflicting live guidance. Preserve appearance, metadata, accessibility, filtering/editing, sessions and AD-3/4/5/8/9 contracts. Retain shell/navigation/recovery/theme/copy/download ownership and connected toolbar/input/tracks/chips during eligible transitions. Save synchronously only after mutations. Preserve native browsing, automatic-prefix hosting, embedded 404, minimal pages/map/launchers.

**Never:** Add Nuxt/Router/Pinia/backend, renderer modes, duplicated markup/state or redesign. No imperative-search wrapper, weakened assertions or counting code moves as savings.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Native | Root/nested/Guide, JS disabled | Complete listing/examples, native links/details/popovers, usual hidden exclusion | Existing explanations |
| Filters | Reserved tags, unknown tokens, IME/paste/caret | Existing matching/focus/feedback, shared colors/labels, synchronous saves | Storage failure uses memory |
| Browse/history | Absent tags, shorter catalogs | Connected controls/caret/track scroll; fresh subtree/count; transient reset | No stale mutations/saves/forwarding |
| Boundaries | Guide/empty/different-base/BFCache | Correct mounts, latest session, no unknown-404 namespace | Native fallback |
| Recovery | Unknown root/project HTTP 404 | Embedded bootstrap, canonical recovery | Relative fallback |

</frozen-after-approval>

## Code Map

- `src/directory.mjs` — rows/tools/catalog/tag metadata/Guide examples.
- `src/links.mjs` — validation/loading/tree; filesystem/YAML must stay build-only.
- `src/assets/search.js` — editing/storage/disclosures/motion/reconciliation.
- `src/assets/navigation.js` — cancellation/mounts, retained-directory branch, persisted pageshow.
- `src/browser.mjs`, `src/layout.mjs`, `src/build.mjs`, `src/pages.mjs` — external/embedded publication; fixtures build from unrelated working directories.
- `test/build.test.mjs` — parity/metadata/identity; stub directory behavior before VM runtime evaluation.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `bun.lock` — pin Vue, prove Bun 1.4.2 rendering/bundling; use its server-renderer export.
- [x] `src/directory-model.mjs`, `src/directory-components.mjs`, `src/directory.mjs` — share browser-safe data, Vue rendering and Guide rows; remove replaced string rendering.
- [x] `src/directory-state.mjs`, `src/assets/search.js` — preserve parser/session rules with one reactive controller; replace filtering/chip/count DOM reconciliation.
- [x] `src/assets/navigation.js` — update retained Vue instance with incoming data; distinguish updates from unmounts, preserving services/cancellation.
- [x] `src/browser.mjs`, `src/build.mjs`, `src/layout.mjs`, `src/pages.mjs` — publish one self-contained runtime externally and embedded; safely serialize data/source; retain validate-before-output-replacement.
- [x] `test/build.test.mjs` — retain browser assertions, add hydration/SSR/bundle/hostile-data proof and pure policy checks; stub Vue before navigation VM evaluation; await DOM flushes without delaying synchronous-save checks.
- [x] `AGENTS.md`, architecture spine, `PRODUCT.md`, `DESIGN.md`, `EXPERIENCE.md`, `docs/development.md` — document the authorized boundary, ownership and build/test commands; remove conflicting live prohibitions.

**Acceptance Criteria:**
- Given generated baseline HTML, when hydration starts, then no mismatch or node-replacement warnings occur and one component definition owns static/enhanced markup.
- Given repeated directory/history transitions, when controls are exercised, then existing identity, accessibility, session and cancellation assertions pass with one effective handler.
- Given the completed pilot, when implementation is compared with baseline, then report handwritten code added/removed including adapters/build wiring and demonstrate one representative control change; reject duplicated owners or adapters that defeat simplification.

## Implementation Notes

- Approved explicitly by the maintainer on 2026-10-27; retain the existing frozen intent and specification. Implementation worktree: `/home/rat/Git/shl/shl-vue-directory`, existing branch `feat/vue-directory-pilot`.
- Baseline: Bun 1.4.2, `bun ci`, required-browser suite: 50 pass / 0 fail (152.69s). HEAD equals origin/main, including research PR #106. First suite invocation hit the tool's 120s limit; rerun with adequate command timeout passed.
- Investigation: share one Vue SSR/hydration island and browser-safe model; replace string rows/tools and imperative chip/count/filter reconciliation, retaining native editing/session/disclosure/motion policies. Keep input uncontrolled for undo/caret. Hydrate SSR defaults before restoring session without saving. Key selected chips by canonical identity and refresh only content on retained updates.
- Navigation must extract inert model data before removing fetched scripts, update the retained instance rather than replacing Vue children, resolve incoming relative links against incoming URL, and check cancellation after asynchronous flushes. Keep feedback text owned by copy/download services. Module-relative bundle resolution is required for temporary-directory fixture builds.
- Existing harness needs semantic SSR serialization assertions, Vue flush waits (synchronous-save assertions stay synchronous), and directory lifecycle stubs before fake-DOM navigation evaluation. Preserve node/connectivity/caret/undo/metadata/cancellation assertions. Include hostile NUL/CR/script-ending data and hydration identity checks.

## Spec Change Log

## Review Triage Log

### Review fixes — 2026-10-27

- Native-navigation cleanup now retains the live Vue island/current model; destructive unmount is confined to application-content replacement. Follow-up review corrected the still-live interaction boundary: cancel obsolete recovery/copy/download work, resume search and bind fresh copy/download handlers immediately, without requiring fragment navigation. Focused Chrome regressions cover unresolved mailto/attachment intent followed directly by filtering, picker mutation with synchronous save and new copy/download actions, suppression of obsolete copy/download completion, persisted restoration after a fetched directory (whose model script was stripped), and actual BFCache restoration after a retained directory transition.
- Enhanced-navigation catch-path fallback and same-page native replacement now reuse that behavior through one `nativeExit` helper, shared with ordinary native clicks. A focused browser fixture shadows only navigation's `location.assign`/`replace` boundary to simulate a nondeparting attachment/non-app fallback. It checks connected controls, synchronous filter saves, picker/copy/download usability, aborted requests and stale local/obsolete fetched-page suppression without title/history/current-nav/focus changes.
- Directory disclosure watches each result-node update, reapplying matching expansion after a visitor manually closes a match while keeping pre-filter disclosure state. Persisted session restoration resets only changing directory content, then renders current matches expanded even when filter values are unchanged.
- Restored selections rebuild the reactive Map in exact authoritative record order, reusing surviving metadata and canonical keyed chip nodes. The reordered-record regression asserts identity/metadata and the next synchronous storage write before awaiting DOM flushes. Existing BFCache coverage now requires a surviving focused chip to remain connected rather than requiring replacement.
- Bundler entry resolution uses `fileURLToPath`; a copied-source fixture in a checkout path containing spaces, `#` and `%` successfully bundles from its encoded module URL.
- DOM text/attribute projection applies `toWellFormed()` as well as NUL replacement. Serialized models, tag identities and color seeds retain their original UTF-16. Hostile hydration coverage now includes lone high/low-surrogate tags and titles, warning-free SSR identity, and lossless selected-tag saves.
- A gated `directoryTick` regression supersedes navigation after the incoming mount begins, releases the obsolete flush after the newer intent completes, and checks title, URL/history pushes, active navigation and focus remain those of the newer intent.
- At implementation handoff these changes were uncommitted; parent verification/finalization is recorded below. Deployed Pages smoke proof remains distinct.

### 2026-10-27 — Review pass: individual finding dispositions

- verdicts: 24 findings — high 0, medium 14, low 3, false 7, maybe-false 0
- Blind Hunter:
  - `[medium]` `[patch]` Native navigation destructively unmounted live content — retain the island, cancel stale operations, resume controls and rebind local services through shared nativeExit; unresolved protocol/attachment regression passes.
  - `[medium]` `[patch]` Fetched pages have no inert model after script stripping — native exit now retains the mounted instance/current model; actual fetched-page BFCache restoration passes without remounting from removed data.
  - `[medium]` `[patch]` Retained transitions leave initial serialized model stale — live instance remains authoritative across native exit/BFCache; regression restores the latest retained beta subtree, not initial alpha/root data.
  - `[medium]` `[patch]` Manually collapsed matching folders did not reopen on another matching query — observe each result projection and reapply forced expansion, preserving pre-filter visitor disclosure; regression passes.
  - `[medium]` `[patch]` Persisted restoration closed unchanged matching groups — refresh changing-content key and re-expand active matches; nested actual BFCache regression passes.
  - `[medium]` `[patch]` Reordered stored tags restored in stale Map order — restore authoritative insertion order while reusing metadata/keyed chip nodes; next synchronous-save assertion passes.
  - `[low]` `[patch]` Encoded checkout paths broke bundle entry resolution — fileURLToPath plus spaces/#/% source fixture passes under Bun 1.4.2.
  - `[low]` `[patch]` Lone-surrogate metadata mismatched UTF-8 SSR projection — normalize only DOM text/attributes with toWellFormed, retaining raw model/identities; hostile-data hydration regression passes.
  - `[false]` `[reject]` Missing isolated runtime benchmark makes overhead evidence insufficient — scope requires parity and simplification/integration-overhead accounting, not a latency target; handwritten net growth and raw/gzip bundle bytes are explicitly measured, and suite duration is expressly not a benchmark. No speed improvement is claimed.
  - `[low]` `[defer]` Deployed Pages recovery unverified — pre-existing deployment-proof boundary; local matrix passes but an unmerged pilot has no preview deployment. Recorded separately without claiming deployed parity.
- Edge Case Hunter:
  - `[medium]` `[patch]` Attachment native exit emptied listing — same nativeExit correction and direct still-live interaction regression as above.
  - `[medium]` `[patch]` BFCache unchanged nested filters stayed closed — changing-content reset plus matching expansion regression resolves it.
  - `[medium]` `[patch]` Native Back lost reordered surviving selections — authoritative Map-order restoration and identity/save assertions resolve it.
- Verification Gap Reviewer:
  - `[medium]` `[patch]` New asynchronous mount supersession boundary lacked proof — gate directoryTick after mount starts; newer intent completes before release, obsolete continuation cannot change title/history/nav/focus.
  - `[medium]` `[patch]` Persisted-page active matches collapsed — covered by unchanged-filter nested BFCache restoration regression.
  - `[medium]` `[patch]` Session-refresh order gap — reversed surviving-tag record plus next synchronous mutation regression added.
- Intent Alignment Auditor (six descriptive surface observations, assessed individually):
  - `[false]` `[reject]` Overall maintenance simplification not established — accepted as a measurement limitation, not an unfulfilled reduction threshold. One shared renderer and removal of manual reconciliation are actual localized simplifications; net growth is honestly reported.
  - `[false]` `[reject]` Published-label checks are not a timed source-edit experiment — no such experiment is required; the shared labels definition and retained-navigation metadata regression establish the representative single-owner control responsibility.
  - `[false]` `[reject]` DOM observations moved after Vue flush — synchronous-save assertions remain before yielding; no contract requires synchronous DOM rendering within event handlers.
  - `[false]` `[reject]` VM lifecycle is stubbed — browser matrices execute the actual integration; VM tests intentionally isolate navigation and do not claim Vue integration proof.
  - `[false]` `[reject]` Native policies remain outside declarative view owner — approved boundary explicitly retains lifecycle/native services; replaced filtering/chip/count reconciliation has no parallel legacy owner.
  - `[false]` `[reject]` Local hosting proof differs from deployment proof — distinction is explicitly documented and deployed follow-up retained, not misrepresented as completed.
- Follow-up verification:
  - `[medium]` `[patch]` Nondeparting native exit preserved nodes but left controls inactive — resume search and install fresh copy/download handlers; assert filtering/picker/new actions work immediately, suppress stale completions.
  - `[medium]` `[patch]` Enhanced-navigation catch fallback bypassed resumed-native behavior — share nativeExit across click, assign and replacement paths; nondeparting fallback/stale-navigation regression passes. Independent reviewer confirmed resolution by final read-only inspection.

## Design Notes

Use `.mjs` Vue render functions and Bun bundling, avoiding template compilation. Hydrate defaults before restoration; retain native disclosure/input state. Pass normalized data/metadata to retained instances without navigation swapping Vue-owned children. Await Vue DOM flushes, but save synchronously. Embed the same self-contained bundle without remote imports/chunks.

## Verification

Baseline before edits; focused checks then `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`, `bun build.mjs`, `git diff --check`. Execute root/project, desktop/mobile, light/dark, native/enhanced/minimal/recovery matrices. Record overhead/evidence and publish PR. Deployed smoke proof remains distinct.

### Original implementation evidence — 2026-10-27 (before review fixes)

- Bun 1.4.2; `bun ci` baseline installed successfully. Baseline required-browser suite: **50 pass / 0 fail**, 155.22s in this session.
- Final `bun ci` verified the pinned lockfile without changes. `bun run format`, `bun run format:check`, required-browser full suite: **52 pass / 0 fail**, 205.95s; `bun build.mjs`, `git diff --check`, and staged diff whitespace check all passed. No browser skips. Suite duration is not an isolated runtime benchmark.
- The new hydration test executes root and project-prefix root/nested loads, checking all captured SSR elements stay connected, no warnings/errors, no initialization writes, no script injection, exact hostile NUL/CR/script-ending model values and synchronous lossless token saves. It checks identical external/embedded directory bundle bytes, no remote imports/chunks and no browser color hashing.
- Existing matrices execute light/dark, desktop/mobile, script-disabled native listings/Guide/minimal pages, generated HTTP-404 recovery, copy/download cancellation, IME/paste/native undo/caret, same-base retained identity/scroll/metadata, shorter/untagged/empty/different-base boundaries, history and actual BFCache. The contrast matrix retained its **4.6279:1** generated minimum across 46,912 generated and 46,080 envelope surface checks.
- Test updates await Vue flushes for DOM observations and compare CSS serialization semantically with `style.cssText`; synchronous storage assertions remain before awaits. Fake-DOM navigation tests stub the directory lifecycle before evaluating navigation. The style-projection matrix reloads after intentionally mutating native DOM visibility, before testing filter predicates.

### Simplification and overhead

After review fixes, compared with baseline `ada54d867926dbd12b60f6a83e780580a02b9116`, `git diff ada54d867926dbd12b60f6a83e780580a02b9116 --numstat -- src package.json` reports **966 handwritten lines added / 530 removed (net +436)**, including all runtime adapters, model extraction, SSR and build wiring. Test changes add 462/remove 140 lines; dependency lockfile and documentation are separate. These are formatted physical lines, not a claim of reduced total code. Entry helpers and color/download policies moved between files are **not counted as savings**.

The old string listing/tools renderer and imperative filtering, chip creation/removal/visibility, result-count text and picker reconciliation have been replaced by one Vue component definition and reactive state. Parser, storage, motion and navigation policy still require native integration. Published row search text and pure matching consume one shared definition, including tag deduplication. No parallel legacy renderer or imperative-filter wrapper remains. After review fixes the directory runtime is **83,416 bytes raw / 33,163 bytes gzip**, including Vue; no CDN or runtime package server is required.

Representative control change: `directoryModel().labels` publishes the count and picker labels once; `Directory` renders their SSR and enhanced states from that metadata. Existing published-label tests change the incoming singular/plural and collapsed/expanded labels, then exercise filtering and toggle transitions after retained navigation; all pass. `TagChip` likewise owns available/selected accessible labels through one render function rather than browser-created replacement markup.

The pilot establishes shared ownership and removes manual reconciliation, but **does not demonstrate a net handwritten-code reduction**. Do not justify a broader migration on size savings from this pilot. Further Vue expansion requires a separate decision. Deployed GitHub Pages browser smoke testing remains outstanding; local recovery matrices do not establish deployed hosting behavior.

### Focused review-fix verification — 2026-10-27

- `SHL_REQUIRE_BROWSER=1 bun test --test-name-pattern='directory review regressions|directory bundle resolves|Vue SSR|session filters|stable directory tools|colored tag filters|app navigation swaps' --timeout 30000 ./test/build.test.mjs`: **8 pass / 0 fail / 46 filtered out**, 28.84s. Only affected hydration/bundling, directory filtering/session/identity and navigation checks ran; no browser skips.
- Prettier write/check targeted only `src/assets/navigation.js`, `src/assets/search.js`, `src/directory-components.mjs`, `src/browser.mjs` and `test/build.test.mjs`; all pass. `git diff --check` passes. Bundle overhead was remeasured with Bun 1.4.2.
- Follow-up unresolved-native interaction fix: `SHL_REQUIRE_BROWSER=1 bun test --test-name-pattern='directory review regressions|app navigation swaps' --timeout 30000 ./test/build.test.mjs`: **3 pass / 0 fail / 51 filtered out**, 2.18s. Prettier write/check targeted only navigation and its test file; `git diff --check` passes. No full suite, commit or push was performed.
- Shared native-exit/fallback fix: `SHL_REQUIRE_BROWSER=1 bun test --test-name-pattern='enhanced navigation fallback|directory review regressions|app navigation swaps' --timeout 30000 ./test/build.test.mjs`: **4 pass / 0 fail / 51 filtered out**, 3.89s. Targeted navigation/test formatting and whitespace checks pass. Full verification remains with the parent; changes remain uncommitted and unpushed.

### Final parent verification — 2026-10-27

- Bun **1.4.2**; `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`, `bun build.mjs`, `git diff --check`: all pass. Full required-browser suite **55 pass / 0 fail**, 183.30s, no skipped browser matrix.
- Matrix audit: native root/nested/Guide and minimal pages run in shared-shell/state checks; filter/editing/storage rows run in colored-tag/session/native-edit tests; browse/history/shorter catalogs run in retained-tools and BFCache checks; searchless/different-base/unknown namespace run in session/navigation/recovery tests; root/project HTTP-404 recovery runs in browser recovery/history matrices. All covering checks ran in the full successful suite.

## Auto Run Result

Status: done.

- Implemented pinned Vue SSR/hydration directory pilot and static Guide examples. Preserved shell/navigation/recovery/theme/copy/download ownership, retained connected controls and session/native browsing contracts.
- Files: `src/directory-components.mjs` owns shared render functions; `src/directory-model.mjs` owns browser-safe metadata/matching; `src/directory-state.mjs` owns reactive view state; `src/directory.mjs` owns SSR/model publication; search/navigation integrate editing, lifecycle and retained updates; browser/build/layout/pages publish/compose the island; links retains build-only validation. Package/lock pin Vue; tests retain parity assertions and add targeted regressions; AGENTS/architecture/product/design/experience/development guidance synchronize the approved boundary.
- Review: six grouped patch responsibilities (four medium: native lifecycle, disclosures, session order, mount-cancellation coverage; two low: encoded paths and ill-formed DOM projection). All repaired with runnable checks. One deployed-verification follow-up deferred; seven rejected observations and reasons are recorded individually above. Final targeted independent review found no remaining concrete defect.
- Follow-up review recommended: false. The patched medium risks now have explicit regression coverage and independent lifecycle reinspection; no specific unverified implementation risk remains. This is not evidence for broader migration.
- Parity verified through the final 55-test required-browser suite, formatting, installation/build and whitespace checks. Actual simplification is shared markup ownership and deleted imperative reconciliation; total handwritten application code grows **436 lines**, including integration. Runtime **83,416 raw / 33,163 gzip bytes**. No overall size/performance improvement is claimed.
- Residual limitation: deployed pilot Pages smoke test requires a deployed revision; current PR remains unmerged by instruction.
