# Input reconciliation: .memlog.md decisions

Date: 2026-10-03. Compared all eight decision/change entries in `.memlog.md:6–13` with `prd.md` and `addendum.md`; checked implementation where decisions refer to current capabilities.

## Substantive gaps or contradictions

None. The latest decisions are preserved; earlier unresolved statements are superseded explicitly rather than treated as outstanding commitments.

## Decision-by-decision reconciliation

| Source entry | Commitment and location in the draft/addendum |
| --- | --- |
| Line 6 | Current-product scope, personal-tool stakes, small-to-medium-team audience, stable memorable links for scattered resources/automation, and reference-first directory use: PRD sections 1–2 and 6. Vision + Features is the drafting approach, not an extra product feature. |
| Line 7 | YAML/JSON repository editing, freely chosen names/folders within validation, branch/PR/check/merge/deploy, and commit-pinned script stability chosen by URL: FR-1–FR-4, FR-13, UJ-1, and addendum Maintainer's Script Example. `links.yaml:45–51` confirms the moving/pinned siblings. |
| Line 8 | Minimal-dependency static GitHub Pages hosting without backend/database or application access management; public metadata and destination-owned access control: PRD sections 5–6 and addendum Technical Context. |
| Line 9 | Hidden automation entries are intended to reduce human-directory clutter, not restrict URL access; automation consumption/editing, human maintenance, and discovery are success outcomes: addendum Directory-Hidden Links and SM-1–SM-3. The unresolved scope/editing questions in this entry are settled by lines 10–11. |
| Line 10 | Reaffirmed current-state scope; hidden links future-only; automation editing modifies the repository map without a separate application editor: FR-9, FR-14, section 6, and addendum Future Enhancement Candidates. |
| Line 11 | Selected external GitHub API editing, direct file editing retained, CLI/helper and browser editor future-only, dedicated application API excluded: PRD section 2, FR-14, sections 6 and 8, and addendum Automation Editing Options. No API client, credential management, or app integration is claimed. |
| Line 12 | Engineer-friendly config/PR maintenance; future naming/grouping guidelines; actual searchable fields rather than destination-content indexing; unmeasured large-library responsiveness: PRD sections 2 and 5, FR-10, SM-2–SM-3, open scale item, and addendum Organization Guidelines. `build.mjs:248–277,308–309` confirms text filtering over recorded properties. |
| Line 13 | Hundreds of links is expected use, not demonstrated capacity or a numeric latency guarantee: PRD sections 2 and 5, SM-3, and the scale evidence open item. |

## Reconciliation boundary

No current requirement is inferred for hidden links, CLI/helper tooling, a browser editor, or naming/grouping guidelines. GitHub API editing remains an external approach. The chosen pinned script is maintainer-supplied evidence, not independently verified script correctness. No new quantitative performance promise is introduced.
