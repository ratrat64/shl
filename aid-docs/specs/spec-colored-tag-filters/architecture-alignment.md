# Architecture alignment

## Scoped amendment and precedence

The user's locked forge decisions authorize replacing the hidden toggle/exact-query interaction and the disabled-tag grayscale rule. This SPEC's tag-filter-behavior.md is authoritative for those feature responsibilities; adopted architecture/design/experience documents still govern everything outside the scope below. This amendment does not permit page-specific chrome overrides or relax shared ownership/rendered verification.

The user's explicit 2026-10-09 visual follow-up supersedes the earlier six-slot palette, neutral tag surfaces and right-side selected track: use sixteen stable automatic theme slots while retaining reserved indices; tint every tag label/chip background and border from its own ink through shared `--tag-tone`/color-mix declarations; place selections left of search on desktop and above search on mobile with matching DOM/tab order. All filtering, lossless identity, row geometry, overflow, native lifecycle and disabled non-tag contracts remain binding.

| Existing contract | Replacement |
| --- | --- |
| AD-2 accepts nonblank tags and omits hidden leaves until toggled/exact state query. | Additionally reject raw whitespace/commas. Selected reserved tags admit matching hidden leaves; every selected tag and broad remaining text still constrain them. Public raw data and leaf state derivation remain single-owner. |
| AD-5 initial # means whole-tag query; spaces can belong to names; ordinary search respects hidden toggle. | Commit #tokens into AND selections with space/comma/Enter, reject ambiguous names, retain unknown input/error; uncommitted text is broad search. Show tags replaces hidden toggle; invariant hidden-inclusive subtree catalog minus selections. |
| AD-9 cross-page mount resets search/hidden visibility/disclosures. | Reset text, selections, token error, picker visibility and disclosures together; same-page/fragment retains. Preserve one mount, outgoing-work cleanup, history/focus/scroll, and shell/theme lifetime. |
| DESIGN/EXPERIENCE require muted inline tags and entirely grayscale disabled row/popover. | Full tags use sixteen-slot per-tag ink plus matched tinted backgrounds/borders on every label/chip, including disabled rows/popovers; disabled codes/destinations/actions/wash remain neutral, hidden opacity independent. |
| DESIGN/EXPERIENCE tools and flows use Show hidden links / Hide hidden links. | Show tags / Hide tags exposes available row below search/button, selected horizontal row left of search on desktop and above on mobile, preceding search in DOM/tab order; reserved selections own hidden discovery. |

## Implementation ownership

| Existing owner | Feature responsibility |
| --- | --- |
| `src/links.mjs`: `loadLinks`, `linkFields`, `entryTree`, `linkStates` | Reject invalid raw names before output replacement; retain shared exact identity/state interpretation and read-only source/projections. |
| `src/directory.mjs`: directory tools/rows/tag panels | Render catalog metadata and chip regions from the current subtree; individual colored spans in existing informational popover markup; native baseline and consistent root/nested structure. |
| `src/assets/search.js`: `initSearch`, recursive filtering | Own selected set, fixed catalog, token/error/disclosure state, AND/text/hidden predicate, live count and focus after chip moves. Replace the old hidden-toggle/query-mode branches rather than maintaining a second filter controller. |
| `src/assets/site.css` | Own fixed color slots and theme variants, tag component states, scroll tracks/responsive tools, and the narrow disabled-tag exception. Do not duplicate CSS in page templates. |
| `src/assets/navigation.js`: mount/navigation lifecycle | Mount the existing search owner once per content transition; preserve same-page retention and cross-page reset. Keep theme/copy/download ownership intact. |
| `src/pages.mjs` and repository documentation | Update Guide copy and affected instructions together; no unique-page filter implementation. |
| `test/build.test.mjs` | Extend existing structural, behavior, validation, navigation and executed rendered checks for changed responsibilities. |

Use an existing pure helper or a minimal shared leaf for identity/color only if consumers genuinely need it; keep imports acyclic and browser consumers free of filesystem/YAML/build dependencies. Browser controls may consume renderer-published color/catalog data. No new library or parallel mutable link store is needed.

## Instruction and data synchronization

During implementation rewrite conflicting live rules in `AGENTS.md`, `README.md`, `docs/reference.md`, Guide content, PRODUCT.md, DESIGN.md, EXPERIENCE.md, and ARCHITECTURE-SPINE.md. Replace the affected semantics; do not leave local exceptions that contradict the active contract. Keep original forge inputs and historical logs unchanged.

Audit link maps and relevant fixtures explicitly. The user authorized the checked-in `release notes` tag's rename to `release-notes` on 2026-10-09. Tests demonstrating old padded or multiword tags must reflect the new rejection rule or an explicit fixture rename. Validation checks syntax, not reachability; disabled/hidden destinations remain public.

## Locked-source preservation map

| forged-idea.md line | Contract location |
| --- | --- |
| 3: full labels, reject dots/hover-only | CAP-1; behavior Tools and selection |
| 4: automatic persistent colors, every surface, disabled exception | CAP-1; behavior Automatic color assignment; amendment table |
| 5: Show tags replacement and lower scroll row | CAP-2; behavior Tools and selection |
| 6: subtree/hidden-inclusive invariant pool minus selected | CAP-2; behavior Tools and selection |
| 7: selected scroll row beside search, reversible activation | CAP-2; behavior Tools and selection |
| 8: AND plus existing broad free text | CAP-3; behavior Filtering and hidden visibility |
| 9: #, three delimiters, known consumption, unknown retained/error | CAP-4; behavior Typed tokens |
| 10: reject whitespace/comma, guidance, explicit rename | CAP-5; behavior Identity and validation; SPEC Open Questions |
| 11: restricted hidden reveal with all filters/ancestors | CAP-3; behavior Filtering and hidden visibility |

The ancillary forge report's readability, narrow-screen, data/docs, duplicate-token and reset concerns are addressed in behavior color/accessibility/tools/validation/token/lifecycle sections. Its earlier dots proposal is superseded by the later locked full-label decision; report stamp, personas and ceremony are not build requirements.
