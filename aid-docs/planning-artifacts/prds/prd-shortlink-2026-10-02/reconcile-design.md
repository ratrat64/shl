# Input reconciliation: DESIGN.md

Date: 2026-10-03. Compared `DESIGN.md` with `prd.md` and `addendum.md`; checked the shared styles, page shell, and listing templates in `build.mjs`.

## Substantive gap

1. **The reference-first visual intent is referenced but not distilled.** `DESIGN.md:40–47,57–67,77–86` commits to “The Working Index”: a compact, flat index prioritizing codes, destinations, and search, with unruled two-column entries rather than decorative cards. FR-8–FR-10 preserve the functions and paired information, and the PRD cites DESIGN.md, but neither artifact explicitly preserves this qualitative constraint against a card-based or decoration-led reinterpretation. A short addendum statement would preserve the existing visual intent without copying tokens or fixing every measurement. `build.mjs:188–211,293–321` confirms that this is current design, not a future redesign request.

## Captured commitments

- Codes remain adjacent to destinations; optional titles appear on hover and are searchable; script entries have color plus a text label: FR-9, confirmed by `build.mjs:204–211,308–309`.
- Folder names navigate while disclosures expand nested lists; breadcrumbs and search serve directory pages: FR-8–FR-10, confirmed by `build.mjs:297–300,317–330`.
- Long destinations are visually shortened while their full values remain available to assistive technology: FR-9, confirmed by the full `.sr-only` URL and aria-hidden visual fragments in `build.mjs:309`.
- System light/dark modes, saved theme override, visible focus, semantic navigation/disclosures, and responsive layout: FR-11 and section 5, confirmed by shared styles and theme script.

## Source/implementation contradiction, not a missing current capability

`DESIGN.md:55,77` promises the full destination on hover. `build.mjs:308–309` adds the destination URL as its tooltip only when no optional title exists; titled entries instead inherit the row's title tooltip. The PRD accurately promises the full URL to assistive technology without claiming universal full-URL hover. Treat the design prose as overbroad for titled entries, not as grounds to assert an unimplemented capability in this current-state PRD.

## Reconciliation boundary

Exact hex colors, font sizes, widths, breakpoints, corner radii, and active-link decoration do not need duplicate PRD requirements. The missing commitment is the usable, reference-first index character, not token-level fidelity. No redesign or source change is proposed by this extract.
