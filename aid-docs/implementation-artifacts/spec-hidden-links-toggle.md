---
title: 'Toggle hidden links in the directory'
type: 'feature'
created: '2026-10-06'
status: 'in-progress'
baseline_revision: 16a4a0719fa752cd0b42c461dbc6e1c22bd96061
baseline_commit: 16a4a0719fa752cd0b42c461dbc6e1c22bd96061
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Visitors cannot reveal links marked `hidden: true` from the link directory, even when they intentionally want to browse them.

**Approach:** Add a toggle button on directory pages with hidden descendants, including the homepage, to show or hide hidden links. The default presentation remains hidden.

## Boundaries & Constraints

**Always:** Keep hidden links, and folders with only hidden descendants, absent from the default listing and search; direct redirects, launchers, and public routing continue to work. When shown, include hidden links in listings, search and displayed counts. Use a real keyboard-accessible button and preserve default-hidden behavior without JavaScript; respect root and project-prefix relative links.

**Never:** Treat hiding as authentication or secrecy, change link-map validation or redirect behavior, or add a dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mixed listing | Visible and hidden leaves, nested hidden-only group | Default omits hidden leaves/group; toggle reveals both, second click hides them | No error expected |
| All-hidden page | Only hidden descendants | Empty state and a toggle by default; showing exposes entries and search; hiding restores empty state | No error expected |
| Search | Query entered while toggle changes | Only links allowed by the toggle match; matching folders and status update | No error expected |
| No hidden links | Directory with only visible leaves | Existing listing and search work; no hidden-link toggle | No error expected |
| No JavaScript | Hidden leaves/groups exist | Hidden links are not displayed by default | No error expected |

</intent-contract>

## Code Map

All relative code paths and verification commands below refer to the task worktree `/home/rat/Git/shortlink/shortlink-hidden-toggle`.

- `build.mjs:296-344` — shared `visibleCount`, `listing` and `directoryContents` generate home and nested listings; render hidden leaves and hidden-only folders inert initially and place toggle where both kinds of pages can use it.
- `build.mjs:243-281` — existing `searchScript` filters rendered rows and counts matches; extend it to coordinate toggle state and search instead of adding a second client script.
- `build.mjs:159-225` — shared control, layout and `[hidden]` CSS; preserve focus styling.
- `build.test.mjs:159-286` — fixtures for hidden nested groups and simulated browser search; extend with toggle behavior and hidden-only pages.
- `README.md:30-72,183-200` — document directory toggle and public nature of hidden links; existing `spec-hidden-links.md` records prior default-hidden feature, not an implementation target.

## Tasks & Acceptance

**Execution:**
- `build.mjs` — generate default-hidden entries/groups and accessible toggle on eligible pages, wire its state to search/count/empty state — maintain progressive default-hidden behavior.
- `build.test.mjs` — exercise generated markup and toggle/search interactions on mixed and all-hidden directory pages — catch state regressions.
- `README.md` — document user-facing toggle and default behavior — align instructions with generated site.

**Acceptance Criteria:**
- Given a generated homepage or nested directory containing hidden descendants, when a visitor activates Show hidden links, then their links and hidden-only folders appear with working short URLs; when activated again they disappear.
- Given a hidden-only directory opened directly, when a visitor toggles hidden links, then its empty state changes to browseable entries and back.
- Given a page with hidden descendants and JavaScript disabled, when it loads, then hidden codes and hidden-only folders remain out of view.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm ci` — expected: dependencies install under Node.js 24.
- `node --test build.test.mjs` — expected: all tests pass.
- `node build.mjs` — expected: site generates successfully.
- `git diff --check` — expected: no whitespace errors.
