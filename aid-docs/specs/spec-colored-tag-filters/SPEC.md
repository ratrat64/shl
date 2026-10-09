---
id: SPEC-colored-tag-filters
companions:
  - tag-filter-behavior.md
  - architecture-alignment.md
  - ../../planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-shortlink-2026-10-06/EXPERIENCE.md
sources:
  - ../../forge/colored-tag-filters/forged-idea.md
---

> **Canonical contract.** This SPEC and its companions are the complete, preservation-validated contract. The scoped amendments in architecture-alignment.md supersede conflicting existing instructions; all other adopted invariants remain binding.

# Colored tag filters

## Why

Give directory visitors a discoverable, reversible way to combine tags and text while recognizing the same full colored labels throughout shl. Replace the hidden-link toggle with tag discovery without exposing unmatched hidden links or making filter choices disappear when results narrow.

## Capabilities

- **CAP-1**
  - **intent:** Visitors can recognize full tag labels consistently across directory surfaces.
  - **success:** The same case-insensitive tag retains its automatic sixteen-slot theme identity across folders, reloads, builds, row labels, tag popovers, available tags, selected tags, and disabled rows; full labels have color-matched tinted backgrounds/borders and are readable without hovering.
- **CAP-2**
  - **intent:** Visitors can discover, select, and remove tags in their current directory subtree.
  - **success:** Show tags reveals one scrollable available-tag row containing the subtree's tags, including hidden leaves, minus selections. Activation moves a tag to the scrollable selected row left of search on desktop and above it on mobile, preceding search in DOM/tab order; removal returns it. Results never shrink the catalog.
- **CAP-3**
  - **intent:** Visitors can narrow links by every selected tag and remaining free text.
  - **success:** Results satisfy selected-tag AND and the existing broad substring search. Hidden leaves appear only when hidden, broken, or disabled is selected and the leaf satisfies every filter; only matching ancestors remain. One live count and the existing no-match state agree with results.
- **CAP-4**
  - **intent:** Visitors can select known tags by typing and correct unknown tokens.
  - **success:** A #tag committed by space, comma, or Enter selects the same tag as the picker and removes its token/delimiter. Unknown tokens remain with “Tag not found”; repeated known tokens produce no duplicate selection or accidental removal.
- **CAP-5**
  - **intent:** Maintainers can publish tag names that are unambiguous in typed filters.
  - **success:** JSON, YAML, and YML reject whitespace or commas anywhere in tag names before replacing output, identify affected entries, and request explicit renaming. Valid raw values remain intact; no silent migration occurs.

## Constraints

- Preserve locked source decisions except the user-approved 2026-10-09 visual amendment detailed in tag-filter-behavior.md: sixteen slots, palette-matched tinted tag surfaces/borders and selected tags left of search (above on mobile) in matching DOM/tab order. No dots, hover-only row labels, OR filtering, result-dependent tag pool, or grayscale-only disabled tags.
- Tag color is independent of link state; disabled codes, destinations, and unavailable actions retain disabled behavior/styling, and hidden opacity remains independent.
- Keep static GitHub Pages publication, validation-before-output-deletion, public destinations, native browsing, existing routing/launchers, shared component ownership, and the single browser lifecycle. No frontend framework or new dependency.
- Maintain usable search and one-line, horizontally scrollable full labels at narrow widths; meet existing focus, text contrast, count announcement, and no-JavaScript foundations.
- Synchronize conflicting live instructions during implementation under architecture-alignment.md. Existing incompatible tag data requires explicit maintainer renaming before a valid release.

## Non-goals

- Manual tag-color configuration, unique colors for every tag, a stored color registry, or a backend/indexing service.
- OR filters, tag suggestions/autocomplete, filter URL sharing or persistence, row-tag filter activation, or automatic renaming.
- Changes to destination access, redirect/recovery semantics, launchers, copying, script downloads, or shared shell design.

## Success signal

- On root and nested pages, visitors can discover hidden-inclusive tags, combine two selections and text, remove either selection, and recover from zero results without losing choices. Reserved selections reveal only matching hidden leaves and ancestors; colors remain consistent, including disabled-row tags, in both themes and mobile/desktop layouts.
- Input-validation, token/filter/lifecycle regressions and the required rendered matrix in tag-filter-behavior.md pass after explicit incompatible-data renaming and instruction alignment.

## Assumptions

- Deterministic palette identity fulfills persistent color assignment without storage; light/dark use corresponding readable variants rather than identical RGB values.
- Uncommitted #tokens use live broad text search, with no hidden reveal; the previous initial-# exact-query mode is replaced by committed selections.
- Duplicate commits are idempotent. Filters and picker visibility reset on cross-page mounts, matching current navigation; same-page/fragment navigation retains them. Clearing text or collapsing the picker retains selected tags.

## Approved data decision

- On 2026-10-09 the user explicitly authorized renaming `links.yaml`'s `search-test-exact` tag `release notes` to `release-notes`. No other automatic renaming is authorized.
