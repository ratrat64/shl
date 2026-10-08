---
title: 'Download the destination script instead of its bootstrap launcher'
type: 'bugfix'
created: '2026-10-08'
status: 'done'
baseline_commit: '2311441401c24951b19626ce39f07c6a693370cc'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Download currently saves the generated Bash bootstrap, while the visitor wants the script at the configured destination.

**Approach:** Fetch the current destination on click in the browser and save its exact bytes through a Blob download. Add regression tests proving the saved content comes from the destination. The destination host must allow CORS; blocked requests show a download error.

**Decision:** The user selected fetch on click. Use the destination URL basename as the filename, falling back to `<code>.sh` when no usable basename exists.

## Boundaries & Constraints

**Always:** Reuse the shared directory renderer and browser lifecycle. Preserve disabled Download controls, URL copying, Open, hidden/broken state behavior, and root/project-prefix navigation. Preserve destination bytes rather than decoding and rebuilding text. Surface download failures without saving a launcher or partial payload. Keep filenames safe and deterministic. Follow the static-site architecture and use native browser APIs and the existing test harness.

**Never:** Execute the downloaded script in the browser, introduce a backend/proxy or dependency, change the CLI launcher's argument/exit-status/cleanup contract, or silently substitute bootstrap content for a failed script download.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Successful save | Enabled script with readable destination response | Downloaded bytes equal the destination bytes, not bootstrap content | Clean up temporary browser resources |
| Failed fetch or body read | Network failure, HTTP error, or blocked response | No partial script or launcher is saved | Announce a useful error |
| Disabled link | Script and disabled tags | Download remains a disabled button with no actionable href | No destination request |
| Content transition | Fetch or body read pending when leaving directory | Outgoing controller cannot save or announce stale results | Abort work and release resources |
| Nested entry | Home expansion or native/navigated folder under root or project prefix | Same destination and filename behavior | No relative launcher-path dependency |

</frozen-after-approval>

## Code Map

- `src/directory.mjs` — `renderLinkRow` owns Download markup for every listing. Its current target is `./${prefix}${code}.sh`; disabled actions already use inert buttons.
- `src/assets/copy.js` — reuse delegated listener, polite feedback, asynchronous stale-result suppression, and cleanup conventions; Download must not become a copy action.
- `src/assets/navigation.js` — mounts directory behaviors and cleans outgoing controllers before main replacement; download ownership must participate here.
- `src/layout.mjs` — includes ordered deferred assets on full-shell documents.
- `src/build.mjs` — already copies the complete native asset directory; no new asset-copy abstraction is needed.
- `src/pages.mjs` — owns Bash launchers and Guide content. Launcher generation is preserved; Guide wording should explain the revised Download action.
- `test/build.test.mjs` — fixture and VM browser mocks, navigation lifecycle checks, Chrome server/helpers, and existing script/disabled tests. Existing launcher assertions near the script-generation test must stop expecting launcher Download hrefs.
- `README.md` and `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/EXPERIENCE.md` — document destination download and its supported/failure behavior; the current experience explicitly promises launcher download.

## Tasks & Acceptance

**Execution:**
- [x] `src/directory.mjs`, `src/assets/download.js`, `src/layout.mjs`, `src/assets/navigation.js` — implement the approved destination-download strategy through the existing component/lifecycle owners.
- [x] `src/pages.mjs`, `README.md`, `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/EXPERIENCE.md` — synchronize visitor-facing Download documentation and limits.
- [x] `test/build.test.mjs` — verify saved destination content, filename, error handling, disabled actions, nested markup, and lifecycle/resource cleanup. Preserve CLI launcher regression coverage.

**Acceptance Criteria:**
- Given an enabled script entry with a supported destination, when Download is activated, then the saved file contains the destination script and no generated bootstrap wrapper.
- Given existing directory actions, when a destination download succeeds or fails, then copying and Open retain their existing behavior.
- Given a script launcher URL, when it is used from Bash, then its existing download-before-execution and argument/exit-status behavior remains valid.

## Implementation Notes

- A cross-origin `download` attribute alone is insufficient: browsers can navigate instead of saving. A browser fetch/blob implementation requires readable CORS responses; `no-cors` cannot provide usable script bytes.

## Verification

- `bun ci` using Bun 1.4.2.
- `bun run format` and `bun run format:check`.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` — existing and added regression checks, including required rendered checks, pass.
- `bun build.mjs` — validated site generation succeeds.
- Inspect the final diff, commit/push the task branch, open a PR against main, and check latest-main mergeability after successful implementation checks.

## Implementation verification

- Bun 1.4.2: `bun ci`, formatting/write and read-only checks, required-browser full suite (33 passed, 0 failed), and site build (68 links) succeeded.
- VM checks cover exact binary bytes, names, HTTP/network/opaque/body-read failures, disabled actions, stale fetch/body/failure completion, abort signals, listener removal, timers, and object URL cleanup.
- Chrome checks use real cross-origin readable and CORS-blocked responses through expanded home, app-navigated folders, and native folder loads at root/project prefixes. The test intercepts the Blob download anchor to inspect its filename and exact bytes; it does not assert an operating-system save dialog or filesystem download.
- Existing rendered light/dark desktop/mobile shell, disabled-state, minimal-document, routing, copy, and CLI launcher regressions passed. Latest main was incorporated before editing.
- Final post-review verification: Bun 1.4.2 install, format/write and read-only formatting checks, all 33 required-browser tests, build (68 links), and whitespace checks passed after rejecting HTTP 206 and adding feedback-expiry assertions.

## Review Triage Log

- Blind 1, low, rejected: a reserved short code can produce a reserved Windows fallback name; browsers apply filesystem filename normalization. The documented deterministic `<code>.sh` fallback is preserved, and changing the naming contract is unnecessary for the typical script links.
- Blind 2, medium, patched: HTTP 206 was accepted by `response.ok`; reject it before reading/saving and exercise the partial-response branch in the VM test.
- Blind 3, low, rejected: a stalled destination can leave its button pending until departure. An additional deadline policy is not required by the selected fetch-on-click behavior; adding cancellation/deadline state is disproportionate to this edge case.
- Blind 4, low, rejected: pending downloads disable only the active row's button and clear previous feedback; native focus/navigation remains available. Adding progress/busy UI is optional polish rather than a broken download contract.
- Blind 5, low, rejected: without JavaScript the Download button has no action. README, Guide, and the experience explicitly state JavaScript is required; native destination browsing and Open remain available. Additional availability UI is optional polish.
- Blind 6, low, rejected: parallel row downloads share generic feedback, but each saves independently and buttons prevent duplicate requests for the same row. No partial payload or incorrect destination save results; per-request feedback adds a new presentation policy.
- Blind 7, maybe-false, rejected: hidden-to-visible status announcements depend on assistive technology; browser/VM checks establish status text but do not establish a missed announcement. Existing copy feedback already uses hidden empty regions. Assistive-technology execution would settle this low-impact concern.
- Blind 8, low, rejected: no pagehide controller exists, but successful in-app transitions explicitly abort and suppress outgoing work, and native departures use browser document lifecycle. A demonstrated stale save after back-forward-cache restoration would justify a separate lifecycle extension.
- Blind 9, low, rejected: Chrome captures Blob filename/bytes before native saving, as explicitly recorded in verification. Native anchor downloading is platform behavior; OS save-dialog/filesystem automation is additional coverage rather than proof of a current code defect.
- Edge 1, low, rejected: same reserved-fallback filename observation as Blind 1; browser filesystem normalization limits its practical effect.
- Edge 2, low, rejected: same stalled-request observation as Blind 3; existing navigation cancellation is covered and no bounded completion requirement was selected.
- Verification 1, medium, patched: execute five-second success/failure feedback callbacks and assert clearing, and verify a subsequent download replaces the feedback deadline.
