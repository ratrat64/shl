# Evidence review — Architecture Spine

**Verdict: PASS.** Reviewed 2026-10-04 as a brownfield current-state snapshot; no actionable evidence gaps found within this lens.

## Adopted decision reality checks

| Decision | Evidence checked | Result |
| --- | --- | --- |
| AD-1 | `PRODUCT.md:15–30`; `build.mjs:225–278,280–354,421–446`; PRD §§4,5,6 | Static artifacts and browser-local state are implemented; no-framework/dependency restraint is an explicit product constraint. |
| AD-2 | `build.mjs:20–114,293–310,444`; `build.test.mjs:43–116,118–155,320–351` | Single source, equivalent format semantics, empty root, nested directories, validation, and public map are source-backed. |
| AD-3 | `build.mjs:10–11,53–108,131–154,293–331,358–410`; `build.test.mjs:98–155,320–395` | Namespace, relative routing, HTML redirects, case recovery, and separate launcher resources match the implementation. |
| AD-4 | `build.mjs:110–129,414–446`; `build.test.mjs:25–41,66–96,256–351` | Validation precedes deletion; escaping, completed downloads, arguments/status, and cleanup have concrete implementation and regression checks. Atomic write recovery is correctly excluded. |
| AD-5 | `build.mjs:156–356`; `build.test.mjs:98–254`; `DESIGN.md:38–86` | Native disclosures, sorting, subtree search, status text, theme storage guards, accessible destination text, and legacy guide forwards are reality-checked. |
| AD-6 | `.github/workflows/check.yml:3–45`; `.github/workflows/deploy.yml:3–43`; `build.mjs:421–446`; `README.md:159–165` | PR tests/build and exception, build-only deployment, dist-only upload, hidden files, CNAME, and smoke-test boundary match current files. |

## Current technology and external checks

- [Node release page](https://nodejs.org/en/about/previous-releases) fetched: v24 is LTS; footer identifies v24.21.0 as latest LTS. Both workflows select major 24, not that exact patch.
- [yaml 2.9.1 registry metadata](https://registry.npmjs.org/yaml/2.9.1) fetched: package exists, requires Node >=14.6, and integrity matches `package-lock.json:12–20`. `package.json:4–6` declares `^2.8.1`; Node 24 fits.
- [Pages hosting documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) fetched: static HTML/CSS/JS hosting, root/project URLs, and custom domains fit this architecture.
- [Pages custom 404 documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site) fetched: custom `404.html` is supported; application-specific lookup is established by source/tests, not assumed from hosting documentation.
- [Repository contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents) fetched: file create/update/delete and branch selection exist. Deferred external writers are technically plausible and explicitly not an implemented client.
- Hosted Pages/Actions need no service-version pins. Workflow action references remain code-owned seed. Greenfield technology defaults are inapplicable to this adopted-system snapshot.

## Actionable gaps and verification boundary

- None. No adopted decision depends solely on an unsupported training-data assertion.
- This review inspected source and test definitions; it did not execute tests or establish deployed Pages behavior. The spine already requires deployed browser smoke tests for routing changes and makes no measured scale/availability claim.
