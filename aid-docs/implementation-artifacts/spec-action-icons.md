---
title: 'Action icons'
type: 'feature'
created: '2026-10-10'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - /home/rat/Git/shl/shl-action-icons/aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md
  - /home/rat/Git/shl/shl-action-icons/aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/EXPERIENCE.md
  - /home/rat/Git/shl/shl-action-icons/aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/mockups/icon-actions.html
  - /home/rat/Git/shl/shl-action-icons/aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Row actions (Open, Download) and toggles (Show tags, theme) are text-only, so scanning crowded 50px rows is slow and the click-to-copy affordance stays undiscoverable.

**Approach:** Add minimalist 1em stroke inline-SVG icons (currentColor, no new dependency) per the finalized UX spines: icon+full-text Open/Download at the same button box, compact icon+short-text tags/theme toggles with preserved accessible names and expanded-state cues, collapsing to icon-only below ~740px. Copy stays implicit click-to-copy; no copy buttons.

</frozen-after-approval>

## Implementation Notes

- Icons reuse the approved preview SVGs verbatim (external-arrow Open, down-to-line Download, tag + chevron tags-toggle, sun/moon/monitor theme): 1em stroke `currentColor`, no new dependency.
- Desktop icon+text at the same box: `.visit`/`.download` horizontal padding `0.55rem` to `0.45rem`, `0.35rem` icon gap, `inline-flex` centered content.
- Compact toggles: visual `tags` / `light|dark|system`; full `Show|Hide tags` and `Theme: <state>` retained in `aria-label` + `data-label-*`. Tag-toggle chevron rotates on `aria-expanded` with stronger expanded fill; `#tag-toggle` keeps fixed `6.5rem` desktop (`auto` in icon-only mobile), theme keeps `min-width: 11ch` desktop (`0` mobile).
- `theme.js`/`search.js` update only the `.btn-label` span (+ `aria-label`, theme icon `hidden` swap); never `textContent` the button, so inline SVG survives. Copy stays implicit click-to-copy (option A): no copy buttons.
- Surprise: shell snapshot failed on guide/390/dark by ~2e-5px moon-path bbox height. Root cause is Blink float dust on SVG bboxes measured on BFCache-scrolled pages (footer-link focus in a prior iteration scrolled guide; restoration carried it into the snapshot load) — not path shape (arcs, cubics, and polygons showed the identical signature; only integer-aligned straight paths were immune). Fixed by rounding numbers to 0.001px in the harness's inner snapshot `equal()`; still catches every visible shift. Moon kept as originally approved arcs.
- Files: `src/directory.mjs`, `src/layout.mjs`, `src/assets/theme.js`, `src/assets/search.js`, `src/assets/site.css`, `test/build.test.mjs`.
- Verified: `bun run format`, full `bun test` 47/47 with `SHL_REQUIRE_BROWSER=1` (real Chrome).

## Review Triage Log

- Unescaped `label` interpolation in `action()`: low → patched with `esc(label)` (AD-4 literal compliance; call sites pass literals only, so no reachable injection).
- Icon-only `.btn-label` rule duplicated `.sr-only` minus three declarations with invalid comma-less `clip:`: low → patched with the exact `.sr-only` declarations.
- Duplicate SVG attr strings in `directory.mjs`/`layout.mjs`: low → patched (single owner `iconSvgAttrs` exported from `layout.mjs`, imported by `directory.mjs`).
- No coverage for theme icon `hidden` swapping: medium → patched (exactly-one-visible + cycling assertions in the theme unit tests).
- No 44px touch target in icon-only mode: false — matches the approved UX (width shrink is the point of icon-only; button heights follow the pre-existing pattern; no repo touch-target rule).
- Missing tooltip + visual/aria split assertion for tags toggle: false — no existing button uses `title` tooltips, and the split is already asserted (svg + `tags` span + chevron + `aria-label` regex).
- No disabled icon-markup assertion: low → patched (disabled Download svg + label assertion in the filenames test).
