---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - aid-docs/planning-artifacts/prds/prd-shortlink-2026-10-02/prd.md
  - aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md
  - aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md
---

# Shortlink - Epic Breakdown

## Overview

This document records **baseline stories for existing behavior**, decomposing the current-product PRD, design system, and architecture into independently checkable capabilities. Stories describe what exists today, not a backlog of new implementation work; a later sprint plan must not treat them as unfinished features without fresh evidence of a gap.

## Requirements Inventory

### Functional Requirements

FR1: Maintainers can add, retarget, or remove entries in exactly one root `links.json`, `links.yaml`, or `links.yml`; links accept a destination string or an object with `url`, optional string `title`, and optional boolean `script`. Missing or multiple source files fail validation. Retargeting retains the short path, and deletion removes generated resources on the next successful publication.

FR2: Maintainers can organize short codes into nonempty nested directories without a fixed taxonomy; a path cannot be both a directory and a redirect. An empty root library displays first-entry guidance.

FR3: Before replacing existing output, the build rejects malformed entries, invalid HTTP(S) destination syntax, invalid path segments, reserved names, case-insensitive sibling collisions, and collisions with generated launcher filenames. Segments match `^[A-Za-z0-9][A-Za-z0-9._-]*$`; validation does not check destination reachability or correctness.

FR4: Pull requests targeting `main` run regression tests then a build, except the documented `AGENTS.md`-only shortcut. Merging to `main` triggers a build and GitHub Pages deployment; manual deployment dispatch is available. Merge restrictions depend on repository ruleset configuration.

FR5: Every link has a browser redirect page using immediate JavaScript navigation, meta refresh, and a clickable destination fallback that uses its optional title. Redirects are HTML, not HTTP 301/302 responses.

FR6: When Pages serves the generated 404 page, client-side routing fetches the public link map and matches the full relative path case-insensitively. Matching links navigate to destinations, matching directories navigate to their canonical-cased pages, and unknown paths show a not-found message and navigation link. Recovery requires JavaScript and successful map retrieval.

FR7: Generated navigation and routing work under both user-site roots and project-site prefixes without a configured base URL; an optional root `CNAME` is included in the published output.

FR8: The homepage lists entries with expandable nested directories; each directory has a browseable page and breadcrumbs. Entries are sorted case-insensitively by name within each group. Codes link to redirects and directory names to directory pages.

FR9: Listings pair short codes with destinations, visually shorten long URLs while preserving full accessible destinations, expose optional titles on hover and in search, and identify script-enabled entries with text as well as color. All entries are listed; there is no hidden-link flag.

FR10: With JavaScript, homepage and directory search filters only the current subtree by code, title, destination, and nested folder name, case-insensitively. Matching descendants become visible in expanded groups; the page reports match count or no matches, and clearing restores visibility. Search does not index destination contents or rank results.

FR11: A guide explains product, use, and operation; former About and How-it-works URLs forward to its sections. Directory and guide pages follow system light/dark preference and support a browser-saved override when storage is available.

FR12: A link with `script: true` publishes a `<path>.sh` launcher, including at nested paths; omitted or false `script` publishes only the browser redirect. Launcher URLs require exact casing and no trailing slash.

FR13: Each launcher downloads its configured destination completely before executing with Bash, forwards arguments and exit status, and removes its temporary file on exit; failed downloads prevent execution. Destinations may be moving or commit-pinned URLs.

FR14: The build publishes a public `links.json` regardless of source format. External automations may read the map and edit the repository source through GitHub's API and existing publication workflow; Shortlink has no dedicated editing endpoint, token manager, or GitHub API client.

### NonFunctional Requirements

NFR1: Operate as a static GitHub Pages site with minimal dependencies, no application backend, database, authentication, or frontend framework; GitHub handles repository checks and deployment.

NFR2: Published entries, destinations, redirect pages, launchers, and the generated map are public. Destination access restrictions remain the destination host's responsibility; launchers do not supply private credentials.

NFR3: Invalid link-map input must fail before deleting existing output. Successful builds recreate output completely; recovery from later write failures is not guaranteed.

NFR4: Escape configured values as HTML text and quote them safely at inline-script and Bash output boundaries.

NFR5: Browsing works without JavaScript; search and case-insensitive 404 recovery require it. Pages use labeled search, announced status, semantic links and disclosures, visible keyboard focus, responsive layouts, full destinations for assistive technology, and script labels independent of color. No audited accessibility-conformance claim is made.

NFR6: The expected library size is hundreds of links, but search responsiveness has not been measured and no performance or capacity target is established; measure before asserting a guarantee.

NFR7: No availability or destination reachability guarantee is established; hosting, DNS, domain choice, HTTPS, and merge rules are external repository/provider configuration.

### Additional Requirements

- AD-1: Preserve repository-owned published state and browser-local visitor state in a static-site-generation architecture with progressive enhancement. Avoid extra state stores, backend mutation paths, and unneeded dependencies; internal modules/templates may change without altering public contracts.
- AD-2: Load and validate one authoritative JSON/YAML map, using the presence of `url` to distinguish links from nonempty directories and allowing an empty root. Preserve nested keys, casing, configured destinations, and optional fields in the generated public map; all generated consumers derive from the same validated data.
- AD-3: Enforce a shared case-insensitive sibling namespace and reserved/generated-name checks before writing output; preserve code casing in paths. Use relative browser links for root/project-prefix hosting; 404 recovery matches all relative segments, but launchers remain exact-case slashless resources.
- AD-4: Apply context-specific escaping to HTML, inline JavaScript (including `</script>` sequences), and Bash. Validate before replacing output, and require launcher download completion, argument/status forwarding, and cleanup.
- AD-5: Keep static browseable HTML and breadcrumbs, client-only subtree search, local theme preference with a system default, accessible code/destination pairing, and the reference-first Working Index. Search and wrong-case recovery are progressive enhancements; the guide retains former URL forwards.
- AD-6: PR checks install dependencies, run tests, then build (with the `AGENTS.md`-only exception); `main` and manual deployment install, build, and upload only `dist/`, including `.nojekyll` and optional `CNAME`. Deploy does not rerun tests. A routing change needs root/project-prefix checks plus a deployed browser smoke test.
- Existing-system seed: `build.mjs` owns generation and `build.test.mjs` owns behavioral checks; CI uses Node.js 24 and the installed `yaml` parser. No greenfield starter template, data migration, monitoring service, staging environment, or new API contract is specified.

### UX Design Requirements

UX-DR1: Present a compact, flat Working Index with unruled two-column directory entries pairing readable codes and destinations; prioritize codes, destinations, and search over decorative cards.

UX-DR2: Apply the defined light/dark color roles across paper, surfaces, text, rules, and wash; reserve blue for standard links/focus and amber plus a text label for script links so color is not the only cue. Respect system preference and browser override.

UX-DR3: Use system sans-serif for body/headings and system monospace for codes/samples; keep codes on one line and middle-truncate long destination display without losing the full URL for assistive technology. Expose optional titles on hover and through search.

UX-DR4: Center a directory container up to 1160px; place search in the heading row on desktop and stack it below the heading under 740px, including on nested directory pages. Keep guide content to a narrower 740px column.

UX-DR5: Keep the header limited to Links and Guide, underline the current destination, and give the bordered theme control a visible keyboard focus outline.

UX-DR6: Let folder names navigate to their pages while disclosure controls expand nested entries; use relative redirect links and visible keyboard focus for code links. Maintain semantic browsing without JavaScript.

UX-DR7: Use flat color surfaces rather than shadows; keep rows unruled and square and use subtle 4px rounding on controls and code blocks. Do not sacrifice code/destination readability to decoration.

### FR Coverage Map

FR1: Epic 1 - Edit and publish the authoritative link map.
FR2: Epic 1 - Organize codes into valid directories.
FR3: Epic 1 - Validate entries and names before replacing output.
FR4: Epic 1 - Check changes and publish to Pages.
FR5: Epic 1 - Follow browser redirect pages.
FR6: Epic 1 - Recover differently capitalized browser paths.
FR7: Epic 1 - Route under user-site and project-site paths.
FR8: Epic 2 - Browse nested directories.
FR9: Epic 2 - Understand link details and script identification.
FR10: Epic 2 - Search recorded details in the current subtree.
FR11: Epic 2 - Read guidance and choose a theme.
FR12: Epic 3 - Opt in to Bash launchers.
FR13: Epic 3 - Download and execute configured scripts safely.
FR14: Epic 1 - Publish the machine-readable map for external consumers.

## Epic List

### Epic 1: Publish and Follow Reliable Short Links

Maintainers can publish a validated, repository-owned library; visitors can use browser short links at a site root or project prefix, including wrong-case recovery. The public map supports external readers and repository API editors without introducing an application backend.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR14.

**Implementation context:** Existing `build.mjs`, `build.test.mjs`, and GitHub Actions workflows already implement this baseline. Apply AD-1–AD-4 and AD-6; routing changes also require a deployed Pages smoke test.

### Epic 2: Find and Understand Resources

Visitors can browse and search a public library, understand destinations and script markers, read the guide, and choose a theme. This adds a complete reference/discovery experience on top of published links.

**FRs covered:** FR8, FR9, FR10, FR11.

**Implementation context:** The current generated directory and guide supply this baseline. Apply AD-5 and UX-DR1–UX-DR7; preserve browsing without JavaScript and root/project-prefix navigation.

### Epic 3: Run Published Scripts

Maintainers can opt links into Bash launchers; callers can execute the configured scripts with arguments and receive their exit statuses. This is a separate executable-resource risk boundary built on the validated published map.

**FRs covered:** FR12, FR13.

**Implementation context:** Existing launchers in `build.mjs` supply this baseline. Apply AD-3–AD-4 to filename collisions, shell quoting, complete downloads, and cleanup; launcher URLs are distinct from browser redirects.

## Epic 1: Publish and Follow Reliable Short Links

Maintainers publish a validated, repository-owned library; visitors follow short links at site roots or project prefixes, including wrong-case recovery. The public map supports external readers and repository API editors without an application backend.

### Story 1.1: Maintain the Public Link Map

As a maintainer,
I want to edit one JSON or YAML link map and publish its validated contents,
So that short-link destinations and the public machine-readable map stay in sync.

**Acceptance Criteria:**

**Given** exactly one valid `links.json`, `links.yaml`, or `links.yml`,
**When** the build succeeds,
**Then** `dist/links.json` preserves the validated nesting, code casing, destinations, and optional fields.

**Given** no source file or more than one supported source file,
**When** the build runs,
**Then** it fails before replacing existing output.

**Given** a destination is changed or an entry is removed,
**When** a subsequent build succeeds,
**Then** the public map retains the code with its new destination or omits the deleted entry.

**Given** an external tool edits the source through GitHub's repository API,
**When** the build runs on the edited source,
**Then** the generated public map reflects it without a Shortlink editing endpoint.

_Baseline coverage: FR1, FR14; AD-1, AD-2, NFR1–NFR3._

### Story 1.2: Validate Codes and Directories

As a maintainer,
I want invalid entries and conflicting paths rejected before publication,
So that a bad edit cannot replace the working site.

**Acceptance Criteria:**

**Given** an empty root map,
**When** the build runs,
**Then** it succeeds;
**And** an empty nested directory or a path used as both directory and link is rejected.

**Given** a malformed link object or a destination that is not an absolute HTTP(S) URL,
**When** validation runs,
**Then** the build fails before removing existing output;
**And** destination reachability is not checked.

**Given** a segment outside `^[A-Za-z0-9][A-Za-z0-9._-]*$`, a reserved name, or siblings differing only by case,
**When** validation runs,
**Then** the build rejects the map before writing output.

**Given** a code or directory collides case-insensitively with a generated filename such as a `.sh` launcher,
**When** validation runs,
**Then** the build rejects it before writing output.

_Baseline coverage: FR2, FR3; AD-2–AD-4, NFR3._

### Story 1.3: Follow a Browser Short Link

As a visitor,
I want a short-link page to take me to its configured destination,
So that I can use the same code from a user-site root or a project site.

**Acceptance Criteria:**

**Given** a valid link,
**When** its page is generated,
**Then** `<path>/index.html` contains immediate JavaScript navigation, a meta refresh, and a clickable fallback;
**And** the optional title appears on the fallback page.

**Given** JavaScript is unavailable,
**When** the visitor opens the page,
**Then** the meta refresh or clickable fallback still exposes the destination;
**And** the response is HTML rather than an HTTP redirect.

**Given** the site is hosted at `/` or `/<repo>/`,
**When** a visitor follows a generated short-link URL,
**Then** it resolves under that hosting path without a configured base URL.

**Given** configured text contains HTML-sensitive or script-closing characters,
**When** the page is generated,
**Then** it is encoded for its HTML or inline-script context rather than becoming markup or executable code.

_Baseline coverage: FR5, FR7 (browser links); AD-3, AD-4, NFR4._

### Story 1.4: Recover Differently Capitalized Browser Paths

As a visitor,
I want a mistyped letter case in a short path to reach the right resource,
So that I do not need to know the code's exact casing.

**Acceptance Criteria:**

**Given** Pages serves `404.html` for a wrong-case link path,
**When** JavaScript retrieves `links.json`,
**Then** the full relative path is matched case-insensitively;
**And** the visitor navigates to the link's destination.

**Given** a wrong-case directory path,
**When** the same lookup succeeds,
**Then** the visitor navigates to its canonical-cased directory URL.

**Given** an unknown path or unavailable map,
**When** recovery cannot find a match,
**Then** the visitor sees a readable not-found state and a navigation link.

**Given** either `/` or `/<repo>/` hosting,
**When** lookup runs,
**Then** it uses the correct site-relative path without a base-URL setting;
**And** `.sh` launcher URLs do not gain wrong-case aliases.

_Baseline coverage: FR6, FR7 (recovery); AD-3, AD-6. Simulated routing checks do not prove deployed Pages 404 handling; routing changes require a deployed browser smoke test._

### Story 1.5: Check and Publish Link Changes

As a maintainer,
I want repository changes checked before publication and the built site deployed from `main`,
So that visitors receive the generated links.

**Acceptance Criteria:**

**Given** a pull request targeting `main` with changes beyond `AGENTS.md`,
**When** PR validation runs,
**Then** it installs dependencies, runs regression tests, and builds in that order;
**And** an `AGENTS.md`-only pull request uses the documented shortcut.

**Given** a push to `main` or manual dispatch,
**When** deployment runs,
**Then** it builds and publishes only `dist/` to GitHub Pages, including `.nojekyll` and an optional root `CNAME`;
**And** deployment does not rerun regression tests.

**Given** a build that passes validation,
**When** output is regenerated,
**Then** stale generated resources are removed;
**And** merge restrictions, DNS, and custom-domain setup remain repository or hosting configuration.

_Baseline coverage: FR4, FR7 (custom domain); AD-4, AD-6, NFR3, NFR7._

## Epic 2: Find and Understand Resources

Visitors browse and search a public library, understand destinations and script markers, read guidance, and choose a theme. This reference experience builds on published links.

### Story 2.1: Browse and Understand the Library

As a visitor,
I want to browse codes alongside their destinations,
So that I can locate a resource even without JavaScript.

**Acceptance Criteria:**

**Given** a nested link map,
**When** the homepage or a directory page is generated,
**Then** entries are sorted case-insensitively within each group;
**And** folder names link to browseable pages, disclosure controls expand nested groups, and directory pages show breadcrumbs.

**Given** JavaScript is disabled,
**When** a visitor browses,
**Then** links and nested groups remain usable;
**And** an empty root shows first-entry guidance.

**Given** a link with a long destination, optional title, or `script: true`,
**When** it is listed,
**Then** its code and destination remain paired, long destinations are visually shortened in the middle, and the full destination remains available to assistive technology;
**And** its title is available on hover, a script label accompanies its distinct color, all entries are listed, and displayed codes, titles, and destinations are HTML-escaped.

**Given** desktop or narrow layout,
**When** the index renders,
**Then** its centered container is at most 1160px wide, with compact flat square rows, two columns where space permits, readable system/monospace typography, and visible keyboard focus;
**And** relative links work at a site root or project prefix.

_Baseline coverage: FR8, FR9; AD-5, NFR5, UX-DR1, UX-DR3, UX-DR6, UX-DR7._

### Story 2.2: Search the Current Directory Subtree

As a visitor,
I want to filter recorded link details on the page I am viewing,
So that I can find a resource without knowing its exact code.

**Acceptance Criteria:**

**Given** JavaScript is enabled,
**When** a visitor searches from the homepage or a directory page,
**Then** codes, titles, destinations, and nested folder names are matched case-insensitively within that page's subtree;
**And** a directory page does not search outside its subtree.

**Given** a match inside a collapsed group,
**When** the query is applied,
**Then** the matching entry becomes visible and its ancestor groups expand.

**Given** a query with matches or no matches,
**When** filtering finishes,
**Then** the page announces a matching-link count or a no-match state;
**And** clearing the query restores the entries without inspecting destination content or ranking results.

**Given** a desktop or sub-740px viewport,
**When** search is displayed on the homepage or a directory page,
**Then** its labeled control shares the heading row on desktop and stacks below it on narrow screens.

_Baseline coverage: FR10; AD-5, NFR5–NFR6, UX-DR3–UX-DR4. Search responsiveness at hundreds of links remains unmeasured._

### Story 2.3: Read Guidance and Choose a Theme

As a visitor,
I want clear usage guidance and a readable light or dark presentation,
So that I can understand and use the library comfortably.

**Acceptance Criteria:**

**Given** the guide page,
**When** it is opened,
**Then** it explains the product, how to use it, and how it works in a reading column at most 740px wide;
**And** former `/about/` and `/how-it-works/` URLs forward to the relevant guide sections.

**Given** no saved preference,
**When** a directory or guide page loads,
**Then** it follows the system light/dark preference;
**And** using the theme control saves a browser-local override when storage is available and remains usable when it is not.

**Given** either theme,
**When** a directory or guide page renders,
**Then** it uses the defined grayscale surfaces and blue link/focus roles, amber plus text for script links, and visible keyboard focus;
**And** the header offers Links and Guide navigation, underlines the current page, and has a bordered theme control with the same subtle 4px rounding as controls and code blocks.

_Baseline coverage: FR11; AD-5, NFR5, UX-DR2, UX-DR4, UX-DR5, UX-DR7._

## Epic 3: Run Published Scripts

Maintainers opt links into Bash launchers; callers execute configured scripts with arguments and receive their exit statuses. This executable-resource boundary builds on the validated link map.

### Story 3.1: Run an Opted-in Link as a Bash Script

As a caller,
I want an opted-in short link to provide a runnable `.sh` launcher,
So that I can execute its configured script with arguments and receive its result.

**Acceptance Criteria:**

**Given** a link with `script: true`,
**When** the build succeeds,
**Then** it emits `<path>.sh`, including for nested paths;
**And** omitted or false `script` emits no launcher while the browser redirect remains a separate HTML resource.

**Given** a launcher URL,
**When** it is requested,
**Then** it requires exact path casing, `.sh`, and no trailing slash;
**And** a generated launcher filename cannot collide case-insensitively with a sibling code or directory.

**Given** a successful complete download,
**When** the launcher runs,
**Then** Bash executes the downloaded file with forwarded arguments and returns its exit status;
**And** temporary output is cleaned up on exit, while a failed download prevents execution and returns failure.

**Given** a configured destination containing shell-sensitive characters,
**When** the launcher is generated and run,
**Then** shell quoting preserves the URL as data;
**And** each run fetches its configured moving or commit-pinned URL without supplying private-resource credentials.

_Baseline coverage: FR12, FR13; AD-3, AD-4, NFR2, NFR4._
