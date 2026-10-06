---
title: Rename Shortlink to shl
type: chore
created: '2026-10-06'
status: done
route: dispatch
baseline_commit: a4a088c29042ac66dc8160aad1745c2b92ae67a4
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The project is still called Shortlink in its generated site, npm metadata, documentation, and examples. Visitors and maintainers should consistently see the new name, shl.

**Approach:** Rename the public identity and current usage examples, align package and lockfile metadata, and update expectations for generated page titles. Keep functional descriptions of “short links” where they refer to the links rather than the product name.

## Boundaries & Constraints

**Always:** Keep existing working repository documentation links pointing to the actual GitHub repository until its remote name changes. Use shl in sample deployment paths, with setup guidance explaining that the path follows the repository name. Preserve link codes, redirects, routing, and persisted theme settings.

**Never:** Rename the GitHub repository or local checkout, rewrite historical planning artifacts or completed implementation records, or change generated `dist/` files directly.

</frozen-after-approval>

## Code Map

- `src/pages.mjs` — shell brand, footer, title suffix, and guide introduction render the site identity; repository links use the real remote slug; `shortlink-theme` is the existing browser storage key.
- `test/build.test.mjs` — navigation title expectations and repository-link assertion; theme persistence assertion must remain compatible.
- `README.md`, `DESIGN.md`, `PRODUCT.md` — current usage, design and product docs; README has concrete Pages launcher examples.
- `package.json`, `package-lock.json` — npm package identity appears in both the root and lockfile package record.
- `.github/workflows/deploy.yml` — display name used in README deployment instructions.
- `aid-docs/planning-artifacts/**`, `aid-docs/implementation-artifacts/**` — historical snapshots and evidence with old names and paths; preserve as records.

## Tasks & Acceptance

**Execution:**
- [x] `src/pages.mjs` — display shl in generated site branding, titles and guide; keep live repository hrefs.
- [x] `test/build.test.mjs` — align title expectations; assert current branding in generated output while retaining the real repository-link assertion.
- [x] `package.json`, `package-lock.json` — set package identity to shl in both files.
- [x] `README.md`, `DESIGN.md`, `PRODUCT.md`, `.github/workflows/deploy.yml` — rename current project references and launcher examples; explain repository-dependent sample paths.
- [x] Run Node.js 24 tests and build, inspect generated HTML, and confirm no stale project-brand occurrences in active surfaces.

**Acceptance Criteria:**
- Given the link map, when the site builds, then the header, footer, guide and page titles call the project shl and links still resolve.
- Given a fresh dependency install, when npm reads metadata, then package and lockfile both identify shl.
- Given a maintainer reading current docs, when following setup and launcher examples, then the project and sample path use shl consistently and the Pages path dependency is clear.
- Given an existing visitor preference, when theme scripts run, then the saved theme remains readable.

## Implementation Notes

- All user-visible surfaces (brand, titles, footer, guide intro, redirect pages, 404 page) now use "shl".
- Package metadata (`package.json`, `package-lock.json`) updated to `name: "shl"`.
- README updated with shl branding, workflow name, and example URLs using `/shl/` path with explanation that the path follows the repository name.
- PRODUCT.md updated to reference shl in purpose and evidence.
- `.github/workflows/deploy.yml` workflow name changed to "Deploy shl".
- Theme persistence key `shortlink-theme` preserved for backward compatibility with existing visitor preferences.
- Repository links to `github.com/ratrat64/shortlink` preserved as live documentation links until the GitHub repository is renamed.
- Historical planning artifacts in `aid-docs/planning-artifacts/` and `aid-docs/implementation-artifacts/` left unchanged per spec constraints.
- All 17 Node.js 24 tests pass; build produces correct output; no whitespace errors.

## Verification

**Commands:**
- `node --test test/build.test.mjs` — expected: all tests pass.
- `node build.mjs` — expected: generated pages use shl in user-visible brand and titles.
- `git diff --check` — expected: no whitespace errors.
