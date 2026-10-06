---
title: 'Run the site locally with one command'
type: 'chore'
created: '2026-10-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Local preview currently requires remembering separate build and serve commands after installing dependencies.

**Approach:** Add an npm script that builds the static site and starts its existing preview server, and document the command in README.md.

</frozen-after-approval>

## Implementation Notes

- Added `npm run dev` to build with Node.js 24 and serve the generated site with `http-server`. The old `serve` command returned a file listing instead of `index.html` for directories when `cleanUrls` was disabled; with it enabled, dotted directories failed. `http-server` serves both correctly without a package dependency.
- Updated `README.md` to document the two-step install and preview flow.
- Smoke-tested the generated homepage and `/dev.tools/` through `npm run dev`; tests and build passed. Pinned the preview CLI version and documented that link-map edits need a restart after review.

## Review Triage Log

- `medium` — `AGENTS.md` still recommends broken `serve` preview and misstates dotted-directory behavior; deferred because updating agent instructions is outside this change.
- `low` — unpinned `http-server` could drift or require an unexpected registry version later; pinned the npx package version (network fetch remains consistent with existing npx Node.js 24 usage).
- `low` — README omitted the restart after link-map edits; documented it.
