# Vue / React decision digest — round 1.1

Decision date and access date: **2026-10-27**.

## Scope and evidence firewall

Research input is only the supplied brief: static GitHub Pages deployment, prerendered HTML with a no-JavaScript baseline, persistent shell/toolbar DOM and session state during navigation, deep links, and unknown-base 404 recovery. No project files, implementation, configuration, or repository history were read. Only this digest was edited.

Eight official documentation pages were fetched directly in this run, using eight webfetch calls. React Router's pre-rendering page also supplies the static-deployment and fallback evidence below; its separate deployment guide was **not** fetched, to respect the eight-source cap. No independent publisher or live deployment was consulted. The retrieved pages are mutable current documentation, not archived snapshots proving their contents at an earlier date.

### Evidence labels

- **D / documentation**: a statement explicitly supported by a retrieved publisher's documentation. High confidence means the documentation states it clearly, not that it was independently tested.
- **I / inference**: a decision implication drawn from the cited documentation and supplied requirements. Confidence is stated separately.
- **U / unresolved**: an important question not answered by the retrieved evidence.
- **Status: unverified** applies to every claim and inference here: the requested independent-publisher threshold was not met. “Documented” does not mean independently verified. No claim is marked verified.

Claim citations such as [S3] inherit the source URL, publisher, publication date, and access date in the ledger. Backing excerpts are intentionally short. Sources linked by a fetched document but not themselves fetched are not additional evidence.

## Decision in brief

**Conditional recommendation — I, medium confidence, unverified [S2–S8]:** do not select either core UI technology as if it supplies static generation and unknown-base recovery. For a deliberately integrated rewrite, **React + React Router Framework Mode with explicit prerendering** has the clearest retrieved end-to-end contract for build-time route rendering, HTML/data output, and deployment without a runtime rendering server. That is an advantage in the documented ownership boundary, not proof of lower total complexity than a Vue solution.

**Incremental alternative — I, medium confidence, unverified [S1–S5]:** Vue is a credible small-scope enhancement choice because its documentation explicitly supports standalone scripts and existing HTML. React also explicitly supports incremental adoption. Neither incremental option alone replaces the static generator or solves persistent cross-page navigation. If choosing Vue + Vue Router for the whole application, assign prerender/build ownership to a selected higher-level framework or to explicit custom integration; the two packages alone are not an SSG product.

**Decision boundary — I, high confidence, unverified [S2–S4, S6–S8]:** the important comparison is an integrated prerendering/navigation architecture versus an enhancement layer plus retained custom generation/navigation. The evidence does not support an unconditional “Vue is simpler” or “React is simpler” verdict.

## Source and excerpt ledger

All publication dates below are **unknown**: no reliable page publication/update date was supplied in the fetched content. Copyright notices, example version strings, and dates concerning unrelated releases were not treated as publication dates.

### S1 — Vue introduction

- URL: https://vuejs.org/guide/introduction.html
- Publisher: Vue.js official documentation / Vue team.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high for documented capabilities. Status: unverified.
- Excerpts: “flexible and incrementally adoptable”; “Enhancing static HTML without a build step”; “Single-File Component”; “two different API styles”.
- Documented claims: Vue supplies declarative components and reactivity; static enhancement, SPA, SSR, and SSG are different ways of using its ecosystem. SFCs combine logic, template, and styles. Options and Composition APIs share the underlying system; the guide recommends Composition API plus SFCs for full applications, and Options API for no-build/low-complexity enhancement.
- Limit: listing SSG as a use case is not a promise that Vue core enumerates routes and emits a deployable static site.

### S2 — Ways of Using Vue

- URL: https://vuejs.org/guide/extras/ways-of-using-vue.html
- Publisher: Vue.js official documentation / Vue team.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high. Status: unverified.
- Excerpts: “standalone script file - no build step required”; “single-page SSG ‘hydrates’ the page into an SPA”; “persisted elements / state across navigations”.
- Documented claims: Vue can enhance existing rendered HTML. SSG prerenders HTML ahead of time and can hydrate afterward. Single-page SSG partially updates content during subsequent navigation; multi-page SSG loads a new page per navigation and can ship no JavaScript for noninteractive pages. The guide identifies single-page SSG as better suited to persisted elements/state and names higher-level Vue generators/frameworks.
- Limit: those named frameworks' exact routing, GitHub Pages, and base-path behavior were not researched here.

### S3 — Vue server rendering

- URL: https://vuejs.org/guide/scaling-up/ssr.html
- Publisher: Vue.js official documentation / Vue team.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high. Status: unverified.
- Excerpts: “Pre-rendered pages are generated and served as static HTML files”; “use `createSSRApp()` instead of `createApp()`”; “coordinate two builds”; “incorrect nodes being discarded and new nodes being mounted”.
- Documented claims: Vue exposes HTML rendering APIs; `createSSRApp` hydrates matching prerendered markup rather than mounting new DOM. Production SSR integration includes client/server builds, assets, universal routing, data, and state. The guide recommends higher-level frameworks for this integration. Browser globals cannot be assumed in universal code; mount/update hooks do not run during server rendering. Hydration mismatches can replace nodes.
- Limit: build-time SSG is distinct from runtime SSR; the guide's runtime Node-server requirement must not be transferred to a static SSG deployment.

### S4 — Vue Router history modes and deployment configuration

- URL: https://router.vuejs.org/guide/essentials/history-mode.html
- Publisher: Vue Router official documentation / Vue Router project.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high. Status: unverified.
- Excerpts: “without a proper server configuration, the users will get a 404”; “use the subfolder instead of the root folder”; “requires you to push the initial navigation”.
- Documented claims: HTML-history SPA URLs need host fallback when requested directly without corresponding static resources. Subfolder deployment requires coordinating public asset paths and router base. Hash history avoids server treatment because the fragment is not sent to the server. Memory history supports nonbrowser rendering but needs explicit initial navigation. A catch-all client route can show a not-found page; serving the same HTML for every URL can mask HTTP 404 status.
- Limit: the page's public-path example references Vue CLI; it is not evidence of a current Vite recipe. Its server rewrite examples are not GitHub Pages configuration evidence. No unknown-base discovery mechanism is documented here.

### S5 — Add React to an Existing Project

- URL: https://react.dev/learn/add-react-to-an-existing-project
- Publisher: React official documentation / React project.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high. Status: unverified.
- Excerpts: “you don't have to rewrite it in React”; “Specify `/some-app` as the base path”; “Set up a JavaScript environment”.
- Documented claims: React components can be introduced into individual existing-page regions. The guide describes module/package tooling and JSX transformation, reusing an existing environment or introducing Vite. For a whole subroute, it recommends a React framework, configured base path, and appropriate host/proxy handling; static HTML/CSS/JS export is also discussed.
- Limit: its framework-specific export examples are not a React Router deployment recipe, and no linked framework guide was fetched. It does not establish that incremental component roots preserve a document through native page navigation.

### S6 — React hydrateRoot

- URL: https://react.dev/reference/react-dom/client/hydrateRoot
- Publisher: React official documentation / React project.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high. Status: unverified.
- Excerpts: “HTML content was previously generated by `react-dom/server`”; “expects the rendered content to be identical”; “including removing any event handlers or state in the tree”.
- Documented claims: React DOM hydrates React-generated HTML and takes ownership inside its root; frameworks may handle hydration. Hydrating the entire document is supported. Mismatches are bugs and attribute correction is not guaranteed. Rendering before hydration completes clears server HTML and switches the root to client rendering. Unmounting removes handlers/state; matching tree structure can preserve state during later updates.
- Limit: `hydrateRoot` is not an arbitrary-HTML preservation API or a static-site generator.

### S7 — React preserving/resetting state

- URL: https://react.dev/learn/preserving-and-resetting-state
- Publisher: React official documentation / React project.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high for the retrieved relevant sections. Status: unverified.
- Excerpts: “same component at the same position”; “destroys state when it removes a component”; “re-create the DOM elements instead of reusing them”.
- Documented claims: component position/type/key governs state retention. Removing or changing a component can reset its subtree; changing keys can recreate DOM. State can be lifted into a persistent parent, or separately persisted outside the component tree.
- Retrieval caveat: the long response was truncated after the relevant explanatory sections and examples; no claim relies on the omitted trailing exercises.
- Limit: this documents render-tree identity, not an unconditional router guarantee for every navigation or error boundary.

### S8 — React Router pre-rendering, static output, deployment fallback

- URL: https://reactrouter.com/how-to/pre-rendering
- Publisher: React Router official documentation / React Router project.
- Published: unknown. Accessed: 2026-10-27.
- Class: D. Confidence: high. Status: unverified.
- Excerpts: “MODES: framework”; “Deployed to a static file server with `ssr:false`”; “will not include any dynamic paths”; “configure your deployment server to serve this file”.
- Documented claims: Framework Mode enables build-time rendering through `prerender` configuration. Automatic static-path selection excludes unresolved dynamic parameters; explicit paths or an async function can enumerate them. Build output includes HTML for document requests and `.data` for client navigation in `build/client`. Combining `ssr:false` with prerendering removes the runtime rendering-server requirement. Without `prerender`, SPA mode renders only the root route before browser hydration determines children. Partial prerendering can emit a fallback at `index.html` or `__spa-fallback.html`, depending on whether `/` was prerendered. Hosts must serve the fallback for otherwise missing paths. Server `actions` and `headers` exports are prohibited with `ssr:false`.
- Limit: generation of a fallback is not installation of a hosting rewrite. The page supplies no GitHub Pages-specific or unknown-base recipe and no React Router basename configuration details.

## Ownership and decision implications

Each row is **I, unverified**; confidence and supporting documentation are explicit. These are proposed boundaries, not claims about the existing application.

| Concern | Vue core + Vue Router | React core/DOM + React Router framework/prerender | Confidence / basis |
| --- | --- | --- | --- |
| UI ownership | Vue components/reactivity own chosen regions or the application; router owns client URL interpretation/navigation. | React owns chosen roots and reconciliation; Framework Mode supplies the prerender contract in S8. | High [S1–S6, S8]. Router lifecycle detail remains incomplete. |
| Static generation | Vue rendering APIs provide a primitive; a generator/framework or custom build must own route enumeration, HTML output, assets, and hydration wiring. | Framework prerender configuration owns path selection and HTML/data output; application still supplies dynamic path values and static data. | High [S2–S3, S8]. Not evidence that every Vue higher-level framework requires more code. |
| Incremental adoption | No-build enhancement is explicitly supported; it can leave HTML generation in its current owner. | Existing-page roots are explicitly supported, generally with documented module/JSX tooling. | High [S1–S2, S5]. Neither approach alone provides cross-document persistence. |
| Persistent shell/toolbar | Single-page SSG is documented as suitable; keep shell outside changing content and avoid remounting it. Exact Vue Router retention semantics need proof. | Stable tree position/type/key provides a retention mechanism; place toolbar/state outside changing route subtrees. Exact Framework Mode layout/error behavior needs proof. | Medium [S2–S3, S6–S7]. Proposed architecture, not demonstrated strict DOM identity. |
| Session state | Application must decide state ownership and restoration beyond the live mounted application. | Same; lifted state handles removed children but is distinct from durable/session-scoped persistence. | Medium [S3, S6–S7]. No session-storage API was researched. |
| Static deployment | Prebuilt HTML/assets can be served statically; route/base/asset integration must be selected. | `ssr:false` plus complete prerendering gives a documented static output path; SPA-only or partially generated routes still need fallback arrangements. | High [S2–S4, S8]. Actual Pages behavior unverified. |
| Unknown-base 404 | Configured router base and catch-all route do not document discovery of an unknown deployment prefix. | A generated SPA fallback does not document discovery of that prefix or asset bootstrapping from an arbitrary missing URL. | High as an evidence limitation [S4, S8]; feasibility unresolved. |

## Lifecycle, no-JS, and deep-link constraints

1. **D, high, unverified [S2–S3, S8]:** prerendered content and hydrated navigation are compatible concepts. **I, high, unverified:** generate every required no-JS content URL; a root-only SPA shell is insufficient for the requested page-specific baseline. Keep ordinary destinations in generated anchors. Whether all controls work without JavaScript is an application contract, not guaranteed by HTML generation.
2. **I, medium, unverified [S2, S6–S7]:** persistent live shell identity requires navigation that leaves the shell mounted. State restoration after a fresh document is a different obligation from retaining the same DOM node. Do not count restored input values as proof of node identity.
3. **D, high, unverified [S3, S6]:** hydration assumes matching initial output. **I, medium, unverified:** restoring session-specific toolbar state must be sequenced to avoid initial render mismatch or node replacement; neither framework eliminates that integration work.
4. **D, high, unverified [S4, S8]:** client route handling and host fallback are separate layers. **I, high, unverified:** prerendered known deep links and unknown paths must be evaluated separately. A catch-all component cannot help if the correct application assets never load.
5. **I, medium, unverified [S4–S5, S8]:** router base, generated document links, assets, and client-navigation data URLs must agree under a project prefix. Configuring a known base is not equivalent to recovering one at runtime. No fetched source establishes automatic unknown-base recovery for either candidate.

## Learning and tooling burdens

- **D, high, unverified [S1–S3]:** Vue introduces template/reactivity concepts, lifecycle hooks, and an API-style choice; full applications commonly use SFC compilation. A handwritten universal rendering integration also introduces browser/build execution boundaries and client/server build coordination. **I, medium, unverified:** standalone enhancement offers a smaller initial tooling commitment, but that advantage does not establish a smaller whole-site prerender/navigation system.
- **D, high, unverified [S5–S8]:** React's documented incremental workflow introduces modular JavaScript and potentially JSX transformation; hydration adds matching-output constraints. State identity requires understanding position/type/keys. React Router prerendering adds route and build configuration, path enumeration, loaders, generated data files, and restrictions when no runtime server exists. **I, medium, unverified:** integrated ownership can reduce bespoke generation plumbing while increasing the amount of framework convention to learn.
- **U, unverified:** relative learning time, migration effort, maintenance savings, bundle/runtime performance, and ecosystem popularity were not measured or independently evidenced. No rankings or numerical claims are made.

## What remains application-specific

**I, medium confidence, unverified [S2–S8]:** retain explicit ownership for static route/data enumeration; semantic no-JS content/links; known-prefix asset and route coordination; strict shell/toolbar node identity across content and not-found views; session save/restore/reset policy; and unknown-base 404 bootstrap/recovery. Framework adoption may supply mechanisms for parts of this list, but the retrieved documentation does not discharge these exact acceptance conditions. This is a contract checklist, not a claim that every item necessarily needs custom code.

**U, unverified:** whether GitHub Pages can deliver the required fallback/status behavior for the proposed output; the exact React Router basename/build-base setup; precise Vue Router shell retention rules; full-document identity across framework error paths; and an independently corroborated cost comparison. GitHub's own hosting documentation and a deployed root/project-prefix smoke test would be needed before claiming Pages compatibility. No server rewrite example here should be assumed to work on Pages.

## Next evidence needed before committing to a rewrite

Proposed validation, **I, medium confidence, unverified [S2–S8]**:

1. Independently corroborate both candidates' relevant claims and retrieve hosting-specific evidence; keep vendor documentation and independent verification distinct.
2. For a full Vue alternative, select one actual SSG/framework integration and compare its ownership to React Router Framework Mode. Do not compare bare Vue + router against an integrated React framework as if those were equivalent packages.
3. Build one small externally scoped prototype per serious candidate: two prerendered routes, shared toolbar, direct deep links, native no-JS browsing, unknown-path entry under root and project prefix, and session restoration after reload. Assert shell/toolbar node identity across client navigation and not-found recovery, not just visual similarity.

**Stop condition:** choose only when the prototype and hosting evidence show that the desired simplification removes more bespoke responsibility than it adds. This run establishes documented architectural options and their gaps; it does not establish a verified migration winner.
