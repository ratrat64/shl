# Frontend framework decision — approved research brief

Approved by the user on 2026-10-27. Decision: whether adopting a frontend framework reduces shl maintenance complexity; if so, select an approach and a reversible pilot, not an immediate rewrite.

## Requirements frame

Hard gates: static GitHub Pages publication without a backend; stable short URLs and Bash launchers; root and project-prefix deployment; direct/deep links and case-insensitive 404 recovery; no-JavaScript baseline browsing; existing validation and output-encoding guarantees.

Preserve current user-visible navigation, shell/control identity, filter/session semantics, accessibility, and themes unless a later explicit product decision changes them. The previous no-framework rule is being reconsidered for this research; it is not a candidate-screening gate.

Weights approved: maintenance/complexity reduction 40%, behavior/hosting fit 25%, migration/regression risk 20%, tooling/learning/ecosystem 15%. Score 1–5, higher is better; scores are analyst judgments, not measurements. Unknown maintainer framework familiarity must remain explicit.

Candidates: current implementation with targeted improvements; Svelte/SvelteKit; Vue; React; Astro. Separate UI libraries from application/SSG/router frameworks. Evaluate incremental replacement and rewrite.

## Plan and effort

Standard preset; three parallel evidence streams, at most eight sources per dimension per round and two rounds, normal verification. Breadth-first: Svelte/SvelteKit; Vue/React; Astro/platform/independent checks. Research surfaces: direct web fetching of current documentation, repository issues and publicly accessible experience reports; no dedicated search engine or workflow orchestration available. Estimated 10–20 minutes, subject to source availability. No runtime performance claims without measurements. Record single-publisher and incomplete compatibility evidence as unverified.

Local implementation inspection is requirements/context evidence only. External technology claims must trace to source digests; local findings must cite a separately labeled repository observation digest, not masquerade as external research.

Deliverables: source digests, cited research report with weighted matrix and sensitivity, recommendation/runner-up/counterargument, migration and exit costs, pilot acceptance criteria and open questions. Research changes only; no prototype implementation.
