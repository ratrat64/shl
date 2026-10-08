# Link-state behavior

## State interpretation

State tags belong to link leaves, not directories. Use the existing trimmed tag interpretation and exact case-insensitive comparison: ` Hidden ` is hidden; `hiddenish` and literal `#hidden` are descriptive tags. Duplicate/case-varied tags activate a state once; preserve their configured values in the public map. URL strings have no states. A directory is hidden-only when it has no non-hidden descendant leaves; states do not inherit from directory names.

| Tags present | Default listing/count | Appearance when listed | Browser forwarding | `script: true` launcher |
| --- | --- | --- | --- | --- |
| None | Included | Regular, or script amber | Available | Existing launcher |
| hidden | Omitted | Regular/script with hidden opacity | Available | Existing launcher |
| broken | Included | Orange-red | Available | Existing launcher |
| disabled | Included | Grey | Explanation only | Inert launcher |
| hidden, broken | Omitted | Orange-red with hidden opacity | Available | Existing launcher |
| hidden, disabled | Omitted | Grey with hidden opacity | Explanation only | Inert launcher |
| broken, disabled | Included | Grey | Explanation only | Inert launcher |
| hidden, broken, disabled | Omitted | Grey with hidden opacity | Explanation only | Inert launcher |

Broken is a maintainer-assigned warning, not a current reachability assertion. Broken alone does not block any action. Disabled grey takes precedence over broken tint and script amber; script identity retains its Download control as a non-color cue, visibly unavailable when disabled. Keep full state tags as non-color cues; do not add duplicate state badges.

Retain 50px minimum rows, full one-line labels and native tag popovers, horizontal overflow without added row height, destination-space reserves and pointer-dependent visibility, and the existing title/search behavior. Hidden rows/tags retain 80% opacity in dark and 94% in light; keyboard focus restores full opacity. Hidden-only summaries dim independently of descendants. State colors use shared CSS tokens; choose exact orange-red/grey values with readable text and visible focus in both themes, including dimmed combinations.

## Disabled interactions and explanation

- Code copies its full short URL; destination copies its full external URL. Preserve existing polite copy success/failure feedback, five-second clearing and timer reset; copying does not enable forwarding.
- Code's native short-URL link opens the explanation. Destination uses a copy-only control with full accessible/selectable text and no external href; without JavaScript its text remains available, but it cannot navigate externally. Modified clicks/native activation must not bypass disabled Open or Download.
- Open and, for script entries, Download stay visible but unavailable, with programmatic disabled state and no actionable external/launcher href. Tags/disclosure and directory navigation stay functional.
- The direct disabled short URL uses shared minimal document/style/theme foundations, not a separate site shell. Page title and heading: **Link disabled**. Paragraphs, exactly:
  - **This short link has been disabled. shl will not forward you to its destination.**
  - **The destination remains public. Disabling this link does not prevent access outside shl.**
- Do not emit meta refresh, destination-forwarding JavaScript, destination canonical link, or an external Continue fallback. The explanation is readable with JavaScript disabled. The original destination remains public in `links.json` and directory text; it need not be reproduced on this minimal page.
- Wrong-case 404 recovery interprets the same states: disabled leaves navigate to their canonical-cased short URL explanation; enabled leaves retain destination forwarding. Preserve directory recovery and root/project-prefix rebasing.
- For disabled `script: true` entries, emit the same exact-case `<path>.sh` resource as a safe Bash launcher. It prints **This link is disabled. No script was downloaded or executed.** to stderr and exits **1**, without downloading the destination, creating a temporary payload, executing it, or processing forwarded arguments. Downloading this static launcher directly does not enable execution. Preserve namespace collision checks.

These guarantees apply to the currently deployed artifacts, not previously downloaded launchers or retained copies of older deployments. External destination access remains outside shl.

## Search syntax and visibility

Trim outer query whitespace and compare case-insensitively. An empty query restores the current hidden-toggle visibility pool. There are two modes, not a token grammar:

| Query | Meaning |
| --- | --- |
| `docs guide` | One broad substring across existing searchable code/path, folder names, title, destination and tags; not two terms |
| `#docs` | Exact whole tag `docs`, not `docs-api` |
| `#release notes` | Exact whole tag `release notes`; spaces are part of the label |
| `#` | No tag label, so no matches |
| `#hidden`, `#broken`, `#disabled` | Exact state tag; temporarily include matching hidden leaves |
| `#broken #disabled` | One literal tag label `broken #disabled`, not an intersection or reserved-state query |

The whole substring following the initial `#` is the tag label; do not tokenize or implement quotation, conjunction, negation or operators. Tag-mode matching uses leaf tags only, never a matching folder name, URL fragment or title. Plain text and non-state tag queries respect Show hidden links. An initial `#` is query syntax, not part of the stored label.

For an exact reserved-state query, search all leaves in the current subtree, regardless of hidden toggle, but show only matching leaves and the ancestors needed to reach them. Hidden-only ancestors must not short-circuit traversal or reveal unmatched siblings. Expand matching groups using existing search disclosure restoration. Count matching leaves, not folders; announce through the existing single count. State search does not mutate the toggle label or `aria-pressed`; switching/clearing queries restores the toggle-selected pool. Toggling during a state query changes the saved pool for subsequent ordinary/empty queries but not that state query's matches.

With JavaScript, expose search whenever the subtree has any leaves, including all-hidden subtrees. Initially all-hidden pages keep **0 links**, **No links listed here.**, and Show hidden links. A matching state query replaces the empty explanation with results; any nonempty zero-result query shows **No links match your search.** Clearing returns to the toggle-selected initial listing/empty explanation. Search remains available when zero results are shown. A truly empty root has no search and retains its existing empty-site copy. Without JavaScript, search and enabled toggles remain hidden; hidden leaves stay omitted and disabled toggles remain visible. Preserve accessible labels and placeholder **Search link, title or tag**. Document exact-tag/state syntax in Guide and README.

Search and hidden visibility reset on content-page transitions under the existing lifecycle; theme and shell remain mounted. Same-page/fragment navigation does not reset them.

## Migration

Migrate checked-in link leaves and live examples before enabling rejection: append `hidden` for `hidden: true` unless a trimmed case-insensitive equivalent already exists; preserve all other tags, order and fields; delete `hidden` for both true and false. A false value does not remove an independently configured `hidden` tag. Remove the property rather than maintain dual conventions. This is a one-time repository edit, not a new migrator or runtime compatibility layer.

Reject every remaining leaf `hidden` property, regardless of value, with the link path and guidance such as **The hidden property is no longer supported; use tags: [hidden].** Validate before deleting existing output. Preserve identical semantics across JSON, YAML and public `links.json`; retain disabled URL validation, path rules and `script: true` launcher collisions. Successful output replacement removes stale forwarding/launcher content when entries change state. Archived historical planning records need not be rewritten.

## Acceptance matrix

These are implementation gates; creating this spec is not evidence they already pass.

1. **States (CAP-1/2):** Exercise all eight combinations in JSON/YAML, mixed case, trimmed/duplicate labels and near-match descriptive tags. Check default visibility/counts and action precedence; disabled does not suppress counting of an otherwise visible leaf.
2. **Search (CAP-3):** Verify exact `#docs` versus `docs-api`, spaced tags, bare `#`, literal multi-word queries and non-tag text containing state names. Tag matches must not come from title, URL or folder names.
3. **Hidden traversal (CAP-3):** From root and an initially all-hidden nested directory, find hidden broken/disabled leaves behind multiple hidden-only ancestors; show no unmatched siblings. Verify zero matches, clearing, toggle on/off/during query, and ordinary/non-state queries against the selected pool; search remains reachable throughout.
4. **Copy/native actions (CAP-4):** Copy both URLs from disabled rows, including hidden combinations, and exercise clipboard rejection and repeated-copy timing. Verify keyboard and modified clicks; with JavaScript off, code reaches explanation, destination stays selectable and Open/Download cannot activate externally.
5. **Forwarding/recovery (CAP-4):** Direct disabled documents contain no forwarding directives or destination fallback; explanation is identical without JavaScript. Check wrong-case paths with/without trailing slash under `/` and `/<repo>/`; disabled resolves canonically, enabled hidden/broken and directory recovery remain correct. Include deployed Pages smoke tests.
6. **Launchers (CAP-4):** Run disabled launchers with harmless arguments and a stubbed downloader; assert stderr, exit 1, zero downloader/payload invocations and no payload temp file. Preserve enabled launcher's complete-download, argument/status forwarding and cleanup checks.
7. **Migration/output (CAP-5):** Check true/false, absent/existing/mixed-case hidden tags, preservation of other values and all legacy-property rejection values. Invalid input retains old output; enabled-to-disabled-to-enabled rebuilds replace stale HTML/launcher behavior; deletion removes artifacts. Collision/URL checks remain active for disabled entries.
8. **Rendered/lifecycle (CAP-2/3/4):** Reuse required-Chrome checks for home, nested pages, Guide and 404 in light/dark at mobile/desktop, direct/native and applicable app navigation. Add affected state-row checks, including hidden opacity/focus, readable non-color cues, unchanged shell and row geometry, and all-hidden search. Verify minimal explanation foundations separately and reset/cleanup on navigation. No browser skip qualifies as proof.

## Deferred automation boundary

No checker or automation ships here. Future automation may add/remove `broken` based on its latest check even if manually assigned, without ownership tracking; users assign `disabled`, and users or automation may assign `hidden`. Broken detection must never automatically hide links. Checker failure/recovery policy needs a separate decision. Separate state toggles, parallel hidden conventions and ownership metadata are rejected; multi-term grammar remains deferred.
