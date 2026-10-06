---
title: 'Technical research: JavaScript runtimes for Shortlink static build'
type: technical
topic: JavaScript runtimes for Shortlink static build
decision: Which build-time JavaScript runtimes are credible alternatives to Node.js 24 for Shortlink?
source: native web research and local compatibility checks
status: complete
preset: standard (inline, no subagents)
validation: normal
created: '2026-10-06'
updated: '2026-10-06'
claims_verified: 2
claims_unverified: 3
---

# JavaScript runtimes for Shortlink static build

**Decision this research serves:** Assess Bun and Deno as replacements for Node.js 24 in build and CI.

## Executive summary

**Recommendation: keep Node.js 24 for now.** Both **Deno 2.9.7** and **Bun 1.4.2** built this repository's static site and passed all **16 existing tests** in local trials after `npm ci`; neither requires a rewrite of the build or tests to be a credible alternative. The small build has no demonstrated bottleneck to justify a second runtime or a lockfile/CI migration. Node 24 is an LTS release. [1][7]

**Best alternative: Bun** if the goal is a straightforward runtime experiment: `bun test ./test/build.test.mjs` passed, as did `bun build.mjs`. It cannot simply replace the CI command with `bun --test`: Bun's Node `--test` CLI mode is absent. **Deno** is also viable, particularly if explicit filesystem/process permissions are valuable, but it adds permission flags and a separate dependency-install workflow. [1][2][3][8]

**Caveat:** trials reused `node_modules` from `npm ci`; clean Bun/Deno installs, their lockfiles, and GitHub Actions runs were **not** verified. Documentation for Bun is undated, and the Deno compatibility/CI pages exceed this research pack's one-month freshness target; the local tests are current but not a substitute for a clean CI pilot. [1][2][3][5][6]

## Landscape and project fit

The runtime decision concerns **generation**, not serving: `build.mjs` imports `src/build.mjs`, validates one YAML/JSON map through `src/links.mjs`, and writes HTML, JS, CSS and Bash files into `dist/`. GitHub Pages hosts those static files; browser-side JavaScript is independent of the build-time runtime. The only npm dependency is `yaml`. The test file imports `node:test`, `node:vm` and `node:child_process` and spawns `process.execPath` for its build fixtures. Both GitHub workflows currently install Node 24 and run `npm ci`; the PR workflow additionally runs `node --test test/build.test.mjs`. These are **project requirements**, based on the repository at commit `21017b6`, rather than external research findings. [1]

| Candidate | Build and 16 tests in this repo | Required CI shift | Distinctive value / drawback |
| --- | --- | --- | --- |
| Node.js 24 | Baseline: pass with Node 24 | None; supported LTS | Minimum change; current tests and npm lockfile stay canonical. [1][7] |
| Bun 1.4.2 | Pass with `bun build.mjs` and `bun test ./test/build.test.mjs` | Replace setup, install and test/build commands; use `bun.lock` for `bun ci` | Compatible in this trial; `bun --test` does **not** run this suite. [1][2][4][6] |
| Deno 2.9.7 | Pass with `deno run --no-lock -A build.mjs` and `deno test --no-lock -A test/build.test.mjs` | Replace setup and install; supply I/O/process permissions; use `deno.lock` for `deno ci` | Permissions can be scoped; extra setup for existing npm dependency and subprocess-based tests. [1][3][5][8][9] |

### Compatibility observed, not assumed

On 2026-10-06, with `npm ci` already run, Node 24, Bun 1.4.2 and Deno 2.9.7 each produced **26 short links** and passed **16/16** tests; Bun's and Deno's focused 404 filter each ran one test successfully. Under Deno the test fixture's `process.execPath` pointed at Deno, so child builds exercised Deno rather than the installed Node executable. `deno run --no-config --no-lock -A build.mjs` failed to resolve the bare `yaml` import: this is not a no-dependencies project. Running `bun --test test/build.test.mjs` failed outside Bun's test runner, while `bun test ./test/build.test.mjs` passed. This matches Bun's documented partial `node:test` support and Deno's documented package.json compatibility. No output-equivalence audit or comparable timed benchmark was performed. [1][2][3][4]

## Integration and implementation reality

- **Bun migration:** install Bun in each workflow using its setup action, regenerate and commit `bun.lock` for frozen `bun ci`, and run `bun test ./test/build.test.mjs` plus `bun build.mjs`. Bun's `node:test` implementation lacks parts of Node's runner, even though this suite passed; keep the full suite as a gate. A trial can keep `npm ci` and the existing `package-lock.json` while only swapping the runtime, avoiding an immediate package-manager migration. [1][2][4][6]
- **Deno migration:** Deno supports package.json and Node built-ins. For a package.json project it normally uses a manually installed `node_modules`; the trial used `npm ci`. A complete switch would commit `deno.lock`, install via `deno ci` with `denoland/setup-deno`, and select permission flags for read/write and test subprocesses. The trial used `-A` to check compatibility, which disables Deno's permission boundary; do not claim a sandbox benefit from that trial. [1][3][5][8]
- **Neither runtime changes Pages behavior:** only `dist/` is uploaded. The output and deploy artifacts still need the existing CI build and a deployed 404 smoke check when routing changes. The tests' simulated browser APIs do not prove live Pages behavior. [1]

## Cross-dimension insight

The core build is portable **because** it uses standard ESM, `node:` modules and one pure-JS npm package; the regression suite and CI dependency handling are the actual migration surfaces. A runtime swap may be viable without changing source, but it does not eliminate package installation, Bash launcher checks or browser-side routing validation. [1][2][3][5][6]

## Recommendation and reversibility

Stay on **Node 24** unless a measured CI/runtime issue or a need for Deno's permissions motivates switching. **Bun is the lower-friction pilot** on this repository because the observed test suite works under its test command; **Deno is the runner-up** if permission scoping or Deno tooling matters more than the simpler CI path. This ranking is a repository-specific judgment based on the same local compatibility run and vendor integration guides, **not** a verified performance or security comparison. Keep a Node CI check during any pilot; compare generated `dist/`, run clean frozen installs, and verify a deployed preview before removing Node. [1][2][3][5][6][8]

## Open questions

1. Will a **clean** `bun ci` or `deno ci` install reproduce these results with the newly committed lockfile and the repository's GitHub Actions runner? This was not tested. [1][5][6]
2. Are end-to-end CI times or maintenance costs materially different? No comparable measurements were gathered.
3. Are there useful minimally scoped Deno permissions for this suite's `process.execPath` subprocesses? `-A` was used in the trial, so permission benefits remain unproven. [1][8]

## Source appendix

Accessed 2026-10-06. “Undated” means the source is a living page without a stated update date; local observations are dated by execution, not publication. Project paths in [1] are requirements context and a reproducible local trial, not independent external evidence.

| Ref | Supports | Publisher / source | Published or updated | Accessed | Confidence |
| --- | --- | --- | --- | --- | --- |
| [1] | Project fit and commands/results at `21017b6` | [Local trial digest](digests/runtime-r1-1.md), Shortlink repository | Observed 2026-10-06 | 2026-10-06 | High for this environment |
| [2] | Bun Node API and `node:test` limitations | [Bun compatibility](https://bun.com/docs/runtime/nodejs-compat), Bun | Undated living page | 2026-10-06 | Medium; trial corroborates relevant subset |
| [3] | Deno Node/npm compatibility and manual `node_modules` mode | [Node and npm compatibility](https://docs.deno.com/runtime/fundamentals/node/), Deno | 2026-07-30 | 2026-10-06 | Medium; trial corroborates relevant subset |
| [4] | `bun test` `.test.mjs` discovery, filtering, CI | [Bun test runner](https://bun.com/docs/test), Bun | Undated living page | 2026-10-06 | Medium; trial corroborates relevant subset |
| [5] | `deno ci` lockfile and CI setup | [Deno CI reference](https://docs.deno.com/runtime/reference/cli/ci/) and [CI guide](https://docs.deno.com/runtime/reference/continuous_integration/), Deno | 2026-05-20 / 2026-06-14 | 2026-10-06 | Medium; not piloted in CI |
| [6] | `bun.lock`, `bun ci`, setup action | [Bun install guide](https://bun.com/docs/pm/cli/install) and [setup-bun](https://github.com/oven-sh/setup-bun), Bun/oven-sh | Undated living pages | 2026-10-06 | Medium; not piloted in CI |
| [7] | Node 24 LTS status | [Node.js releases](https://nodejs.org/en/about/previous-releases), Node.js/OpenJS Foundation | Living schedule; 24 last updated 2026-09-07 | 2026-10-06 | Medium; single publisher |
| [8] | Deno permissions and `-A` | [Security and permissions](https://docs.deno.com/runtime/fundamentals/security/), Deno | 2026-06-17 | 2026-10-06 | Medium; permission boundary not tested |
| [9] | Deno test runner and name filtering | [deno test](https://docs.deno.com/runtime/reference/cli/test/), Deno | 2026-07-06 | 2026-10-06 | Medium; trial corroborates filtering |

## Staleness map

Computed from [`claims.json`](claims.json) using the technical pack's **one-month compatibility** window, a one-month conservative window for integration commands, and a six-month lifecycle window. Deno's CI guidance (2026-06-14) reached its recheck date **2026-07-14**, and its Node API compatibility list (2026-07-30) reached **2026-08-30**; both were already due when accessed, though the relevant compatibility paths passed the 2026-10-06 local trial. Local compatibility results should be rerun by **2026-11-06**; the Node release schedule by **2027-03-07**. Bun's undated living pages have no computable publication-based recheck date: revisit them before any adoption decision. A decision report older than two quarters needs a fresh run. [1][2][3][5][7]
