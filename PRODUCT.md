# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors browse the public link directory and follow short URLs. Repository maintainers edit and publish links through version control.

## Product Purpose

Publish maintainable short links as a static GitHub Pages site. A maintainer changes the link map in a pull request; merging to `main` deploys updated redirects.

## Positioning

The checked-in link map and build output replace an application server and database; GitHub Pages serves the resulting static files.

## Operating Context

One JSON or YAML link map is the source of truth. The build validates it and generates redirect pages, a directory page, a 404 handler for differently capitalized codes, and optional Bash launchers. GitHub Actions checks pull requests and deploys on pushes to `main`.

## Capabilities and Constraints

- Link entries accept an absolute HTTP(S) destination, an optional title, an optional `script: true` flag for a `.sh` launcher, an optional boolean `hidden` flag to omit a link from directory listings, counts, and search by default, and optional tags displayed under entries and included in search. Visitors can reveal hidden links with the directory toggle.
- Published links and destinations, including hidden links, remain public in `links.json`, redirect pages, and optional launchers. Hiding controls discoverability, not secrecy. There is no backend, database, anonymous submission, click tracking, or HTTP 301/302 redirect.
- Short codes are case-insensitively unique and follow the documented reserved-name rules. Destination syntax is validated, not reachability.
- Node.js 24 runs the build and checks after `npm ci` installs the YAML parser; no frontend framework is wanted.
- Provide dark and light modes and informational pages.

## Evidence on Hand

- `README.md` documents setup, link editing, deployment, behavior, and limits.
- `links.yaml` contains example entries, including a title and script launcher.
- `build.mjs` forwards to `src/build.mjs`; `src/links.mjs` validates input, `src/pages.mjs` contains the site templates, and `test/build.test.mjs` covers validation and generated behavior.
- No testimonials, usage metrics, or performance claims are supplied.

## Product Principles

- Keep the link directory easy to browse.
- Keep the link map reviewable and version-controlled.
- Publish links without operating an application server.
- Make link destinations and limitations transparent.
