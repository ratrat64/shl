# Architecture and UX alignment

## Amendment scope

The adopted documents describe the existing system. This feature intentionally replaces boolean hiding, broad `#tag` matching and the all-hidden search restriction, and adds disabled routing/execution behavior. The amendments below govern those differences; all other architecture/UX contracts remain binding. This spec-authoring change does not rewrite the existing-system documents or application. Implementation must synchronize their live rules and affected agent instructions, rather than leave competing conventions or claim a local exception.

| Existing contract | Required synchronized amendment |
| --- | --- |
| Architecture AD-2 and Shared data convention | Remove optional boolean `hidden`; reject its presence. Derive hidden/broken/disabled from exact trimmed case-insensitive tags. Preserve raw public configured values. Hidden remains public/routable unless disabled. Ordinary visibility uses toggle; explicit state search temporarily includes matching hidden leaves. |
| Architecture AD-3 | Enabled links retain minimal forwarding documents. Disabled leaves emit minimal explanations without forwarding, and 404 recovery routes them to canonical short URLs. Preserve case/prefix handling; `.sh` remains exact-case and separate, including safe disabled launchers. |
| Architecture AD-4 | Retain validation-before-replacement and all output encodings. Complete-download/execute/cleanup applies to enabled launchers; disabled launchers exit 1 before download/execution. A disabled URL still receives URL/schema/collision validation. |
| Architecture AD-5 | Keep plain-text broad subtree search, add exact whole-tag mode and explicit state-query visibility exception. Copy remains an enhancement; disabled destination is copy-only with no external native fallback. |
| PRODUCT capabilities | Replace hidden property with state tags and public disabling semantics; retain manual repository publication, static operation and destination limitations. |
| DESIGN directory tools; EXPERIENCE Tool availability | Show enhanced search in any nonempty subtree, including all-hidden, while preserving initial empty copy/count and no-JavaScript visibility. Truly empty root still has no search. |
| DESIGN rows/colors; EXPERIENCE rows/emphasis/interactions | Broken orange-red and disabled grey override script emphasis as specified, hidden opacity remains independent, and tags remain non-color cues. Disabled destination is copy-only; Open/Download are visibly unavailable. Keep shared geometry, theme roles and accessibility floor. |
| EXPERIENCE Search/Hidden toggle/Empty subtree | Specify whole-tag syntax and temporary state-search reveal, unchanged toggle state, single-count/no-match behavior and clearing restoration. |
| EXPERIENCE Document variants | Disabled explanation uses minimal shared foundations; no external fallback. Existing full-shell 404 keeps its recovery responsibility. |
| README, generated Guide, live AGENTS link-schema instructions | Replace old hidden examples/rules, explain exact tag and state searches and disabling/copying limits; preserve historical records as history. |

## Responsibility ownership

- `src/links.mjs` currently owns validation, `linkFields`, leaf interpretation and tree/count projections. Derive state once for shared consumers; do not maintain separate property/tag semantics. Raw entries and borrowed slices remain readonly.
- `src/directory.mjs` owns tools, rows, groups and tag disclosure; evolve disabled control/copy hooks together with their behavior consumers. Do not fork home/nested implementations.
- `src/pages.mjs` owns forwarding, unique explanation content, launcher rendering and 404 recovery. Share state interpretation with generation/recovery, avoiding filesystem/YAML/build dependencies in browser code. Extract a neutral leaf only where required for acyclic dependency direction; no speculative registries.
- `src/layout.mjs` retains shared document/shell foundations. Disabled explanation selects minimal composition; 404 remains full shell. Preserve embedded styles/theme where request paths make native assets unreliable.
- `src/assets/site.css` owns shared state tokens/component declarations; `src/styles.mjs` and `src/browser.mjs` load shared embedded assets. Scope content inside main; no state/page selector may alter shell chrome.
- `src/assets/search.js` and `copy.js` retain their responsibilities within existing navigation mount/cleanup. Implement exact tag matching without parsing rendered label text; retain full URL values and do not let copy-only disabled targets acquire navigation behavior. Preserve stale-copy cancellation, query reset, native fallbacks and theme lifetime.
- `src/build.mjs` publishes the same validated map and generates every leaf's correct current artifact. It does not check destination reachability or schedule state mutation.

AD-1/AD-6 and AD-7–AD-9 remain unchanged: static repository-owned state, existing checks/publication, single-owner composition, encoding and readonly boundaries, uniform borderless chrome, and executed rendered verification. Reuse existing tests in `test/build.test.mjs`; the behavior companion defines the affected gates, not a new testing framework or automation service.
