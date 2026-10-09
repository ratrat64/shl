# Developing shl

[README](../README.md) · [Reference](reference.md)

## Local commands

Use [Bun 1.4.2](https://bun.com/docs/installation), matching CI. Confirm with
`bun --version`. Run all commands from the repository root; build paths are
relative to the working directory. Tests also require Bash.

```bash
bun ci
bun run dev
```

The pinned `http-server` serves the generated `dist/`, usually at
`http://localhost:8080/`, including dotted folders such as `/dev.tools/`. Restart
the command after edits to rebuild.

| Command | Purpose |
| --- | --- |
| `bun build.mjs` | Validate the link map and recreate `dist/`. |
| `bun run test` | Run regression checks with a 30-second per-test timeout. |
| `bun run format` | Apply pinned Prettier formatting. |
| `bun run format:check` | Check formatting without writing. |

Formatting covers application build/source/test files, workflows, package metadata,
and root link maps. Generated output, vendor files, and planning documents are
excluded. Both CI workflows format with `--write` before tests/build. No lint or
typecheck suite is configured.

## Pull request checks and deployment

Every pull request targeting `main` runs **Check pull request** on Ubuntu with Bun
1.4.2. The **PR validation** job runs `bun ci`, `bun run format`,
`bun test --timeout 30000 ./test/build.test.mjs`, then `bun build.mjs`. New commits
rerun checks and cancel older runs for the same PR. Checks have read-only repository
permissions and do not deploy. An `AGENTS.md`-only PR succeeds without running Bun
tests or a build; mixed changes still run both.

For your own repository, create an active branch ruleset in **Settings → Rules →
Rulesets**, targeting `main`. Require a pull request, the GitHub Actions **PR
validation** check, and an up-to-date branch before merging. Run an initial PR if
the check is not yet available in the picker. The baseline does not require an
approving review; add one if your team needs it.

Merges to `main` trigger **Deploy shl**, which installs dependencies, formats,
validates the link map during the build, and uploads only `dist/` to GitHub Pages.
It also supports manual dispatch. Deployment does not rerun regression or browser
tests; those run in PR validation. A root `CNAME`, if present, is copied to the output.

## Source ownership

A successful build deletes and recreates `dist/`. Edit sources, not generated files:

| Source | Responsibility |
| --- | --- |
| `build.mjs` | Entry point forwarding to the builder. |
| `src/build.mjs` | Validate input and generate site output and native assets. |
| `src/links.mjs` | Input validation, leaf interpretation, directory tree, and counts. |
| `src/pages.mjs` | Guide, redirect/disabled pages, legacy forwarding, 404, and Bash launchers. |
| `src/layout.mjs` | Shared document foundations and shell. |
| `src/directory.mjs` | Homepage and nested directory components. |
| `src/assets/site.css` | Shared styles, controls, and design tokens. |
| `src/assets/*.js` | Native browser behavior, navigation, and content lifecycle. |
| `src/styles.mjs`, `src/browser.mjs` | Module-relative loading of styles/theme for embedded documents. |
| `test/build.test.mjs` | Validation, generated behavior, launcher, and rendered regression checks. |

Keep shared UI ownership and styling consistent with
[architecture AD-7–AD-9](../aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md).
Reuse existing helpers and components; keep unique content inside `<main>`.
HTML templates remain in `.mjs`; `/* HTML */` comments enable embedded formatting.
Preserve escaping and whitespace-sensitive code samples.

Links, folders, Guide, and 404 use the full shared shell. Destination/legacy
redirects and disabled explanations use the minimal document without chrome.
404 and minimal documents embed the shared CSS and theme script so nested or
unknown paths cannot break those foundations.

## Verification

Tests build in temporary directories, execute generated scripts with simulated
browser APIs, and run Bash launchers with a stubbed downloader and harmless payloads.
For focused routing checks:

```bash
bun test --test-name-pattern="404" ./test/build.test.mjs
```

With Chrome installed, rendered checks compare Links, folders, Guide, and 404 at
390px and 1440px in light/dark themes, under root and project prefixes. They cover
direct loads, script-disabled native documents, shell-preserving transitions, and
tag disclosures. CI requires these checks; skipping Chrome is not visual proof.
Use the same required-browser mode locally:

```bash
SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs
```

Set `CHROME_BIN` if the browser executable is not named `google-chrome`.

### Deployed routing smoke test

After deployment, open a known code, a wrong-case code with and without a trailing
slash, and an unknown code in a browser. Repeat under a project prefix when changing
routing. Local preview servers may serve 404 pages differently from GitHub Pages.

### Navigation smoke test

1. Run `bun run dev` and open `/guide/#about` directly. In the browser console, save
   `window.savedHeader = document.querySelector('header')`.
2. Change Theme, then navigate through Links, folders, breadcrumbs, and footer Guide.
   Confirm `savedHeader === document.querySelector('header')`, theme, page title,
   active navigation, and keyboard focus after each transition.
3. Select the current navigation link and Guide section links, then use Back/Forward.
   Content, fragments, and saved scroll should match, with instant history restoration.
4. Check search, Show tags, tag selection/removal, and both URL copy actions after returning from Guide.
   Each interaction should run once; controls reset after leaving and returning.
5. Repeat with JavaScript disabled for native links, and on a deployed project-prefix
   URL such as `/<repo>/guide/#about`.
