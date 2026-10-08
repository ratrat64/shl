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

- Link entries accept an absolute HTTP(S) destination, optional title, optional `script: true` for a `.sh` launcher, and tags displayed inline and searchable. Exact trimmed case-insensitive hidden/broken/disabled tags derive leaf states; the legacy hidden property is rejected. Hidden omits links from ordinary listings/counts/search until toggled. Broken is an orange-red warning; disabled grey takes precedence and stops shl forwarding/execution while retaining both URL copies and public destinations. Open/Download are unavailable; disabled short URLs explain and launchers exit 1 without download/execution. Full labels stay on one line without ellipsis; crowded rows scroll horizontally, and selecting labels opens a native popover. Plain search is one broad substring; `#tag` is an exact whole leaf tag, spaces included. Exact state queries temporarily reveal matching hidden leaves and ancestors without changing the toggle, even in all-hidden directories; clearing restores the selected pool.
- Destinations appear on row hover or focus-within only in hover-capable, fine-pointer mode with no coarse input available, with their layout space reserved. Any available coarse pointer, including hybrid touch/mouse devices, forces destinations visible; touch and non-hover modes always show them too. Long URLs stay on one line with middle truncation, preserving the full accessible and copy value.
- All published destinations, including hidden and disabled links, remain public in `links.json` and directory text. Enabled redirect pages and launchers also include destinations; disabled explanations and inert launchers do not. Omitting `script` or setting it to false produces no launcher; browser behavior still follows the disabled state. Hiding controls discoverability, not secrecy, and disabling controls shl forwarding/execution, not external access. There is no backend, database, anonymous submission, click tracking, or HTTP 301/302 redirect.
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
