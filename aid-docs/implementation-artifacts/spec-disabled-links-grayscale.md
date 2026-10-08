---
title: 'Grayscale disabled links'
type: 'bugfix'
created: '2026-10-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Disabled links should use only shades of gray. Their codes, destinations, tags, tag popovers, unavailable Open/Download controls, backgrounds, borders, selection and keyboard focus must remain grayscale in both themes, including hover and hidden/broken/script combinations. Preserve copying, disclosure, disabled actions, geometry and readable contrast.

Follow-up: disabled short codes must retain their resting appearance on hover, with no underline added.

</frozen-after-approval>

## Implementation Notes

- Reuse state-scoped theme roles in `src/assets/site.css` for `.disabled-row` and its sibling `.tag-panel`; use true neutral disabled foregrounds and neutral surfaces. Keep enabled entries and shared chrome using their existing palette.
- Extend the existing rendered state matrix in `test/build.test.mjs` with grayscale assertions for resting, hover, focus, selection and open tag panels. Existing suite covers both themes, widths, native/app loads, minimal documents and root/project-prefix recovery.
- Synchronize the disabled palette and interaction description in the existing DESIGN.md and EXPERIENCE.md.
- Retained hidden-row opacity over a neutral parent backdrop so translucent disabled rows cannot pick up the page's green tint. Hover projection now edits selectors in place to preserve production cascade ordering; contrast checks use each control's fill and the compositing backdrop, including selection spans and popovers.
- Verification: Bun 1.4.2; `bun ci`, `bun run format`, required-browser full suite (30 passed), `bun build.mjs` (68 links), `bun run format:check`, and `git diff --check` succeeded. Mechanical UI detector returned no findings.
- Follow-up: explicitly retain `text-decoration: none` on disabled short codes; the rendered state matrix asserts it both at rest and on hover.

## Review Triage Log

- Medium, patched: hidden row opacity originally blended neutral colors over the green-tinted page; the owning list item now provides a neutral backdrop.
- Medium, patched: appended synthetic hover rules overrode the later disabled-button rules; projected hover selectors now preserve original rule order, and tests assert unchanged disabled wash.
- Medium, patched: action contrast was checked against row backgrounds instead of button fills; checks now account for actual fills and row-opacity compositing.
- Low, patched: selection/popover checks verified grayscale without contrast; added readable-contrast checks including destination text spans.
