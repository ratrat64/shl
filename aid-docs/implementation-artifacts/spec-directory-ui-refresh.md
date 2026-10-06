---
title: 'Refresh directory controls and live link count'
type: 'feature'
created: '2026-10-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md
  - aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/EXPERIENCE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The directory looks fragmented: framing rules, a redundant Links heading and result sentence, and a separated search label compete with the count and link list. Its homepage count also fails to reflect search and disappears when no visible links remain.

**Approach:** Implement the approved responsive UX: a prominent single count on the left that tracks the current visible matches; a one-line search followed by an extensible hidden-links control group on the right; spacing instead of directory framing lines. Preserve folder titles, browsing and progressive enhancement, including a visible zero count.

</frozen-after-approval>

## Implementation Notes

- Intent gaps: none; the final UX spines and homepage mock define layout, copy, states, and accessible labeling.
- Irreversibles: none; static templates and regression tests only.
- Footprint: `src/pages.mjs` templates/CSS/search state, `test/build.test.mjs` markup and simulated interactions, and `README.md` directory-use text. No new dependency or public API.
- Reuse `directoryContents`, `visibleCount`, and the existing recursive browser `filter` for home and nested pages. Keep the guide's section rules and existing code/destination link actions.
- Implemented shared directory controls in `src/pages.mjs`: search and hidden toggle follow one live count, with 0 visible even on an empty root; directory-only rule removal leaves guide styling intact. `test/build.test.mjs` exercises rendered markup and browser interactions; `README.md` reflects the new count behavior.
- Raised the nested count type after review to sit clearly above row metadata while leaving the folder heading primary.

## Review Triage Log

- `[false]` Historical PRD mentions the root DESIGN.md as an input at its creation date; active AGENTS, architecture and epics pointers were updated in the design PR.
- `[false]` From `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/`, four `../` segments correctly reach repository-root README, PRODUCT and links.yaml.
- `[false]` The epics file explicitly records baseline behavior at an earlier revision, not a current hidden-link requirement; new behavior is defined by the final UX spines.
- `[low, patch]` Nested count needed clearer display hierarchy; increased its font-size range without outranking the folder heading.
- `[false]` Small-screen rows intentionally preserve the existing code/destination relationship and scrolling per EXPERIENCE.md; the illustrative mock yields to the spine on conflicts.
- `[low, rejected]` CSS-string assertions cannot prove actual viewport layout, but adding a browser harness for this static UI change is disproportionate to the existing build-test setup.
- `[low, rejected]` The visible Show/Hide action text identifies the next action while `aria-pressed` reports the current reveal state; both were explicitly requested in the UX spine.
- `[false]` The mock illustrates the at-rest toolbar; its lack of a second revealed state does not leave behavior unspecified because EXPERIENCE.md documents toggle, count and hidden-state rules.
