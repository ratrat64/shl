# Tag filter behavior

Derived from the spec memory and source decisions; applies to every directory page.

## Identity and validation — CAP-1, CAP-5

- Keep the existing array-of-nonblank-strings contract; additionally reject any JavaScript `\s` character or comma anywhere in the raw tag, including leading/trailing whitespace. Do not trim invalid values into acceptance. Preserve valid Unicode, punctuation, casing, array order, and public `dist/links.json` values.
- Use `tag.toLowerCase()` as identity, matching existing case-insensitive search/states; do not add Unicode normalization. Exact reserved identities are `hidden`, `broken`, `disabled`, and `script`; descriptive lookalikes derive no state. Existing defensive trimmed state interpretation can remain for fetched recovery metadata.
- Deduplicate identities per leaf/catalog/selection without mutating raw data. Row labels preserve configured case. For a catalog identity with case variants, choose the raw label smallest by JavaScript UTF-16 lexical comparison; sort the catalog by canonical identity with the same comparison. Selected tags use insertion order; returned tags rejoin catalog order.
- Validation messages name source/entry path and offending value and explain: “Tag names must not contain whitespace or commas; rename this tag explicitly. No automatic renaming is performed.” Retain existing type/nonblank guidance where applicable. Every format fails before `dist/` deletion.
- The user authorized `release notes` → `release-notes` on `search-test-exact` on 2026-10-09. Existing tests for padded state tags and multiword tags must become intentional rejection fixtures or explicitly updated valid fixtures, not silently transformed data.

## Automatic color assignment — CAP-1

Use one deterministic rule across build-time rendering; browser chips consume the same published identity/color metadata rather than implementing a competing rule. No registry, local storage, manual configuration, or result-order assignment.

| Slot | Light ink | Dark ink | Role |
| --- | --- | --- | --- |
| 0 | `#006b60` | `#64b6a4` | Teal |
| 1 | `#895400` | `#c6a36a` | Amber |
| 2 | `#a33d20` | `#ee967b` | Orange-red |
| 3 | `#606060` | `#a3a3a3` | Grey |
| 4 | `#7044a3` | `#c4a1ec` | Violet |
| 5 | `#245e9b` | `#90b9ed` | Blue |
| 6 | `#94346b` | `#e999c3` | Magenta |
| 7 | `#596600` | `#b3bc70` | Olive |
| 8 | `#006579` | `#72bfce` | Cyan |
| 9 | `#9b3548` | `#ef9baa` | Rose |
| 10 | `#4c509d` | `#a8adf0` | Indigo |
| 11 | `#39682c` | `#93c785` | Leaf |
| 12 | `#875027` | `#d9aa80` | Copper |
| 13 | `#7b3e80` | `#d5a0da` | Plum |
| 14 | `#48616d` | `#9cb9c7` | Slate |
| 15 | `#23674a` | `#7dc6a1` | Forest |

- Reserve `hidden` and `disabled` for slot 3, `broken` for slot 2, `script` for slot 1. For other identities, start hash at `2166136261`; iterate canonical string UTF-16 code units, applying `(Math.imul(hash ^ charCode, 16777619) >>> 0)`; slot is `hash % 16`. The user-approved 2026-10-09 visual amendment supersedes the former modulo-six mapping. Freeze this sixteen-slot mapping across subsequent builds; unrelated additions/removals/reordering cannot recolor tags.
- Theme changes select the corresponding ink variant, preserving slot identity. Sixteen slots reduce collisions without promising unique colors for every tag; full labels carry identity.
- Individually color full `#label` spans in existing row tag trigger/popover and picker chips, with backgrounds and borders tinted from each tag's own ink. Shared CSS publishes `--tag-tone` per slot; one color-mix treatment blends tone into the local `--panel` at 5% resting / 8% hover for fills and 30% resting / 45% hover for borders. Do not duplicate per-slot surface declarations or inherit regular/script/broken/disabled row emphasis. Preserve 50px row heights and full-label horizontal overflow. Losslessly JSON-encode identity metadata, including accepted NUL, without changing raw public values.
- Exempt only tag labels/chip treatment from disabled grayscale overrides; code, destination, unavailable actions and row wash remain neutral. Hidden dimming still applies and focus restores opacity. Verify text contrast ≥4.5:1 on actual backgrounds, including hidden opacity and hover/focus wash; if a proposed ink fails, adjust its theme pair and record the final mapping before shipping. Do not solve contrast by removing disabled-tag colors.

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

- A candidate is `#` followed by a nonempty name, at the start of input or immediately after whitespace/comma. A `#` inside an ordinary word or URL fragment is not a token. Remove exactly one prefix; names themselves may contain `#` because the locked validation prohibits only whitespace/commas.
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
| Validation | JSON/YAML/YML reject internal/outer whitespace, tabs/newlines and commas with source/path/value guidance; existing output sentinel survives rejection. Valid Unicode/case/raw tag values stay intact. |
| Colors | Same lossless identity/slot for mixed case, repeated tags, folders, every surface, and disabled tags; stable after source reorder/add/remove and reload; fixed reserved slots, both themes, safe HTML output. Fixtures must cover all sixteen slots with ≥4.5:1 contrast on actual resting/hover tinted fills, hidden opacity and row wash; palette-matched fill/border proof for inline/popover/available/selected tags. |
| Catalog/selection | Hidden-inclusive subtree scope; dedup/order; unchanged pool under text/AND/zero results; removal restores order; all-selected, no-tag, empty and all-hidden pages; keyboard focus after moves. Selected track is left of search on desktop, above on mobile and before search in DOM/native Tab order; preserve Tab and horizontal touch-track scrolling proof. |
| Filter predicate | No-selection baseline, two ordinary tags AND, text combination, nonmatching leaf, ancestor-only folder text, each reserved selection, broken+disabled, removal of last reserved tag; counts/disclosures/empty/no-match agree. |
| Tokens | Space/comma/Enter, case, duplicates, bare #, unfinished/unknown/corrected/deleted token, mixed prose, multiple pasted tokens, mid-input caret, URL fragments and IME; no lost unrelated input/delimiters, no hidden reveal before selection. |
| Lifecycle/native | Direct loads, folder/Guide navigation, same-page fragments, Back/Forward, one mount per transition, reset/retention rules, no-JavaScript baseline, copy/download stale-work protections. |
| Rendered integration | Executed root/nested directory light/dark × desktop/mobile matrix: full labels, scrolling/keyboard/touch, usable search, chip positions, hidden/broken/disabled/script combinations, contrast/focus, popovers. Verify shared shell on Links/nested/Guide/404 through native/app loads, minimal foundations and root/project-prefix recovery using existing checks. |

Run Bun 1.4.2 with `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (set `CHROME_BIN` if needed), and `bun build.mjs`. Browser absence/skip is not visual proof. Routing semantics are preserved; any actual routing change additionally needs deployed Pages smoke proof.
