---
title: 'Search links by tags'
type: 'feature'
created: '2026-10-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Maintainers cannot label links with topics, and visitors cannot find links by topic using the existing directory search.

**Approach:** Accept optional `tags` arrays of nonblank strings on link objects in JSON or YAML; show the tags in directory listings and include them in the existing case-insensitive search on home and nested directory pages. Add representative tags to checked-in links so the feature can be tried immediately.

</frozen-after-approval>

## Implementation Notes

- Reused the directory's existing `data-search` filtering for tags, including hidden-link gating and nested folders; no new search mode is needed.
- Validated optional tag arrays in `links.mjs` before replacing output, and escaped displayed tags and search metadata in `pages.mjs`.
- Added example tags in `links.yaml`, instructions in `README.md`, and generated-site tests in `build.test.mjs`.
- Review follow-ups: support searching by displayed `#tag`, trim label whitespace for rendering/search, document tags in the generated Guide, and simulate decoded HTML attributes when testing tag search. Node 24 tests and build pass.

## Review Triage Log

- low — Displayed `#tag` previously had no matching search text; patched by indexing both raw and prefixed tag names.
- low — Whitespace around a tag produced an untidy label; patched by trimming labels at rendering/search time.
- medium — The generated Guide omitted tag instructions; patched with format and search example.
- low — Escaped HTML in test metadata was not decoded like a browser's dataset; patched test and asserted searching for the decoded value.
