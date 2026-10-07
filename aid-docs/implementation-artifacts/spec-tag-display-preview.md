---
title: Compact tag display comparison
type: chore
created: 2026-10-07
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Show both proposed tag treatments so Rat can compare them before choosing: single-line inline tags and a tag-count control opening a floating panel. Use the current directory appearance, identical sample entries, and responsive layouts. Tagged and untagged entries must have equal heights; long tags must remain inspectable with keyboard and touch.

</frozen-after-approval>

## Implementation Notes

- Added standalone `mockups/tag-display.html` beside the existing directory mock. Both treatments use identical entries and current palette/type styles; native HTML popovers supply keyboard activation, Escape, light dismissal, and the browser top layer. Full-width mode matches the existing 1160px container.
- Browser assertions passed in Chrome at 1440px and 390px, both themes, and 200% zoom: equal heights for the five ordinary tagged/untagged rows, no page overflow, full-width mode, keyboard opening, Escape, and outside-click dismissal. A long-code stress row scrolls horizontally like the current directory. Check script and screenshots are in `/tmp/opencode/check-tag-display.mjs` and `/tmp/opencode/tags-*.png`.
- `bun ci`, all 17 build tests, and `bun build.mjs` passed with Bun 1.4.2. Mechanical detector reported only typography advisories for sizes inherited from the current directory; comparison heading uses the existing h2 ramp.

## Review Triage Log

- Medium, patched: long codes could overflow the viewport. Added a stress sample, row-local horizontal scrolling, and a positioning context for visually hidden destination text; browser checks show no page overflow.
- Medium, patched: tall tag panels could extend outside short viewports and internal scrolling would dismiss them. Added viewport-relative height/scrolling and close only when the trigger moves.
- Low, patched: inline accessible names suppressed tag names. Included complete tags in inline button names.
- Low, patched: half-width comparison could bias destination-space judgments. Added a full-width view using the current directory container width.
- Low, patched: ordinary samples alone did not demonstrate stress behavior. Added long-code and long-tag samples; verified ordinary row heights at narrow width and 200% zoom.
