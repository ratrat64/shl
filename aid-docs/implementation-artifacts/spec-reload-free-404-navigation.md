---
title: 'Reload-free internal navigation through 404'
type: 'feature'
created: '2026-10-09'
status: 'in-review'
baseline_commit: '1b42ee5860a96601e59ae5c2f6b088aaccafd85e'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ordinary internal navigation must preserve the live document and shared shell, including navigation from and back to 404. Today embedded 404 pages have no navigation controller, fetched 404 content is rejected, and recovery has no content-lifecycle cleanup.

**Approach:** Extend the existing navigation controller and content mount/cleanup lifecycle to support not-found content and recovery. Amend AD-9 and synchronize EXPERIENCE.md and AGENTS.md; prove identity preservation with required-browser regressions at root and project-site prefixes.

## Boundaries & Constraints

**Always:** Ordinary internal browsing and local actions preserve document, documentElement, header, footer and theme-control identity. Reuse shared navigation, theme, content lifecycle, and link interpretation. Preserve native anchors without JavaScript, failure fallback, modified clicks, external forwarding, minimal redirect/disabled documents, history, fragments, accessible focus, title/current navigation, and existing per-complete-URL scroll restoration. Cross-page mounts reset directory controls; same-page fragments retain them. Outgoing listeners and asynchronous work are cleaned before replacement and stale results cannot update content, save files, rebase links or navigate.

**Never:** Add a framework, dependency, competing router/lifecycle, arbitrary fetched-script execution, or intercept external/destination/launcher/download navigation as app content. Do not guess a project root when no ancestor map is readable. Do not remove native failure fallback in pursuit of reload-free success paths.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Not-found browsing | Direct unknown URL; readable ancestor map | Rebase shell/Home links; ordinary Links/Guide/Home/directory navigation and Back/Forward retain document/shell | First readable map ends probing even without a match |
| History restores 404 | Fetch returns HTTP 404 with generated not-found shell | Mount not-found content through the same controller; title/focus/nav update | Reject unrelated error HTML and retain native fallback |
| Directory case recovery | Map identifies canonical directory | Navigate through existing controller with replacement history; preserve shell | Native fallback if enhanced loading fails |
| Leaf recovery | Enabled or disabled short code | Enabled leaf forwards to destination; disabled leaf reaches canonical minimal explanation | Preserve existing shared interpretation and native forwarding |
| Fragment/local action | Existing page fragment, copy, filters, disclosure, popover or theme | No document reload; fragments retain current main/state; actions retain existing semantics | Existing accessible feedback and native boundaries |
| Stale recovery/action | Leave while map, clipboard or download work is pending | Abort cancellable work; suppress late mutation, feedback, save and forwarding | Newest navigation/history intent wins |
| Unknown base/unavailable JS | No readable map, or scripts disabled | Relative shell/Home anchors remain usable | No invented root; not-found completion follows request completion |

</frozen-after-approval>

## Code Map

- `src/assets/navigation.js`: `navigate`, `mount`, `rebase`, `place`; sole app controller, request sequencing, history/fragment/focus and controller cleanup. Currently rejects non-OK responses and page markers without header nav keys.
- `src/pages.mjs`: `notFoundPage` embeds one-shot recovery and an unmarked Home anchor. `forwardingPage`/redirect variants remain minimal.
- `src/layout.mjs`: `documentPage`/`page` own shell and script startup; embedded shells currently load only theme. `src/browser.mjs` reads embedded theme through module-relative stdlib URLs.
- `src/links.mjs`: `isDirectory`, `linkUrl`, `linkStates` are authoritative pure recovery helpers; browser code cannot import builder/YAML/filesystem capabilities.
- `src/assets/{search,copy,download,theme}.js`: reuse content initialization/cleanup and document-lifetime theme. No new local-action dispatcher needed.
- `test/build.test.mjs`: reuse `fixture`, `browserServer` (actual HTTP 404 at `/` and `/project/`), `availableChrome`, `browserControls` CDP; extend navigation/recovery VM checks and rendered shell checks.
- `aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md`: AD-9 currently excludes recovery from app mounting and requires native navigation after rebasing; rewrite that conflicting contract.

## Tasks & Acceptance

**Execution:**
- [x] `src/pages.mjs`, `src/browser.mjs`, `src/layout.mjs`, `src/assets/navigation.js` and a recovery asset if needed -- move recovery into the existing content lifecycle and provide identical controller code to unknown-base embedded shells -- enable transitions without duplicated responsibilities.
- [x] `src/assets/navigation.js` -- admit recognizable generated not-found responses, separate content identity from active-nav identity, and support recovery replacement navigation -- restore 404 through history while preserving failure boundaries.
- [x] `ARCHITECTURE-SPINE.md`, `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/EXPERIENCE.md`, `AGENTS.md` -- synchronize the reload-free navigation/local-action and lifecycle contract -- remove conflicting live instructions.
- [x] `test/build.test.mjs` -- extend focused recovery/lifecycle checks and required-browser identity/history regression matrix -- exercise the edge cases above using generated anchors and real responses.

**Acceptance Criteria:**
- Given generated pages at both hosting prefixes, when an unknown 404 navigates to Links, Guide and a directory and Back/Forward returns through these entries, then document/root/shell/theme-control references survive every transition and URL/content/title/nav/focus are correct.
- Given light/dark themes and desktop/mobile viewports, when these transitions and local actions execute, then shell appearance/theme remain consistent, cross-page content mounts once, and same-page fragments retain content state.
- Given pending recovery or directory actions, when content is replaced or history intent changes, then no stale operation mutates the active shell/content or forwards/saves after cleanup.
- Given native exclusions, minimal forwarding, disabled explanations or unavailable enhancement, when activated, then existing fallback and destination semantics remain functional.

## Implementation Notes

- One recovery source is composed with serialized authoritative pure link helpers by `src/browser.mjs`; `src/build.mjs` publishes that same code as a native asset, and embedded shells receive identical content assets/controller code in the same order. Minimal documents still embed only theme/forwarding behavior.
- Recovery mounts through the navigation controller, aborts map requests on newer intent/cleanup, and checks activity after fetch and body completion. Relative Home remains relative until a map establishes the base. Canonical directories replace history through the controller; enabled/disabled leaves retain native replacement semantics.
- The controller accepts generated not-found content (including HTTP 404), leaves header navigation inactive for it, aborts superseded page requests, and invalidates pending clipboard/download/recovery work when intent changes as well as before replacement. Download cleanup restores buttons synchronously; late completion cannot mutate them or save.
- No framework or dependency added. Existing full-URL scroll restoration and the recovery request-completion/no-deadline contract remain.

## Spec Change Log

## Review Triage Log

## Verification

- `bun ci` using Bun 1.4.2.
- `bun run format` and `bun run format:check` from the task worktree root.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` with installed Chrome; no skipped browser evidence.
- `bun build.mjs` from the task worktree root.
- Record executed root/project-prefix, light/dark, desktop/mobile identity matrix. Deployed Pages routing smoke proof requires deployed artifacts; report its availability separately from local HTTP-404 browser proof.
- After checks, inspect status/diff/history, commit and push the task branch, open a PR against main, and check merge conflicts against latest main.

### Executed evidence — 2026-10-09

- Bun 1.4.2: `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`, and `bun build.mjs` passed. Final full suite: **41 passed, 0 failed, no skipped browser checks**; application build generated 68 short links.
- New Chrome CDP matrix passed all eight combinations: `/` and `/project/` × light/dark × 390px mobile/1440px desktop. Real HTTP-404 unknown pages navigated via generated Home/Links/Guide/folder anchors and Back/Forward through 404 while retaining document/root/header/footer/theme-control references, correct URL/content/title/current-nav/focus, and computed shell appearance. Direct wrong-case directories recovered without replacing document/shell.
- Same-page Guide/directory fragments retained main/control state; cross-page mounts reset filters/error/picker, and single-toggle behavior proved controls were not mounted twice. Pending clipboard/download bodies were released during navigation loading and produced no stale feedback/save. Pending mounted recovery bodies were released after leaving and produced no forwarding/rebasing/mutation.
- VM regressions passed generated-404 admission, unrelated/error/minimal rejection and native fallback, canonical replacement history and replacement failure fallback, superseded fetch/body suppression, map fetch/body abortion (including abort-ignoring transports), first-readable-map stopping, enabled/disabled leaf interpretation, and unavailable-map relative fallback. Existing required-browser checks passed direct/native shell appearance, minimal foundations, native actions/popovers/themes, downloads and state recovery.
- Deployed GitHub Pages smoke proof is **not available for this task branch**: local generated-artifact HTTP-404 browser proof is complete; actual Pages routing remains a post-deployment check.
