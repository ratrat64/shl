# Product

<!-- impeccable:product-schema 1 -->

Updated: 2026-10-08

## Platform

web

## Users

Visitors browse the public link directory and follow short URLs. Repository maintainers edit and publish links through version control.

## Product Purpose

Publish maintainable short links with shl, a static GitHub Pages site. A maintainer changes the link map in a pull request; merging to `main` deploys updated redirects.

## Positioning

The checked-in link map and build output replace an application server and database; GitHub Pages serves the resulting static files.

## Operating Context

One JSON or YAML link map is the source of truth. The build validates it and generates redirect pages, a directory page, a 404 handler for differently capitalized codes, and optional Bash launchers. GitHub Actions checks pull requests and deploys on pushes to `main`.

## Capabilities and Constraints

- Link entries accept an absolute HTTP(S) destination, optional title, and nonblank tags without raw whitespace or commas. Invalid names require explicit renaming before output replacement. Exact case-insensitive script/hidden/broken/disabled tags derive leaf states; legacy properties are rejected. Hidden leaves are omitted by default. Broken warns; disabled codes/destinations/actions remain neutral and stop forwarding/execution while retaining both URL copies and public destinations. Full inline/popover labels and filter chips use sixteen stable automatic theme slots with matched tinted backgrounds/borders, including disabled tags; hidden opacity remains independent. Crowded 50px rows and one-line tag tracks scroll. Show tags exposes a fixed hidden-inclusive subtree catalog minus selections. Selected tags appear left of search on desktop and above it on mobile in matching DOM/tab order, requiring AND plus one broad remaining-text substring. Known #tokens commit with whitespace/comma/Enter; duplicates are idempotent, unknown input remains with Tag not found. Only selected hidden/broken/disabled tags admit matching hidden leaves and ancestors; script alone does not. Filters reset on cross-page mounts and remain on same-page fragments; clearing text or collapsing the picker retains selections. Search remains available on every nonempty subtree, including all-hidden pages.
- Destinations appear on row hover or focus-within only in hover-capable, fine-pointer mode with no coarse input available, with their layout space reserved. Any available coarse pointer, including hybrid touch/mouse devices, forces destinations visible; touch and non-hover modes always show them too. Long URLs stay on one line with middle truncation, preserving the full accessible and copy value.
- All published destinations, including hidden and disabled links, remain public in `links.json` and directory text. Enabled redirect pages and launchers also include destinations; disabled explanations and inert launchers do not. The legacy `script` property is rejected; use `tags: [..., "script"]` instead. Hiding controls discoverability, not secrecy, and disabling controls shl forwarding/execution, not external access. There is no backend, database, anonymous submission, click tracking, or HTTP 301/302 redirect.
- Short codes are case-insensitively unique and follow the documented reserved-name rules. Destination syntax is validated, not reachability.
- Bun 1.4.2 runs the build and checks after `bun ci` installs the YAML parser; no frontend framework is wanted.
- Provide dark and light modes and informational pages.

## Evidence on Hand

- `README.md` documents shl setup, link editing, deployment, behavior, and limits.
- `links.yaml` contains example entries, including a title and script launcher.
- `build.mjs` forwards to `src/build.mjs`; `src/links.mjs` validates input, `src/pages.mjs` contains the site templates, and `test/build.test.mjs` covers validation and generated behavior.
- No testimonials, usage metrics, or performance claims are supplied.

## Product Principles

- Keep the link directory easy to browse.
- Keep the link map reviewable and version-controlled.
- Publish links without operating an application server.
- Make link destinations and limitations transparent.
