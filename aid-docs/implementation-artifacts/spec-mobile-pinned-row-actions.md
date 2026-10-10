---
title: 'Pinned row actions on small screens'
type: 'feature'
created: '2026-10-10'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On mobile and other small screens a link row can scroll horizontally under long codes, tag lists, and destinations, pushing the Download and Open buttons out of view so visitors must hunt for them.

**Approach:** Pin the Download/Open buttons as one always-visible group layered above the row content on narrow viewports, while keeping the desktop grid, 50px row height, and full-length tags/destinations unchanged.

</frozen-after-approval>

## Implementation Notes

- Wrapped Download/Open in `span.link-actions` (`src/directory.mjs`); `display:contents` on desktop so the grid is untouched (desktop screenshots byte-identical to main).
- Below 740px rows become flex; the action group is `order:-1`, sticky to the leading edge, opaque (`--bg`, `--wash` on hover/focus-within, tracking disabled/broken scopes via redefined tokens), `z-index:1`. Destination keeps a 3rem flex reserve after a `Destination reserve` failure at 390px.
- Updated one adjacency regex and added static pinning-contract asserts (`test/build.test.mjs`). Full suite: 47 pass, 0 fail with `SHL_REQUIRE_BROWSER=1`; real-Chrome screenshots verified mobile pinning and desktop parity.

## Review Triage Log

- Dead `grid-template-columns` at ≤500px under flex: low, rejected (harmless, doubles as fallback).
- RTL physical `left`: false, rejected (no RTL support exists anywhere; unreachable state).
- No trailing divider on pinned group: low, rejected (standard sticky-column pattern; divider would need per-state sync).
- Unnamed accessible group: false, rejected (generic span changes no programmatic semantics vs sibling buttons).
- Inner buttons shrinkable: false, rejected (nowrap text + automatic minimum size floors them).
- Static pinning asserts incomplete: patched (assert now covers display/order/sticky/z-index/background).
- Height/focus/clipping unverified: false/low, rejected (50px asserted at 320/390/1440 plus state-matrix/spectrum fixtures).
