# Independent adversarial gate — modular divergence

Date: 2026-10-07
Workspace: `/home/rat/Git/shl/shl-modular-ui`
Reviewed: the working-tree `ARCHITECTURE-SPINE.md`, `spec-modular-ui.md`, current source, repository instructions, UX contracts, and relevant checks.
Method: independent, single reviewer; no other review reports consulted and no agents spawned. References below are workspace-relative. No spine or source edits were made.

## Verdict

**HOLD the architecture gate for narrow contract reconciliation.** The implementation has meaningful consolidation and passing regression evidence. The spine successfully prohibits copied shared markup, declarations, page-identity chrome overrides, competing published maps, and JavaScript-only browsing. It does **not** yet fully specify dependency acyclicity, transient view-state lifetime, or the integration boundary between components and their shared browser behavior. Current behavior selectors also contradict AD-9's stated separation from visual classes.

This is not a recommendation for a framework, registry, universal renderer, or a frozen filename/signature scheme. Several divergent refinements below are legitimate implementation choices. The gate must distinguish those choices from changes to observable behavior or ownership; “one owner” alone does not establish that distinction.

### Actions to carry forward

1. Make the internal dependency direction binding and acyclic, including foundations and browser-generator dependencies; distinguish build-time imports from generated-browser capabilities.
2. State that validated repository data is borrowed read-only, while detached view projections and transient state have explicit owners and lifetimes. Bind the existing reset-on-transition behavior.
3. Document the semantic renderer/behavior/lifecycle contract and align existing behavior selectors with AD-9. Do not freeze incidental positional APIs.
4. Define 404 as native navigation plus recovery, rather than an ordinary app-mounted page; preserve first-readable-map termination and explicitly decide the stalled-map boundary.
5. Make required rendered evidence distinguish “executed” from “skipped”; passing the test command is not by itself evidence of the AD-9 matrix.

## Evidence and verification

- `bun --version`: **1.4.2**.
- `bun test --timeout 30000 ./test/build.test.mjs`: **23 pass, 0 fail**, approximately 4.56 seconds.
- Google Chrome **154.0.8037.97** is installed; the two browser tests' availability guards succeed in this environment.
- `git diff --check`: no whitespace errors at inspection time.
- Tests build in temporary directories. This review did not run the root build or replace workspace `dist/`.
- No deployed GitHub Pages smoke test was performed. Local simulated 404 serving is not deployment evidence, as AD-6 and the spec correctly acknowledge.
- Existing staged source/document changes were treated as the review subject, not as reviewer-owned edits.

## The requested construction: two refinements one level down

**Interpretation:** A and B below are alternative implementations of existing pages/modules, not simultaneous duplicate owners in one site. Each complete alternative retains one owner per responsibility and all AD-1–AD-9 requirements. Mixing incompatible halves is not claimed to comply. No new product feature or route is introduced.

### Pair 1 — root and nested directory state: fresh mounts versus retained page state

**A — fresh-content lifecycle refinement**

- The existing root and nested pages compose the same document, shell, directory renderers, tokens, and browser behavior.
- The shared lifecycle obtains a fresh main for a cross-page transition and calls the shared behavior owner once.
- Its directory view starts with an empty query, hidden entries excluded, and initial disclosures. Cleanup invalidates copy feedback and releases outgoing behavior.

**B — retained-state lifecycle refinement**

- The same pages compose exactly the same owners, markup, styles, and initial static HTML.
- The shared lifecycle retains detached page-local view state keyed by URL; it still fetches/replaces main, preserves shell/theme, disposes outgoing behavior, and mounts once.
- On returning from Guide it seeds the directory controller with that page's former query, hidden-toggle state, and disclosures. Search remains local, no published map is mutated, and all filtering/count/accessibility semantics remain unchanged.

**Concrete distinguishing trace:** Home → type `git` → reveal hidden links → Guide → Home. A resets the query/toggle/disclosures; B restores them. Both satisfy AD-1's page-local search, AD-2's source/visibility contract, AD-5's filtering, and AD-9's described cleanup/mount sequence. The remaining ADs are unchanged.

**Hole:** AD-9 does not say whether outgoing page-local state is discarded or retained. The README explicitly says it resets (`README.md:79–83`), and current code implements fresh state (`src/browser.mjs:25–26,130,172–180`). B is an all-AD counterexample to preservation of the existing transition contract, not evidence that B should be added. See F4/F5.

### Pair 2 — directory data/controller modules: detached mutable projection versus recomputation

**A — immutable-snapshot consumer**

- A shared entry owner interprets the validated raw map and produces a detached `entryTree` snapshot.
- Pure renderers read it; the shared search controller keeps query/visibility/disclosure state separately and derives the matching count.
- A raw source snapshot is never modified, and public JSON preserves configured values.

**B — view-owned mutable projection**

- The same shared interpretation/traversal owner creates a detached tree for each directory view.
- Pure renderers read the tree; the shared controller later stores match/visibility/disclosure information on its own detached nodes, resetting them when the view leaves.
- The source map is still borrowed read-only, public JSON is identical, and all observable search/count/hidden/native behavior matches A.

**Concrete distinguishing operation:** filtering `git` changes only controller state in A, but changes detached node fields in B. Neither changes repository data or published links; both keep renderers pure and one traversal owner.

**What this proves:** the ADs legitimately permit different representations and mutation strategies for derived view data. They do not supply an ownership/lifetime contract to tell a consumer whether a returned tree is reusable, borrowed, or view-owned. A single helper can return either fresh results or a cached read-only result while remaining pure. The current helpers happen to allocate fresh trees, and `loadLinks` also returns borrowed references to raw directory entries (`src/links.mjs:18–28,96,142`). Confusing those two kinds of data is the integration hole; mutating the raw map and changing publication would already violate AD-2 and is **not** an all-AD counterexample. See F3/F4.

### Pair 3 — document/control API and styles: explicit purpose versus explicit state

**A — purpose input:** the single shared action owner takes `{ purpose: 'open', disabled: false }`, owns its accessible/native link output, and emits its own visual and behavior hooks.

**B — semantic input:** that same responsibility is owned by a renderer taking `{ href, executable: false, enabled: true }`; it derives the Open/Download purpose and disabled presentation internally. Shared CSS uses explicit component hooks rather than A's visual class vocabulary.

Apply either complete refinement to the existing Open/Download controls and both root/nested listings. All tokens, spacing, native destinations/downloads, script cues, focus, and computed appearance stay the same. Both implementations satisfy the purpose/state-variant rule, one style owner, and dedicated behavior hooks. Neither exposes a page-name variant.

**Concrete divergence:** component input vocabulary, the carrier of variants, and the shared declaration selectors differ. This is **permitted**, not a style-consistency failure. AD-7/AD-8 forbid two coexisting owners or differing chrome; they do not require identical implementation vocabulary. The missing useful boundary is which semantic output hooks the shared behavior consumes. Current copy behavior consumes presentation classes, so renaming those classes is not currently an independent styling operation (`src/browser.mjs:95,103–104`). See F6/F7.

It would be invalid to call two arbitrary sizes “purpose variants” and use them to restyle the same chrome. Equal-viewport/theme chrome equality still binds. Nor can a local main selector change a reused row's design semantics merely because the header stays unchanged: AD-7's no-fork rule and the UX contract still apply.

### Pair 4 — browser module refinement: neutral leaves versus a legal import cycle

The existing recovery responsibility already serializes `NAV_ITEMS` and uses `scriptString` (`src/pages.mjs:82`). Consider moving its browser-script generation into the existing browser-behavior owner, with responsibility pointers updated together:

```js
// A: browser generator imports neutral foundation leaves.
// browser.mjs -> encoding.mjs, navigation-definition.mjs
// layout.mjs -> those same leaves, styles.mjs, browser.mjs
export const recoveryScript = () => /* encode navigation using shared leaves */ '';
```

```js
// B: reuse the existing layout exports; do not copy encoding or navigation.
// browser.mjs
import { scriptString, NAV_ITEMS } from './layout.mjs';
export const recoveryScript = () => scriptString(NAV_ITEMS);
// layout.mjs already imports themeScript from './browser.mjs'.
```

The snippets illustrate import topology, not replacement recovery implementations. In B, deferred access through a function avoids needing the imported constants during module initialization. A complete B can emit exactly the current recovery script and HTML; it needs no registry, runtime builder, backend, or copied helper. All numbered ADs remain satisfied. The diagram's existing arrows can still exist, but B adds `browser → layout → browser`.

**Hole:** the internal dependency diagram is acyclic as drawn, but no rule says additional reverse edges are forbidden or that the import graph must remain acyclic. This is a concrete structural extraction of existing recovery logic, not a proposed feature. See F1/F2.

## Findings — adversarial lens

The ten observations below separate binding holes, present code/contract mismatches, and verification improvements. They are not ten assertions that existing behavior is broken.

### F1 — Acyclicity is illustrated, not required

- **Location:** Spine, Dependency direction, lines 98–131; AD-7.
- **Trigger condition:** Pair 4B reuses the existing encoder/navigation exports from the browser generator and introduces a foundation/browser import cycle without copying a responsibility.
- **Guard snippet:** “The internal composition graph is acyclic. Components/pages depend on foundations and pure helpers; foundations do not import their composing pages/components. Shared encoders/navigation definitions are dependency leaves when both browser generation and document composition consume them.” State whether the diagram is an exhaustive allowed-edge policy or a responsibility sketch.
- **Potential consequence:** module initialization order and future extraction are coupled despite apparent adherence to every AD. The documented DAG offers no enforceable rejection criterion.

### F2 — The dependency model does not distinguish capability layers

- **Location:** Spine, AD-7 and Dependency direction; `src/links.mjs:1–2,7–28`; `src/pages.mjs:61–62`; `src/layout.mjs:1–2`.
- **Trigger condition:** “Shared entry helpers” can mean imports from the current build-side `links.mjs` with filesystem/YAML dependencies, or self-contained functions serialized into recovery. Both are currently used, but the internal diagram does not express that distinction.
- **Guard snippet:** Describe pure helpers as capability-free leaves and generated browser behavior as having no filesystem/YAML/builder dependency. Explicitly allow build-time co-location of validation and helpers; require a neutral leaf only when a new import direction or browser consumer actually needs it.
- **Potential consequence:** a future extraction may accidentally ship a build-capability import to the browser or introduce a reverse edge while believing it has merely reused the shared entry owner. Current generated recovery does **not** import `links.mjs` at browser runtime; this is a boundary hole, not a present browser filesystem defect.

### F3 — Validated input versus derived-view mutation is not specified

- **Location:** Spine, AD-1/AD-2/AD-7 and Mutation convention; `src/links.mjs:96,142`; `src/build.mjs:43–53`.
- **Trigger condition:** `loadLinks` returns `raw` and directory `entries` aliases, while `entryTree` returns detached derived nodes. A consumer cannot infer the permitted mutation capability merely from “one owner” or “validated entries.”
- **Guard snippet:** “Validated raw entries and directory slices are borrowed read-only through publication; pure interpretation/renderers do not mutate them. Controllers may mutate only detached, view-owned state/projections. Public JSON is serialized from the unchanged validated raw snapshot.” Documentation is sufficient; this does not demand cloning or deep-freezing every object.
- **Potential consequence:** preprocessing through a borrowed directory slice can change what later renderers or publication observe. AD-2 catches changed public output after the fact, but does not give an operation-level ownership rule to prevent it. Pair 2's detached mutation remains legitimate.

### F4 — Shared derived results have no lifetime/identity contract

- **Location:** Spine, AD-7/AD-9 and Shared data convention; `src/links.mjs:18–28`; `src/browser.mjs:25–26,130`.
- **Trigger condition:** Pair 2's pure helper can allocate fresh trees or reuse cached read-only trees; Pair 1 can retain page-local state. “Pure” does not decide identity reuse or how long a view may hold a projection.
- **Guard snippet:** Define source snapshots as build-owned, controller/view state as page-lifetime, and any cached shared projection as read-only. A controller must not attach transient state to a reusable shared projection.
- **Potential consequence:** independently extracted controllers disagree about whether a shared return value is theirs to change, or retain view state across transitions contrary to existing behavior. Do not require a cache or prohibit safe immutable caching; define the ownership contract.

### F5 — Existing cross-page reset behavior is absent from the binding lifecycle rule

- **Location:** Spine, AD-9 line 96; spec, preservation boundaries/acceptance; `README.md:79–83`; `src/browser.mjs:150–156,171–180`.
- **Trigger condition:** Pair 1B restores old directory state after Guide while satisfying the numbered mount/cleanup requirements.
- **Guard snippet:** “Successful cross-page main replacement resets query, hidden visibility, and expanded folders; same-page/fragment navigation does not remount or reset. Theme remains shell/browser-owned. Retain the documented per-URL scroll restoration.”
- **Potential consequence:** future modules preserve filtering mathematics but change the visitor's existing navigation experience. This is the clearest observable all-AD divergence from the preservation goal.

### F6 — Current behavior still depends on visual classes

- **Location:** Spine, AD-9 lines 94–96; `src/browser.mjs:19,35–37,89,95,103–104,129`; `src/pages.mjs:83–85`.
- **Trigger condition:** search finds `.links`; copy selects `a.code, a.destination` and distinguishes URL type via the `code` class; persistent/recovery navigation finds `.site-head`/`.footer` and `brand` styling classes.
- **Guard snippet:** Define responsibility-owned hooks for directory roots, copy kind, and site-local navigation, then have the renderer and behavior owner use them consistently. Keep visual classes for CSS. Existing IDs already serving only one behavior can remain where appropriate.
- **Potential consequence:** a styling refactor changes copy/search/rebasing behavior. The theme hook is correctly separated (`data-theme-control`), but that change alone does not satisfy the broader AD-9 rule. This is a present code/contract mismatch, not an all-AD witness.

### F7 — Component variants lack a renderer-to-behavior semantic boundary

- **Location:** Spine, AD-7/AD-8 and Variants convention; `src/directory.mjs:9–20,24–39`; `src/layout.mjs:23–38`.
- **Trigger condition:** Pair 3 changes input/selector vocabulary while retaining single ownership and identical output semantics. A caller/behavior module needs to know which signals mean copy-short-URL, copy-destination, Download, disclosure target, and disabled control.
- **Guard snippet:** Document the semantic output boundary: native href/download behavior, stable disclosure target association, copy kind, disabled/pressed state, and the shared hooks consumed by behavior. Purpose/state variants may not alter that contract accidentally. Positional signatures and incidental class names remain code-owned seed.
- **Potential consequence:** an independently extracted renderer is visually correct but incompatible with the behavior owner. Such a mixed implementation would violate AD-9; the improvement is to make the integration contract actionable before integration, not to declare every API variation forbidden.

### F8 — Lifecycle scope is partly inferred from the seed

- **Location:** Spine, AD-9 and internal lifecycle diagram; `src/layout.mjs:31–37`; `src/browser.mjs:130,164–180`; `src/pages.mjs:54–59`.
- **Trigger condition:** ordinary shell pages load search/copy/navigation and mount through navigation; embedded 404 loads theme/recovery only. The shell's `active` argument also becomes `data-app-page`, but navigation accepts only `links`/`guide` and removes fetched main scripts.
- **Guard snippet:** State that ordinary directory/Guide content mounts through the shared lifecycle; theme is document/shell-lifetime; recovery is direct-document/native-navigation behavior; minimal forwarding is document-lifetime and outside app mounting. State the mount-before-interaction/cleanup-before-replacement order and cancellation obligation for outstanding copy work. Do not require disposal work where detached DOM and no external work make it unnecessary.
- **Potential consequence:** a structural extraction puts behavior in a fetched main script, or treats 404's shell as proof it participates in app mounting. Both fail existing integration without any new product feature. The current native 404/minimal behavior is intentional, not itself a defect.

### F9 — “Unavailable map” lacks a bounded stalled-request decision

- **Location:** Spine, AD-3 line 60 and AD-9 line 96; spec I/O matrix, 404 recovery; `src/pages.mjs:67–94`; `test/build.test.mjs:1360–1432`.
- **Trigger condition:** a 404 map fetch remains pending rather than rejecting or returning a response. Recovery awaits it indefinitely, leaving “Checking that link / One moment”; ancestor probing and the not-found state do not run. The existing tests simulate thrown errors and non-OK responses, not a stalled fetch.
- **Guard snippet:** Explicitly decide whether the unavailable-map fallback must be bounded. If it must, use the existing native timeout facility/pattern and a focused stalled-response check. Separately retain the first-readable-map boundary: a readable map with no match must stop ancestor probing, not borrow another site's map.
- **Potential consequence:** the promised not-found state has an unbounded pending case. This is an existing recovery edge, not a proposed routing feature. A latency target is deferred; that does not automatically define whether recovery may wait forever. Do not silently broaden first-readable-map semantics while fixing it.

### F10 — Passing regression status can omit the rendered gate

- **Location:** Spine, AD-6/AD-9; `test/build.test.mjs:784–785,1154–1155`; `.github/workflows/check.yml:33–45`.
- **Trigger condition:** Chrome is absent or an overridden `CHROME_BIN` is unavailable. Both rendered tests explicitly skip; the workflow does not itself assert browser availability or record an executed matrix requirement.
- **Guard snippet:** When AD-9 rendered verification is required, require evidence that the browser checks executed, with a known available Chrome binary or explicit recorded local evidence. Fail that required verification step on a missing browser rather than interpreting test-command success as rendered proof. Reuse the existing harness.
- **Potential consequence:** future shared-foundation changes pass PR validation without the appearance check the architecture requires. This review's local browser availability closes that gap for this run; no assertion is made that today's hosted runner actually lacks Chrome.

## Acyclic dependency check

### Actual current ES-module imports

Ignoring external standard-library/package leaves, the source import graph is:

```text
build.mjs -> src/build.mjs
src/build.mjs -> links, styles, browser, directory, pages
directory -> layout, links
pages -> layout, links
layout -> styles, browser
links -> node:fs/promises, yaml
styles -> no imports
browser -> no imports
```

**Result: acyclic now.** A valid leaf-to-root order is `styles/browser/links`, `layout`, `directory/pages`, `src/build`, root `build`. Combining shared pure helpers with validation in `links.mjs` does not itself create a cycle. It is build-time co-location, not evidence that generated browsers execute the YAML parser.

### Other graphs

- The publication/dependency Mermaid graph at spine lines 103–115 is acyclic as drawn.
- Its `Artifacts → Rendering` “generated by” edge is provenance, not a runtime import. Together with `Browser → Artifacts`, it must not be interpreted as a request-time dependency on the builder; line 100 already prohibits that.
- The internal Mermaid graph at lines 119–130 is acyclic as drawn, but omits encoding, recovery serialization, and most component-to-style/behavior integration edges.
- Generated assets do not import build modules. `navigation.js` has a runtime prerequisite on the definitions in `search.js` and `copy.js`; `page()` emits them before navigation. 404 instead embeds theme/recovery and follows native links. These are script/lifecycle dependencies, not ES-module cycles.
- Acyclicity today does not close Pair 4B. A normative no-reverse-edge/acyclic rule is needed if that is the intended future gate.

## Scope audit: foundations, 404, and native behavior

| Concern | Current implementation / binding rule | Gate result |
| --- | --- | --- |
| Every HTML producer | Shell and minimal forwards use `documentPage`; 404 uses embedded shell resources | Covered by AD-7; no extra universal renderer needed |
| Shared styles/theme | One `styles` definition and one `themeScript`; normal pages use assets, minimal/404 embed the exact shared definitions | Correctly scoped; embedding is not a second style owner |
| Shared chrome | One shell, borderless header/footer; main content is local; equal viewport/theme geometry binds | Obvious page/body override forks are already forbidden |
| Guide width/separators | Local `.prose` content behavior; not a header/footer variant | Legitimate content distinction, not divergent chrome |
| Minimal documents | Canonical, meta refresh, JS replace, and native fallback without chrome | Explicit valid document purpose variant |
| 404 asset base | Inline foundations; first readable ancestor map rebases shell links | Correctly recognizes unknown requested base |
| 404 without readable map | Existing relative shell fallback; no discovered-root claim | Do not “fix” this by inventing a project base |
| 404 without JavaScript | Native relative shell links and noscript explanation; no map lookup/rebase/app mounting | Valid existing limitation; native does not mean known-root recovery |
| Native browsing | Directory links/disclosures and direct Guide URLs work without JavaScript; hidden entries stay hidden | Preserve; no SPA-only component API |
| Theme without JavaScript | CSS system preference works; saved localStorage restoration needs JavaScript | Clarify applicability if editing AD-9; do not promise native storage restoration |
| App transitions | Preserve shell/theme; replace main; update active navigation; mount search/copy; strip fetched main scripts | Existing behavior boundary, not permission for local boot scripts |
| Launchers | Separate exact-case `.sh`, Bash quoting/download-before-execution/cleanup | Outside UI lifecycle; no reason to expand this task |

## Counterexamples rejected, rather than reported as holes

- Copying a header/row/traversal and assigning it a new filename violates AD-7, even if output happens to match today.
- Putting `body.guide .site-head` in the shared stylesheet still violates AD-8; one stylesheet owner is not permission for page-identity overrides.
- A main-scoped selector or content-induced overflow that changes shared chrome geometry violates the equality rule; selector scoping alone is insufficient.
- Mutating raw validated entries so the emitted map changes configured values violates AD-2; it is not a lawful ownership alternative.
- Registering local behavior that runs twice, survives cleanup incorrectly, or fails to mount on app navigation violates AD-9; a shared module filename does not cure it.
- Native 404 links before base discovery may remain relative. That is an explicit retained fallback, not a requirement for root guessing or app navigation on 404.
- Different private API signatures, detached-state representations, or CSS selector vocabulary with identical required semantics are not automatically defects. The spec explicitly does not promise every unrelated line of code is identical.

## Exit condition

Reconcile dependency acyclicity, page-state lifetime/reset, and semantic behavior/lifecycle ownership with the preserved behavior contract; resolve or narrow the present visual-class-hook mismatch. Record the 404 stalled-request decision and executed rendered evidence. Then repeat the existing relevant checks. No additional feature, registry, dependency, or broad rewrite is necessary.

## Final assessment — reconciliation verified (2026-10-07)

**PASS — no remaining blocking findings in this architecture gate.** This assessment supersedes the initial HOLD and the open dispositions above. Re-read the amended spine, spec, relevant source/tests, AGENTS, PRD/addendum/epics, and UX documents; no spine/code edits or agents were used.

| Earlier concerns | Closure verified |
| --- | --- |
| F1/F2: dependency direction/capabilities | AD-7 now expressly binds every import edge to acyclicity and prohibits build capabilities in generated browser code, while allowing existing build-time helper co-location. The inspected source graph remains acyclic; recovery embeds self-contained helpers rather than importing filesystem/YAML capabilities. Pair 4B is now forbidden. |
| F3/F4: data ownership/lifetime | AD-7 distinguishes read-only source/borrowed slices, view-owned detached projections, and read-only reusable projections. Current renderers derive fresh nodes without mutating raw entries; `entryCounts` is reused for root and descendant aggregation. Safe private representation differences remain permitted. |
| F5: state/navigation preservation | AD-9 binds cross-page resets, same-page non-remounting, cleanup-before-replacement, shell/theme persistence, title/nav/focus/history/fragments, stale-request suppression, native failure fallback, and per-URL scroll limits. Source and existing navigation checks agree. Pair 1B is now forbidden. |
| F6/F7: component hooks/API | The amended AD-9 explicitly permits owner-published structural classes/IDs as dual-use contracts and requires their semantic outputs and consumers to change together. Existing `.links`, `.code`, `.destination`, and shell hooks qualify; theme uses its dedicated hook rather than borrowing the hidden toggle's styling selector. The earlier blanket visual-class mismatch is closed by this explicit contract amendment, not by requiring unnecessary hook renaming. |
| F8/F9: recovery/native scope | AD-9 separates direct-document 404/minimal behavior from app mounting, preserves first-readable-map stopping and native/relative fallback, distinguishes CSS system theme from JS saved overrides, and explicitly retains no application-level recovery deadline. Current recovery agrees. Bounded completion is an expressly deferred requirement, not a blocker or requested implementation change. |
| F10: rendered verification | AD-9 now rejects skipped/unavailable browser checks as gate evidence. The affected existing Chrome matrix executed successfully in this follow-up, including root/project prefixes, home/nested/Guide/404, both themes, desktop/mobile, direct/native loads, and applicable app transitions. Minimal foundations and recovery were separately covered by the suite. |

The reconciled PRD/addendum/epics describe implemented hidden/tags/native/theme/component behavior without prescribing conflicting chrome or future-only capabilities. UX tool availability now explicitly preserves empty-site, all-hidden, and no-JavaScript states; source agrees. The numeric live heading is no longer `aria-hidden`, and its generated-markup regression assertion passes. No new dependency, registry, freezing/cloning mechanism, cache, timeout, or product feature is needed to close this gate.

**Follow-up proof:** Bun 1.4.2; Chrome 154.0.8037.97; `bun test --timeout 30000 ./test/build.test.mjs` → **23 pass, 0 fail**. Explicit browser selection via `CHROME_BIN=google-chrome bun test --timeout 30000 --test-name-pattern="inline tags keep row height|shared shell renders consistently" ./test/build.test.mjs` → **2 pass, 21 filtered out, 0 fail**; neither rendered check skipped. Temporary fixture builds leave workspace output untouched.

Deployment smoke testing remains the already documented post-deployment routing obligation; this PASS establishes architecture/implementation gate closure, not deployed GitHub Pages behavior. The only report housekeeping was removal of its original Markdown trailing spaces, which had surfaced once the report was staged.
