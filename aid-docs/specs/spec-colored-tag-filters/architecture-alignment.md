# Architecture alignment

## Scoped amendment and precedence

The user's locked forge decisions authorize replacing the hidden toggle/exact-query interaction and the disabled-tag grayscale rule. This SPEC's tag-filter-behavior.md is authoritative for those feature responsibilities; adopted architecture/design/experience documents still govern everything outside the scope below. This amendment does not permit page-specific chrome overrides or relax shared ownership/rendered verification.

The latest approved 2026-10-09 seeded-color/validation follow-up supersedes finite palettes and uppercase/emoji acceptance: generate every tag's HSL light/dark inks from its UTF-16 FNV seed, including state labels, using the fixed readable bounds in the behavior companion. Renderer publishes --tag-light/--tag-dark; shared --tag-tone uses native light-dark and existing color-mix tints/borders. Reject Unicode uppercase/titlecase and emoji source names along with whitespace/commas, before output deletion, preserving valid lowercase/uncased text/digits/punctuation and explicit maintainer migration only. Selected tags remain left of search on desktop and above on mobile in matching DOM/tab order. All filtering, lossless identity, row geometry, native lifecycle and disabled non-tag contracts remain binding; row-state emphasis stays separate from generated label colors.

| Existing contract | Replacement |
| --- | --- |
| AD-2 accepts nonblank tags and omits hidden leaves until toggled/exact state query. | Additionally reject raw whitespace/commas/Unicode uppercase/titlecase/emoji with exact rename guidance. Selected reserved tags admit matching hidden leaves under AND/text constraints. Valid raw data and state interpretation remain single-owner; input tokens/recovery can be case-insensitive without accepting uppercase source names. |
| AD-5 initial # means whole-tag query; spaces can belong to names; ordinary search respects hidden toggle. | Commit #tokens into AND selections with space/comma/Enter, reject ambiguous names, retain unknown input/error; uncommitted text is broad search. Show tags replaces hidden toggle; invariant hidden-inclusive subtree catalog minus selections. |
| AD-9 cross-page mount resets search/hidden visibility/disclosures. | Reset text, selections, token error, picker visibility and disclosures together; same-page/fragment retains. Preserve one mount, outgoing-work cleanup, history/focus/scroll, and shell/theme lifetime. |
| DESIGN/EXPERIENCE require muted inline tags and entirely grayscale disabled row/popover. | Full tags use per-string seeded HSL inks plus matched tinted backgrounds/borders on every label/chip, including state labels and disabled rows/popovers. No finite/reserved color slots; disabled codes/destinations/actions/wash remain neutral, hidden opacity independent. |
| DESIGN/EXPERIENCE tools and flows use Show hidden links / Hide hidden links. | Show tags / Hide tags exposes available row below search/button, selected horizontal row left of search on desktop and above on mobile, preceding search in DOM/tab order; reserved selections own hidden discovery. |

## Implementation ownership

| Existing owner | Feature responsibility |
| --- | --- |
| `src/links.mjs`: `loadLinks`, `linkFields`, `entryTree`, `linkStates` | Reject invalid raw names before output replacement; retain shared exact identity/state interpretation and read-only source/projections. |
| `src/directory.mjs`: directory tools/rows/tag panels | Render catalog metadata and chip regions from the current subtree; individual colored spans in existing informational popover markup; native baseline and consistent root/nested structure. |
| `src/assets/search.js`: `initSearch`, recursive filtering | Own selected set, fixed catalog, token/error/disclosure state, AND/text/hidden predicate, live count and focus after chip moves. Replace the old hidden-toggle/query-mode branches rather than maintaining a second filter controller. |
| `src/assets/site.css` | Consume renderer-published generated theme inks through shared light-dark/color-mix tag treatment; own states/tracks/responsive tools and narrow disabled-tag exception. No per-slot tokens/selectors or CSS duplication. |
| `src/assets/navigation.js`: mount/navigation lifecycle | Mount the existing search owner once per content transition; preserve same-page retention and cross-page reset. Keep theme/copy/download ownership intact. |
| `src/pages.mjs` and repository documentation | Update Guide copy and affected instructions together; no unique-page filter implementation. |
| `test/build.test.mjs` | Extend existing structural, behavior, validation, navigation and executed rendered checks for changed responsibilities. |

Use an existing pure helper or a minimal shared leaf for identity/color only if consumers genuinely need it; keep imports acyclic and browser consumers free of filesystem/YAML/build dependencies. Browser controls may consume renderer-published color/catalog data. No new library or parallel mutable link store is needed.

## Instruction and data synchronization

During implementation rewrite conflicting live rules in `AGENTS.md`, `README.md`, `docs/reference.md`, Guide content, PRODUCT.md, DESIGN.md, EXPERIENCE.md, and ARCHITECTURE-SPINE.md. Replace the affected semantics; do not leave local exceptions that contradict the active contract. Keep original forge inputs and historical logs unchanged.

Audit link maps and relevant fixtures explicitly. The user authorized the checked-in `release notes` tag's rename to `release-notes` on 2026-10-09. Tests demonstrating old padded or multiword tags must reflect the new rejection rule or an explicit fixture rename. Validation checks syntax, not reachability; disabled/hidden destinations remain public.
The same user's latest follow-up explicitly authorizes HiDdEn → hidden, BrOkEn → broken, DiSaBlEd → disabled and emoji-🎉 → emoji-party only. Future invalid names require maintainer-chosen replacements. Preserve historical forge/memory logs and earlier verification evidence; rewrite conflicting live contracts.

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
