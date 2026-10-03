# Input reconciliation: PRODUCT.md

Date: 2026-10-03. Compared `PRODUCT.md` with `prd.md` and `addendum.md`; checked `build.mjs`, `package.json`, `links.yaml`, and both GitHub Actions workflows.

## Substantive gaps or contradictions

None. The draft and addendum preserve the source's substantive product commitments.

## Captured commitments

- Visitors browse/follow public short links; maintainers edit a version-controlled map and publish through PRs and `main` deployment: PRD sections 2 and 4.1–4.3.
- A single JSON/YAML map drives validation, redirect pages, browseable directories, case-recovery handling, and optional launchers: FR-1–FR-14. These are confirmed by `build.mjs:20–114,123–154,293–410,421–446`.
- Public destinations, no backend/database, no anonymous submission/tracking, browser rather than HTTP redirects, case-insensitive uniqueness, and syntax-only destination validation: FR-3, FR-5, and sections 5–6.
- Node.js 24, the YAML dependency, and no frontend-framework requirement: addendum Technical Context; confirmed by `package.json` and workflow runtime/install steps.
- Easy browsing, reviewable repository maintenance, static hosting, and transparent destinations/limitations: FR-8–FR-11 and section 5.
- No supplied usage or performance evidence: success criteria are explicitly qualitative; expected hundreds-of-links use is not asserted as tested capacity, and performance remains an open evidence item.

## Stale source statement, not a draft gap

`PRODUCT.md:36` names `links.json` as the checked-in example source. The repository uses `links.yaml`; the addendum Evidence References already records this correction. Public generated `dist/links.json` remains accurate and is covered by FR-14.

## Reconciliation boundary

The source's informational pages are represented by the current consolidated guide, not a demand to restore separate pages. Future hidden links, CLI/helper tools, browser editing, and organization guidelines stay outside current scope. GitHub API editing is an external repository workflow, not an application integration.
