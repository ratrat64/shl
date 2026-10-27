---
title: Vue directory pilot
type: refactor
created: '2026-10-27'
status: in-review
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

## Design Notes

Use `.mjs` Vue render functions and Bun bundling, avoiding template compilation. Hydrate defaults before restoration; retain native disclosure/input state. Pass normalized data/metadata to retained instances without navigation swapping Vue-owned children. Await Vue DOM flushes, but save synchronously. Embed the same self-contained bundle without remote imports/chunks.

## Verification

Baseline before edits; focused checks then `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`, `bun build.mjs`, `git diff --check`. Execute root/project, desktop/mobile, light/dark, native/enhanced/minimal/recovery matrices. Record overhead/evidence and publish PR. Deployed smoke proof remains distinct.

### Executed evidence — 2026-10-27

- Bun 1.4.2; `bun ci` baseline installed successfully. Baseline required-browser suite: **50 pass / 0 fail**, 155.22s in this session.
- Final `bun ci` verified the pinned lockfile without changes. `bun run format`, `bun run format:check`, required-browser full suite: **52 pass / 0 fail**, 205.95s; `bun build.mjs`, `git diff --check`, and staged diff whitespace check all passed. No browser skips. Suite duration is not an isolated runtime benchmark.
- The new hydration test executes root and project-prefix root/nested loads, checking all captured SSR elements stay connected, no warnings/errors, no initialization writes, no script injection, exact hostile NUL/CR/script-ending model values and synchronous lossless token saves. It checks identical external/embedded directory bundle bytes, no remote imports/chunks and no browser color hashing.
- Existing matrices execute light/dark, desktop/mobile, script-disabled native listings/Guide/minimal pages, generated HTTP-404 recovery, copy/download cancellation, IME/paste/native undo/caret, same-base retained identity/scroll/metadata, shorter/untagged/empty/different-base boundaries, history and actual BFCache. The contrast matrix retained its **4.6279:1** generated minimum across 46,912 generated and 46,080 envelope surface checks.
- Test updates await Vue flushes for DOM observations and compare CSS serialization semantically with `style.cssText`; synchronous storage assertions remain before awaits. Fake-DOM navigation tests stub the directory lifecycle before evaluating navigation. The style-projection matrix reloads after intentionally mutating native DOM visibility, before testing filter predicates.

### Simplification and overhead

Compared with baseline `ada54d867926dbd12b60f6a83e780580a02b9116`, `git diff ada54d867926dbd12b60f6a83e780580a02b9116 --numstat -- src package.json` reports **950 handwritten lines added / 521 removed (net +429)**, including all runtime adapters, model extraction, SSR and build wiring. Test changes add 261/remove 140 lines; dependency lockfile and documentation are separate. These are formatted physical lines, not a claim of reduced total code. Entry helpers and color/download policies moved between files are **not counted as savings**.

The old string listing/tools renderer and imperative filtering, chip creation/removal/visibility, result-count text and picker reconciliation have been replaced by one Vue component definition and reactive state. Parser, storage, motion and navigation policy still require native integration. Published row search text and pure matching consume one shared definition, including tag deduplication. No parallel legacy renderer or imperative-filter wrapper remains. The directory runtime is **83,441 bytes raw / 33,189 bytes gzip**, including Vue; no CDN or runtime package server is required.

Representative control change: `directoryModel().labels` publishes the count and picker labels once; `Directory` renders their SSR and enhanced states from that metadata. Existing published-label tests change the incoming singular/plural and collapsed/expanded labels, then exercise filtering and toggle transitions after retained navigation; all pass. `TagChip` likewise owns available/selected accessible labels through one render function rather than browser-created replacement markup.

The pilot establishes shared ownership and removes manual reconciliation, but **does not demonstrate a net handwritten-code reduction**. Do not justify a broader migration on size savings from this pilot. Further Vue expansion requires a separate decision. Deployed GitHub Pages browser smoke testing remains outstanding; local recovery matrices do not establish deployed hosting behavior.
