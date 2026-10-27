# Repository observations — requirements context, not external technology evidence

Baseline: commit `3f1b8ef`, inspected 2026-10-27. Sources are repository files at that commit. Counts below are physical lines, not complexity metrics or productivity measurements.

- `src/build.mjs:18–67`: 71-line builder loads and validates before deleting dist, copies assets, writes redirect/launcher/directory/Guide/404/map resources. The publication pipeline is already compact.
- `src/directory.mjs:10–49,156–219`: renderer owns tag colors, labels, catalogs and metadata; browser consumes serialized metadata. A UI migration must preserve one shared definition rather than duplicate server/client logic.
- `src/assets/search.js:19–162`: storage validation, failed-write memory fallback, restoring retained controls and listener cleanup are intertwined in one initialization closure.
- `src/assets/search.js:178–294`: recursive DOM filtering, count updates, selected/available chip mutations and focus handling are coordinated imperatively.
- `src/assets/search.js:300–390`: picker layout animation and cancellation are additional behavior, not just filtering.
- `src/assets/search.js:392–539`: token parsing tracks edit ranges, unknown-token ranges, URL exclusion, caret restoration, multiline paste and IME composition. A framework does not supply this domain parser automatically.
- `src/assets/navigation.js:60–165`: fetch/parse/recognize pages, cancellation and stale-result guards, retained directory controls, cleanup/remount, history/title/current-nav/focus and scroll handling are manually coordinated.
- `src/assets/navigation.js:128–144`: same-base directory navigation deliberately retains outgoing main/tools and swaps only directory content. A replacement must prove DOM identity and input selection, not merely equal state values.
- `src/assets/navigation.js:219–245`: persisted native Back mounts latest session state and restores selected-chip focus. Router defaults alone are not proof of compatibility.
- `src/assets/recovery.js:14–61`: ancestor map probing determines an unknown canonical site base; first readable map stops probing, case-insensitive lookup routes directories/leaves separately. This is product-specific routing.
- `src/browser.mjs:11–21`, `src/pages.mjs:220–239`: browser behavior is embedded for unknown-base 404; pure link helpers are serialized into recovery. External-asset/hydration discovery must work before base resolution.
- `src/pages.mjs:13–61`: Bash launchers and minimal forwarding/disabled explanations are independent of interactive directory rendering and need no framework replacement.
- `package.json`: runtime build dependency is YAML; formatting is Prettier; Bun drives build/tests. A component compiler, bundler and application framework would add maintained tooling.
- Architecture AD-3/5/7/9 and DESIGN.md: static/no-JS output, persistent shell and toolbar DOM identity, session filters, native failure/modified-click behavior, focus and 404 recovery are requirements. AD-1/7's no-framework policy is the decision under reconsideration.

Hypothesis to test externally: a declarative component system could remove manual DOM reconciliation/listener management; an application router could replace generic navigation bookkeeping, but neither erases the domain parser, storage contract, unknown-base recovery, or generated launchers. No claim of net productivity gain has been measured.
