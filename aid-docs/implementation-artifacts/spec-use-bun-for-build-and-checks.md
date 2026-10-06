---
title: 'Use Bun for build, checks and local preview'
type: 'chore'
created: '2026-10-06'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: a4a088c29042ac66dc8160aad1745c2b92ae67a4
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The site builds and tests with Node.js 24 and npm, despite a successful Bun trial. Maintainers must still install and invoke Node for CI, deployment and local preview.

**Approach:** Make Bun the pinned build/test runtime and package manager in both workflows and local commands, while preserving the static output and existing test behaviors. Use a committed Bun lockfile for repeatable installs.

## Boundaries & Constraints

**Always:** Keep validation-before-output-replacement, link syntax and routing, generated artifacts, Bash launcher behavior, the existing PR validation job name and AGENTS.md-only skip, and Pages deployment of only `dist/`. Preserve the one-step local preview (build plus static server) including dotted directories. Run the existing regression suite before building on PRs; retain working Node rollback from git history. Bash remains needed for launcher tests. Compare output from the old and new runtime with the checked-in link map.

**Never:** Introduce a frontend framework or application server, change public link-map semantics, or merge/deploy automatically. Do not depend on Node as a hidden test/preview subprocess when CI is configured for Bun.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| PR validation | normal changed files | clean Bun install, full regression suite, then build | invalid map or failing test blocks PR |
| AGENTS-only PR | only `AGENTS.md` changes | existing named job passes without installing/building | preserved conditional behavior |
| Pages push/manual dispatch | checked-in map | clean Bun install and `dist/` build/upload | failed build prevents upload |
| Local preview | fresh clone and dependency install | `bun run dev` builds and serves home and dotted directory URLs | build failure prevents server start |
| Launcher test | stubbed downloader with Bun installed but no Node in PATH | existing argument/status/cleanup assertions still pass | nonzero status propagates |

</frozen-after-approval>

## Code Map

- `package.json`, `package-lock.json` — existing yaml range and npm lock; `dev` runs Node plus pinned npx http-server; replace with Bun scripts, Bun lockfile and pinned runtime, preserving preview route behavior.
- `build.mjs` — tiny root CLI with Node shebang; keep import-only wrapper, update shebang if needed for direct execution.
- `test/build.test.mjs` — `node:test` fixture spawns `process.execPath`; launcher test creates a Node-shebang curl stub at ~716; adapt only the stub to avoid hidden Node dependency, keep substantive assertions.
- `.github/workflows/check.yml`, `.github/workflows/deploy.yml` — Node install/npm commands; replace setup/install/test/build steps but retain conditions, job name and upload path.
- `README.md`, `PRODUCT.md`, `AGENTS.md` — current runtime/preview/verification instructions; align with real Bun commands, not historical implementation specs.
- `src/build.mjs`, `src/links.mjs`, `src/pages.mjs` — static generation and validation; preserve their behavior/bytes. `config/serve.json` is no longer the active preview server config.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `bun.lock`, `package-lock.json` — pin Bun, migrate the single yaml dependency to frozen Bun installs, change dev/test/build scripts and remove obsolete npm lock after verification.
- [x] `build.mjs`, `test/build.test.mjs` — remove Node shebang assumptions while retaining test coverage and Node-compatible source imports.
- [x] `.github/workflows/check.yml`, `.github/workflows/deploy.yml` — setup Bun, frozen install, full tests then build for PRs, build/upload on main; keep AGENTS-only skip.
- [x] `README.md`, `PRODUCT.md`, `AGENTS.md` — document installation, tests, preview, deployment and fallback appropriately.

**Acceptance Criteria:**
- Given a fresh task worktree with Bun 1.4.2 and no existing `node_modules`, when `bun ci`, `bun test ./test/build.test.mjs` and `bun build.mjs` run in order, then all regression tests pass and `dist/` matches the baseline Node build.
- Given a normal PR, when GitHub Actions runs the required `PR validation` job, then it passes with Bun and no setup-node/npm step; an AGENTS-only PR retains the skip.
- Given a push to main or manual dispatch, when the deploy job runs, then it uploads only the Bun-built `dist/` site and optional root CNAME.
- Given installed dependencies, when `bun run dev` starts, then the homepage and dotted directory paths serve their generated index pages.

## Implementation Notes

- Baseline at `a4a088c29042ac66dc8160aad1745c2b92ae67a4`: `npm ci`, Node 24 tests (17 pass) and build (26 links); saved `dist/` snapshot in `/tmp/opencode/shortlink-bun-baseline-20261006` before migrating.
- `bun.lock` migrated from the npm lock with `yaml@2.9.1` and identical integrity hash. Replaced npm lock and Node-only shebangs; Bash launcher remains unchanged. Both workflows use pinned Bun 1.4.2 and frozen `bun ci`.
- Removed `node_modules`, then ran Bun 1.4.2 `ci`, all 17 tests, build, and `diff -qr` against the Node snapshot: all passed, byte-identical outputs. A second test run with only Bun, Bash, mktemp and rm on PATH passed 17 tests (no Node executable available).
- `bun run dev -p 8187` served the homepage and `/dev.tools/` as generated index pages. The http-server CLI is invoked through `bunx --bun` so its Node shebang is overridden; Bun emits Node-style compatibility warnings but the process is Bun. Production Pages routing is unchanged.
- Review patch: the full CI/local test script allows 30 seconds per test for slower runners; README now links to Bun installation and identifies the git-revert rollback. Re-ran frozen install, full suite (17 pass), build and byte comparison successfully.

## Spec Change Log

## Review Triage Log

- `low` — Blind: `bunx` preview dependencies are not in `bun.lock`. The prior `npx http-server@14.1.1` likewise fetched an untracked preview tool; this does not affect frozen CI builds, and adding a preview-only dev dependency to production installs is disproportionate. Rejected.
- `medium` — Blind: Bun's five-second per-test default could time out subprocess-heavy input validation on a slower runner. Confirmed from Bun test runner docs and patched CI/test script to 30 seconds.
- `low` — Blind: GitHub runners have Node installed and cannot prove Bun-only operation just by replacing setup-node. Tested all 17 checks locally with a PATH containing Bun, Bash, mktemp and rm, but no Node; adding test-runner PATH construction to CI is disproportionate. Rejected.
- `low` — Blind: CI does not launch local preview. Verified the new command manually with HTTP assertions for `/` and `/dev.tools/`; adding a networked process lifecycle to the regression suite for an optional preview is disproportionate. Rejected.
- `low` — Blind: README lacked a fresh-install Bun link/version check. Added official installation link and `bun --version`.
- `medium` — Edge-case: launcher/validation tests might hit Bun's default five-second timeout. Same root cause as blind finding; patched 30-second timeout and re-ran suite.
- `low` — Edge-case: no documented rollback despite plan's fallback note. Added a README sentence to revert the migration commit as a unit.
- `low` — Verification-gap: preview dotted-directory behavior lacks an automated regression check. True of previous preview command as well; manually exercised the migrated command with asserted HTTP responses. Rejected because server startup/port/cleanup machinery outweighs this optional-preview risk.

## Verification

**Commands:**
- Baseline: `npm ci`, Node 24 test and build; snapshot `dist/` before migration — expected: existing checks pass and outputs are available for comparison.
- `bun ci && bun test ./test/build.test.mjs && bun build.mjs` — expected: clean locked install, full test pass, matching output.
- `bun test --test-name-pattern 404 ./test/build.test.mjs` — expected: focused routing check passes.
- `bun run dev` plus local HTTP requests for `/` and `/dev.tools/` — expected: index pages, not directory listings or 404.
- `git diff --check` — expected: no whitespace errors.
