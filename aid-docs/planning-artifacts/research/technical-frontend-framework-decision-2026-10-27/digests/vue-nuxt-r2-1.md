# Vue + Nuxt follow-up: integrated SSG, prefixes, enhancement, identity

Research/access date: **2026-10-27**. Scope: external documentation only; decision brief supplied in the request. No repository content, previous digests, or ambient application code was inspected. A directory listing was used solely to confirm the output location and that this filename was new. Six new sources were fetched; eight tool calls total including that listing and this write. No builds, browser experiments, deployments, or issue searches were performed.

## Decision correction and evidence limits

**Include Vue + Nuxt as the integrated application/SSG candidate opposite Svelte + SvelteKit.** Nuxt documents build-time rendering, crawl/explicit route enumeration, static output, and a GitHub Pages preset [N1–N3]. Comparing standalone Vue's integration burden against SvelteKit's integrated features would use different abstraction levels. Vue itself recommends higher-level frameworks for production SSR integration [V1]. This repairs candidate coverage; it does not establish a winner.

Labels below distinguish **documented** product behavior, **inference** from retrieved evidence, and **unknown/unverified** behavior. Current live documentation was retrieved on the access date; undated pages are not version-pinned historical evidence. No conclusion relies solely on model training knowledge.

Independence: N1–N3 are one Nuxt publisher/source family, not three independent confirmations. V1 is Vue's first-party account of Vue, not independent verification of Nuxt deployment. S1 is SvelteKit's first-party account, not independent testing. M1 is independent of both framework publishers and supplies a progressive-enhancement criterion only; it does not verify either product against that criterion. **No independent framework-specific deployment or identity verification was obtained.**

## Findings

### 1. Nuxt has integrated SSG and a documented Pages path

- **Documented:** `nuxt generate` builds and prerenders the application; `.output/public` is deployable to static hosting [N1]. The crawler saves route HTML and payload data, follows anchors, and supports explicitly supplied routes. Undiscoverable/unlinked routes require enumeration or another documented registration mechanism; crawling alone is not proof of complete route coverage.
- **Documented:** the Nuxt GitHub Pages guide uses `nuxt build --preset github_pages`, uploads `.output/public`, and says Pages supports static sites and Nuxt prerenders to static HTML [N2]. This is the publisher's deployment recipe, not a deployment executed in this research.
- **Documented:** generated static builds also emit `200.html` and `404.html` **SPA fallbacks** [N1]. **Unknown:** whether those fallbacks satisfy any required no-JS unknown-path recovery, case correction, canonical navigation, or prefix discovery. Their existence alone proves none of those behaviors.
- **Comparison limit:** this round retrieves SvelteKit component-state documentation, not its static adapter or Pages guide. SvelteKit's corresponding SSG/deployment details are not independently re-established here. The fair comparison unit is still the integrated pair, with evidence gaps recorded rather than standalone Vue penalized for missing application tooling.

### 2. Configured base path is not arbitrary-prefix artifact portability

- **Documented, per-deployment build configuration:** for `https://<user>.github.io/<repository>/`, N2 sets `NUXT_APP_BASE_URL=/<repository>/` on the build step. For a user/organization site or custom domain it says omit the variable or use `/`. This establishes a documented way to target a **known deployment base**.
- **Documented, server runtime configuration:** N3 also shows `NUXT_APP_BASE_URL=/prefix/ node .output/server/index.mjs`. That example runs a server; it is not evidence that already-generated Pages HTML changes its base after upload.
- **Important positive evidence:** the retrieved N3 explicitly notes relative paths such as `./` are not supported directly in `nuxt.config.ts` because of Nitro limitations, but gives `NUXT_APP_BASE_URL=./ npm run generate` and `runtimeConfig: { app: { baseURL: './' } }` as approaches for static hosting with relative asset paths. A blanket claim that Nuxt cannot generate relative asset paths would therefore conflict with the retrieved documentation.
- **Unknown/unverified:** whether those relative-path approaches make **one byte-identical output artifact** function unchanged at `/`, `/repo/`, and an unforeseen multi-segment prefix, including direct nested-route loads, router links, payload requests, public assets, and unknown-path fallbacks. Relative asset paths are narrower than an end-to-end relocatable routing guarantee. N3 describes `buildAssetsDir` as relative to the base/CDN and fixed at build time; neither this nor server runtime overrides proves universal static relocation.
- **Conclusion:** configured-prefix deployment is documented; same-artifact arbitrary-prefix deployment is **not established**, not disproved. No comparative claim about SvelteKit's arbitrary-prefix portability is supported by the Svelte source fetched in this round.

### 3. No-JS prerendered content is separate from complete progressive enhancement

- **Documented:** Nuxt's `ssr` option enables rendering HTML dynamically or at generate time, defaults to `true`, and says generated pages have no content if set to `false` [N3]. Combine this with N1's emitted route HTML: Nuxt provides a documented build path to prerendered content rather than only an empty client-rendered shell.
- **Documented Vue distinction:** Vue says server-rendered markup need not wait for JavaScript to display, while its button example remains static until hydration attaches event listeners [V1]. Thus visible no-JS content and JavaScript-driven interaction are different capabilities.
- **Independent criterion:** MDN defines progressive enhancement as providing a baseline of essential **content and functionality**, with richer capabilities layered on top [M1]. **Inference:** prerendering alone establishes neither usable fallback interactions nor progressive enhancement for an entire application. Essential actions must have appropriate baseline behavior; framework event handlers are not themselves that baseline.
- **Unknown/unverified:** actual no-JS usability, native navigation, forms/actions, and unknown-route fallbacks for either candidate. This source set contains no browser-disabled-JavaScript acceptance run and no retrieved SvelteKit no-JS/prerender configuration guide. MDN supplies a common evaluation standard, not evidence that either implementation meets it.

### 4. Shared components, hydration, caching, and persistent identity differ

- **Documented SvelteKit behavior:** S1 explicitly says navigation reuses existing layout/page components. Its same-route-template example (`/blog/my-short-post` → `/blog/my-long-post`) updates props without destroying/recreating the components or rerunning mount/destroy hooks. It describes sidebar scroll preservation and an explicit keyed block to force remounting. This is direct first-party evidence of conditional instance reuse, stronger than merely advertising reusable components.
- **Scope limit:** S1's example is not an unconditional promise that every page, layout boundary, error transition, or browser navigation preserves every component. A different component tree or explicit keyed remount needs separate evaluation. The source also warns that derived values must remain reactive when an instance is reused.
- **Documented Nuxt configuration:** `app.keepalive` controls KeepAlive defaults between pages, defaults to `false`, and can be overridden per page [N3]. This documents a caching control, not an always-mounted shell or universal DOM-identity guarantee.
- **Documented Vue hydration:** hydration matches components to prerendered DOM and attaches listeners; mismatch recovery can discard incorrect nodes and mount replacements [V1]. Initial HTML reuse therefore must not be conflated with guaranteed identity throughout later navigation.
- **Unknown/unverified for Nuxt:** exact persistent shell/layout behavior across ordinary route changes, layout switches, and error/recovery paths. No Nuxt layout/navigation lifecycle source or runtime identity test was retrieved within the budget. KeepAlive being false does **not** prove all shell components remount; reusable markup and optional caching likewise do **not** prove they remain mounted.
- **Acceptance distinction (inference):** content equality or restored state is weaker than the same live component/DOM object. Any strict identity requirement needs reference-equality checks for the relevant nodes/components through specified client-side transitions. No-JS readability is a separate test and does not establish SPA-style identity across full-document navigation.

## Source register: URL, publication, access, class, excerpts

### N1 — Nuxt 4.x: Prerendering

- URL: https://nuxt.com/docs/4.x/getting-started/prerendering
- Publication/update: not displayed in retrieved content; rolling 4.x documentation, exact release/commit unknown.
- Access: 2026-10-27; retrieved successfully.
- Class: first-party framework documentation; Nuxt publisher family; capability/configuration evidence, not independent verification.
- Excerpts:
  - “Use the `nuxt generate` command to build and pre-render your application using the Nitro crawler.”
  - “You can now deploy the `.output/public` directory to any static hosting service”.
  - “Save the HTML and `_payload.json` to the `~/.output/public/` directory”.
  - “pages that are not linked to a discoverable page can't be pre-rendered automatically.”
  - “Static and prerender builds also emit `200.html` and `404.html` SPA fallbacks.”
- Supports: integrated static generation, route discovery limits, emitted output/fallbacks. Does not establish arbitrary-prefix relocation or no-JS fallback recovery.

### N2 — Nuxt: GitHub Pages deployment

- URL: https://nuxt.com/deploy/github-pages
- Publication/update: not displayed in retrieved content; rolling deployment guide, exact release/commit unknown.
- Access: 2026-10-27; retrieved successfully.
- Class: first-party framework deployment guide; Nuxt publisher family, **not** a GitHub-authored hosting guide or independent deployment test.
- Excerpts:
  - “GitHub Pages only support static sites, Nuxt will pre-render your application to static HTML files.”
  - “If you are deploying a project site without a custom domain, you need to set `NUXT_APP_BASE_URL` to your repository slug for your build step.”
  - “`NUXT_APP_BASE_URL=/<repository>/ npx nuxt build --preset github_pages`”.
  - “For a user or organization site named `<owner>.github.io`, or for a custom domain, omit `NUXT_APP_BASE_URL` or set it to `/`.”
- Supports: documented Pages preset and deployment-specific build base. Does not establish unchanged-artifact relocation.

### N3 — Nuxt 4.x: configuration reference

- URL requested: https://nuxt.com/docs/4.x/api/nuxt-config#baseurl
- Canonical page returned: https://nuxt.com/docs/4.x/api/nuxt-config
- Publication/update: not displayed in retrieved content; rolling 4.x reference, exact release/commit unknown.
- Access: 2026-10-27; retrieved successfully. Tool output was truncated after the relevant `app`, `runtimeConfig`, and `ssr` sections; claims here use only visible retrieved text.
- Class: first-party configuration reference; same Nuxt publisher family as N1/N2.
- Excerpts:
  - `baseURL`: “The base path of your Nuxt application.” Default: `"/"`.
  - “This can also be set at runtime by setting the NUXT_APP_BASE_URL environment variable.” Example: `NUXT_APP_BASE_URL=/prefix/ node .output/server/index.mjs`.
  - “Relative paths (like `./`) are not supported directly in `nuxt.config.ts` due to Nitro limitations.” It then gives static relative-asset approaches including `NUXT_APP_BASE_URL=./ npm run generate` and `runtimeConfig.app.baseURL: './'`.
  - `buildAssetsDir`: “relative to `baseURL` (or `cdnURL` if set). This is set at build time and should not be customized at runtime.”
  - `keepalive`: “Default values for KeepAlive configuration between pages.” Default: `false`; overridable with `definePageMeta`.
  - `ssr`: “Whether to enable rendering of HTML - either dynamically (in server mode) or at generate time. If set to `false` generated pages will have no content.” Default: `true`.
- Supports: precise base configuration, relative-asset options, prerender vs client-only distinction, optional caching. Not a general identity/relocation contract.

### M1 — MDN: Progressive enhancement

- URL: https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement
- Publication: original publication not displayed. Last modified **2025-07-18**, explicitly displayed in the retrieved page.
- Access: 2026-10-27; retrieved successfully.
- Class: independent, framework-neutral web-platform reference/design guidance; not a framework conformance test or normative framework specification.
- Excerpts:
  - “provides a baseline of essential content and functionality to as many users as possible”.
  - “a simpler-but-still-usable experience for users of older browsers and devices with limited capabilities”.
  - “Special notice should be taken of accessibility. Acceptable alternatives should be provided where possible.”
- Supports: evaluating essential functionality as well as initial HTML. Does not independently verify Vue/Nuxt or Svelte/SvelteKit behavior.

### S1 — SvelteKit: State management

- URL: https://svelte.dev/docs/kit/state-management
- Publication/update: not displayed in retrieved content; rolling documentation, exact release/commit unknown.
- Access: 2026-10-27; retrieved successfully.
- Class: first-party SvelteKit documentation; component lifecycle/state evidence, not independent verification.
- Excerpts:
  - “When you navigate around your application, SvelteKit reuses existing layout and page components.”
  - In its two-blog-slug example: “won’t cause the layout, page and any other components within to be destroyed and recreated.”
  - “lifecycle methods like `onMount` and `onDestroy` won’t rerun”.
  - “Reusing components like this means that things like sidebar scroll state are preserved”.
  - To force remounting it demonstrates `{#key page.url.pathname}` around a component.
- Supports: explicit instance-reuse semantics and reactive-update implications for the documented navigation case. Does not establish all-route/error identity, static deployment, or arbitrary-prefix support.

### V1 — Vue: Server-Side Rendering

- URL: https://vuejs.org/guide/scaling-up/ssr.html
- Publication/update: not displayed in retrieved content; rolling Vue guide, exact release/commit unknown. Its mention of Vue 3.5+ is not a publication date.
- Access: 2026-10-27; retrieved successfully.
- Class: first-party Vue documentation; Vue rendering/hydration explanation, not independent Nuxt verification.
- Excerpts:
  - “Pre-rendered pages are generated and served as static HTML files.”
  - “Server-rendered markup doesn't need to wait until all JavaScript has been downloaded and executed to be displayed”.
  - “If you click the button, you'll notice the number doesn't change. The HTML is completely static on the client since we are not loading Vue in the browser.”
  - “During hydration, it creates the same Vue application that was run on the server, matches each component to the DOM nodes it should control, and attaches DOM event listeners.”
  - “we highly recommend using Vue frameworks if you need SSR since they often have built-in SSR support.”
  - Hydration mismatch recovery can cause “incorrect nodes being discarded and new nodes being mounted”.
- Supports: SSG/SSR distinction, visible HTML vs interaction, hydration identity caveat, framework-level comparison rationale.

## Key remaining gaps and decision effect

1. **Arbitrary-prefix portability:** neither integrated candidate is proved to meet unchanged-artifact deployment across unknown prefixes. Nuxt's documented relative-assets option deserves evaluation rather than categorical rejection. A future external prototype should build once, deploy identical bytes at root and multiple prefixes, then test nested direct loads, links, assets, payloads, and 404s.
2. **No-JS completeness:** Nuxt's prerendering capability is documented; a fully usable baseline for all essential routes/actions is unverified. Equivalent SvelteKit static/no-JS evidence was not refreshed in this round. SPA fallbacks must not be counted as prerendered route coverage.
3. **Persistent identity:** SvelteKit has explicit first-party reuse evidence for the documented navigation case. Nuxt's precise shell/layout/error lifecycle remains unknown from this set; optional KeepAlive and hydration are insufficient substitutes. Neither candidate has runtime identity proof here.
4. **Independent corroboration and version specificity:** MDN independently establishes the enhancement criterion only. No hosting-provider-authored framework guide, current issue analysis, pinned package experiment, or independent framework-specific verification was obtained. Live undated docs do not certify an exact installed version.

**Decision effect:** Vue + Nuxt belongs on the integrated SSG shortlist. These sources do not justify selecting a winner, claiming Nuxt has no relative-base option, or declaring either stack compliant with strict arbitrary-prefix/no-JS/identity requirements.
