---
title: Shortlink — Current Product
status: draft
created: 2026-10-02
updated: 2026-10-03
---

# PRD: Shortlink

## 1. Purpose and Vision

Capture Shortlink's existing capabilities for maintainers and downstream planning, without turning future ideas into current requirements. This draft combines the maintainer's Vision + Features coaching decisions with the implementation at commit `565f20c`. `README.md` supplies usage guidance; `DESIGN.md` supplies the existing visual direction. Technical details and future possibilities are preserved in [addendum.md](addendum.md).

**Vision:** Help engineers and small-to-medium teams organize scattered project resources behind memorable, stable short links, making everyday setup and automation easier to repeat and share.

The library centralizes references to configuration files, scripts, documentation, and other project resources without relocating their originals. Short URLs reduce the effort of typing long destinations or remembering where resources live. Their addresses remain stable while maintainers can change their destinations.

## 2. Target Users and Jobs

Currently a personal tool, intended for small-to-medium teams. The intended maintainer is an engineer comfortable with YAML/JSON, version control, pull requests, and pipelines. Near-term libraries are expected to contain **hundreds of links**; this is a usage expectation, not a tested capacity limit.

- **Maintainers:** Add, organize, retarget, and remove short links using repository workflows.
- **Human visitors:** Consult the directory primarily as a reference, with browsing and resource discovery as secondary uses.
- **Automations:** Use script launchers and maintain the link map through GitHub's repository API. This is an external editing approach, not a built-in Shortlink API integration.

### Concrete Scenario

**UJ-1 — Rat sets up a new VM.** Rat has a known-working oh-my-posh setup script in another repository. Rat maintains a commit-pinned destination under `scripts/ohmyposh-setup-stable`, publishes it through a checked pull request, and uses its short `.sh` launcher URL in a `curl | bash` command. The directory provides a reference when the short code is forgotten. The short code does not itself guarantee a working or immutable destination.

## 3. Glossary

- **Link map:** The single YAML or JSON source file containing link entries and nested directories.
- **Short code:** A maintainer-chosen path segment; nested short codes form a full short path.
- **Destination:** The absolute HTTP(S) URL configured for a link entry.
- **Directory:** A nonempty nested group of entries, with a browseable page.
- **Script launcher:** An optional `.sh` resource that downloads and runs a link entry's destination using Bash.

## 4. Current Features and Functional Requirements

### 4.1 Repository-Maintained Library

**FR-1 — Edit the link map.** Maintainers can add, retarget, or remove entries in exactly one of `links.json`, `links.yaml`, or `links.yml`. Entries accept a destination string or an object with `url`, optional string `title`, and optional boolean `script`. Missing or multiple source files fail validation. Retargeting preserves the short path; deleting an entry removes its generated resources on the next successful publication.

**FR-2 — Organize resources.** Maintainers can choose short codes and nested directories without a fixed taxonomy. Directories must contain entries and cannot simultaneously be redirects. An empty root library is allowed and displays guidance for adding a first entry.

**FR-3 — Validate changes.** Before replacing existing build output, reject malformed entries, invalid destination syntax, invalid path segments, reserved names, case-insensitive sibling collisions, and collisions with generated launcher filenames. Path segments start with an ASCII letter or number and then contain only ASCII letters, numbers, dots, underscores, or hyphens. Destination validation accepts absolute HTTP(S) URLs; it does not check reachability or resource correctness.

**FR-4 — Check and publish.** Pull requests targeting `main` run regression tests and a build, except the documented `AGENTS.md`-only check shortcut. Merging to `main` triggers a build and deployment to GitHub Pages; manual deployment dispatch is also available. Requiring passing checks before merging depends on repository ruleset configuration, not the Shortlink application.

### 4.2 Browser Short Links and Routing

**FR-5 — Follow a short link.** Each link entry has a browser redirect page with immediate JavaScript navigation, meta refresh, and a clickable destination fallback. The optional title is used on the fallback page. Redirects are not HTTP 301/302 responses; `curl -L` does not follow the HTML redirect.

**FR-6 — Recover differently capitalized paths.** When GitHub Pages serves the generated 404 page, JavaScript consults the public link map and matches the entire relative path case-insensitively. Matching links go to their destinations; matching directories go to their canonical-cased pages. Unknown paths show a not-found message and a navigation link. Wrong-case recovery requires JavaScript and successful link-map retrieval.

**FR-7 — Support hosting paths.** Generated navigation and routing support user-site roots and project-site prefixes without a configured base URL. An optional root `CNAME` is included in the published output; DNS and GitHub Pages domain setup remain external hosting responsibilities.

### 4.3 Human Reference and Discovery

**FR-8 — Browse the library.** The homepage lists entries with expandable nested directories. Each directory has its own page with breadcrumbs. Entries are sorted case-insensitively by name within each group. Short codes link to their browser redirect pages, while directory names link to directory pages.

**FR-9 — Understand entries.** Show short codes alongside destinations; visually shorten long destinations while retaining the full destination for assistive technology. Optional titles appear on hover and remain searchable. Script-enabled entries have both a distinct color and a text label. Every entry is listed today; there is no hidden-link flag.

The existing visual direction is a compact, flat "Working Index": codes, destinations, and search take priority over decorative cards. `DESIGN.md` defines its system typography, theme colors, and responsive layout.

**FR-10 — Search the current subtree.** With JavaScript enabled, search on the homepage or a directory page filters that page's entries and descendants case-insensitively by short code, title, destination URL, and nested folder names. Matching descendants become visible in expanded groups. Show a matching-link count or a no-match message; clearing the query restores visibility. This is text filtering, not destination-content indexing or ranked search. A directory page does not search outside its subtree.

**FR-11 — Read guidance and choose a theme.** A guide explains the product, usage, and operation. Former About and How-it-works URLs forward to guide sections. Directory and guide pages follow the system light/dark preference and allow a browser-saved override when storage is available.

### 4.4 Script Execution and Automation

**FR-12 — Publish optional launchers.** Setting `script: true` generates a `.sh` launcher alongside the browser redirect, including for nested entries. Omitting `script` or setting it to `false` generates no launcher. Launcher URLs require exact casing and no trailing slash; browser redirect URLs are not interchangeable with launcher URLs.

**FR-13 — Execute the configured script.** A launcher fully downloads its destination before invoking Bash, forwards arguments and exit status, and removes its temporary file on exit. A failed download prevents execution. The launcher uses the configured destination each run; maintainers can select either a moving URL or a commit-pinned URL.

**FR-14 — Publish a machine-readable map.** Publish `links.json` regardless of source format. External automations can read the public map and use GitHub's repository API to edit the source link map through the existing repository publishing process. Shortlink supplies no dedicated editing endpoint, token management, or GitHub API client.

## 5. Cross-Cutting Quality and Constraints

- **Hosting simplicity:** Operate as one static published site with minimal dependencies, no application backend, and no database. GitHub supplies repository hosting, checks, and Pages deployment.
- **Public data:** Published entries, destinations, redirect pages, launchers, and the generated link map are public. No application-level authentication or authorization exists. Any destination access restrictions belong to its host; a launcher does not supply private-resource credentials.
- **Validation and output integrity:** Invalid link-map input fails before existing output is replaced. Successful builds regenerate the output completely; there is no claim of atomic recovery from subsequent write failures.
- **Untrusted values:** Display configured values as escaped text and quote destinations safely in generated HTML, inline scripts, and Bash launchers.
- **Usability and accessibility:** Existing pages use labeled search, a status announcement, visible keyboard focus, semantic links/disclosures, responsive layouts, and script identification that does not rely on color alone. Browsing works without JavaScript; search and wrong-case recovery do not. These are observed affordances, not a claim of audited accessibility conformance.
- **Scale:** Observe search responsiveness with hundreds of links before claiming scale performance. No latency, availability, or maximum-library-size guarantee has been established.

## 6. Current Scope and Non-Goals

Current scope is the version-controlled library, validation, browser routing, directory/search, guide/theme, optional launchers, and static publication described above. Existing manual config editing remains supported alongside the selected external GitHub API automation approach.

Current scope excludes hidden entries, an application editing UI or CLI, application-level access management, anonymous submissions, built-in click tracking, automatic destination health checks, automatic script version selection, and HTTP redirects. A dedicated application API conflicts with the no-backend constraint and is not a planned enhancement.

Future possibilities are recorded separately in the addendum, with no delivery commitment.

## 7. Success Criteria

These are maintainer-defined qualitative outcomes, not measured results:

- **SM-1 — Usable automation library:** A maintainer can publish and run a chosen script through its short launcher URL; an external automation can update the link map using GitHub's API and the repository workflow. Validates FR-1, FR-4, FR-12–FR-14. No end-to-end GitHub API automation was demonstrated in this PRD work.
- **SM-2 — Familiar human maintenance:** Engineers can add, organize, and retarget entries using config files and pull requests without needing an application editor. Validates FR-1–FR-4.
- **SM-3 — Find resources in a growing library:** Humans can use the directory and search to locate resources by their recorded properties across an expected library of hundreds of links. Validates FR-8–FR-10. Responsiveness at that volume remains unmeasured.
- **Counter-metric:** Increasing link count or adding editing features is not success if it makes human lookup harder or introduces an application backend/database. This guards SM-2 and SM-3.

## 8. Open Items and Assumptions

No unresolved product-scope blocker remains in the draft. The maintainer still needs to approve this consolidated interpretation before finalization.

- **Scale evidence:** No numeric search-performance target or representative hundreds-of-links measurement exists. Owner: maintainer. Revisit when growing the library or investigating slow search.
- **Automation evidence:** GitHub API editing is the selected external approach; credentials, API permissions, and a working automation are outside the current application's implementation. Owner: automation maintainer. Revisit when setting up the first automated writer.
- **Deployment evidence:** Existing routing tests simulate browser APIs; real Pages behavior needs a deployed browser smoke test when routing changes. No routing change is proposed here.

Expected scale and audience are explicit maintainer statements. No inferred capability is treated as an implemented feature.
