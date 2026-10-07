# Independent modular architecture rubric review

## Verdict

**Pass with contract clarifications before final architecture handoff.** The spine establishes the approved responsibility-owned composition without a framework or registry, addresses the actual CSS-driven divergence, and covers the static operational envelope. Four concrete gaps remain in the precision of the lifecycle/verification contract and its relationship to existing browser behavior. None calls for redesigning the composition or adding infrastructure.

Reviewed on 2026-10-07 against the working files in `/home/rat/Git/shl/shl-modular-ui`. This document exists to help maintainers and downstream builders preserve the approved modular boundaries while changing the static site. The assessment is an independent, static rubric review; tests, runtime installation, and deployed smoke testing were not rerun. Implementation handoff results are testimony, not fresh verification by this reviewer.

Only this report was written. The spine and implementation were not edited. No agents were spawned.

## Scope and evidence

- Primary artifact: `ARCHITECTURE-SPINE.md`, all sections, especially AD-7–AD-9.
- Approved intent: `aid-docs/implementation-artifacts/spec-modular-ui.md:12–36,60–63`.
- Live instructions: `AGENTS.md`, UX `PRODUCT.md`, `DESIGN.md`, and `EXPERIENCE.md`.
- Source: `src/layout.mjs`, `src/directory.mjs`, `src/styles.mjs`, `src/browser.mjs`, `src/pages.mjs`, `src/links.mjs`, and `src/build.mjs`.
- Operational evidence: `package.json`, `.github/workflows/check.yml`, `.github/workflows/deploy.yml`, and relevant tests in `test/build.test.mjs`.
- Historical constraints: the architecture workspace `.memlog.md`.
- Rubric: enforceable Binds/Prevents/Rule; real divergence boundaries; deferred scope; technology/source/spec consistency; operational completeness; minimal composition.

The working tree contains staged task changes. This review evaluates their current contents, not only the historical baseline cited by the spine. No inherited parent spine is identified; no parent-contract comparison is claimed. No project-context file was found.

## Concrete findings

### R1 — The rendered gate does not define what a skipped browser check means

**Location:** Spine AD-9, line 96; AD-6, line 78.

**Trigger:** A maintainer runs the prescribed regression suite without an installed Chrome binary. Both real-browser tests return `t.skip` (`test/build.test.mjs:783–785,1153–1155`), so the suite can succeed without verifying computed shell appearance.

**Evidence:** AD-9 requires real computed appearance and calls itself a rendered consistency gate. AD-6 requires running the regression suite, but neither rule distinguishes a successful suite containing skips from completed rendered verification. `README.md:214–219` already states that a skipped check is not rendered verification. The PR workflow runs Bun tests but does not itself explicitly ensure Chrome availability (`check.yml:33–45`). This is not evidence that Chrome is absent on current hosted runners; it is evidence that the acceptance condition is not stated in the binding spine.

**Consequence:** Two builders can both claim the architecture gate passed while one supplied browser evidence and the other supplied only simulated/structural checks.

**Concrete correction:** Add to AD-9: “A skipped or unavailable real-browser check does not satisfy rendered verification; record a successful browser run for the affected matrix before claiming the gate complete.” Reuse the existing harness and README wording. Making every local test invocation fail without Chrome is unnecessary.

**Disposition:** Clarify the spine; no new dependency or test framework required.

### R2 — The lifecycle rule omits existing navigation contracts worth preserving

**Location:** Spine AD-9, lines 94–96; AD-5, line 72.

**Trigger:** A future navigation refactor preserves header/footer/theme identity and mounts content once, but stops updating the document title, restoring fragments/history, moving keyboard focus, or falling back to native navigation after a failed fetch.

**Evidence:** AD-9 specifies shell preservation, cleanup, main replacement, active navigation, and one mount, but does not bind those other behaviors. They are implemented together in `src/browser.mjs:134–184,187–200`: fragment placement, scroll restoration, heading/section focus, request sequencing, document title updates, and `location.assign` on failure. `README.md:78–83,225–235` documents the user-visible contract. The approved spec explicitly requires persistent shell behavior and accessible controls, forbids unrelated behavior changes, and points to the existing navigation implementation (`spec-modular-ui.md:22–24,42`). Existing navigation tests exercise these paths (`test/build.test.mjs:183–537`).

**Consequence:** An implementation can satisfy the distilled lifecycle rule while regressing navigation that the approved refactor was meant to preserve. This is a missing preservation boundary, not a claim that the current code is broken.

**Concrete correction:** Extend AD-9 with a compact preservation clause covering title, fragment/history/scroll behavior, accessible focus, stale-request suppression, and native fallback on unavailable/non-app responses. Explicitly retain the documented one-scroll-position-per-URL limit; do not require per-history-entry restoration or a router abstraction.

**Disposition:** Ratify existing behavior in the spine.

### R3 — The behavior-hook prohibition is broader than the ratified source

**Location:** Spine AD-9, lines 95–96.

**Trigger:** A maintainer applies “Dedicated behavior hooks target their own responsibility” and the stated prevention of coupling behavior to visual classes to all browser enhancements.

**Evidence:** Theme now uses the dedicated `[data-theme-control]` hook (`src/browser.mjs:4`, `src/layout.mjs:19`), correctly separating it from hidden-toggle styling. Navigation has `data-app-link`, `data-nav`, and `data-app-page`. However, copy behavior still targets `a.code, a.destination` and infers the copy operation through the visual `code` class (`src/browser.mjs:95,103–104`); search still locates `.links` (`src/browser.mjs:19,37`), and navigation locates shell links by `.site-head`/`.footer` (`src/browser.mjs:129`). The spine presents all browser lifecycle behavior as adopted without defining which classes are stable behavioral contracts.

**Consequence:** One builder treats those classes as supported dual-use hooks; another concludes that the adopted architecture requires replacing them all. The resulting disagreement is specifically the coupling AD-9 says it prevents.

**Concrete correction:** State whether dedicated hooks are mandatory wherever behavior depends on a presentation-only selector, or whether named structural classes are approved stable behavior hooks. If the intended rule is narrowly about the theme control borrowing unrelated hidden-toggle styling, say so explicitly. Reconcile the chosen interpretation with the approved single-owner/hook intent; avoid a wholesale selector rewrite without that decision.

**Disposition:** Discuss the intended scope, then synchronize the contract and any necessary follow-up. The review does not prescribe implementation changes.

### R4 — “Unavailable map” fallback has an unstated completion limit

**Location:** Spine AD-3, line 60; AD-9, line 96; Deferred, lines 172–179.

**Trigger:** An ancestor `links.json` fetch or its body never settles promptly, rather than rejecting or returning a non-success status.

**Evidence:** Recovery awaits sequential `fetch` and `res.json` calls with no application deadline (`src/pages.mjs:67–72`), then changes “Checking that link” to the not-found state only after the loop finishes (`src/pages.mjs:95–96`). Offline tests simulate immediate rejection (`test/build.test.mjs:1381–1384,1402–1410`); they do not establish bounded completion for a stalled request. App navigation separately has a ten-second timeout (`src/browser.mjs:161`), so the two network-bound enhancements already have different availability behavior. The spine promises a not-found state for unavailable maps without explaining this limit.

**Consequence:** The themed shell remains usable, but the recovery message can remain pending for a browser/network-controlled duration. A downstream builder can incorrectly read the rule as a bounded fallback guarantee.

**Concrete correction:** Preserve the approved existing behavior by documenting that recovery has no application-level deadline and that final fallback depends on request completion. Record bounded recovery as an explicit open/deferred decision only if wanted. Do not silently add a timeout during this preservation-focused refactor.

**Disposition:** Clarify the existing limitation, or discuss a separately authorized behavior change.

## Rubric assessment

| Dimension | Assessment | Evidence and reasoning |
| --- | --- | --- |
| Binds/Prevents/Rule form | Pass | AD-1–AD-9 all identify consumers, forbidden divergence, and observable rules. Stable IDs are preserved. |
| Enforceability | Pass with clarifications | Source cardinality, namespace, escaping, output replacement, shell inclusion, borderlessness, theme restoration, and matrix verification are checkable. R1–R4 identify narrower acceptance/scope ambiguities. |
| Non-obvious divergence boundaries | Pass | The spine directly addresses body/page CSS overriding identical shell markup, theme restoration without a control, unknown 404 asset bases, first-readable-map ownership, context-specific encoding, launcher filename collisions, and shell persistence. These are actual cross-consumer risks, not generic modularity slogans. |
| Approved spec coverage | Pass with lifecycle clarification | Full shell includes 404; forwards remain minimal with shared foundations; borderless chrome is uniform; Guide separators remain content-local; link-map/search/tag/launcher contracts are retained. R2 addresses preserved navigation behaviors omitted by the short rule. |
| Brownfield ratification | Pass with hook clarification | Document/shell composition, normalized entries, shared theme/token definitions, forwarding, and embedded 404 resources match current source. AD-9's hook wording needs R3 to avoid declaring a broader migration complete than the source shows. |
| Operational/environmental envelope | Pass | AD-6 distinguishes PR tests from deployment builds, documents artifact boundaries and CNAME/.nojekyll, covers manual deployment, external hosting/merge policy, local preview limits, and deployed routing smoke tests. There is no silently implied staging service or application environment. R1 and R4 cover concrete verification/recovery limits. |
| Deferred divergence | Pass | Deferred extraction is still constrained by AD-7–AD-9. Performance targets, external writer setup, atomic replacement, future features, and provider/operations expansion are expressly bounded. None authorizes independent document/style/data owners. |
| Technology/current evidence | Adequate for this review | Package metadata and workflows agree on Bun 1.4.2; the only application dependency remains YAML. The spine correctly calls these repository pins, not latest-release claims. The lockfile version and prior successful commands were not independently reverified here. |
| Minimal architecture | Pass | Plain ES-module composition, actual repeated responsibilities, unique local content, and explicit rejection of frameworks, registries, and universal rendering avoid speculative architecture. No new layer is needed to close these findings. |
| Structure/readability | Pass | Explanation/reference hybrid: paradigm first, stable rule schema, then dependency projections, operational seed, and explicit deferrals. Diagrams reinforce direction rather than imposing a fixed module tree. |

## Rule-by-rule enforceability check

| Rule | Binding check | Result |
| --- | --- | --- |
| AD-1 | Repository-owned map; no browser write path, application backend, framework, or competing store | Clear. The general dependency allowance does not override the approved task's stricter no-new-dependencies constraint. |
| AD-2 | One source; common string/object semantics; validated public JSON; hidden entries stay routable/public | Clear. `linkFields` normalizes rendering fields while `raw` preserves published input values. |
| AD-3 | Reserved/colliding paths rejected; root/project-relative resources; case-preserving output and case-insensitive browser recovery; exact launcher URLs | Clear namespace and routing boundary; R4 qualifies map-unavailability completion. |
| AD-4 | Validate before deletion; HTML/script/shell encoding; full download before execution | Clear. Explicitly declining atomic write-failure recovery avoids a false durability promise. |
| AD-5 | Static browsing/disclosures; subtree search/count/hidden behavior; accessible controls and feedback; legacy forwards | Clear architectural floor. Detailed UX values stay in the design/experience documents rather than being duplicated here. |
| AD-6 | Root-based build, PR suite then build, artifact-only publication, external hosting settings and deployed smoke test | Clear operational ownership; R1 completes the distinction between running tests and satisfying rendered proof. |
| AD-7 | Shared document for every page; full shell versus minimal forwards; shared directory renderers and interpretation | Clear. Validation traversal and DOM search traversal have different responsibilities; “share traversal” should not be read as demanding a universal walker. Current source does not need a registry. |
| AD-8 | One token/component-style owner; equal shell appearance; no page-identity override; borderless chrome | Clear and aligned with approved DESIGN/EXPERIENCE/AGENTS. Equal geometry means component geometry at equal viewport/theme, not identical footer vertical placement across different content lengths. |
| AD-9 | Storage-tolerant theme, persistent shell, mount/cleanup, recovery rebasing, rendered matrix | Sound boundary; R1–R4 tighten its proof, preserved behavior, hook scope, and network-completion limits. |

## Deferred-scope audit

- **Further extraction:** Safely deferred because actual repetition and independently changing responsibilities trigger reconsideration, with existing single-owner invariants still binding.
- **Performance/scale:** No measured target is invented. “Hundreds of links” is expectation, not evidence. This does not permit adding a separate authoritative index.
- **External writers:** Credentials/concurrent edits belong to future repository automation; no Shortlink API is implied.
- **Product extensions:** New editors/taxonomy are separate decisions. Implemented hidden/tag behavior is explicitly removed from the deferred bucket.
- **Write-failure recovery:** Explicitly narrower than atomic publication, and consistently qualified by AD-4.
- **Providers/environments/operations:** Current Pages/repository ownership is decided. Staging, monitoring, and service-level targets are legitimately deferred at feature altitude.
- **Recovery latency:** Unlike the above, its present limitation is implicit; R4 makes the existing behavior explicit without inventing a new requirement.

## Structural lens

Chosen model: **Explanation + Reference/Database**. Word metrics report 2,260 words; AD-7, AD-8, and AD-9 contain 137, 123, and 172 words respectively. No structural cut, merge, or move is warranted. The conventions and diagrams reinforce random-access rules and dependency direction; they are not harmful duplication. No editorial recommendations, no proposed word reduction, and no length target. The requested review is semantic, so cosmetic copy-editing was not performed.

## Review method and limits

The adversarial pass considered source cardinality, malformed/empty input, public hidden metadata, namespace and launcher collisions, encoding, destructive replacement, no-JavaScript browsing, theme/storage/control absence, unknown asset bases, first-readable-map termination, navigation lifetime/history/failures, computed-style evidence, and deployment/environment boundaries. Handled concerns were discarded rather than padded into findings. The edge-path pass independently identified skipped-render verification and stalled-map completion; these overlap R1 and R4 and are noted here rather than counted as additional distinct defects.

No contradiction was found in the approved full-shell 404, minimal shared-foundation redirects, borderless chrome, or native fallback before base discovery. The existing offline relative fallback is deliberately limited by the approved spec; guessing the project root would violate that decision. No new framework, component registry, universal renderer, atomic build pipeline, staging environment, or monitoring service is recommended.

**Handoff recommendation:** Retain AD-7–AD-9 and the existing composition. Close the four wording/acceptance gaps with explicit decisions, then assess rendered/deployed verification from actual run evidence. This review alone does not certify test execution or GitHub Pages behavior.

## Final follow-up assessment — 2026-10-07

**PASS. R1–R4 are closed; no remaining blocking findings in this rubric review.** This assessment supersedes the initial conditional verdict above.

| Finding | Closure in updated spine |
| --- | --- |
| R1 — Skipped rendered gate | AD-9 Verification gate (`:103`) explicitly rejects skipped/unavailable browser checks and requires a recorded, executed, successful affected matrix. The spec records both Chrome checks executed and the covered matrix (`spec-modular-ui.md:85–86`); this reviewer did not rerun them. |
| R2 — Navigation preservation | AD-9 Rule (`:100`) binds title/active navigation, focus, history/fragments, stale-request suppression, native failure fallback, and the existing per-URL scroll limit. Cross-page resets and same-page non-remount behavior are explicit; 404/minimal forwarding remain direct-document behaviors. |
| R3 — Behavior-hook scope | AD-9 Component integration (`:101`) permits owner-published structural class/ID contracts with renderer/behavior changes coordinated, while prohibiting unrelated-control visual-class borrowing and control-order dependence. The dedicated theme hook remains required without demanding wholesale selector replacement. |
| R4 — Recovery completion limit | AD-9 Recovery boundary (`:102`) explicitly states no application-level deadline and completion-dependent final fallback. Deferred bounded recovery (`:188`) supplies a revisit trigger without changing existing behavior. |

AD-7's acyclic import, browser-capability, and read-only source/shared-projection boundaries (`:87–88`) strengthen ownership without requiring a neutral module until needed, cloning/freezing infrastructure, or a cache. AD-8 retains approved borderless full-shell chrome, with 404 included and shared-foundation redirects minimal. Framework/registry/universal-renderer prohibitions remain intact.

Targeted checks of the reconciled PRD/addendum, epic inventory, and UX DESIGN/EXPERIENCE confirm alignment on implemented hidden/tags/copy/Download behavior, Bun/src ownership, shell/minimal composition, and empty/all-hidden/no-JavaScript tool availability. No new product feature or unnecessary implementation obligation is introduced by these closures. This is contract-closure verification; deployed Pages smoke testing remains the separately stated publication check.
