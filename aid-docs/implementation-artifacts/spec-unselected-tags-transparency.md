---
title: 'Unselected tags transparency'
type: 'feature'
created: '2026-10-10'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Available (unselected) tag chips in the Show-tags picker look identical in weight to selected tags, so unselected options stand out more than they should.

**Approach:** Render available-picker tag chips slightly transparent while keeping selected chips, inline row labels, and popover labels at full opacity; hover/focus restores full opacity.

</frozen-after-approval>

## Implementation Notes

- Scoped to `#available-tags .tag-chip` in `src/assets/site.css`: resting `opacity: 0.8`, restored to `1` on `:hover`/`:focus-visible`. Selected chips (`#selected-tags`), inline `.tag-label` row labels, and popover labels untouched.
- Kept existing tint/border fills unchanged so rendered tag-surface checks still match; 0.8 keeps ≥4.5:1 headroom on the generated ink envelope in both themes.
- No transition change: opacity flips immediately, consistent with reduced-motion immediacy.
- Review follow-up: restore rule widened from `:focus-visible` to `:focus`, and `opacity` added to the shared `.tag-chip` highlight transition so hover/focus softens over 140ms like neighbouring tint/border changes.
- Follow-up (2026-10-10): resting opacity lowered 0.8 → 0.7 per maintainer choice. Measured via headless-Chrome CDP probe across the full hue envelope plus real map tags: at 0.7 the gray fixed tags read 3.1:1 light / 3.8:1 dark (below the 4.5:1 floor); all generated hues stay above 3.1. Accepted tradeoff for a clearer selected/unselected distinction.

## Review Triage Log

- `:focus`/`:active` left dimmed — low, patched: restore selector now `:hover`/`:focus`.
- Opacity stacking with hidden dimming — false: picker chips live in toolbar tracks, never inside `li[data-hidden]`; row `.tag-label`s untouched.
- Mount animation end-snap (1 → 0.8) — low, rejected: transient 240ms entrance effect with a 0.2 delta; removing the fade would violate the specified chip entrance motion.
- Opacity snapping against animated neighbours — low, patched: `opacity` added to the `.tag-chip` transition (no-preference media only, reduced-motion still immediate).
- Focus outline faded at 0.8 — low, resolved by the `:focus` patch: a focused available chip is always full opacity.
- Missing forced-colors override — low, rejected: no `forced-colors` support exists anywhere in the stylesheet; out of scope for this tweak.
- Opacity as the only selected-vs-available cue / dimmed disabled chips — false: selected chips already carry `aria-pressed="true"` plus a visible `×` suffix, and chips are never `disabled` (only the picker toggle can be).
- Stale spec (no verification, `in-progress`) — false: `bun run format`, `bun build.mjs`, and the full browser suite (47 pass) were run; status now `done`.
