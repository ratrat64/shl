---
title: 'Match broken-link Open controls and highlights to the short code'
type: 'bugfix'
created: '2026-10-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Broken links should use their short code's orange-red palette for the Open button and row hover/focus highlight, in light and dark themes. Keep disabled precedence and independent hidden opacity, existing geometry, focus indicators, and enabled actions.

Follow-up requested by the user: the long destination URL's hovered text should also use the broken short code's orange-red palette.

</frozen-after-approval>

## Implementation Notes

- `src/assets/site.css`: reuse `--button-tone` for broken enabled Open text/border/fills, and scope the warning wash to broken enabled rows. Disabled rows retain their existing palette; Download keeps its script-action styling.
- Row wash uses 6% warning color rather than the button's 10% fill: the rendered contrast check caught insufficient contrast for hidden light-theme metadata at 10%.
- `test/build.test.mjs`: extend the existing rendered state matrix with Open default/hover fills, borders and text, row hover/focus colors, and actual wash contrast across state combinations, both themes and sizes, native/scripted loads and root/project prefixes.
- Synchronize `DESIGN.md` and `EXPERIENCE.md` with this state-specific palette refinement. Focused required-Chrome state checks pass.
- Review fixes: cap broken Open hover fill at 12% to retain hidden text contrast, and model parent opacity by compositing both text and background over the page. Extend the row-emphasis experience rule with the warning exception.
- Final verification: Bun 1.4.2 `bun ci`, format and format:check, all 30 tests with `SHL_REQUIRE_BROWSER=1`, `bun build.mjs` (68 links), and `git diff --check` passed. The full rendered matrix includes shared shell consistency, native/app transitions, minimal documents, and root/project-prefix recovery. The UI detector returned no findings.
- Follow-up: add a broken-enabled destination hover override and rendered hover color/contrast checks to the existing state matrix. Merge latest main's independent row-spacing change before verification.
- Follow-up review adds resting/restored destination colors, visible fragment inheritance, and retained hover underline checks.
- Follow-up verification: all 30 required-browser tests, format checks, build, and diff whitespace checks passed; after adding review-requested assertions, the affected rendered state matrix passed again.

## Review Triage Log

- medium, patched: hidden broken Open hover text was approximately 4.16:1 with the shared 18% fill. The warning-specific 12% fill yields approximately 4.55:1 in light mode at 94% opacity; rendered checks now exercise dimmed hover contrast.
- medium, patched: contrast checks composited text over the wash rather than compositing the entire row over the page. The check now models both layers correctly.
- low, patched: EXPERIENCE.md's Row emphasis rule omitted the broken-enabled exception; it now agrees with its Button fills rule and DESIGN.md.
- medium, deferred: extending hover contrast to unchanged standard hidden Open controls exposed their pre-existing light-theme contrast of approximately 4.11:1. Recorded separately; changed warning controls have an executed contrast regression check.
- low, patched: follow-up checks initially covered only hovered color. Assert muted resting color and restoration to protect the hover-only boundary.
- low, patched: follow-up checks initially inspected only the destination container. Assert both visible fragments inherit its hover color and its underline remains.
