# Tag filter behavior

Derived from the spec memory and source decisions; applies to every directory page.

## Identity and validation — CAP-1, CAP-5

- Keep the array-of-nonblank-strings contract. Reject raw JavaScript `\s`, commas, Unicode `\p{Uppercase}` or `\p{Lt}` (titlecase) and emoji characters anywhere in the tag, including padding. Emoji detection uses `\p{Extended_Pictographic}`, `\p{Emoji_Presentation}`, `\p{Regional_Indicator}` and U+20E3 (keycaps), covering pictographs, ZWJ/modifier sequences, flags and keycaps without banning bare digits, # or *. Preserve valid lowercase/uncased international text, digits, ordinary punctuation, NUL, raw values/order and public `dist/links.json`. Do not silently trim, lowercase, strip or otherwise normalize invalid names into acceptance.
- Use `tag.toLowerCase()` as identity, matching existing case-insensitive search/states; do not add Unicode normalization. Exact reserved identities are `hidden`, `broken`, `disabled`, and `script`; descriptive lookalikes derive no state. Existing defensive trimmed state interpretation can remain for fetched recovery metadata.
- Deduplicate identities per leaf/catalog/selection without mutating raw data. Row labels preserve the first configured spelling and order; uppercase/titlecase source variants are invalid. Sort the catalog by canonical UTF-16 lexical identity; selected tags retain insertion order and returned tags rejoin catalog order. Typed uppercase tokens still resolve known lowercase identities; defensive fetched recovery interpretation remains case-insensitive.
- Validation messages name source/entry path and offending value and explain: “Tag names must not contain whitespace, commas, Unicode uppercase/titlecase characters or emoji (pictographs, emoji-presentation symbols, flags or keycaps); rename this tag explicitly. No automatic renaming is performed.” Retain type/nonblank guidance. JSON/YAML/YML all fail before `dist/` deletion, including migration from legacy properties.
- The user authorized `release notes` → `release-notes` on `search-test-exact` on 2026-10-09. Existing tests for padded state tags and multiword tags must become intentional rejection fixtures or explicitly updated valid fixtures, not silently transformed data.
- The user additionally authorized exactly four checked-in renames on 2026-10-09: HiDdEn → hidden, BrOkEn → broken, DiSaBlEd → disabled and emoji-🎉 → emoji-party. Uppercase/emoji publication fixtures become explicit valid renames or intentional rejection cases; historical logs remain historical.

## Automatic color assignment — CAP-1

Use one deterministic rule across build-time rendering; browser chips consume the same published identity/color metadata rather than implementing a competing rule. No registry, local storage, manual configuration, or result-order assignment.

- The latest user-approved 2026-10-09 predefined-state amendment retains generated descriptive colors but fixes exact broken/script/disabled labels to shared link-state tokens and hidden alone to readable neutral gray in light mode and light-gray/white-ish ink in dark mode. Preserve script ink against disabled-row overrides via a root-resolved token alias. No invisible exception. For every other canonical tag identity, start seed at `2166136261`; iterate UTF-16 code units with `Math.imul(seed ^ charCode, 16777619) >>> 0`.
- Generate HSL inks directly: hue = `(seed % 3600) / 10`; saturation = `55 + ((seed >>> 16) % 21)` percent; light-theme lightness = `20 + ((seed >>> 24) % 3)` percent; dark-theme lightness = `80 + ((seed >>> 24) % 5)` percent. Final fixed bounds are hue 0–359.9°, saturation 55–75%, light lightness 20–22% and dark lightness 80–84%. Collisions remain possible; there is no unique-color promise or stored registry. Unrelated additions/removals/reordering cannot change a tag's colors.
- Publish `--tag-light` / `--tag-dark` metadata (generated HSL inks or fixed-token references) on each row/popover label and catalog chip once. Selected chips clone the catalog metadata. Shared CSS sets `--tag-tone: light-dark(var(--tag-light), var(--tag-dark))` under the existing root color-scheme. No browser hash implementation, slot attributes, per-slot tokens or surface declarations.
- Full #labels and chips share color-mix tint treatment against local `--panel`: 5% resting / 8% hover fills and 30% resting / 45% hover borders. Preserve lossless JSON-content identities, 50px rows and horizontal full-label overflow. State labels keep their fixed inks regardless of other tags on the row; regular/script/broken/disabled row-state precedence remains separately owned.
- Only tags are exempt from disabled non-tag grayscale; hidden dimming stays independent and focus restores opacity. Require ≥4.5:1 on actual tinted backgrounds including hidden opacity and row wash. The initial light ceiling of 23% failed a yellow envelope edge; the fixed 22% ceiling and 80% dark floor passed the executed full-spectrum/envelope checks. Preserve these bounds rather than silently changing theme colors later.

## Tools and selection — CAP-2

- Replace Show hidden links with a dedicated Show tags control. Its open label is Hide tags; expose expanded state and controlled region. Opening/collapsing changes only picker visibility, never results or selections.
- Compute the unique catalog once per mount from all leaves in the current subtree, including hidden/disabled leaves and descendants of closed folders. Exclude no tags based on current results or text; available identities are exactly catalog minus selected identities.
- Available tags occupy one horizontally scrollable row below search and the button. Selected tags occupy one horizontally scrollable row LEFT of search on desktop, preceding search in DOM/tab order. On narrow screens stack the selected track above search beneath the count, without wrapping labels or squeezing search to zero. Reveal focused chips by scrolling their track; oversized labels retain reachable ends.
- Native buttons implement selection/removal; Enter and Space work as click. Available buttons identify “Filter by #tag”; selected buttons identify “Remove #tag filter” and expose selected state. Avoid nested controls. After available activation, focus its selected button; after removal focus the next selected button, then previous, then search if none remain.
- When selected is empty, hide its row. When all tags are selected, keep Show tags enabled and the open available region present with “All tags selected.” If the catalog is empty, Show tags is disabled and search remains available for a nonempty subtree.
- Row tags stay informational native-popover triggers; do not turn them into filter controls. Keep full colored labels readable inline, popover keyboard/dismissal behavior, row height, destination reserves, and horizontal overflow. No color dots or hover dependency.

## Filtering and hidden visibility — CAP-3

For each leaf, require all three conditions:

1. It is not hidden, or the selected set contains at least one of `hidden`, `broken`, `disabled`.
2. Its exact canonical tag set contains every selected identity.
3. The remaining input, outer-trimmed and case-insensitive, is one broad substring of the existing code/folder-path/title/destination/tag search text. Do not split ordinary prose into words or change its punctuation.

Selecting `script` or an ordinary descriptive tag alone never reveals hidden leaves. Selecting `broken` admits hidden leaves tagged broken, not every hidden leaf; AND and text still apply. Selecting `broken` plus `disabled` requires both, including on hidden leaves. Selecting `hidden` excludes nonhidden leaves because they lack that tag.

- Display only directories with at least one matching leaf; directory names may satisfy text, never tag AND. Expand matching groups while filters are active, retaining existing disclosure restoration when filters change/clear. Count matching leaves once, not directories or tags.
- Update the existing single polite live count, preserving “1 link” / “N links.” Any selection or nonblank text makes an active filter; zero results show “No links match your search.” Keep search and tag choices reachable at zero results. With no active filter use the existing initial empty explanation, including all-hidden 0-link pages.
- There is no show-all-hidden toggle. Removing the last reserved selection immediately restores hidden exclusion. Merely opening Show tags or typing a reserved word does not grant hidden visibility.

## Typed tokens — CAP-4

- A candidate is `#` followed by a nonempty name, at the start of input or immediately after whitespace/comma, outside HTTP(S) URL spans. Remove exactly one prefix; names themselves may contain #, digits or * under the validation restrictions above. Typed uppercase syntax resolves known lowercase identities.
- A following space/other whitespace or comma attempts commitment on input, including paste; Enter attempts the candidate at the caret and prevents form submission. Scan completed candidates left-to-right; process each once. Do not commit during IME composition; process after composition ends. Preserve caret placement and unrelated free text.
- A known catalog identity adds one selection and consumes its token and one terminating delimiter. An already-selected identity consumes syntax, leaves the selection untouched, and politely announces “Tag already selected.” Typed duplicates do not toggle/removal. Enter contributes no input delimiter to remove.
- Unknown attempted tokens, including their typed delimiter, remain unchanged and display exact “Tag not found” in a separate polite, search-associated error. Do not select them or erase them to force a match. Known candidates elsewhere can still commit. Clear the error when its offending token is corrected to a known tag and committed or removed; never overwrite it with count/copy/download feedback.
- Without a commit delimiter, the token remains ordinary live broad-search text; it is not a selected filter. The previous initial-# exact-tag query mode is removed. Bare `#` yields zero results rather than matching every row's label prefix. Pending/unknown tokens never enable hidden visibility; the retained input still narrows results as text.
- Examples: `#shell `, `#shell,`, and Enter after `#shell` each select shell; `#shell,#setup ` selects both. `#SHELL ` after shell is selected consumes syntax with no new chip. `#missing,` remains with its error. `setup #shell ` leaves `setup ` as text. `https://example.com/#shell` remains plain text.

## Lifecycle and baseline

- Initial state: empty text, no selections/error, available row collapsed. Search is enhanced on every nonempty subtree, including all-hidden and untagged ones; truly empty directories retain existing static empty-state behavior.
- Cross-page content mounts, including Back/Forward, reset this state and directory disclosures under existing navigation ownership. Same-page/fragment navigation does not remount/reset. Direct loads start fresh. Do not persist filters in storage, URL, history, or source snapshots; theme persistence remains independent.
- Clearing the search field clears text/token errors, not selections. Each selection is individually removable; no new clear-all feature is required. Collapsing the picker keeps filters. Outgoing controls/listeners cannot affect newly mounted content; mount exactly once.
- Without JavaScript, hide search and usable picker controls, retain visible static listings, full colored labels/popovers, enabled native links, and disabled copy-only/unavailable action foundations. Hidden leaves stay omitted. A disabled no-tag picker may remain visible as a disabled control.
- Keep accessible search labeling, visible keyboard focus, named tag regions, search-associated error, and full chip labels. Text/state/removal/expanded cues must not depend solely on color. Preserve the borderless shared chrome, existing row geometry and disabled actions.

## Verification contract

Reuse `test/build.test.mjs` and its browser harness; implementation checks are acceptance gates, not claims that this planning task changed the application.

| Responsibility | Required proof |
| --- | --- |
| Validation | JSON/YAML/YML reject whitespace/commas, ASCII/accented/Greek/Cyrillic/fullwidth uppercase and titlecase, pictographs/ZWJ/modifiers/flags/keycaps before deleting output, with source/path/value rename guidance and retained sentinel. Allowed lowercase/uncased international text, bare digits/#/*, punctuation and NUL stay raw. Uppercase input/recovery remains case-insensitive. |
| Colors | Pin descriptive UTF-16 seed/color vectors (including supplementary lowercase and NUL) and fixed state-token references, verify stable source reorder/add/remove/reload/root/nested/all-surface metadata and >16 distinct representative generated inks. Execute full hue-spectrum/current-map and conservative HSL-envelope checks on actual light/dark tinted rest/hover backgrounds, hidden opacity and state row wash. Verify fixed-state treatment and focus contrast in the state fixtures, not a redundant full-spectrum focus sweep. Preserve separate row state precedence and shared fill/border proof for all tag surfaces. |
| Catalog/selection | Hidden-inclusive subtree scope; dedup/order; unchanged pool under text/AND/zero results; removal restores order; all-selected, no-tag, empty and all-hidden pages; keyboard focus after moves. Selected track is left of search on desktop, above on mobile and before search in DOM/native Tab order; preserve Tab and horizontal touch-track scrolling proof. |
| Filter predicate | No-selection baseline, two ordinary tags AND, text combination, nonmatching leaf, ancestor-only folder text, each reserved selection, broken+disabled, removal of last reserved tag; counts/disclosures/empty/no-match agree. |
| Tokens | Space/comma/Enter, case, duplicates, bare #, unfinished/unknown/corrected/deleted token, mixed prose, multiple pasted tokens, mid-input caret, URL fragments and IME; no lost unrelated input/delimiters, no hidden reveal before selection. |
| Lifecycle/native | Direct loads, folder/Guide navigation, same-page fragments, Back/Forward, one mount per transition, reset/retention rules, no-JavaScript baseline, copy/download stale-work protections. |
| Rendered integration | Executed root/nested directory light/dark × desktop/mobile matrix: full labels, scrolling/keyboard/touch, usable search, chip positions, hidden/broken/disabled/script combinations, contrast/focus, popovers. Verify shared shell on Links/nested/Guide/404 through native/app loads, minimal foundations and root/project-prefix recovery using existing checks. |

Run Bun 1.4.2 with `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (set `CHROME_BIN` if needed), and `bun build.mjs`. Browser absence/skip is not visual proof. Routing semantics are preserved; any actual routing change additionally needs deployed Pages smoke proof.
