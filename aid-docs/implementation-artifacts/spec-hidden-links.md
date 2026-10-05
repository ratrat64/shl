---
title: 'Hide links from the web directory'
type: 'feature'
created: '2026-10-05'
status: 'done'
route: 'dispatch'
baseline_commit: fa396c7b1d52442f05ac8533ec977d2b51996776
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Automation-oriented or otherwise unlisted short links clutter the public web directory, but their URLs still need to work.

**Approach:** Accept an optional boolean `hidden` on a link object. `hidden: true` removes that link from human-facing directory listings, counts, and search (including nested pages); it remains a usable redirect and optional script launcher. Missing or `false` leaves existing behavior intact.

## Boundaries & Constraints

**Always:** Keep hidden entries in the published `links.json`, direct redirect pages, optional `.sh` launchers, and wrong-case browser recovery. Hide directory listings that have no visible descendants; preserve direct access to their directory URLs. Counts reflect visible links only. Reject non-boolean `hidden` before removing existing output. Document that hiding is discoverability control, not secrecy.

**Never:** Add authentication, private storage, an editing UI, or a separate link map. Do not suppress generated resources or relax name/collision validation for hidden entries. Do not rewrite the existing current-state PRD/architecture/epics as if they had originally specified this enhancement.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Hidden link | `{url, hidden: true, script: true}` | Absent from web lists/search and counts; present in redirect, launcher, public map and 404 recovery | N/A |
| Visible/default link | URL string or `{url, hidden: false}` | Listed, searchable and counted as before | N/A |
| Nested hidden-only group | Directory with only hidden descendants | No empty folder in parent listings; direct folder URL still opens without exposing link names | N/A |
| All links hidden | No visible links on homepage or a directory page | Clear empty-state message rather than misleading first-entry guidance | N/A |
| Invalid flag | `hidden: null`, `"true"`, number, array, or object | Build fails before replacing previous output | Actionable validation error |

</frozen-after-approval>

## Code Map

- `build.mjs:53-114` — `collect()` validates link objects before deleting output; mirror the boolean `script` check for `hidden`, retain all links for resource generation.
- `build.mjs:293-331` — `listing()` renders both homepage and directory pages; filter hidden leaves and prune empty visible subtrees here. `indexPage()` uses `links.length` for its count and distinguishes an empty source from an all-hidden source.
- `build.mjs:240-278,358-445` — search uses rendered rows; 404 reads unfiltered public `links.json`; redirects, launchers, and directory pages are generated from all validated entries. Keep these consumers working.
- `build.mjs:333-354` — generated guide should explain optional `hidden: true` and its public-map limitation.
- `build.test.mjs:12-20,98-155,170-230,320-395` — fixture-based validation, nested listings/search, and root/project-prefix 404 checks to extend.
- `README.md:30-86,167-190` — update input syntax, examples, public visibility, and output description; `PRODUCT.md:25-29` describes current product capabilities.

## Tasks & Acceptance

**Execution:**
- [x] `build.mjs` — validate optional `hidden`, render only visible descendants in directory listings, count visible links, and provide honest empty states while preserving generated resources.
- [x] `build.test.mjs` — prove hidden/default/invalid cases, nested/all-hidden pages, and preserved direct access/launcher/public-map/404 behavior for both hosting prefixes.
- [x] `README.md`, `PRODUCT.md` — document the new optional flag and its visibility limits; update generated guide copy in `build.mjs`.

**Acceptance Criteria:**
- Given a hidden link or a link in a hidden-only folder, when a visitor browses or searches the homepage or any ancestor directory, then neither its code nor an empty ancestor folder is shown.
- Given an explicit hidden link URL (including a nested link), when opened directly or recovered through 404 with different letter casing, then it reaches the configured destination under root or project-prefix hosting.
- Given a hidden script link, when the build succeeds, then its `.sh` launcher works as it would for a visible link.
- Given an invalid `hidden` value, when building over an existing `dist/`, then the build fails and the previous output remains.

## Implementation Notes

Hidden entries are filtered while rendering directory HTML; the public map, redirect pages and optional launchers are still generated from the full validated input. The user's uncommitted `links.yaml` reorganization was preserved locally and excluded from the feature PR because it changes existing public URLs.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and disposition |
| --- | --- | --- |
| Blind: moving the existing setup paths removes old links | medium | The uncommitted user edit to `links.yaml` replaces both `scripts/ohmyposh-setup-*` paths; publishing that edit would remove their redirect and launcher resources. The open feature PR excludes this change. Deferred for a separate decision before publishing the link-map edit. |
| Blind: README Bash examples use stale paths | low | The examples already pointed to paths absent from the baseline map; this feature PR does not change those paths. If the user's uncommitted rename is published, documentation should be updated then; deferred. |
| Blind: no hidden-query search test | false | The search script filters only rendered `.links` rows (`build.mjs`); hidden rows are excluded at generation, and the hidden listing test asserts names and URLs are absent from both home and nested HTML. Search cannot match an absent row. |
| Blind: invalid hidden YAML is not tested | low | JSON invalid values are tested, but YAML parsing can coerce values; add a YAML invalid-value check before output replacement. Patch. |
| Blind: deep visible descendant retention untested | low | Recursive visibility pruning needs a visible link several levels down to prove ancestor directories stay present. Patch the nested fixture. |
| Blind: deployed Pages 404 smoke test absent | false | No routing code changed; existing Pages smoke test is required for routing changes. Simulated root/project-prefix tests verify hidden entries remain in the public map and recovery path. |
| Edge: old setup URLs removed | medium | Same uncommitted `links.yaml` change as the first finding, reported independently. The feature PR does not include it; deferred until the owner decides whether to preserve old URLs. |
| Verification gap: old setup URLs removed | medium | Same user-owned uncommitted map rewrite; feature PR excludes it, but publishing the map edit as-is would remove live paths. Deferred. |

## Verification

**Commands:**
- `npm ci` — installs the YAML parser under Node.js 24.
- `node --test build.test.mjs` — all regression checks pass, including hidden-link cases.
- `node build.mjs` — generates the checked-in link map successfully from the repository root.
- `git diff --check` — no whitespace errors.

**Results:** Node.js 24: 13 tests passed; build generated 26 links from the worktree's current `links.yaml`; `git diff --check` passed. The local generated homepage lists 25 visible links, omits `setup/ohmyposh/latest`, and still generates its `.sh` launcher and public map entry. Deployed GitHub Pages 404 behavior still requires a browser smoke test if routing changes later.
