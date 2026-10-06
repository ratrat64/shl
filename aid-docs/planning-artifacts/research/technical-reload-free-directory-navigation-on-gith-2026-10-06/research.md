---
title: 'Technical research: reload-free directory navigation on GitHub Pages'
type: technical
topic: 'Reload-free directory navigation on GitHub Pages'
decision: 'Can directory browsing avoid full page reloads while preserving redirects and GitHub Pages hosting?'
source: 'Native research: GitHub and MDN documentation, accessed 2026-10-06'
status: complete
preset: quick
validation: normal
created: '2026-10-06'
updated: '2026-10-06'
verified: 4
unverified: 0
---

# Reload-free directory navigation: feasibility

**Decision:** Yes. Keep every generated directory and short-link URL as an actual static page; add client-side enhancement for clicks on **directory** links only. GitHub Pages serves the same generated files on direct entry and reload [1][2][3]. The browser can fetch the next directory page, swap its browseable content, and use `history.pushState`/`popstate` for the address bar and Back/Forward without loading a new document [4][5][6]. This requires no server or frontend framework. **Caveat:** this is a design verdict, not a deployed-browser validation.

## Platform and browser boundary

GitHub Pages supports static HTML, CSS, and JavaScript and both user-site roots and project-site prefixes [1]. Its custom Actions build can publish generated pages [2]; real `index.html` entry files remain important for direct directory visits and refreshes [3]. `pushState` changes a same-origin URL without fetching it immediately, but browsers may request it later [4]. Therefore a client-only route with no corresponding file risks a broken direct URL; the existing generated directory files avoid that failure.

For a normal folder click, fetch its existing page, check `response.ok` (HTTP 404 does not reject `fetch`) [7], parse the response, replace the directory content, update the title and browser history. On `popstate`, render the selected directory again, including the initial entry [5][6]. `DOMParser` supplies a separate HTML document, but its script nodes are inert during parsing and copied markup is not automatically safe; initialize handlers deliberately and only import the site's expected directory content [8].

## Integration with this repository

The build already emits separate pages for redirects, directories, the homepage and the 404 fallback (`src/build.mjs:33-49`). The link redirect itself comes from `redirectPage` (`src/pages.mjs:19-41`), while `listing` generates folder anchors and code/destination anchors (`src/pages.mjs:234-267`). `copyScript` already intercepts code and destination clicks (`src/pages.mjs:200-216`). These observations define a narrow enhancement:

1. Mark folder links in the generated listing and intercept only unmodified primary clicks on those links and directory breadcrumbs/Home links. Leave code links, destination links, Open, `.sh` downloads, Guide, and external links to their present behavior. Keep ordinary `href`s for keyboard, modified clicks, and no-JavaScript navigation.
2. Fetch the marked folder URL, verify a successful directory response, replace the directory `<main>`, update `<title>` and current navigation state, then push its **real** URL. If a fetch fails, let the browser load that URL normally. Do not fetch or inject a redirect page as directory content.
3. Reinitialize search, hidden-link toggle, and copy handlers after changing `<main>` (their current scripts initialize once on page load). Rebase persistent header/footer URLs to the site root or update them per directory: today `shell` renders them using the initial page depth (`src/pages.mjs:218-229`). Resolve directory links as absolute `a.href` before URL changes; relative `./` paths otherwise change meaning when `pushState` changes the base URL [4][7]. Manage focus/scroll on transition as well as Back/Forward.
4. Keep `dist/<path>/index.html`, `dist/<path>.sh`, `dist/links.json`, and `404.html` generation untouched. The existing 404 logic (`src/pages.mjs:310-361`) still handles wrong-case direct requests; it does not need to become the normal directory router.

**Alternative considered:** rendering the whole UI from `links.json` would duplicate the server-generated listing and its escaping/hidden/search logic. Reusing the existing directory HTML is the smaller change for this codebase. A purely client-only SPA would lose reliable direct URLs without static route files [3][4].

## Recommendation and verification boundary

Proceed with progressive enhancement in the directory UI; preserve the generated redirect and fallback routes. The feasibility rests on GitHub's static-file publishing model and MDN's documented browser history/fetch behavior [1][2][4][5]. After implementation, exercise folder navigation and Back/Forward with no reload; then reload a nested directory, follow an exact-case short link, test wrong-case 404 forwarding, hidden/search/copy controls, disabled JavaScript, and project-prefix and custom-domain deployments. These are implementation acceptance checks, not claims of tests already run.

## Open questions

- Actual deployed Pages behavior for this enhancement has not been smoke-tested. Resolve with a deployed browser run after implementation, especially wrong-case requests and project-prefix navigation.
- Whether to preserve search query, hidden toggle, and disclosure state between directory visits is a UX decision; current full-page navigation resets those controls.

## Source appendix

| Ref | Claim/finding supported | Publisher | Published/updated | Accessed | Confidence |
| --- | --- | --- | --- | --- | --- |
| [1] | Pages publishes static assets at root and project prefixes | [GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | undated | 2026-10-06 | high |
| [2] | Custom Actions build can publish generated static pages | [GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) | undated | 2026-10-06 | high |
| [3] | Entry files are required for direct static routes | [GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites) | undated | 2026-10-06 | high |
| [4] | Same-origin pushState does not immediately load the URL | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) | 2025-06-23 | 2026-10-06 | high |
| [5] | Fetch plus history state support in-page navigation | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API) | 2025-08-01 | 2026-10-06 | high |
| [6] | popstate handles Back/Forward history traversal | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event) | 2026-07-28 | 2026-10-06 | high |
| [7] | Fetch resolves on HTTP errors and relative URL resolves against current document | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) | 2025-12-16 | 2026-10-06 | high |
| [8] | Parsed HTML is initially inert; transplanted nodes may become active | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString) | 2026-04-08 | 2026-10-06 | high |

## Staleness map

The checked-date proxy for undated platform docs is 2026-10-06; the browser-pattern dates are the documented last-updated dates. Applying a one-month platform window and a two-year pattern window gives **2026-11-06** as the first recheck (GitHub Pages behavior), then 2027-06-23 (`pushState`) and 2027-08-01 (History API guide). Recheck earlier if GitHub changes Pages routing or deployment behavior. The calculation uses `claims.json` and the research kit's `staleness` command.
