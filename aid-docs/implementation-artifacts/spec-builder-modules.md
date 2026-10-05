---
title: 'Split the builder into focused modules'
type: 'refactor'
created: '2026-10-06'
status: 'done'
route: 'dispatch'
baseline_commit: 16a4a0719fa752cd0b42c461dbc6e1c22bd96061
review_loop_iteration: 2
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `build.mjs` mixes link-map loading/validation, HTML/CSS/JavaScript/Bash rendering, and filesystem publication in one long file, making the builder hard to read and maintain.

**Approach:** Extract a small set of cohesive ES modules for link-map input/validation and rendering. Leave `build.mjs` as the executable entry point that sequences validation and writes the same site. This is a structural refactor: generated files, CLI behavior, errors, source format support, and browser/launcher behavior must remain unchanged.

## Boundaries & Constraints

**Always:** Keep exactly one authoritative JSON/YAML source, current validation rules/error diagnostics, validation before output deletion, CWD-relative link sources and `dist/`, and the ordered build outputs. Keep HTML/inline-script/Bash escaping and the site's root/project-prefix routing intact. Preserve the existing public files and their bytes for the checked-in link map; continue generating `.nojekyll` and optional `CNAME` correctly. Build and tests must work with Node.js 24 when the builder is invoked by absolute path from a temporary working directory.

**Never:** Introduce new dependencies, a frontend framework, a configuration layer, speculative abstractions, a change to the link-map schema, or updates to generated files in source control. Do not alter page copy/styling or reorganize tests for appearance alone.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Checked-in YAML | Current `links.yaml`, including nested/hidden/script entries | Same generated paths and bytes as pre-refactor build | N/A |
| JSON and alternate YAML | Test fixtures run builder from temporary CWD | Existing output parity, generated navigation, launchers and 404 recovery | N/A |
| Invalid input | Missing/duplicate source, invalid YAML/schema/collisions with prior `dist/` | Same failure and diagnostics; old output survives | Nonzero exit before replacement |
| Optional domain | Root `CNAME` exists | Same copied `dist/CNAME`, `.nojekyll` and public map | N/A |

</frozen-after-approval>

## Code Map

- `build.mjs:1-117` — executable and input/validation; move source loading and `collect` traversal into `links.mjs`, with failures still reported by the CLI. Preserve traversal order and error text.
- `build.mjs:13-16,119-477` — escaping, styles, browser scripts, link/directory/guide/404 HTML and Bash templates; move into `pages.mjs`. Current main (`06be8d5`) has Show hidden links and copy/open destination interactions: keep `searchScript`, `copyScript`, `data-search`, row controls and CSS exactly, with no page or asset byte changes. Rendering captures `raw`, `links`, `source`; pass those from the entry point where needed.
- `build.mjs:478-510` — keep CNAME read, output removal/recreation, ordered writes (including `assets/copy.js`) and completion log here.
- `build.test.mjs:10-20,43-98,159-215,231-353,355-643` — absolute-path temp-CWD tests cover formats, validation, hidden browse/toggle, copy/open, search, launchers and 404. ESM imports resolve beside the builder; source/output paths stay CWD-relative. Add one focused exact multiline validation-error check for moved diagnostics.
- `AGENTS.md`, `README.md`, `PRODUCT.md` — live maintainer instructions currently say templates live in `build.mjs`; change only these pointers to `pages.mjs` (and source validation to `links.mjs` where useful). Historical planning documents remain historical.
- `package.json`, `.github/workflows/check.yml`, `.github/workflows/deploy.yml` — dependency and build entry points remain unchanged.

## Tasks & Acceptance

**Execution:**
- [ ] `links.mjs` — extract input parsing and validation without changing source selection, traversal, errors, or the resulting link data.
- [ ] `pages.mjs` — extract rendering templates and helpers, passing only required inputs rather than capturing CLI state; keep emitted bytes unchanged.
- [ ] `build.mjs` — keep a short entry point that loads validated data and writes every existing artifact (including `assets/copy.js`) in the same order.
- [ ] `build.test.mjs` — run existing regression checks and add one exact multiline validation-diagnostic check covering source, ordering and old-output preservation.
- [ ] `README.md`, `PRODUCT.md`, `AGENTS.md` — update current template ownership guidance without changing runtime behavior.

**Acceptance Criteria:**
- Given the checked-in link map and same root directory, when the new builder runs, then the sorted generated path set and raw bytes match the pre-refactor `dist/` snapshot.
- Given the existing JSON/YAML and failure fixtures, when `node --test build.test.mjs` runs under Node.js 24, then all tests pass without changing their expectations.
- Given the PR workflow or a maintainer invoking `node build.mjs`, when building from the repository root, then it produces the same success/failure behavior using the same entry point.

## Implementation Notes

Implementation handoff ends after local edits and checks. Leave the branch uncommitted and unpushed for separate review and publication steps. The branch was fast-forwarded first to `57899b0554e748276c46f483447238e31352ca26` (hidden toggle), then to `06be8d5e1a357bcf9067495c780a2a0f0847c182` (copy/open actions). The original `baseline_commit` remains in frontmatter for history; output preservation now compares against the newest pre-extraction snapshot.

## Spec Change Log

- Review found main advanced with the Show hidden links toggle after the first extraction. Updated Code Map, test coverage, and verification snapshot to the current main; reverted the old extraction before fast-forwarding the branch and re-deriving. This avoids shipping the old search/listing/guide behavior over the new toggle. KEEP the two-module split, CLI entry point, unchanged validation diagnostics, and byte-for-byte output proof.
- Review found main advanced again with copy/open destination interactions after the second extraction. Updated Code Map and tasks for new asset/markup/search/styles, exact error diagnostics, and current maintainer guidance; reverted old extraction, fast-forwarded, and captured a fresh baseline before re-deriving. This avoids silently dropping copy/Open actions or leaving stale editing instructions. KEEP the two-module split, existing hidden toggle behavior, CLI entry point, and byte-for-byte output proof.

## Review Triage Log

| Finding | Verdict | Evidence and disposition |
| --- | --- | --- |
| Blind 1: extraction based on obsolete main | high | `main` advanced from `16a4a07` to `57899b0` with the Show hidden links feature while this branch remained at the old base. A merge would conflict or drop behavior. Bad spec: refresh Code Map/baseline and re-derive on current main. |
| Blind 2: hidden rows filtered from HTML | high | `pages.mjs` copies old listing logic; current `main/build.mjs` retains hidden rows with `data-hidden` for a visitor toggle. Same obsolete-base root cause; bad spec. |
| Blind 3: hidden-only folders omitted | medium | Current main emits hidden folder markup and toggle, while old listing omits it. Same obsolete-base root cause; bad spec. |
| Blind 4: hidden-only pages cannot reveal entries | medium | Old page rendering emits only an empty message; current main emits toggle and initially hidden list. Same obsolete-base root cause; bad spec. |
| Blind 5: search lacks toggle state | high | `pages.mjs` uses old `searchScript` without current main's toggle coordination; shown/hidden queries would diverge. Same obsolete-base root cause; bad spec. |
| Blind 6: homepage count does not update | medium | Current main's count label tracks visible/total via toggle; old extraction renders a fixed count. Same obsolete-base root cause; bad spec. |
| Blind 7: guide text is stale | low | Current main documents Show hidden links; old extracted template describes permanent omission. Same obsolete-base root cause; bad spec. |
| Blind 8: tests and baseline are stale | high | Latest main adds toggle tests and changes output; the 13 passing tests and old byte snapshot cover only the previous commit. Same obsolete-base root cause; bad spec. |
| Edge 1: 404 map fetch can hang | low | Both baseline and current main use the same unbounded `fetch`; extraction leaves it unchanged. Pre-existing behavior; deferred as unrelated to modularization. |
| Edge 2: launcher download can hang | low | Both baseline and current main use the same `curl -fsSL` without timeout; extraction leaves it unchanged. Pre-existing behavior; deferred as unrelated to modularization. |
| Blind 1 (second pass): latest main advanced again | high | `origin/main` moved to `06be8d5`, adding copy/destination interactions after the refactor branch aligned to `57899b0`. Must rebaseline and re-derive to avoid lost behavior; bad spec. |
| Blind 2 (second pass): copy/open row controls absent | high | The new directory row on `origin/main` has a copy action and destination Open link; the extracted old row lacks both. Same obsolete-base root; bad spec. |
| Blind 3 (second pass): copy asset absent | high | New main emits `assets/copy.js` and page hooks; current branch does not. Same obsolete-base root; bad spec. |
| Blind 4 (second pass): search matches control text | medium | New main uses `data-search` to avoid searching action labels; old extraction uses `textContent`. Same obsolete-base root; bad spec. |
| Blind 5 (second pass): row CSS stale | medium | New main includes styles for copy and Open controls; extraction's pages omit them. Same obsolete-base root; bad spec. |
| Blind 6 (second pass): new interaction checks absent | high | `origin/main` adds tests for copy/open/search behavior and old branch's suite cannot cover them. Same obsolete-base root; bad spec. |
| Blind 7 (second pass): old byte snapshot | high | The baseline snapshot at `57899b0` predates new generated copy asset and page markup. Refresh from latest main before extracting; bad spec. |
| Blind 8 (second pass): local-only handoff conflicts with publication | false | The note governs step-03 implementation only; repo workflow requires commit/push/PR **after** checks, in the separate publication step. No omitted publication behavior. |
| Blind 9 (second pass): edit-template instructions stale | low | README and AGENTS currently direct maintainers to `build.mjs`; after extraction templates live in `pages.mjs`. Include documentation correction in re-derivation, with no generated output change; bad spec. |
| Blind 10 (second pass): exact validation diagnostics uncovered | low | Existing tests check fragments and output preservation, not full multiline stderr after moving error reporting. Add one representative exact-diagnostic case in re-derivation; bad spec. |
| Edge 1 (second pass): curl may hang | low | Carried: same unchanged pre-existing curl behavior as Edge 2 in first pass; no change to this refactor. |
| Edge 2 (second pass): 404 fetch may hang | low | Carried: same unchanged pre-existing fetch behavior as Edge 1 in first pass; no change to this refactor. |

## Verification

**Commands:**
- `npm ci` — install the existing YAML parser in the task worktree.
- `npx --yes node@24 --test build.test.mjs` — all existing regression checks pass.
- `npx --yes node@24 build.mjs` — build succeeds from repository root.
- `diff -qr /tmp/opencode/shortlink-builder-baseline-copy dist` — identical generated paths and bytes compared to the Node.js 24 build of current `main` (`06be8d5`) before re-extraction.
- `git diff --check` — no whitespace defects.
