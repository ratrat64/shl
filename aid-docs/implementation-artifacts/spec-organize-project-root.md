---
title: 'Organize the project root'
type: 'refactor'
created: '2026-10-06'
status: 'done'
route: 'dispatch'
baseline_commit: '591ce8aee10b9ddbb476d5e89a5c312137103864'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The project root mixes the builder implementation, tests, preview configuration, source data, documentation, and two unused scratch snippets. Finding the files that actually build and test the site is harder than necessary.

**Approach:** Group implementation in `src/`, regression tests in `test/`, and preview configuration in `config/`; keep a root build entry point and the root link-map contract so the existing commands and hosted site remain compatible. Remove the two unused scratch snippets.

## Boundaries & Constraints

**Always:** Keep `node build.mjs` run from the repository root as the public CLI; preserve its existing output, errors, source selection (`links.json`/`links.yaml`/`links.yml`), optional root `CNAME`, `dist/` content, and test behavior. Preserve the current root `README.md`, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, package manifests, and link map as established project entry points.

**Never:** Change link semantics, generated URLs/pages, launcher behavior, or deploy artifact contents; do not modify historical planning records just to rewrite old paths.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Build | Valid root link map and optional `CNAME` | Existing `node build.mjs` emits byte-identical `dist/` | Existing CLI output and diagnostics |
| Validation | Missing, conflicting, or invalid root map; existing `dist/` | Existing test fixtures still fail without deleting prior output | Same exit code and diagnostics |
| Preview | Generated `dist/` and moved server config | Preview command uses `config/serve.json` with `cleanUrls: false` | Same local routing for dotted paths |

</frozen-after-approval>

## Code Map

- `build.mjs` -- current CLI and site writer; uses CWD-relative map/CNAME/dist and imports `./links.mjs` and `./pages.mjs`. Keep this path as a tiny forwarding entry point; move existing body to `src/build.mjs` and adjust only its module imports.
- `links.mjs`, `pages.mjs` -- source loading/validation and rendering; relocate together under `src/` with no logic edits.
- `build.test.mjs:10-20` -- temp-CWD runner resolves the builder relative to its own file; moving it to `test/` needs `../build.mjs`. Other fixtures stay CWD-relative.
- `.github/workflows/check.yml` -- update test command; retain root build command. `.github/workflows/deploy.yml` -- root build command stays as is.
- `serve.json`, `README.md:156-181`, `AGENTS.md:22-26`, `PRODUCT.md:33-38` -- update current preview/test/build-path guidance; old planning notes are dated evidence.
- `esc_func.mjs`, `test_esc.mjs` -- tracked in the builder split commit, never imported or referenced; the latter is syntactically invalid. Remove as unused scratch material.
- `links.yaml`, `package.json`, `DESIGN.md`, `dist/` -- preserve authoritative input, package root, design entry point, and generated output.

## Tasks & Acceptance

**Execution:**
- [x] `src/build.mjs`, `src/links.mjs`, `src/pages.mjs`, `build.mjs` -- move builder implementation together and preserve the root CLI through a forwarding entry point.
- [x] `test/build.test.mjs`, `.github/workflows/check.yml` -- relocate test suite and update its builder path and CI invocation.
- [x] `config/serve.json`, `README.md`, `AGENTS.md`, `PRODUCT.md` -- relocate preview config and correct active maintainer instructions and ownership references.
- [x] `esc_func.mjs`, `test_esc.mjs` -- remove unreferenced scratch snippets without affecting runtime/tests.

## Implementation Notes

- Kept the root build command as a two-line forwarding entry point; moved the CWD-relative builder unchanged to `src/build.mjs` alongside its imports. The regression suite resolves the root entry point from `test/`.
- Preview configuration and current documentation/CI paths follow the new layout. The builder-only scratch files were unreferenced and removed.
- After `main` added tags and script-download row changes, merged it into this refactor and verified that both branches generate the same site and pass all 16 regression checks.

## Spec Change Log

## Review Triage Log

- Blind 1: `false` — a baseline-versus-new `dist/` comparison found identical file names and bytes; the verification command below records that proof.
- Blind 2: `false` — input validation and caught diagnostics moved intact, and regression tests still exercise failure codes; internal uncaught stack file paths are not a supported CLI contract.
- Blind 3: `low` — the preview command was exercised on `/dev.tools/` and `/dev.tools/index.html`; adding an automated server dependency solely to test this optional preview is not justified.
- Blind 4: `false` — no repository code imports `links.mjs` or `pages.mjs` by root path outside the moved builder; these paths are internal modules, not a supported external API.
- Blind 5: `low` — README lacked a current ownership pointer for validation and output generation; added both next to the template guidance.
- Verification gap 1: `low` — no automated preview test exists; manual smoke check found the moved configuration serves both URLs identically to the baseline. The pre-existing dotted-directory listing behavior is recorded separately.

## Verification

**Commands:**
- `npx --yes node@24 --test test/build.test.mjs` -- expected: 16 regression checks pass after merging the tags feature.
- `npx --yes node@24 build.mjs` -- expected: build succeeds from root with unchanged generated artifact bytes.
- `git diff --check` -- expected: no whitespace errors.

**Manual checks:**
- Run the documented `serve` command and request `/dev.tools/` and `/dev.tools/index.html` to confirm the moved config retains baseline preview behavior.

**Observed:** `diff -rq` found no differences between the pre-move and refactored `dist/` trees (49 files).
