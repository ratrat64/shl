# Independent modular architecture evidence review

**Verdict: PASS WITH EVIDENCE QUALIFICATIONS.** The adopted technologies exist, the runtime/library pins match repository and upstream evidence, and AD-1–AD-9 are supported by the current modular working tree. No new stack selection, unsupported latest-release claim, or current-working-tree implementation contradiction was found. Two qualifications concern reproducible provenance and enforcement of rendered verification; neither is evidence that the current implementation fails.

## Scope and method

- Reviewed on 2026-10-07 in `/home/rat/Git/shl/shl-modular-ui`.
- Target: `aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md`, including every ADOPTED decision, diagrams, stack, structural seed, and deferred claims.
- Checked current files against `package.json`, `bun.lock`, both workflows, all production modules, relevant tests, README, PRODUCT, DESIGN, EXPERIENCE, modular spec, PRD, and architecture/PRD memory logs. Compared the cited baseline with `git show HEAD` for layout, pages, and styles.
- The review surface includes staged, uncommitted modular changes. HEAD is `053844fe08b546f6a4690c029d19b09d00a92822`; it is not a commit containing the entire reviewed surface.
- Used direct repository inspection, upstream registry/API/documentation requests, and an independent regression run. No agents were spawned. Findings use an evidence/verification-gap lens; this is not a greenfield technology evaluation or a general code review.
- The customization resolver path was absent in this worktree; shipped review defaults were inspected. The user's requested Markdown evidence report controls output and scope.

Paths below are repository-relative unless explicitly identified as upstream URLs. Spine line numbers refer to the reviewed file.

## Findings

### E1 — The cited revision does not identify the complete reviewed implementation

- **Location:** Spine `:40,80–96,146–155,170`; architecture `.memlog.md:26–27`.
- **Trigger condition:** An auditor checks out the sole cited revision to reproduce the document's existing-system evidence. Runtime and older contracts match, but the modular amendment does not exist at that revision.
- **Evidence:** `git rev-parse HEAD` returned `053844fe08b546f6a4690c029d19b09d00a92822`; `git status --short` showed staged changes to the spine, modular spec, source, and tests. At HEAD, `src/layout.mjs` has no `documentPage` foundation; `src/pages.mjs` separately renders redirect/legacy/404 wrappers and the 404 lacks shell/theme foundations; `src/styles.mjs` uses `.directory-page` to remove borders only on directory pages. Current staged code implements the amended contracts at `src/layout.mjs:23–38`, `src/pages.mjs:14–19,49–98`, and `src/styles.mjs:18–31,88–91`.
- **Guard / missing evidence:** Identify the SHA explicitly as the pre-amendment baseline, distinguish baseline verification from staged implementation verification, and record the final implementation revision when available. Until then, cite the modular spec's handoff evidence as working-tree evidence rather than committed-snapshot evidence.
- **Potential consequence:** A reproducibility audit can incorrectly conclude that AD-7–AD-9 were already implemented and verified at the named commit, or reject valid staged changes because the pinned snapshot disagrees.
- **Qualification:** Spine `:40` already says AD-7–AD-9 bind the approved change, and the spec records an in-progress baseline and handoff. This is an ambiguity in evidence attribution, not an invented approval or a failure of the current modular code.

### E2 — A passing regression command is not necessarily proof of the rendered gate

- **Location:** Spine AD-9 `:92–96`, verification sources `:155`, and Structural Seed `:170`.
- **Trigger condition:** The normal regression command runs where `google-chrome`/`CHROME_BIN` is unavailable. Both browser checks skip and the suite can succeed without computed-style verification.
- **Evidence:** `test/build.test.mjs:783–785` and `:1153–1155` explicitly call `t.skip` when the browser probe fails. The shared-shell test otherwise compares actual geometry/styles across pages, themes, widths, prefixes, native loads, and app transitions (`:1158–1258`). `.github/workflows/check.yml:33–45` installs Bun/dependencies and runs tests/build, but has no explicit Chrome installation or required-browser assertion. This does not establish that today's hosted runner lacks Chrome; it establishes that repository configuration does not itself require execution of that gate. README `:214–219` correctly warns that a skip is not rendered verification.
- **Guard / missing evidence:** Keep a required, recorded browser execution for work governed by AD-9, either through the existing local handoff process or an explicit required-browser CI path. Evidence should name the browser and record that the two checks ran rather than equate a generic green test result with rendered proof.
- **Potential consequence:** A future shared-chrome regression could pass the normal command on a browserless environment while being presented as satisfying the architecture's rendered-consistency requirement.
- **Qualification:** This independent run executed both checks: 23 passed, zero failed, no skips, using Chrome 154.0.8037.97. Current handoff proof is present. AD-9 does not explicitly require all rendered checks to be CI-enforced; the finding limits what a generic CI/test pass proves.

## Adopted-decision reality-check matrix

| Decision | Repository evidence | Assessment |
| --- | --- | --- |
| AD-1 — Static operation/state | `src/build.mjs:28–55`; `src/browser.mjs:1–14,16–86`; `package.json:10–12`; PRODUCT `:19–30`; PRD `:78–91` | Static artifacts, page-local search, browser-local theme, no frontend framework/backend/database. Repository writer approach is product-approved, not an implemented editing client. Dependency restraint is a policy, not an invented runtime capability. |
| AD-2 — Single contract | `src/links.mjs:7–28,51–142`; `src/build.mjs:53`; `src/directory.mjs:29–39`; `src/browser.mjs:30–84`; format/hidden/tag tests at `test/build.test.mjs:47–104,539–598,833–1050` | Single JSON/YAML source, url-based leaves, nonempty nested objects, empty root, optional field validation, public raw map, hidden listing pool, and tags match. Rendering trims tags through shared interpretation while public JSON preserves configured values; the spine does not promise byte-identical rendering of whitespace. |
| AD-3 — Namespace/routing | `src/links.mjs:4–5,30–48,97–134`; `src/build.mjs:37–46`; `src/layout.mjs:15–26`; `src/pages.mjs:14–19,59–98`; routing tests `test/build.test.mjs:1360–1433` | Namespace list/regex match. Case-preserving static paths, relative navigation, browser redirects, full-path case-insensitive lookup, canonical directories, and separate launcher resources are implemented. Pages serving 404 is externally supported; actual deployed behavior remains a separate smoke-test boundary. |
| AD-4 — Validation/encoding/launcher | `src/build.mjs:14–29`; `src/layout.mjs:4–8`; `src/pages.mjs:4–19`; tests `test/build.test.mjs:1093–1104,1261–1359` | Validation completes before deletion. HTML/script/Bash boundaries use distinct encoding. Bash downloads to a temporary file before execution, forwards arguments/status, and removes the file on exit. No atomic-write, reachability, or destination-correctness guarantee is overstated. |
| AD-5 — Progressive browsing | `src/directory.mjs:4–50`; `src/browser.mjs:16–120`; `src/pages.mjs:24–50`; `src/styles.mjs:14–16,46–80`; tests covering directory/search/copy/tags/hidden states | Native links/details and button/popover disclosures exist. Search includes nested names, codes, destination, title, and tags; hidden pool/count behavior and ancestor expansion match. Download is the text cue. Legacy Guide forwarding remains. No audited accessibility or universal browser-support claim is made. |
| AD-6 — Checks/publication | `.github/workflows/check.yml:3–45`; `.github/workflows/deploy.yml:3–43`; `build.mjs:1–2`; `src/build.mjs:12–55` | PR install/test/build with AGENTS-only shortcut; main/manual build-only deployment; dist-only artifact including hidden files; `.nojekyll` and optional CNAME. Runtime and working-directory claims match. Required rulesets, HTTPS, staging, and live deployment behavior are appropriately external/unasserted. |
| AD-7 — Composition/data owners | Imports and renderers in `src/layout.mjs`, `src/directory.mjs`, `src/pages.mjs`; `src/links.mjs:7–28`; `src/build.mjs:6–10,37–52`; foundation test `test/build.test.mjs:1106–1150` | Current tree has one document/shell owner, one shared forwarding renderer, responsibility-local row/group/tool renderers, and shared field/tree interpretation. Recovery embeds the same helper definitions rather than inventing a separate schema. ES modules and string renderers are existing repository technology. See E1 for baseline versus staged evidence. |
| AD-8 — Styles/variants | `src/styles.mjs:1–7,18–31,73,82–93`; DESIGN `:71,79–85`; EXPERIENCE `:35–36`; AGENTS `:44–49`; browser test `test/build.test.mjs:1153–1258` | Tokens/action declarations have shared owners. No remaining directory/body selector changes chrome. Borderless shell and local Guide separators agree across instructions and current code; browser comparisons pass. Purpose/state variants do not fork shared chrome by page identity. |
| AD-9 — Lifecycle/rendered proof | `src/browser.mjs:1–14,88–201`; `src/layout.mjs:23–38`; `src/pages.mjs:59–98`; navigation tests `test/build.test.mjs:183–537`; foundations/rendered/recovery tests `:1106–1258,1360–1433` | Theme uses dedicated hook and guarded storage, including no-control documents. Navigation preserves shell, disposes outgoing copy behavior, replaces main, updates active navigation, and mounts once. Recovery embeds foundations and rebases shell only after readable-map discovery. Native/offline fallbacks and first-readable-map boundary are tested. See E2 for optional-browser gate qualification. |

## Runtime, library, tool, and hosted-service checks

These are observed existing technologies, not recommendations to replace or expand the stack. Upstream checks were made during this review on 2026-10-07.

| Technology | Pin / source of truth | Independent existence and fit check |
| --- | --- | --- |
| Bun | `package.json:4` and both workflows select 1.4.2 | Local `bun --version` returned 1.4.2; install/test banners identified revision `744846f84`. Upstream `GET repos/oven-sh/bun/git/ref/tags/bun-v1.4.2` resolves to `744846f844374847c902b5e7fd59b4342a51ef99`. Actual `bun ci` and the regression run establish compatibility for the repository's filesystem, URL, YAML, VM, process, and test APIs. |
| yaml | `package.json:11` declares `^2.8.1`; `bun.lock:13` resolves 2.9.1 | `https://registry.npmjs.org/yaml/2.9.1` returns version 2.9.1, matching lockfile integrity, package exports, and Node engine `>=14.6`. Bun compatibility is demonstrated by actual JSON/YAML build tests, not inferred solely from the Node engine field. |
| http-server | `package.json:8` invokes `bunx --bun http-server@14.1.1` | `https://registry.npmjs.org/http-server/14.1.1` confirms that exact CLI exists, serves static files, and declares Node `>=12`. This optional preview tool is not in `bun.lock`; its top-level version is command-pinned, not a lockfile-pinned production dependency. It is omitted from the spine's two-row Stack table, so that table should be read as build/test runtime and build-library inventory, not a complete tooling inventory. This review did not launch the preview command. |
| ES modules and generated HTML/CSS/JS | `build.mjs` forwards to `src/build.mjs`; source modules use ordinary imports, functions, and string templates | No generated frontend package loader/framework runtime exists. Browser features include native details/popover, CSS feature-tested anchor placement, Clipboard API with failure feedback, and native navigation fallback. Chrome tests establish observed browser fit, not universal support. |
| Browser verification | Tests use `CHROME_BIN` or `google-chrome`; no browser version pin | Local Chrome 154.0.8037.97 executed both browser checks. Version is an observed reviewer environment fact, not a repository runtime pin. See E2. |
| Bash/curl/mktemp/rm | `src/pages.mjs:6–12`; README `:146–149` | Launcher tests execute Bash with harmless payloads/stubbed curl and check completed download, quoting, arguments, status, and cleanup. Local Bash is 5.3.9 and curl is 8.18.0. The spine correctly names prerequisites without pretending exact launcher-host versions are pinned. Real remote script correctness is not checked. |
| GitHub Pages | Workflows build/upload/deploy static output | Current official [Pages hosting/site-types documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) confirms static HTML/CSS/JS and root/project URLs; [custom 404 documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site) confirms `404.html` support. This ratifies the existing provider, not a new platform choice. |
| GitHub Actions | Workflow references listed below | Every referenced action tag resolves upstream. Build/test orchestration and Pages artifacts fit the actual workflow. Hosted services have no application-semver pin; individual actions do have repository-owned refs. |
| External GitHub repository API | PRD `:24,76,109`; spine Deferred `:176` | Current [repository contents API documentation](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents) confirms create/update/delete, branch selection, and update SHA. Credentials/concurrency/client implementation are explicitly deferred. No live writer was claimed or demonstrated. |

Action ref existence was checked with `gh api repos/<owner>/<repo>/git/ref/tags/<ref>`:

| Existing workflow reference | Resolved upstream commit |
| --- | --- |
| `actions/checkout@v7.0.1` | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `oven-sh/setup-bun@v2` | `0c5077e51419868618aeaa5fe8019c62421857d6` |
| `actions/configure-pages@v6.0.0` | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| `actions/upload-pages-artifact@v5.0.0` | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| `actions/deploy-pages@v5.0.1` | `368f82528645a54fb793d4d04e342629a3f51346` |

These are observed tag resolutions, not assertions that workflows pin those commit hashes. `setup-bun@v2` is a moving major ref. Upstream action metadata for checkout and setup-bun uses the Actions `node24` runtime; that is distinct from the application's Bun build/test runtime and does not invalidate the spine's Bun pin.

## Source/path/version reconciliation

- All files named in the spine's frontmatter sources were inspected and exist. Structural Seed filenames agree with current imports and responsibility ownership. `src/build.mjs`, `package.json`, and `bun.lock` are additionally identified or discussed in the body even though not all appear in frontmatter.
- The approved PRD is a historical `565f20c` snapshot and still says hidden entries are absent/excluded (`prd.md:62,91`). Architecture memory `:26–27`, current PRODUCT/README/code, and the modular spec explicitly establish newer hidden/tags behavior and amend AD-2/AD-5. This is known temporal source drift, not a missing implementation or a greenfield requirement inferred from training data.
- The old `reviews/review-evidence.md` is dated 2026-10-04 and cites the former single-file/Node/package-lock layout. It cannot independently prove the modular update. The newer architecture memory and this review cover Bun/src reality. Historical references are not treated as live pins.
- Architecture memory retains historical Node 24.21.0/LTS evidence and future-hidden wording in older chronological entries. Those are superseded by its `:26–27` update, not current stack assertions. Its frontmatter snapshot still says `7b2e8d9`; use the dated entries rather than that stale header to interpret current provenance.
- The spine explicitly disclaims latest-release claims (`:146`). No present decision rests on a training-data-only technology assertion. Latest-LTS claims in historical logs were not revalidated and are not needed to ratify the present Bun stack.
- Hundreds of links, API writers, atomic write recovery, staging/provider changes, and service levels remain expectations or deferred work with stated revisit conditions. No performance/availability evidence is invented. Dependency diagrams match the static publication boundary and acyclic renderer/helper/foundation imports; they do not assert deployed infrastructure beyond the existing workflows.

## Independent execution and verification boundary

Executed in the specified worktree:

```text
bun --version                                  -> 1.4.2
bun ci                                         -> succeeded, no install changes
bun test --timeout 30000 ./test/build.test.mjs   -> 23 pass, 0 fail, no skips
google-chrome --version                        -> 154.0.8037.97
git diff --check                               -> clean
git diff --cached --check                      -> clean
```

The test suite builds fixtures in temporary directories and exercises generated assets. Both real Chrome tests executed; this is independent current-working-tree evidence, not merely repetition of the handoff's reported pass. A production-root `bun build.mjs` run was not needed to establish the fixture-tested architecture and would replace generated `dist/`; the earlier 26-link build is recorded in the spec, not claimed as independently rerun here.

No deployed Pages smoke test, production workflow execution, ruleset inspection, external writer execution, large-library benchmark, or exhaustive browser compatibility audit was performed. The spine already excludes or separately requires those proofs. Source/spine/memory files were not edited; this review report is the only authored artifact.

## Closure assessment — 2026-10-07

**Verdict: PASS. E1 and E2 are closed for the current task working tree.** The preceding findings and execution record remain historical evidence.

- **E1 closed:** Spine `:40–42` explicitly distinguishes baseline `053844fe08b546f6a4690c029d19b09d00a92822` from the working-tree implementation of AD-7–AD-9. The current verification is not attributed to that baseline; a final implementation revision remains to be recorded when available.
- **E2 closed:** AD-6 `:81` requires browser execution in CI, and AD-9 `:104` requires recorded successful rendered evidence, rejecting skips. `.github/workflows/check.yml:40–44` sets `SHL_REQUIRE_BROWSER=1`; `availableChrome` at `test/build.test.mjs:12–17`, used by both browser checks (`:829,1201`), asserts failure rather than skipping when Chrome is absent in required mode. The rendered matrix still observes computed styles/geometry across shell pages, themes, widths, prefixes, native loads, and applicable app transitions.
- **Independent closure execution:** `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` returned **24 pass, 0 fail, no skips**, with Chrome **154.0.8037.97**. The spec's final verification (`:117–123`) records the **26-link build** and **zero architecture-linter findings**; those two results were inspected, not independently rerun for this closure.
- Named tooling is unchanged; the prior technology checks remain applicable. No verification gaps found. No remaining E1/E2 issue; deployed Pages smoke testing remains the existing operational boundary, not a claim of this closure.

This follow-up is limited to the two evidence qualifications; only this report was appended.
