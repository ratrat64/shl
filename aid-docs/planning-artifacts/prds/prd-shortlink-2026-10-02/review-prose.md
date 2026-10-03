# Shortlink PRD prose review

These documents exist to help maintainers and downstream planners understand Shortlink's approved current-state personal-tool capabilities, constraints, and separately recorded future possibilities.

## Review basis

- **Pass:** Explicit prose lens only, applied to `prd.md` and `addendum.md` using `lens-prose.md` and its required `editorial-common.md` reference.
- **Readers and style:** Human readers; Microsoft Writing Style Guide. Prioritize clear sentence construction, unambiguous references, and plain language over stylistic preference.
- **Structure handoff:** Read `review-structure.md` first. Its Strategic/Context (Pyramid) model and supporting-reference addendum remain intact. It reported no findings, so there are no CUT passages to skip or MERGE locations to reconcile. Preserve its examples, summaries, headings, and progression.
- **Voice to preserve:** Concise, technical, factual current-state descriptions; requirement labels and IDs; imperative capability statements; explicit limitations and evidence caveats. Terms such as link map, launcher, subtree, and commit-pinned URL serve the engineering audience. Future possibilities retain their conditional language.
- **Boundary:** Preserve approved scope and content. No new requirements, targets, or claims. Front matter, code blocks, structural markup, and approval/status wording are unchanged. Finalization remains with the parent task.

## Findings

| Pass | Original Text | Revised Text | Changes |
| --- | --- | --- | --- |
| prose | `prd.md`, §4.3, FR-10: With JavaScript enabled, homepage and directory-page search filters their entries and descendants case-insensitively by short code, title, destination URL, and nested folder names. | With JavaScript enabled, search on the homepage or a directory page filters that page's entries and descendants case-insensitively by short code, title, destination URL, and nested folder names. | Applied. Replace the compressed subject and ambiguous “their” with an explicit page reference. Preserve the existing per-page subtree scope and all search fields. Adds 5 words. |
| prose | `prd.md`, §5, Usability and accessibility: non-color-only script identification | script identification that does not rely on color alone | Applied. Unpack the stacked negative modifier into plain language so readers can understand the existing accessibility affordance without decoding the compound. Preserve the separate caveat about unaudited conformance. Adds 6 words. |

No actionable prose findings in `addendum.md`; no copy edits applied there.

## Measurement and handoff

Exact total and per-heading counts were obtained before and after editing with the supplied `word_metrics.py`, run using `python3`. Totals include headings and front matter; section counts measure the body directly beneath each heading.

| Document | Original words | Revised words | Reduction |
| --- | ---: | ---: | ---: |
| `prd.md` | 1,725 | 1,736 | −11 (−0.64%) |
| `addendum.md` | 574 | 574 | 0 (0%) |
| **Combined** | **2,299** | **2,310** | **−11 (−0.48%)** |

The only changed section counts are PRD §4.3 (235 → 240) and §5 (181 → 187). All other section counts remain unchanged.

**Recommendations: 2. Applied copy edits: 2. Net growth: 11 words (0.48% of 2,299).** No length target was supplied. The small increase makes existing meaning explicit; no examples, caveats, or reader-engagement elements were cut. Scope, IDs, and draft status are preserved. This is a prose-only handoff, not a finalization decision.
