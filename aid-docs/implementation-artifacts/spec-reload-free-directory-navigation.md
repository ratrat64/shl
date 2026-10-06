---
title: 'Reload-free directory navigation'
type: 'feature'
created: '2026-10-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Following a folder or breadcrumb in the link directory reloads the entire page, interrupting browsing even though each directory is already published as a static page.

**Approach:** Enhance directory-to-directory navigation with fetched generated HTML and browser history, while preserving working direct URLs, refreshes, native links without JavaScript, and existing redirect and launcher behavior. Search, hidden-link controls, and copy actions must work after navigation; Back/Forward should show the right page.

</frozen-after-approval>

## Implementation Notes

- Generated directory pages keep native anchors and real static `index.html` resources; a small browser asset intercepts only marked directory links and swaps fetched directory `<main>` elements.
- Rebase local anchors and persistent header/footer links before changing browser history, rerun the existing search and copy initializers for new content, and focus the heading after navigation. Failed fetches or non-directory responses fall back to normal document navigation. Guard against late responses after history changes and restore directory scroll positions.
- Changed `src/pages.mjs`, `src/build.mjs`, `test/build.test.mjs`, and `README.md`; test fixtures cover project-prefixed click/Back/Forward, nested and hidden-only pages, inert redirect pages, and fetch failure.

## Review Triage Log

- High: A pending Back fetch could overwrite a later Forward view when Forward returned to the displayed page. Invalidated pending requests on every history change; added a rapid Back/Forward regression.
- Medium: Asynchronously appended search/copy scripts could attach duplicate handlers after rapid navigation. Exposed and reran their existing initializers directly on the swapped directory.
- Medium: Manual scroll restoration lost the visitor's position when returning to a directory. Saved scroll positions per directory and restored them on history navigation.
- False: Search, disclosure, and hidden-link controls reset on returning to a directory; this already happened with the previous full-page navigation, and the research recorded persistence as an open UX decision, not an acceptance condition for this change.
- Low: A marked same-path link was prevented and could not clear a fragment. Let the browser handle same-path links natively, invalidating any pending fetch.
