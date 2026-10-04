# Independent PRODUCT reconciliation — 2026-10-04

Verdict: PASS WITH A MINOR OMISSION. Architectural constraints and all four product principles landed; no inflated product-capability claims found.
Method: Independently compared PRODUCT.md with the spine, build.mjs, link source, package manifests, workflows, and existing test code; no execution or deployment verification.

## Product principles preserved
- Easy browsing (PRODUCT:42): AD-5 preserves static disclosures, directory pages, subtree search, guide/theme, and accessibility affordances; build.mjs:156–354 implements them.
- Reviewable/version-controlled map (PRODUCT:43): AD-1/AD-2/AD-6 preserve repository ownership, one validated source, PR checks, and publication; build.mjs:20–114 and check.yml:22–45 agree.
- No application server (PRODUCT:44): AD-1/AD-6 preserve static-only operation, no database or application authentication, and dist-only Pages publication; deploy.yml:18–43 agrees.
- Transparent destinations/limits (PRODUCT:45): AD-2–AD-5 preserve public JSON/listings, visible and assistive-technology-readable URLs, browser-only redirects, syntax-only validation, and launcher boundaries; build.mjs:90–151,293–354,444 agrees.

## Constraints and stale evidence resolved
- PRODUCT:36 is stale: checked-in examples are links.yaml, not links.json; root contains exactly that supported source. Generated dist/links.json remains the public browser map (build.mjs:24–39,444). AD-2 correctly distinguishes them.
- PRODUCT:29 uniqueness means case-insensitive siblings, not globally unique leaf codes; build.mjs:53–73 and AD-3 agree on the actual nested namespace.
- Node 24 and YAML-only dependency match PRODUCT:30, package.json:4–6, package-lock.json:12–14, and both workflows. AD-1 prohibits a frontend framework and constrains dependency additions.
- User-permitted internal modular/templating refactors are explicitly allowed by AD-1 and Structural Seed/Deferred; published contracts remain binding, rather than freezing build.mjs's layout.
- Deployment builds without regression tests (deploy.yml:26–33); PR validation tests then builds, with the AGENTS.md-only exception (check.yml:22–45). AD-6 is accurate; README:20 and AGENTS:20,36 must not be read as deploy-time test guarantees.

## Claim calibration
- AD-4 correctly limits output integrity to validation-before-deletion, not atomic write recovery; build.mjs:108–114,421–446 agrees.
- The spine asserts no destination health/script correctness, immutable launcher destination, built-in GitHub API client, measured scale/latency, or availability guarantee; Deferred keeps these evidence gaps explicit.
- AD-5 names accessibility affordances without audited conformance; AD-6 requires deployed smoke evidence rather than treating simulated routing tests (build.test.mjs:353–395) as proof of Pages behavior.

## Actionable findings
- Minor spine omission: explicitly retain PRODUCT:28's no built-in click tracking as a current-scope exclusion in AD-1 or Deferred. Static operation alone does not exclude client-side analytics; build.mjs's guide already states the limitation (:338).
- Upstream documentation cleanup: change PRODUCT:36's source example to links.yaml and clarify README:20 / AGENTS:20,36 as PR tests versus deployment build/validation. These are evidence corrections, not implementation work.

Final disposition: AD-1 now explicitly excludes built-in click tracking. Upstream wording drift is recorded in working memory; it does not block this current-system spine.
