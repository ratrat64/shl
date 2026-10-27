---
title: 'Technical research: frontend framework decision'
type: technical
topic: frontend framework decision
decision: Reduce shl maintenance complexity while preserving static publication contracts
source: native research with separately labeled repository observations
status: complete
verified_claims: 3
unverified_claims: 7
preset: standard
validation: normal
created: 2026-10-27
updated: 2026-10-27
---

# Frontend framework decision

## Executive summary

**Do not commit to a full rewrite yet. Use Svelte as the first framework pilot for the interactive directory, with Vue as an equally credible alternative.** Keep the existing publication pipeline for that experiment. If the goal is specifically to replace the custom application router, investigate **SvelteKit with static prerendering**, after explicitly deciding how to preserve automatic deployment-prefix/404 handling.

This is a **medium-confidence recommendation to run a pilot, not a finding that Svelte beats Vue or that a rewrite will pay off**. The approved weighted comparison ties incremental Svelte, incremental Vue and retaining the current architecture. Familiarity and measured integration work could easily change the result.

Three findings drive the decision:

1. **The browser code is the relevant target.** Local inspection found manual DOM reconciliation, storage restoration, retained-control navigation and lifecycle coordination. The builder is only 71 physical lines; replacing it does not directly resolve those concerns. These are repository observations, not external evidence of framework quality. See [repository context](digests/repository-context.md), baseline `3f1b8ef`.
2. **Components can take over rendering/state/event wiring; product policies remain ours.** Declarative components and rendering have independent documentation support, and Svelte exposes build-time HTML rendering plus hydration. That supports an experiment, not a productivity prediction. The token editor, session-storage semantics and recovery algorithm still need explicit ownership. [1][2][3]
3. **An application framework offers more replacement, with more integration risk.** SvelteKit supplies static output and layout reuse, but its SPA fallback uses absolute assets even when ordinary pages use relative paths. Nuxt also supports static generation and documents deployment-base configuration, including relative-asset options. Neither retrieved contract proves an unchanged artifact handles shl's unknown-prefix recovery. [4][5][6][7][8]

**Biggest caveat:** no candidate prototype, pinned dependency/toolchain test, or deployed Pages smoke test was run. The research answers what to try and why; it does not authorize production migration. All framework-specific identity, portability and migration-savings claims remain unverified in this application.

Before authorizing the pilot, confirm maintainer familiarity and approve a bounded amendment to the no-framework policy. Before replacing the router, explicitly resolve the portable-prefix requirement. These decisions can change which option to try first.

## 1. Requirements and source discipline

The user approved the [brief](brief.md), including these weights: maintenance/complexity reduction **40%**, existing behavior/hosting fit **25%**, migration/regression risk **20%**, tooling/learning/ecosystem **15%**.

Hard gates remain: static GitHub Pages without a backend; existing short URLs and Bash resources; root/project-prefix routing and case-insensitive 404 recovery; no-JavaScript baseline browsing; validation and output encoding. The current generator produces relative links without build-time base configuration. Treat preserving that automatic-prefix property as the default, not silently substituting a configured-base build. Whether to relax it is a product/architecture decision.

Preserve live document/shell identity, same-base searchable-directory toolbar/input/chip identity, latest tab-session filters, focus/history/scroll, modified clicks, disabled/hidden/script behavior and theme foundations. Toolbar identity is required **between applicable searchable directories**, not across Guide/searchless mounts. The historical no-framework policy is under reconsideration, not a research veto. Requirements come from the repository; they are not findings about competing products.

External technology findings below resolve to retrieved source digests. **Verified** means independently corroborated for the narrow stated claim; **primary-documented / unverified** means official documentation supports it but independent confirmation or application proof is missing. Analyst rankings are judgments, never measurements. Rolling documentation dates are unknown unless displayed; access date is 2026-10-27 throughout.

Evidence acquired: three parallel documentation streams plus a focused follow-up and landing checks. Dedicated web search was unavailable; direct fetching covered official documentation, independent platform guidance and one current source inspection. No production-experience cohort, issue-history study or longitudinal ecosystem-health analysis was obtained. Those gaps limit the strength of a rewrite recommendation.

## 2. Weighted decision matrix

Screening leaves five options for first-investment scoring: retain current architecture, incremental Svelte, incremental Vue, full Kit, and Astro-led migration. Nuxt and React remain feasible reserve candidates in §4. **No untested candidate has passed all application hard gates.** Scores do not waive those gates or authorize migration.

Scale: 1 = substantial burden/mismatch; 3 = plausible with material work or uncertainty; 5 = low added burden/direct fit. Higher migration score means less risk. Tooling scores reflect introduced concepts/owners, not measured learning hours or ecosystem popularity. Formula: `0.40M + 0.25F + 0.20R + 0.15T`.

| Option | Maintenance M | Behavior/hosting F | Migration R | Tooling T | Total / 5 | Basis and gate status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Retain + targeted plain-JS improvements | 2 | 5 | 5 | 5 | **3.80** | Local baseline; lowest migration burden, still owns reconciliation/navigation. No new architecture gate. |
| Incremental Svelte | 4 | 4 | 3 | 4 | **3.80** | UI ownership opportunity [1][2][3]; retained publication/routing, but build/hydration/handoff untested. |
| Incremental Vue | 4 | 4 | 3 | 4 | **3.80** | Same opportunity [1][14][15]; enhancement/SSR boundary untested. No justified numerical advantage over Svelte. |
| Full SvelteKit static | 4 | 2 | 2 | 3 | **2.95** | More routing replaced [4][6]; portable fallback/identity gate unresolved [5]. |
| Astro-led migration | 3 | 3 | 2 | 3 | **2.80** | Static/persistence support [10][12][21], but UI state and routing-policy integration remain; gate unproved [22]. |

**Confidence: medium in the capability distinctions, low in comparative savings.** Independent sources corroborate generic component mechanisms, static hosting and the compiler/framework distinction; they do not independently verify the decisive application-specific cells. [1][11][13] The tie is intentional. Adding a decimal advantage would invent evidence.

Sensitivity: changing maintenance/migration weights from 40/20 to 50/10 makes incremental Svelte/Vue **3.90** and retaining current **3.50**; changing them to 30/30 yields **3.70** and **4.10** respectively. A one-point change in maintenance score moves any total by **0.40**. Familiarity or a pilot can readily reverse the recommendation. Kit's score should be recomputed if the portable-base contract changes; scoring a relaxed requirement against an unchanged baseline would be misleading.

## 3. What complexity would move?

| Responsibility | Potential framework contribution | Responsibility that remains |
| --- | --- | --- |
| Rows, count, selected/available tags, visibility | Components derive output from state instead of manual DOM reconciliation. [1][2][3] | AND/text rules, hidden admission, stable identities, color metadata and accessibility semantics. |
| Events and cleanup | Component-owned handlers and lifecycle hooks. [1][3] | Clipboard/download cancellation, stale-result suppression and cleanup timing. |
| Search editing | Reactive text and selected-tag state. [2][3] | Token commitment, caret/selection, URL exclusion, edit-range tracking, IME and unknown-token feedback. |
| Ordinary navigation | Kit/Nuxt/React Router can own routes and static rendering; Astro offers fetch/swap navigation. [4][7][9][10] | Exact scroll/focus/session policy, retained toolbar nodes, minimal-document exclusions and failure behavior. |
| 404 recovery | Framework fallback or custom generated document. [5][7][11] | Unknown-base bootstrap, ancestor-map probing, case correction, cancellation and canonical recovery. |
| Publication | Framework SSG can emit pages. [4][7][9][12] | Validate-before-output-deletion, JSON map, minimal redirects, escaped Bash launchers, collision checks. |

**Cross-dimension insight:** replacing UI synchronization and replacing the application lifecycle are different investments. A component pilot limits routing risk but leaves the custom router; an application framework replaces more plumbing but requires recovery integration. Components do not automatically shorten the parser/storage contract, while splitting plain-JS files does not eliminate reconciliation. A hybrid is worthwhile only if it deletes an owner rather than adds one. Net savings remain unmeasured.

## 4. Candidate screen and trade-offs

### Svelte components, with the current builder/navigation — first pilot

Svelte supplies a compiler/component model; its application framework is SvelteKit, a distinction independently corroborated by Cloudflare. Its documented APIs render HTML at build time and hydrate **Svelte-generated** HTML. They are not a promise to hydrate arbitrary existing string templates. [2][3][13]

**Proposed boundary:** one owner for the coupled directory tools/results, shared component rendering for static HTML and client hydration, with the current navigation controller passing new directory data to a retained component. Keep shared label/color semantics authoritative. Do not let both `search.js` and Svelte mutate the same subtree. This boundary is a design hypothesis requiring the pilot, especially because the present controller swaps parsed HTML rather than passing component data.

**Why first:** it tests the identified UI responsibility without adopting a new route/base/fallback model. **Cost:** compiler/bundling integration, server/client component builds, hydration sequencing and a small navigation handoff. It leaves the custom router and recovery in place. **Strongest argument against it:** a hybrid can add a framework *and* an adapter while retaining the hardest navigation logic. If those adapters rival the code removed, reject it.

### Vue components — equal short-list alternative

Vue explicitly supports enhancing existing HTML without a build step, as well as compiled single-file components. Its SSR API supports matching HTML/hydration; production universal rendering requires coordinated integration. [14][15]

Vue's incremental option is real, but “no build required” is not evidence that the whole shl migration is integration-free. The pilot must select either a deliberate DOM-template enhancement approach or shared compiled rendering, then prove one owner for markup/state. Do not compare a no-build demo against a complete Svelte migration. **Choose Vue first if it is the maintainer's familiar tool or its enhancement approach proves simpler.** Retrieved evidence does not establish a meaningful Svelte-over-Vue maintenance advantage.

### SvelteKit with adapter-static — strongest next investigation for router replacement

Kit can own prerendering, hydration, ordinary client routing and applicable layout/page reuse. All required directory routes, including unlinked ones, must be enumerated. Prerendering with SSR produces content; disabling SSR globally would substitute an empty client shell and fail the browsing baseline. [4][6]

Keep stable shell/tools outside replaced or keyed route subtrees; reactive updates must handle reused components because mount hooks do not rerun on each navigation. Kit snapshots are history-entry state, not shl's latest tab-session filter record. [6]

**Gate unresolved:** the static SPA fallback has absolute assets, and the documented Pages deployment configures a base. `paths.relative` alone does not solve arbitrary-prefix fallback bootstrapping. This is a documented default mismatch, **not proof that customization is impossible**. A separately embedded recovery bootstrap and shell-preserving handoff need design and proof. [4][5] If per-deployment base configuration becomes acceptable, Kit deserves a new evaluation because it can take over more custom routing responsibility.

### Vue + Nuxt — credible integrated alternative, reserve candidate

Nuxt documents crawl/explicit prerendering, static HTML/payload output, a GitHub Pages preset and SPA fallbacks. Its configuration reference also documents relative-asset approaches; ruling it out as incapable of relative paths would be wrong. [7][8][16]

It is the fair integrated comparison against Kit, rather than bare Vue + Vue Router. However, precise shell/error-transition identity and full portable fallback behavior were not established in this source set. Reserve it for a Nuxt-experienced maintainer or if the Kit pilot exposes a blocker; this prioritization is about research focus, not demonstrated Nuxt inferiority. Vue Router history mode alone still needs host fallback for missing files and a coordinated subfolder base. [17]

### React + React Router Framework Mode — feasible, lower priority here

React can be introduced incrementally. React Router's **Framework Mode**, rather than React alone, documents route prerendering with `ssr:false` for static deployment; dynamic paths need enumeration and fallback delivery remains a host concern. React hydration requires matching React-generated HTML, and state/DOM identity depends on tree position, component type and keys. [9][18][19][20]

There is no identified React-specific integration need or known maintainer skill advantage. It remains feasible, but this research found no project-specific benefit that justifies prioritizing a JSX/component/router migration over the closer Svelte/Vue pilot. This is a shortlist judgment, not a claim about speed, quality, popularity or ecosystem inferiority. Existing React expertise would reopen it.

### Astro — good static-page fit, weaker fit for the identified problem

Astro can prerender static pages and hydrate selected framework components. Its `.astro` components do not supply a reactive client runtime: coupled controls still need scripts or a UI framework. Splitting toolbar/results into independent islands would require explicit coordination; one interactive owner is a more promising boundary. [12][21]

`ClientRouter` and `transition:persist` can carry elements/islands across navigation. `ClientRouter` normally replaces the body, updates persisted-island props, and runs new scripts. shl's existing controller instead strips fetched scripts and has a specific cleanup/retention contract. Astro therefore has a genuine navigation-replacement opportunity, but not demonstrated equivalence. [10]

**Important correction from source inspection:** the retrieved Astro router does not categorically reject HTTP-404 HTML; it parses supported HTML and checks for the transition-enabled marker. Unknown-base recovery, released-version behavior and strict identity remain unproved, rather than “404 unsupported.” [22] Astro adds page-generation infrastructure around an already small builder; adding Svelte/Vue as well may be justified later, but is a larger first experiment.

## 5. Cost, lock-in and migration shape

No new hosted service is needed for the documented static-output approaches; GitHub Pages remains a static host. [4][7][9][11][12] No subscription pricing or performance comparison drives this decision. Framework/package licenses, exact supported runtime versions and any paid tooling require checking for the chosen pinned pilot; this report does not assert a completed legal or dependency-compatibility assessment.

| Approach | Main work / maintenance cost | Exit cost |
| --- | --- | --- |
| Targeted current-code improvement | Separate pure token/filter policy from DOM adaptation where useful; retain custom lifecycle/routing ownership. | Lowest: current output/data contracts continue. |
| Incremental Svelte/Vue | Shared rendering/client ownership, compiler if used, hydration, data handoff, adapting implementation-coupled tests. | Rewrite component templates, but preserve plain data/policy and builder. Remove compiler/integration and restore the previous renderer. |
| Kit/Nuxt/React Router rewrite | Route/layout/data representation, prerender enumeration, base/fallback, minimal-resource coexistence, new build/deploy and acceptance harness integration. | Templates plus route/load conventions and build integration must be replaced. Keep link schema/pure policies separate from framework modules. |
| Astro-led | Page templates/static routes plus persistence/lifecycle integration; add a UI runtime if scripts do not address the state problem. | Replace Astro templates, build and transition directives; any UI framework adds its own exit work. |

These are responsibility inventories, **not effort estimates**. No maintainer availability, framework familiarity or representative change-time measurements were supplied. A full rewrite also incurs behavior rediscovery and parallel old/new implementation risk; preserve the existing behavioral suite rather than treating a new starter app as parity.

## 6. Recommendation and smallest useful pilot

**Next action: request a Svelte directory pilot, with an explicit architecture amendment allowing that bounded experiment.** This recommendation rests on documented component/render primitives and local responsibility matching, with medium confidence; the selection of Svelte over Vue is a provisional starting point, not an independently verified winner. Choose Vue instead if the maintainer is more comfortable with it.

Pilot scope: root and two nested directories with different catalogs, Guide, and a real 404/recovery entry. Include one entry of each type—ordinary, hidden, broken, disabled and script—plus hostile-but-valid text/encoding fixtures. Keep the current validator, redirects, launcher generator and CSS foundations. Use one shared component rendering path for static/client output; avoid a second independent row/tag implementation. One component tree owns coupled directory state; the current navigation layer has one explicit handoff and must not mutate component-owned nodes.

Acceptance conditions, using the existing browser checks where possible:

1. **Baseline and output:** root/nested/Guide HTML remains readable with JS disabled; native browsing works; minimal redirect/disabled documents and launchers preserve their contracts; no-JS controls are hidden/inert as appropriate.
2. **Identity and lifecycle:** assert reference equality for document/root/header/footer/theme control across enhanced directory/Guide/404 transitions, and toolbar/search/selected chips across applicable same-base directory transitions. Verify caret, focus, chip-track scroll and no duplicate handlers.
3. **State/policies:** exact text and ordered selections survive reload, latest-state Back/Forward, absent-subtree selections and storage exceptions. Restore without token commitment. Exercise IME, unknown tokens, text edits, hidden admission, AND/text matching and transient resets.
4. **Routing and cancellation:** deploy the same output at root and a project prefix. Check direct nested routes, actual HTTP-404 responses, wrong-case directories/leaves, unresolved maps, racing navigation and stale download/filter/forward suppression. Separate generated `/404.html` success from a real missing URL.
5. **Hydration and appearance:** no hydration mismatch warnings or node replacement on initialization; desktop/mobile and light/dark match the shared shell/row contract, including focus/disabled/tag contrast. Preserve safe HTML/script serialization.
6. **Prove simplification:** remove the superseded manual reconciliation/listener code. Record handwritten code removed/added **including adapters and build configuration**, the state/lifecycle owners remaining, and the files/steps needed for one representative filter/control change versus baseline. Code size is supporting evidence, not the sole criterion. Do not count moving logic into a component as deleting it.

**Stop/rollback:** if parity needs duplicated renderers, competing state/navigation owners, or a large custom adapter, reject this pilot and retain the current implementation. If it passes, migrate the directory UI in bounded steps before deciding on router replacement. Reverting the pilot and rebuilding the existing generator is the exit path; keep published data/URL contracts intact. No prototype was implemented in this research task.

**For a deliberate full rewrite:** prefer evaluating Kit's static adapter first, with Nuxt as the integrated runner-up if Vue/Nuxt familiarity is stronger. Before implementation, resolve the portable-prefix/fallback gate and synchronize PRODUCT, architecture AD-1/7/9, design and agent instructions with the approved decision. This report is planning input, not that amendment.

## 7. Open questions and evidence limits

- **Which stack does the maintainer already know?** Ask before investing in the pilot; this can reverse the Svelte/Vue preference and reopen React/Nuxt.
- **Must one unchanged build remain relocatable without base configuration?** Current behavior is the default preserved contract. Explicitly allowing a per-deployment base materially improves the integrated-framework option.
- **Will component-only adoption actually reduce maintenance?** Only the scoped parity/change exercise can answer it; no performance or developer-productivity percentages are claimed.
- **Which exact packages work with Bun 1.4.2 and the chosen build strategy?** Pin versions and execute dependency install, server/client compilation, static generation and hydration. Rolling docs are not a compatibility matrix.
- **How do framework errors and native BFCache restoration interact with latest-session policy?** Test the proposed tree/lifecycle and actual deployed host, not just the happy path.
- **Ecosystem longevity and production failure rates:** not established. No issue-count/popularity ranking, five-year durability prediction or historical incident treated as current fact.

First-pass dimensions stopped at documented-capability coverage. Follow-up reached its two-round cap with implementation questions open. Refresh/Deepen should investigate these named gaps rather than repeat the full landscape comparison.

## 8. Source appendix

All sources accessed **2026-10-27**. “Unknown” means no reliable publication date was displayed. Confidence concerns the cited documentation statement, not shl parity. Except narrow independently corroborated patterns/hosting distinctions, capabilities are **primary-documented / independently unverified**. Detailed excerpts and limitations are in the [Svelte](digests/svelte-r1-1.md), [Vue/React](digests/vue-react-r1-1.md), [Nuxt follow-up](digests/vue-nuxt-r2-1.md), [Astro/platform](digests/astro-platform-r1-1.md) and [landing-check](digests/verification-r2-1.md) digests. Local requirements/observations are separately cited above, not external framework evidence.

| Ref | Claim/finding supported | Publisher / source | Pub date | Accessed | Confidence |
| --- | --- | --- | --- | --- | --- |
| [1] | Component props/state/events/rendering; independent generic pattern corroboration | [MDN: Framework main features](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Main_features) | Modified 2025-04-11 | 2026-10-27 | High for generic mechanism, not product ranking |
| [2] | Compiler and standalone component model | [Svelte: Overview](https://svelte.dev/docs/svelte/overview) | Unknown | 2026-10-27 | Medium; compiler distinction corroborated by ref 13 |
| [3] | Server render and matching client hydration APIs | [Svelte: Imperative component API](https://svelte.dev/docs/svelte/imperative-component-api) | Unknown | 2026-10-27 | Medium, unverified integration |
| [4] | Static output, explicit GitHub base, route/output options | [SvelteKit: adapter-static](https://svelte.dev/docs/kit/adapter-static) | Unknown | 2026-10-27 | Medium |
| [5] | Absolute fallback assets; prerender vs client-only distinction | [SvelteKit: Single-page apps](https://svelte.dev/docs/kit/single-page-apps) | Unknown | 2026-10-27 | Medium |
| [6] | Layout/page reuse, reactive updates and history snapshots | [SvelteKit: State management](https://svelte.dev/docs/kit/state-management) | Unknown | 2026-10-27 | Medium |
| [7] | Static generation, enumeration and fallback outputs | [Nuxt: Prerendering](https://nuxt.com/docs/4.x/getting-started/prerendering) | Unknown | 2026-10-27 | Medium |
| [8] | Base configuration and relative static-asset options | [Nuxt: Configuration](https://nuxt.com/docs/4.x/api/nuxt-config) | Unknown | 2026-10-27 | Medium; no portable-artifact proof |
| [9] | Framework Mode static prerendering and host fallback responsibility | [React Router: Pre-rendering](https://reactrouter.com/how-to/pre-rendering) | Unknown | 2026-10-27 | Medium |
| [10] | ClientRouter, persisted nodes/props, swap and script lifecycle | [Astro: View transitions](https://docs.astro.build/en/guides/view-transitions/) | Unknown | 2026-10-27 | Medium |
| [11] | Static GitHub Pages hosting; corroborated by framework deploy guides | [GitHub: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Unknown | 2026-10-27 | High for static hosting only |
| [12] | Static Pages deployment and configured base | [Astro: GitHub Pages deployment](https://docs.astro.build/en/guides/deploy/github/) | Unknown | 2026-10-27 | Medium; digest notes example inconsistency |
| [13] | Independent Svelte compiler/Kit application-framework distinction | [Cloudflare: SvelteKit](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/) | Modified 2026-04-21 | 2026-10-27 | High for distinction; not current compatibility |
| [14] | Incremental enhancement, SSG vs ordinary multipage behavior | [Vue: Ways of using Vue](https://vuejs.org/guide/extras/ways-of-using-vue.html) | Unknown | 2026-10-27 | Medium |
| [15] | SSR/hydration integration and mismatch implications | [Vue: Server-side rendering](https://vuejs.org/guide/scaling-up/ssr.html) | Unknown | 2026-10-27 | Medium |
| [16] | Nuxt Pages preset and deployment-specific base | [Nuxt: GitHub Pages](https://nuxt.com/deploy/github-pages) | Unknown | 2026-10-27 | Medium |
| [17] | History fallback and subfolder-base coordination | [Vue Router: History modes](https://router.vuejs.org/guide/essentials/history-mode.html) | Unknown | 2026-10-27 | Medium; not a Pages rewrite recipe |
| [18] | Incremental React adoption and framework/tooling boundary | [React: Add React to an existing project](https://react.dev/learn/add-react-to-an-existing-project) | Unknown | 2026-10-27 | Medium |
| [19] | Matching hydration and root ownership | [React: hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot) | Unknown | 2026-10-27 | Medium |
| [20] | Tree/type/key-dependent state and DOM retention | [React: Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state) | Unknown | 2026-10-27 | Medium |
| [21] | Static Astro templates versus hydrated UI-framework components | [Astro: Front-end frameworks](https://docs.astro.build/en/guides/framework-components/) | Unknown | 2026-10-27 | Medium |
| [22] | Router HTML/media/marker handling and script execution | [Astro maintainers: router.ts, rolling main](https://raw.githubusercontent.com/withastro/astro/main/packages/astro/src/transitions/router.ts) | Unknown | 2026-10-27 | Medium for inspected source, low for released behavior |

## 9. Staleness and next use

The helper calculated these dates from the dated claims in [claims.json](claims.json):

| Dated claim | Window | Recheck by |
| --- | --- | --- |
| Generic component mechanisms, MDN modified 2025-04-11 | Pattern: 24 months | **2027-04-11** |
| Compiler/application-framework distinction, Cloudflare modified 2026-04-21 | Pattern: 24 months | 2028-04-21 |
| This selection judgment, issued 2026-10-27 | Selection: 6 months | **2027-04-27** |

The earliest calculated recheck is **2027-04-11**. Undated live compatibility sources cannot receive a calculated publication-based date; re-fetch and pin them **before implementation**, and keep compatibility evidence within one month of use. The helper rejects unknown dates, so `claims.json` intentionally contains only dated entries; the ledger and source appendix retain undated claims without fabricated dates. Ecosystem claims would need six-month freshness and landscape claims twelve; neither class supplies a comparative ranking here.

If this report is older than two quarters, refresh it before acting on its selection judgments. Refresh/Deepen should prioritize framework compatibility and the unresolved pilot questions.
