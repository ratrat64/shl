---
title: 'Manual link-state tags'
type: 'feature'
created: '2026-10-08'
status: 'in-review'
baseline_commit: 'bf29da0058b7d66b6d2631b58f5da88fd7725416'
route: 'dispatch'
review_loop_iteration: 0
context:
  - aid-docs/specs/spec-link-state-tags/SPEC.md
  - aid-docs/specs/spec-link-state-tags/link-state-behavior.md
  - aid-docs/specs/spec-link-state-tags/architecture-alignment.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Maintainers need consistent manual hidden/broken/disabled states; visitors need exact filtering and reliable disabled enforcement.

**Approach:** Implement the merged SPEC and all companions as one cohesive feature, replacing the hidden boolean with state tags across publication and browser consumers.

## Boundaries & Constraints

**Always:** Preserve static operation, public destinations, shared ownership/encoding, native browsing, readonly data, shell/lifecycle and row geometry. Keep both disabled copy actions. State searches reveal matching hidden leaves/ancestors without changing the toggle; all-hidden search stays available. Synchronize live rules and verify accessible colors.

**Never:** Add automation, checker policies, ownership metadata, per-state toggles, multi-term grammar, dependencies/frameworks, legacy compatibility, or external-access guarantees. Do not alter the canonical SPEC or historical records.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| States | Eight tag combinations; trimmed/case-varied labels | Exact states; disabled grey overrides broken/script; hidden opacity independent | Near-match tags descriptive |
| Search | Plain text, whole `#tag`, bare `#` | Broad substring or exact complete label; no token grammar | Bare `#` yields no matches |
| Hidden search | Reserved state query, hidden-only ancestors | Matching leaves only; single count; clear restores toggle pool | No matches shows existing search message |
| Disabled | Direct/wrong-case URL; script; native actions | Exact explanation, inert exit-1 launcher, unavailable Open/Download; both copies | No destination forwarding/fallback/download |
| Migration | True/false legacy property | Add hidden tag for true, preserve others, remove property | Every residual property rejected before output deletion |

</frozen-after-approval>

## Code Map

- `src/links.mjs`: `linkFields`, `entryTree`, `loadLinks` own leaves/counts/validation; reuse pure-helper serialization for recovery.
- `src/directory.mjs`: `renderLinkRow`, `directoryContents` own row actions, data hooks and tools; publish exact tags separately from broad search text.
- `src/pages.mjs`: `redirectPage`, `scriptLauncher`, `notFoundPage` own forwarding/launchers/recovery; use `documentPage` from `src/layout.mjs` for disabled minimal foundations.
- `src/assets/search.js`, `copy.js`: filtering/copy feedback. Preserve `navigation.js` mounting/rebasing and stale-copy cancellation.
- `src/assets/site.css`: shared theme/component/state tokens. Reuse row geometry, disabled-control wash and hidden-opacity selectors.
- `test/build.test.mjs`: reuse `fixture`, `behaviorScript`, `runChrome`, `browserServer` and existing behavior/Bash/rendered harnesses. Native query blocks scripts; fallback strips forwarding, so cannot prove disabling.

## Tasks & Acceptance

**Execution:**
- [x] `src/links.mjs` -- derive three states once and reject legacy property -- consistent publication/recovery.
- [x] `src/directory.mjs`, `src/assets/search.js`, `copy.js`, `site.css` -- expose exact tag data, implement visibility exception, copy-only destination and unavailable actions, accessible state emphasis -- preserve native behavior and shared layout.
- [x] `src/pages.mjs` -- exact minimal explanation, safe disabled launcher and canonical disabled recovery; update Guide -- enforce every entry path.
- [x] `links.yaml`, `README.md`, `AGENTS.md`, `aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md`, `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/{PRODUCT,DESIGN,EXPERIENCE}.md` -- migrate entries/examples and synchronize the alignment companion's amendments -- remove competing live rules.
- [x] `test/build.test.mjs` -- migrate valid hidden fixtures, retain rejection cases, add behavior-companion acceptance gates -- meaningful regression proof.
- [ ] Published feature artifacts -- deployed GitHub Pages root/project-prefix routing smoke. No staging deployment is configured; local simulated and rendered routing is verified, not deployed feature routing.

**Acceptance Criteria:**
- Given JSON/YAML fixtures, when every state combination is built, then public raw values and precedence match CAP-1/2.
- Given an all-hidden nested subtree, when state queries, toggles, clearing and navigation run, then reachable search, matching ancestors and restored counts follow CAP-3.
- Given disabled entries, when copying, native/modified activation, direct/recovered routing and Bash launchers run, then CAP-4 permits copying but never shl destination forwarding/execution.
- Given migrated sources and state changes, when rebuilding or submitting invalid legacy input, then CAP-5 preserves fields, replaces stale artifacts and protects existing output on validation failure.
- Given required Chrome, when light/dark mobile/desktop direct/native/app matrices run, then states are legible and shell/geometry/lifecycle remain consistent; deployed prefix smoke verifies actual Pages routing.

## Implementation Notes

- `linkStates` is a pure helper owned by links.mjs and serialized into recovery; no neutral module or dependency was needed. Raw map values remain untouched.
- Exact lowercased leaf tags are encoded separately from broad searchable text. State queries traverse hidden-only groups; ordinary visibility and clearing retain the saved toggle pool.
- Disabled rows keep native short links to explanations and selectable destination-copy buttons without href; Open/Download use native disabled buttons. Existing copy cancellation/timers remain in the shared controller.
- One checked-in legacy true leaf (setup/ohmyposh/latest) and README/Guide examples were migrated; its URL/script fields remain unchanged. Valid test fixtures use tags, and legacy properties of all values remain explicit rejection cases. There were no checked-in false or already-hidden-tag legacy leaves requiring migration.

## Spec Change Log

## Review Triage Log

| Finding | Verdict and evidence | Disposition |
| --- | --- | --- |
| Blind-1: selectable disabled URL duplicated/split | medium: hidden accessible text plus flex fragments made native selection differ from the configured URL. Disabled markup now uses its full aria-label and inline-block visible fragments; actual Chrome selection strings equal configured URLs. | Patched |
| Blind-2: legacy-property guidance could hide false entries or replace tags | medium: blanket tags replacement guidance omitted false/preservation semantics. Diagnostic now says remove the property, append only for true and preserve tags; rejection checks pass. | Patched |
| Blind-3: PRODUCT claimed destinations in disabled artifacts | low: retained publication paragraph contradicted intentionally destination-free explanation/launcher output. Public map/directory versus enabled artifacts are now distinguished. | Patched |
| Blind-4: README said script:false always emits a redirect | low: launcher opt-out is independent of disabled HTML behavior. Text now distinguishes explanations from forwarding. | Patched |
| Blind-5: deployed routing gate incomplete | medium: verified code and local Pages approximation do not prove hosted feature behavior. No feature staging exists; explicit unchecked post-publication gate remains. | Pending deployment, not claimed complete |
| Blind-6: rendered matrix lacked ordinary-state variants | medium: every matrix leaf originally had script:true. All eight non-script variants now assert teal defaults, state precedence and absent Download. | Patched |
| Blind-7: native code-link path was not activated | medium: direct explanation loading did not exercise listing hrefs. Native nested disabled code activation now reaches canonical explanation under both prefixes. | Patched |
| Blind-8: new button lacked genuine keyboard proof | medium: synthetic clicks/focus did not prove Enter/Space activation. Separate native CDP verification used trusted key events and the real clipboard; both keys copied the independent configured URL without navigation, and disabled actions could not activate. | Verified |
| Blind-9: button pointer variants lacked checks | medium: new element type initially had only width/selection assertions. Rendered checks now exercise fine idle/hover/focus, coarse/hybrid/non-hover visibility and stable geometry. | Patched |
| Blind-10: state-query disclosures lacked restoration assertions | medium: traversal changed ancestor opening without checking clear/switch behavior. Both visitor-open and initially closed ancestors now retain their proper states after queries clear. | Patched |
| Verification-1: clipboard expectation trusted generated attribute | medium: comparing copied output to the same data attribute could hide truncation. Rendered expectation now independently embeds the original stateMap URL through scriptString; full special-character URL is checked. | Patched |

Edge-case review returned no findings. All layers completed before triage; frozen intent remained unchanged.

## Design Notes

No intent gaps. Migration is reversible; merging triggers deployment. Footprint: existing modules/tests/live docs plus this record, no new API. Disabled destinations use copy buttons with selectable text and no external href; Open/Download use disabled controls. Serialize shared interpretation into recovery; extract a neutral module only if dependency direction requires it.

## Verification

- `bun ci` -- Bun 1.4.2 dependencies installed.
- `bun run format` and `bun run format:check` -- scoped formatter succeeds.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` -- affected regression/rendered suite passes without skips.
- `bun build.mjs` and `git diff --check` -- migrated root builds and diff is clean.
- Run Impeccable detector once on changed UI after implementation; inspect affected states in batched desktop/mobile verification.
- Baseline required-browser suite: 25 pass, 0 fail (2026-10-08). Deployed smoke needs published feature artifacts; record evidence before claiming completion.

### Executed implementation evidence (2026-10-08)

- Bun 1.4.2: `bun ci`, scoped format and format:check, required-Chrome full suite **30 pass, 0 fail, 0 skip**, `bun build.mjs` (**26 links**), and `git diff --check` succeeded.
- Added gates in test/build.test.mjs cover all eight states across JSON/YAML/YML and raw publication, duplicate/mixed-case/near tags, rejection-before-replacement, enabled→disabled→enabled artifacts and deletion, inert Bash with stubbed curl/mktemp/bash and exact stderr/exit, and disabled-copy success/failure/timer reset/stale cleanup.
- Executed Chrome state matrix at 390/1440px, light/dark, root/project prefixes, script-enabled/native documents and app transitions: exact/spaced/literal/bare-tag search, all-hidden ancestors/matching siblings/count/clear/toggle behavior, native disabled controls and direct explanation without fallback stripping, canonical disabled recovery, preserved shell/theme and lifecycle reset, 50px row geometry, destination reserves, opacity/focus and at least 4.5:1 computed state/tag/destination contrast on background and wash. Existing shell/Guide/404/native/forwarding and tag-popover gates also passed.
- Impeccable detector ran once over changed UI targets and returned `[]` (no findings).
- Remaining gate: deployed Pages smoke requires a deployment containing this feature (and disabled fixtures). This branch does not configure a staging site or alter production publication; status is in-review, not done. Current-artifact disabling cannot revoke older retained launchers or external destination access, as specified.
- After review patches, parent verification reran format:check, required-Chrome full suite (**30 pass, 0 fail**), root build (**26 links**) and diff checks successfully. Inline destination fragments provide exact native selection without changing middle truncation or 50px row geometry. Diagnostics and publication docs were corrected; matrix now includes ordinary/script variants, native nested code activation, pointer states and disclosure restoration.
- Genuine keyboard verification: `bun /tmp/opencode/verify-disabled-keyboard.mjs` passed with Chrome 155 CDP Input.dispatchKeyEvent keyDown/keyUp, focus emulation and clipboard permissions. Enter/Space generated trusted native activation, replaced a sentinel real clipboard value with an independent full configured URL, reported Destination copied. and did not navigate. Disabled Open/Download refused focus, were skipped by native Tab, and native keyboard/pointer attempts produced no activation/download. No repository edits or new dependency were needed for this verification.
- Latest main added only separate automation-planning documentation (PR #65); merging it into this task required no application changes. This feature still contains no automation implementation.
