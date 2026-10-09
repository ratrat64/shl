---
title: 'Predefined state tag colors'
type: 'feature'
created: '2026-10-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '1b42ee5860a96601e59ae5c2f6b088aaccafd85e'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Generated colors for #broken, #script and #disabled do not match their link-list state colors. The #hidden treatment should be light gray / white-ish rather than a generated hue.

**Approach:** Reuse the shared link-state theme tokens for the named tags, and provide a neutral treatment for #hidden. Use the same treatment on inline labels, popovers, available filters and selected filters.

**Decision:** The visibility color exception applies only to #hidden; the user confirmed there is no #invisible tag. Keep the neutral light-theme treatment readable against light surfaces and use light-gray / white-ish ink in dark mode.

## Boundaries & Constraints

**Always:** Keep other tag colors deterministic and generated. Retain readable contrast in light/dark themes, existing shared tinted fills/borders, full labels, row geometry and selected-chip metadata cloning. Synchronize the superseded all-tags-generated contract in live design, architecture and agent instructions.

**Never:** Change tag filtering, source validation, link states or link-map values as a side effect of styling.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| State colors | broken / script / disabled, either theme | Fixed shared broken / script / disabled colors regardless of other tags on the row | Existing behavior |
| Ordinary label | Any other descriptive tag | Existing seeded HSL color | Existing validation |
| Hidden label | hidden, either theme | Fixed neutral theme-aware treatment | Existing behavior |
| Selected filter | Activate a fixed-color catalog chip | Clone renderer-published metadata and preserve its fixed color | Existing behavior |

</frozen-after-approval>

## Code Map

- `src/directory.mjs`: `tagColors` / `tagStyle` own renderer-published color metadata for row labels, popovers and catalog chips.
- `src/assets/site.css`: shared `--broken`, `--script`, `--disabled` theme tokens; tag tone and color-mix styling.
- `src/assets/search.js`: selected chips clone original catalog nodes; no independent color assignment is needed.
- `test/build.test.mjs`: seeded vectors, catalog metadata and rendered contrast checks currently assume all state tags are generated.
- `README.md`, `AGENTS.md`, UX PRODUCT/DESIGN/EXPERIENCE, architecture AD-5 amendment and colored-tag specification: live all-tags-generated instructions need reconciliation.

## Tasks & Acceptance

**Execution:**
- [x] `src/directory.mjs`, `src/assets/site.css` — add fixed treatments using existing shared state tokens and a readable neutral visibility treatment.
- [x] `test/build.test.mjs` — adapt seeded assertions and verify fixed treatments, metadata cloning and rendered contrast.
- [x] Live documentation and instructions — replace contradictory all-tags-generated rules with the approved exceptions.

**Acceptance Criteria:**
- Given named fixed tags, when rendered in light/dark themes on desktop/mobile, then rows, popovers and both chip tracks use consistent fixed treatments.
- Given directory navigation and selected-chip updates, when content mounts or selection changes, then renderer-owned color metadata remains authoritative.
- Given hidden, broken or disabled row combinations, when labels are rendered at rest, hover or focus, then they remain readable and link-state behavior is preserved.

## Implementation Notes

- Approved by the user; implementation and verification run in `/home/rat/Git/shl/shl-predefined-state-tag-colors` on `fix/predefined-state-tag-colors`. Do not commit, push or perform remote operations during the implementation handoff.
- Reuse existing fixed state tokens instead of duplicating their numeric palette. Preserve the existing Operate-mode visual identity and scope the color changes to the four named tag identities. Read `/home/rat/.config/opencode/skills/impeccable/reference/craft-floor.md` before UI edits. Run the mechanical detector once after UI work: `/home/rat/.config/opencode/skills/impeccable/scripts/impeccable detect --json src/directory.mjs src/assets/site.css`.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence / route |
| --- | --- | --- |
| Blind 1: grayscale prohibition contradicts disabled exception | low | SPEC.md's blanket wording conflicts with the named fixed neutral exception; directly clarify descriptive-tag preservation. Patch. |
| Blind 2: hidden color assertion is self-referential | medium | Rendered expectations use the production hidden token, so a readable chromatic replacement would pass. Add independent numeric theme expectations. Patch. |
| Blind 3: selected hidden contrast skipped | medium | Hidden is preselected and its catalog chip is skipped before selected checks. Check the existing selected chip and assert all four fixed identities are covered. Patch. |
| Blind 4: mounted theme transition lacks fixed-tag proof | low | Existing shell theme checks do not exercise selected fixed tags and an open disabled-script popover together. Add a bounded transition assertion to the existing matrix. Patch. |
| Blind 5: root script alias ownership lacks mutation proof | medium | Current palette equality would not catch replacing the alias with a duplicate constant; verify a root token change reaches disabled script labels/popovers. Patch. |
| Blind 6: exact fixed matching lacks independent negative vectors | low | Existing expected metadata often comes from tagColors itself. Add pinned generated near-match vectors to the existing test. Patch. |
| Blind 7: focus full-spectrum coverage overstated | low | The full spectrum covers rest/hover; focus checks cover the state fixture. Clarify live coverage wording rather than adding redundant spectrum sweeps. Patch. |
| Blind 8: lookup allocated per label | low | The fixed lookup is recreated per call; moving the static object to module scope is a direct correction with no public surface. Patch. |
| Blind 9: new matrix diagnostics omit context | low | Fixed ink assertions lack theme/width/prefix/native context. Add those values to existing messages. Patch. |
| Verification-gap 1: hidden neutral value unpinned | medium | Pre-verified gap: the numeric palette checks omit --tag-hidden and token-derived expectations accept orange-red. Same root cause as Blind 2; add independent numeric expectations. Patch. |

## Verification

- `bun ci` with Bun 1.4.2 — dependencies installed.
- `bun run format` and `bun run format:check` — scoped formatting passes.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` — generated and real-browser checks pass, including shared shell and tag theme/state matrix.
- `bun build.mjs` — site builds successfully.
- Executed on 2026-10-09 in the specified worktree with Bun 1.4.2: 39 tests passed, zero failures, browser required. Built 68 short links.
- Fixed-token assertions cover row/popover/available/selected surfaces in both themes and desktop/mobile, including combined disabled/broken/script/hidden rows, rest/hover/focus, native loads and root/project prefixes. Root-resolved script tag ink stays amber under disabled-row overrides while non-tag content retains neutral state precedence.
- Selection tests deliberately alter published fixed-color metadata before selection to prove the browser consumes it; app Back navigation verifies remounted catalog/row metadata and computed colors. Descriptive seed vectors, spectrum and envelope checks remain intact. Contrast sweep minimum: 4.6279:1 across 54,592 rendered tag checks (generated and fixed) and 46,080 HSL envelope surface checks.
- Mechanical UI detector ran once on `src/directory.mjs` and `src/assets/site.css`: `[]` (no findings). `git diff --check` passed. No commits, pushes or remote operations performed; implementation is ready for parent handoff.
- Parent review completed all three layers; nine small corrections addressed verification gaps, allocation and live-contract wording. Nothing deferred. Independently pinned hidden RGB values, tested every selected fixed identity, mounted theme toggles, root script-token mutation and descriptive near-match vectors. Full required-browser suite rerun after patches: 39 passed, 0 failed; format/check, build and diff check passed. Full spectrum/envelope checks cover rest/hover; state fixtures additionally cover focus.
- Integrated latest main `873218e` (Guide spacing and 404 navigation) with a clean merge. Final required-browser suite on the integrated branch: 41 passed, 0 failed; formatting/check, build (68 links) and diff check passed. Contrast minimum remains 4.6279:1.
