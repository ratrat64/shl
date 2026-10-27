# Astro and GitHub Pages — external evidence digest

Research date/accessed: **2026-10-27**. Scope: the supplied brief only; no project files inspected. Live documentation is not a historical snapshot or a pinned-version compatibility test.

## Evidence rules

`documented fact` means a publisher explicitly states the behavior; `inference` means a conclusion drawn here. Confidence measures evidential support, not implementation proof. **Verified** requires relevant independent publishers corroborating the claim; multiple Astro pages are one publisher. A single official source is **primary-documented, not independently verified**. Recommendations are judgments, not verified facts. Undated documentation has `pub_date: unknown`.

## Evidence received

### S1 — Islands architecture

- URL: https://docs.astro.build/en/concepts/islands/
- Publisher: Astro documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpts: “They render to static HTML with no client-side runtime.” / “An island always runs in isolation from other islands on the page” / “Client islands can still share state and communicate with each other”.
- **C1 — documented fact; high confidence; primary-documented, not independently verified [S1].** Astro template components generate static HTML; client islands hydrate separately, and communication is possible across their separate component contexts. The documented default strips UI-component JavaScript; a `client:*` directive enables interactive hydration.
- **C2 — inference; medium confidence; not independently verified [S1].** Separate filter, toolbar, and results islands would still require explicit state/communication ownership. Islands do not by themselves supply an application-wide coordination model. This is an ownership cost, not evidence that multiple islands cannot work.

### S2 — Front-end frameworks

- URL: https://docs.astro.build/en/guides/framework-components/
- Publisher: Astro documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpts: “With all client directives except `client:only`, your component will first render on the server to generate static HTML.” / “Astro components are HTML-only templating components with no client-side runtime.”
- **C3 — documented fact; high confidence; primary-documented, not independently verified [S2].** Framework components can provide prerendered HTML plus later hydration; `client:only` does not provide that server-rendered component HTML. Hydration sends the selected UI framework and component code, with a framework sent once for multiple components using it. `.astro` components cannot themselves be hydrated, but may ship browser scripts.
- **C4 — inference; high confidence; not independently verified [S1, S2].** Astro supplies page generation, integration and hydration scheduling; a chosen React/Svelte/etc. component runtime supplies its interactive component behavior. Plain browser scripts are also supported. Selecting Astro therefore does not select a reactive UI runtime, nor remove the need to own filter state and navigation lifecycle.

### S3 — View transitions / ClientRouter

- URL: https://docs.astro.build/en/guides/view-transitions/
- Publisher: Astro documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpts: “They simply add animations.” (native cross-document transitions) / “The `<body>` is completely replaced with the new page’s body.” / “Elements marked `transition:persist` are moved over to the new DOM if they exist on the new page.” / “the state is retained upon navigation, but your component will re-render with new props.”
- **C5 — documented fact; high confidence; primary-documented, not independently verified [S3].** Ordinary navigation is full-page by default. Opt-in `ClientRouter` fetches and swaps pages, handles links and Back/Forward, and requires both pages to use the router to avoid a full reload. Native cross-document animation alone does not change the MPA navigation model.
- **C6 — documented fact; high confidence; primary-documented, not independently verified [S3].** `transition:persist` carries matching HTML elements or hydrated islands between pages, including island state; the matching element must exist on the destination. `transition:persist-props` retains old props as well. CSS animations may restart and iframes may reload despite persistence.
- **C7 — inference; medium-high confidence; not independently verified [S2, S3].** Persisting a stable plain-HTML toolbar container is a plausible route to exact toolbar node identity. Persisting only an island wrapper/state is insufficient proof of exact child-node identity: new props can cause a framework re-render. Conversely, persist-props can leave page-specific data stale. Browser identity assertions are required, including toolbar descendants and pages that omit controls. A shared layout or visual transition alone is not proof.
- **C8 — documented fact; high confidence; primary-documented, not independently verified [S3].** Bundled module scripts execute once; inline scripts may execute again. Lifecycle events such as `astro:after-swap` and `astro:page-load` support reinitialization. `fallback="none"` uses full-page navigation in browsers lacking support; `swap` still supplies client navigation without animation.
- **C9 — inference; medium confidence; not independently verified [S3].** A persisted toolbar needs idempotent listener installation, explicit result-data updates and cleanup for replaced content. Attaching listeners on every page-load without ownership can duplicate handlers on retained nodes. In-memory retained state is not evidence of session-filter restoration after a fresh/native document load; an explicit browser persistence/restore design is still needed. No session-storage API semantics were independently researched here.

### S4 — Astro GitHub Pages deployment

- URL: https://docs.astro.build/en/guides/deploy/github/
- Publisher: Astro documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpts: “host a static, prerendered Astro website” / “all of your internal page links must be prefixed with your `base` value”.
- **C10 — documented fact; high confidence; primary-documented, not independently verified [S4].** Astro documents GitHub Actions deployment, `site`, and project-path `base` (e.g. `/my-repo`); the special username.github.io repository can omit the project prefix.
- **C11 — source-quality observation; high confidence; primary-observed, not independently verified [S4].** The retrieved custom-domain instructions say remove `base`, but the adjacent example still includes it, and the next example still shows a prefixed link. Treat those examples as internally inconsistent, not a deployable configuration recipe.

### S5 — Configuration reference

- URL: https://docs.astro.build/en/reference/configuration-reference/
- Publisher: Astro documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpts: “The base path to deploy to.” / “You can access this value via `import.meta.env.BASE_URL`.” / “Trailing slashes on prerendered pages are handled by the hosting platform, and may not respect your chosen configuration.”
- **C12 — documented fact; high confidence; primary-documented, not independently verified [S5].** `base` controls the development/build root for pages/assets; URLs need the prefix and `BASE_URL` reflects trailingSlash configuration. `output: 'static'` is the documented default. Static redirects without an adapter use meta refresh and do not set redirect status codes.
- **C13 — inference; high confidence; not independently verified [S4, S5].** Configured deployment base is different from discovering an unknown base at a missing URL. These pages document the former, not an automatic ancestor-map/base-discovery algorithm. A relocatable identical artifact and a per-deployment configured build are distinct requirements; only the latter is directly supported by this evidence.

### S6 — GitHub Pages platform

- URL: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Publisher: GitHub documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpt: “GitHub Pages is a static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository on GitHub”.
- **C14 — documented fact; high confidence; verified for the narrow shared claim by independent publishers [S4 Astro, S6 GitHub].** GitHub Pages hosts static website output, including the static prerendered output Astro targets; both publishers also describe project sites under a repository path. This corroborates hosting compatibility, not runtime correctness of this app.
- **C15 — inference; high confidence; not independently verified [S5, S6].** A Pages-only design cannot rely on an Astro request-time server to implement recovery or per-visitor filters. Build-time HTML and browser behavior must carry those responsibilities. This does not claim GitHub cannot run a separate build process.

### S7 — GitHub custom 404

- URL: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site
- Publisher: GitHub documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpts: “You can display a custom 404 error page when people try to access nonexistent pages on your site.” / “type `404.html` or `404.md`.”
- **C16 — documented fact; high confidence; primary-documented, not independently verified [S7].** Pages provides a custom missing-page document. This source does not document a blanket SPA rewrite-to-index, unknown-base discovery, case-insensitive matching, or shell-preserving fetch handling of HTTP 404 responses.

### S5 supplement — build.format

- Same URL/publisher/pub_date/accessed as S5.
- Exact excerpts: “`'directory'`: Astro will generate a directory with a nested `index.html` file for each page.” / “`'preserve'`: Astro will generate HTML files exactly as they appear in your source folder.”
- **C17 — documented fact; high confidence; primary-documented, not independently verified [S5].** `build.format` supports `file`, `directory`, and `preserve`; `file` emits route-named `.html` files, while `directory` emits nested indexes. This controls output layout, not an arbitrary missing-request rewrite rule.

### S8 — Astro routing

- URL: https://docs.astro.build/en/guides/routing/
- Publisher: Astro documentation; pub_date: unknown; accessed: 2026-10-27.
- Exact excerpts: “Astro uses standard HTML `<a>` elements to navigate between routes.” / “Because all routes must be determined at build time, a dynamic route must export a `getStaticPaths()`”.
- **C18 — documented fact; high confidence; primary-documented, not independently verified [S8].** File-based pages and enumerated static dynamic routes can generate nested directory pages; a rest parameter can represent paths of different depths. The static rest route enumerates generated paths rather than supplying a request-time universal catch-all.
- **C19 — inference; high confidence; not independently verified [S1, S5, S6, S8].** Prerender each known directory with real anchors and matching static output to support direct deep links and no-JS browsing. Unknown paths need the hosting 404 mechanism and optional browser recovery, not an unenumerated Astro static catch-all. Actual deployed slash/status behavior remains a test obligation.

## Technology decision

**R1 — recommendation/inference; medium confidence; not independently verified [S1–S8, metadata above]. Choose Astro for static HTML generation plus one application-owned browser controller for the strict persistent-shell/toolbar and recovery contract. Start with native DOM scripting, without a required UI-component runtime.** Astro's documented static pages, standard anchors and optional scripts fit the baseline. This is a bounded recommendation for the brief, not a comparison proving superiority over frameworks not researched in this run.

**R2 — recommendation/inference; medium confidence; not independently verified [S2, S3].** Keep one authoritative state/lifecycle owner for filters, retained toolbar, page-data updates and recovery. Multiple independent islands for strongly coupled controls would recreate explicit synchronization work. If a component runtime is later chosen, place the coupled interactive surface under one owner, prerender it, and verify descendant identity through updates; do not use `client:only` for the required no-JS browsing surface. No evidence here ranks React against Svelte or another runtime.

**R3 — recommendation/inference; medium confidence; not independently verified [S3, S5, S7].** Astro `ClientRouter` plus explicit matching `transition:persist` elements is a credible built-in alternative for normal generated-page navigation, not a demonstrated turnkey solution for the complete brief. Use it as the sole navigation owner only after proving HTTP-404 entry/recovery and exact descendant identity. Otherwise let the single custom controller retain shell/toolbar and replace page content; do not run competing navigation owners. Prefer the built-in option if the proof succeeds, since it avoids custom routing work.

### Strongest caveat: unknown base + actual 404 + exact identity

**C20 — inference; high confidence about evidence limits, medium about implementation feasibility; not independently verified [S3–S8].** The hardest requirement is not HTML templating. A missing nested URL may load a host-provided 404 document before the canonical base or assets are known. Astro's configured `base` does not document runtime discovery, and the ClientRouter guide does not establish how fetching a genuine HTTP-404 response interacts with persistent-page swapping. Its documented default also replaces the body, so “persistent shell” must name which nodes must survive; persistence is explicit, not whole-document DOM preservation by default. There is no retrieved proof that stock Astro supplies this full recovery contract.

**R4 — design proposal/inference; medium confidence; unverified implementation [S3–S8].** Make the 404 bootstrap self-contained enough to run before canonical asset-base discovery; give it an explicit site-marker/map discovery and validation protocol, then hand canonical navigation to the same owner that preserves the live shell. This is application work proposed here, not an Astro or GitHub documented feature. Do not infer a root from path depth alone. No-JS 404 content should remain readable with ordinary recovery anchors; no claim is made that no-JS recovery can discover an unknown base automatically.

### Required proof before treating the choice as accepted

**R5 — proposed verification work; high confidence in relevance; not executed [S2–S8].** A small deployed Pages prototype should check:

1. Root and project-prefix native deep loads with JavaScript disabled: complete directory content and working links.
2. Retained references to shell, toolbar container, search input, selected chips and other identity-critical descendants across directory, informational and 404 navigation, including Back/Forward. Check `===`, not screenshots or equivalent state alone.
3. Session filters after native reload/direct entry, page replacement and Back/Forward; verify no stale props/data or duplicate handlers. Storage fallback semantics need separate browser-platform evidence.
4. A real missing nested URL with unknown base: initial bootstrap assets, base discovery, failed/slow fetches, recovery, return to 404 and history intent changes. Test real HTTP 404 responses, not just navigating to a successful `/404.html` response.
5. Router fallback and hydration timing: the static baseline stays usable before hydration, and persistence holds wherever the product requires it. Document unavoidable full-document navigation boundaries.

## Gaps and next leads

- **Astro custom-404 generation gap:** S7 grounds the hosting filename/behavior, but this run did not retrieve Astro's dedicated custom-404 section. S8 discusses `/404` rewrites but does not establish how an authored Astro 404 emits the required root `404.html` under each build.format. Do not treat that filename exception as verified. Next lead: the custom-404 section linked from Astro Pages documentation, followed by output inspection in a disposable prototype.
- **Independent experience/issue not retrieved:** the eight-source allowance was used for official framework/platform coverage. No issue's open/closed state or affected versions were inspected. Therefore no historical report is presented as a current limitation, and no absence of reports is claimed as evidence of reliability.
- **Version/date gap:** retrieved live Astro pages mention v7-era features; their publication dates are unknown. No release history was fetched to establish which versions were shipped by 2026-10-27. Claims describe the retrieved pages, not a retrospectively proven release baseline; pin and validate a version before implementation.
- **Ownership and limits:** static hosting compatibility/project URL shape has independent-publisher corroboration (C14). Astro persistence/hydration statements remain single-publisher documented capabilities. End-to-end exact identity, session restoration and unknown-base recovery remain unverified. Native browser storage/navigation semantics and competing generators/runtimes were not researched.
- **Research firewall note:** one targeted search of the fetched configuration output unexpectedly returned additional ambient tool-output matches. Those matches were excluded entirely from evidence and conclusions; only this run's eight web sources ground this digest. No project files were deliberately inspected, and only this digest was edited.
