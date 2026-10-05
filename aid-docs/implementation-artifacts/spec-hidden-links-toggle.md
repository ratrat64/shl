---
title: 'Toggle hidden links in the directory'
type: 'feature'
created: '2026-10-06'
status: 'done'
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

### 2026-10-06 — Review pass
- verdicts: 8 findings — high 0, medium 0, low 6, false 2, maybe-false 0
- findings:
  - `[low]` `[patch]` Changing action label with `aria-pressed` was redundant — removed `aria-pressed` and kept the descriptive Show/Hide label.
  - `[low]` `[patch]` README implied every directory displayed a count — clarified that only the homepage count updates.
  - `[false]` `[reject]` Hidden rows appear in HTML source — they already exist in the public link map and redirects; default display is hidden, as requested, with no secrecy guarantee.
  - `[low]` `[patch]` Synthetic rows and hard-coded hrefs could miss markup/script integration — asserted generated titled row attributes and resolved generated hrefs under both prefixes.
  - `[low]` `[patch]` PRODUCT.md described omission as permanent — updated it to say by default and mention the toggle.
  - `[low]` `[reject]` Code Map line references and task-worktree path age after implementation — this build's spec is an implementation record; editing it solely to fix a review finding is disallowed.
  - `[low]` `[patch]` Titled hidden links lacked integrated markup/search coverage — tested emitted `data-hidden`, `hidden`, and `data-title` through the search toggle.
  - `[false]` `[reject]` Auditor noted browser behavior is tested through generated HTML and simulated DOM rather than a deployed browser — no observed behavior diverges from the visitor-facing intent; deployment smoke testing requires deployment.

## Verification

**Commands:**
- `npm ci` — expected: dependencies install under Node.js 24.
- `node --test build.test.mjs` — expected: all tests pass.
- `node build.mjs` — expected: site generates successfully.
- `git diff --check` — expected: no whitespace errors.

## Auto Run Result

Status: done

Implemented a directory button that reveals and re-hides hidden links and hidden-only folders; default listings remain hidden, and search, homepage count, and empty states follow the toggle.

Files changed: `build.mjs` (generated UI and browser script), `build.test.mjs` (markup and interaction coverage), `README.md` and `PRODUCT.md` (behavior documentation), and this spec (implementation record).

Review: five low-severity patch findings addressed (four distinct fixes); no deferred items. One low-severity spec-only finding was rejected under the review rule. Two findings were rejected as false: hidden links were already publicly discoverable, and the tested interaction shows no demonstrated browser divergence. Patched counts: high 0, medium 0, low 5. Follow-up review recommended: false.

Verification: `npm ci`, Node.js 24 `--test build.test.mjs` (14 passed), Node.js 24 `build.mjs` (26 links built), and `git diff --check` passed. Residual risk: deployed-browser rendering has not been smoke-tested before deployment.
