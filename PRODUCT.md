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

`links.json` is the source of truth. The build validates it and generates redirect pages, a directory page, a 404 handler for differently capitalized codes, and optional Bash launchers. GitHub Actions checks pull requests and deploys on pushes to `main`.

## Capabilities and Constraints

- Link entries accept an absolute HTTP(S) destination, an optional title, and an optional `script: true` flag for a `.sh` launcher.
- Published links and destinations are public. There is no backend, database, anonymous submission, click tracking, or HTTP 301/302 redirect.
- Short codes are case-insensitively unique and follow the documented reserved-name rules. Destination syntax is validated, not reachability.
- Node.js 22 runs the build and checks without package installation; no frontend framework is wanted.
- Provide dark and light modes, informational pages, and optional custom static advertisement spaces that are off by default.

## Evidence on Hand

- `README.md` documents setup, link editing, deployment, behavior, and limits.
- `links.json` contains example entries, including a title and script launcher.
- `build.mjs` contains the site templates; `build.test.mjs` covers validation and generated behavior.
- No testimonials, usage metrics, or performance claims are supplied.

## Product Principles

- Keep the link directory easy to browse.
- Keep the link map reviewable and version-controlled.
- Publish links without operating an application server.
- Make link destinations and limitations transparent.
