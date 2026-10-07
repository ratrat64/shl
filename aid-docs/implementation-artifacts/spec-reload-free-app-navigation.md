---
title: 'Modular reload-free app navigation'
type: 'feature'
created: '2026-10-07'
status: 'done'
baseline_commit: '247ccc42f7f006fc004e1b09c7e2a1813332e8e2'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Directory navigation is already enhanced, but header and footer Guide links reload the document, and Guide cannot navigate back into the directory without reloading. Page templates, styles, and browser behavior are concentrated in one module, making consistent navigation harder to maintain.

**Approach:** Extend the existing static-page navigation enhancement across the directory and Guide, keeping the header and footer mounted. Organize rendering and browser behavior into reusable, responsibility-focused modules with explicit initialization of swapped content.

## Boundaries & Constraints

**Always:** Support user-site roots and project-site prefixes with relative static URLs. Preserve direct entry, refresh, no-JavaScript browsing, theme preferences, search, hidden toggles, copy feedback, tags, expandable folders, and accessible focus. Internal app links include the brand, Links/Guide header navigation, footer Guide, folder links, breadcrumbs, and Guide section anchors. Maintain generated HTML as the source for navigation. Keep links semantic and update document title, active navigation, and page-specific styling after transitions.

**Never:** Add a frontend framework or dependency. Intercept short-link destinations, copy actions, Open controls, downloads, repository/documentation links, or modified/new-tab clicks as app routes. Change redirect, launcher, legacy information-page forwarding, or Pages 404 recovery contracts. Require persistence of search, hidden toggles, or disclosure state between page transitions; retain the existing reset behavior.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| App transition | Ordinary internal app click from Guide or directory | Swap content without document reload; keep header/footer and theme; update URL, title, current navigation, styling, and focus | Unavailable/invalid page uses normal navigation |
| Same route | Click current brand, Links, Guide, or breadcrumb route | No document reload; apply normal top/fragment navigation semantics | Invalidate pending transitions |
| Sections | Guide fragment click or app URL with Guide fragment | Correct section scroll/focus and fragment URL without reload | Missing fragment retains usable content |
| History | Back/Forward across Guide, directories, and fragments | Correct content and URL; restore saved scroll where applicable | Latest history action wins over stale fetches |
| Mounting | Enter populated or hidden-only directory from Guide or empty home | Search, hidden toggle, and copy work exactly once per interaction | Missing controls safely skip initialization |
| Native actions | Modified clicks, target/download links, destinations | Preserve existing browser/copy/download behavior | No app fetch |

</frozen-after-approval>

## Code Map

- `src/pages.mjs` currently owns CSS (38–121), theme/search/copy/router assets (123–290), shell (292–314), directory components (316–398), Guide, redirects, launchers, and 404. Existing `header`, `footer`, `renderDirectoryNode`, `renderLinkRow`, `searchableListing`, and `directoryContents` are reusable functional components.
- `src/pages.mjs` router accepts only `main[data-directory]` and marked directory links. It rebases dot-relative URLs, strips fetched scripts, guards races, and restores scroll. These protections must survive extension. Guide currently loads no router or directory initializers.
- `src/build.mjs` imports page/asset exports and publishes static pages and assets. `src/links.mjs` owns validation and traversal independently of page rendering.
- `test/build.test.mjs` covers routing with simulated browser APIs, generated templates, controls, redirects, launchers, and 404. Existing router fixtures exclude Guide and require extension.
- `README.md` describes directory-only enhanced navigation and the current template location. Product and architecture require static operation and prohibit a frontend framework.

## Tasks & Acceptance

**Execution:**
- [x] `src/layout.mjs`, `src/directory.mjs`, `src/styles.mjs`, `src/browser.mjs`, `src/pages.mjs` — extract shared shell/header/footer, directory components, styles, and browser behaviors into cohesive modules, keeping safe context encoding and avoiding circular dependencies.
- [x] `src/browser.mjs`, `src/layout.mjs`, `src/directory.mjs` — extend explicit app-link/page markers and shared navigation to Guide; mount content behavior on direct loads and swaps; handle fragments, same-route clicks, history, race cancellation, focus, and outgoing copy feedback cleanup.
- [x] `src/build.mjs` — wire modular exports and shared browser assets into generated app pages, including empty directory and Guide entry points.
- [x] `test/build.test.mjs` — extend routing/initialization checks for the matrix at root and project prefix; preserve exclusion, fallback, and existing generation regressions.
- [x] `README.md` — document app-wide navigation and module ownership.

**Acceptance Criteria:**
- Given any generated app page, when navigating through its header, footer, folders, breadcrumbs, or Guide sections with JavaScript enabled, then the document remains mounted and the requested app view is usable.
- Given direct entry or disabled JavaScript, when browsing generated pages, then their native links and static content remain functional.
- Given the modular implementation, when inspecting ownership, then shared layout, directory components, styles, and browser lifecycle have distinct modules without duplicated rendering or a framework.

## Implementation Notes

- Shared semantic `data-app-link` anchors and `data-app-page` views drive navigation using generated HTML. Deferred search/copy definitions load on every app entry; the router explicitly mounts each initial or swapped view once.
- Only main content is replaced. Shell links remain anchored to their original site root; transitions update title, navigation state, directory styling, section/heading focus, and URL. Request sequencing cancels stale responses, including after same-route clicks and history changes.
- Copy cleanup removes the outgoing listener, clears its timer/status, and invalidates pending clipboard promises. Missing directory controls safely skip initialization.
- Scroll remains one saved position per complete URL (including fragments), rather than per history entry. Repeated visits to the exact same URL share its most recently saved position.

## Spec Change Log

## Review Triage Log

- Blind 1 — medium, patch: scrolling during a slow fetch was lost because only click-time scroll was saved. Capture it again immediately before replacing the outgoing view; regression passes.
- Blind 2 — medium, patch: CSS smooth scrolling applied to history restoration and could save intermediate positions during rapid navigation. History scrolling now explicitly uses instant behavior; routing assertions pass.
- Blind 3 — low, rejected: nonexistent Guide fragments go to the heading instead of preserving scroll. Generated Guide anchors all have matching sections; the missing-fragment view remains usable as required. Extra branching for malformed links is unwarranted.
- Blind 4 — low, rejected: search/copy require navigation startup and its prerequisite scripts. All generated pages load those deferred assets in order; blocked/missing assets leave native static browsing available. Independent initialization would add duplicate lifecycle paths for exceptional asset failures.
- Blind 5 — medium, patch: an indefinitely pending fetch/body did not reach fallback. Native ten-second AbortSignal timeout now bounds both; timeout and rejection checks pass.
- Blind 6 — low, rejected: slow requests have no pending announcement. This is a transient feedback improvement rather than a broken navigation outcome; adding loading-state machinery is unnecessary for this change.
- Blind 7 — low, patch: public scroll documentation omitted repeated-URL sharing. README now documents most-recent scroll per URL.
- Blind 8 — medium, patch: the temporary browser runner was not reproducible from the repository. README now contains a manual browser procedure covering persistent shell identity, theme, focus, history, controls, prefixes, and disabled JavaScript.
- Blind 9 — medium, patch: missing title/heading and unsupported app marker branches lacked regression proof. All three responses now assert fallback without view or history mutation.
- Blind 10 — medium, patch: distinct click races and stale rejection lacked regression proof. Reverse completion and obsolete failures now assert the newest view wins without extra history/fallback.
- Edge 1 — medium, patch: indefinitely pending response/body could strand intercepted navigation. Same timeout fix as Blind 5; both timeout checks ran and passed.
- Verification 1 — medium, patch: fabricated shell anchors bypassed generated markers/navigation keys. Fixtures now derive shell anchors and selector membership from generated HTML at both prefixes.
- Verification 2 — medium, patch: concatenating scripts independently hid emitted startup-order regressions. Fixtures now load actual generated deferred script tags in order and exercise Guide-to-directory search/copy initialization.

## Verification

- `bun --version` — Bun 1.4.2.
- `bun ci` — install locked dependencies from the task worktree root.
- `bun test --timeout 30000 ./test/build.test.mjs` — all regression checks pass.
- `bun build.mjs` — generate the site successfully from the worktree root.
- Browser smoke check if browser tooling is available: direct Guide entry, header/footer transitions, nested browsing, same-route click, section history, and theme continuity. Deployment-specific Pages recovery remains covered by its unchanged contract.

### Execution evidence

- Bun 1.4.2; `bun ci` installed the locked YAML dependency successfully.
- Full regression suite and build passed; routing checks execute real search/copy initializers against simulated controls at `/` and `/project/`, covering all matrix rows and outgoing clipboard cleanup.
- Headless Chrome via the existing temporary Playwright installation passed direct Guide entry, shell/theme identity, same-route clicks, Guide fragment Back/Forward, nested folders/breadcrumbs, footer navigation, hidden-only controls/copy/reset, and no-JavaScript browsing at root, project prefix, and an empty-home fixture. Smoke runner: `/tmp/opencode/check-shl-app-navigation.mjs` (temporary verification artifact, not a project dependency).
- Deployment-specific GitHub Pages recovery was not exercised in a deployed browser; its unchanged regression checks passed.
- After review patches, full verification passed again: `bun test --timeout 30000 ./test/build.test.mjs` (18 passed, 0 failed) and `bun build.mjs` (26 links). Review fixes add native fetch timeouts, final outgoing scroll capture, instant history restoration, generated-shell/startup verification, invalid-page cases, and distinct-click race proof.
