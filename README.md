# shl

A URL shortener that runs entirely on GitHub Pages. A JSON or YAML link map is
the source of truth; a build step turns each entry into a static folder with an
instant redirect, and GitHub Actions deploys it on every push to `main`.

The generated site includes a browsable directory and a guide with About, How to use,
and How it works sections. The former `/about/` and `/how-it-works/` URLs forward
to those sections. It follows the system light/dark preference; visitors
can override it with the Theme button, saved in their browser.
Search on the homepage and each directory page filters the listed links by code,
title, destination, or tag (including nested links). Show hidden links includes
hidden entries in listings and search; the button is disabled where none exist.
The single link count on each page updates with search and the hidden-links toggle.
Click a short code to copy its full short URL, or a destination to copy its full URL;
use **Open** beside the destination to visit it. Without JavaScript, the links
remain navigable and hidden links stay hidden.

## Setup

1. Create a GitHub repository with these files and a `main` branch. A public
   repository works with GitHub Pages on GitHub Free.
2. Settings → Pages → **Source: GitHub Actions**.
3. Edit your link file with your links on a branch and open a pull request to `main`.
   Once checks pass, merge it. The deployment workflow checks, builds, and deploys.
   Wait for **Actions → Deploy shl** to finish.

Your links live at `https://<user>.github.io/<repo>/<code>`; the path follows
your repository name (for example, `/shl/` if you name it `shl`). Want bare
`go.example.com/<code>`? Add a root `CNAME` file containing only `go.example.com`
(no scheme or path); the build copies it into `dist/`. Point that subdomain's DNS
CNAME record at `<user>.github.io`, set the custom domain in Settings → Pages,
and enable HTTPS once GitHub provisions the certificate. For an apex domain,
follow [GitHub's DNS instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Adding a link

Edit `links.yaml` on a branch and submit a pull request:

```yaml
gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs
  tags: [documentation, github]
automation:
  url: https://example.com/setup.sh
  hidden: true
```

Short form is just `code: https://example.com/`. Long form adds an optional string `title` shown
on the redirect fallback page, a `tags` array of nonblank strings, or a boolean `hidden` (default `false`).
Tags appear on one line beside each short code without increasing row height;
select the labels to see the full tags if they are shortened. Type a tag (with or
without its `#` prefix) in Search links to filter matching links
(case-insensitive, including nested links). JSON entries use the same `"tags": ["documentation", "github"]` format.
Set `hidden: true`
to omit a link from directory listings, counts, and search by default. Visitors can
use Show hidden links to reveal it. Its redirect and optional script launcher still
work. You can edit the file in GitHub's web editor;
choose to create a branch and pull request. The links become live after the merge
to `main` finishes deploying.

Nest objects to create directories in JSON or YAML:

```yaml
tools:
  git: https://git-scm.com/
  editors:
    code:
      url: https://code.visualstudio.com/
      title: VS Code
```

This creates browseable `/tools/` and `/tools/editors/` pages and redirect URLs
`/tools/git/` and `/tools/editors/code/`. The homepage has expandable directories;
each directory page also lists links and subdirectories. With JavaScript, folder
links, breadcrumbs, brand, and header/footer Links and Guide navigation work
without reloading, keeping the header, footer, and theme mounted. Guide section
anchors also navigate without reloading; Back and Forward restore content and
saved scroll positions (the most recently saved position per URL, shared by
repeated visits to that URL). Search, hidden toggles, and expanded folders reset on
page transitions.
Direct URLs, refreshes, and browsing without JavaScript still use the generated
pages. Existing top-level links keep their URLs. Directory names are their display
labels, and a directory must contain at least one entry. A path cannot be both a
directory and a redirect.
The checked-in `links.yaml` includes flat and nested examples, optional titles,
`script: true` and `script: false`, and codes using dots, underscores and hyphens.
Directories without visible descendants are hidden in parent listings by default,
but their URLs still open. Show hidden links reveals those directories and their
links. If every link is hidden, the directory initially displays an empty state
and the toggle; with JavaScript disabled, hidden entries stay out of view.

Each path segment starts with an ASCII letter or number, followed by letters,
numbers, `.`, `_`, or `-`. `index`, `404`, `assets`, `links`, `about`, `guide`,
`how-it-works`, and generated filenames (such as `index.html`) are reserved in
any casing. Siblings cannot differ only by case. Destinations must be absolute HTTP or HTTPS
URLs. Edit a destination to retarget a link; delete its entry to remove it on the
next deployment.

To use JSON instead, rename `links.yaml` to `links.json` and write the same
link entries as JSON:

```json
{
  "gh": "https://github.com/",
  "docs": { "url": "https://docs.github.com/en/pages", "title": "GitHub Pages docs" },
  "automation": { "url": "https://example.com/setup.sh", "hidden": true }
}
```

Keep **exactly one** of `links.json`, `links.yaml`, and `links.yml` in the root.
The build rejects missing or multiple sources. Both formats use the same link
validation; the generated site always publishes a `links.json` for browser routing.
Hidden links and destinations remain in that public file and can be recovered by
the 404 handler. Hiding controls discoverability, not secrecy.

## Running Bash scripts

Set `script: true` in YAML (or `"script": true` in JSON) to generate an
additional `<path>.sh` launcher alongside its browser redirect, including in
nested directories. The checked-in `links.yaml` includes:

```yaml
setup:
  ohmyposh:
    stable:
      url: https://raw.githubusercontent.com/ratrat64/homelab-public/9a32b5a83044bbbb0f7b01a7b76bb5e929950b80/scripts/ubuntu/oh-my-posh/setup.sh
      script: true
```

After deployment, use the `.sh` URL for remote execution:

```bash
curl -fsSL https://your-user.github.io/shl/setup/ohmyposh/stable.sh | bash

# Arguments are forwarded to the destination script:
curl -fsSL https://your-user.github.io/shl/setup/ohmyposh/stable.sh | bash -s -- --verbose
```

Use the full link path's exact casing, with `.sh` and **no trailing slash**. The browser
URL ending in `/<path>/` returns HTML, which `curl -L` cannot follow.
This example is the nested launcher at `/setup/ohmyposh/stable.sh`.

Launchers require Bash, curl, mktemp, and rm. Each run downloads the current
destination into a temporary file, executes it only after a successful download,
and removes it on exit. Download failures and the script's exit status are
returned by the launcher.

The `script` field must be a boolean; omitting it or setting it to `false` produces
only the browser redirect. A generated `<code>.sh` must not collide with another
short code or directory in the same folder, regardless of casing.

## Pull request checks

Every pull request targeting `main` runs **Check pull request**, using Bun 1.4.2
on Ubuntu. The **PR validation** job runs `bun ci`, `bun run format`, `bun test ./test/build.test.mjs`,
then `bun build.mjs`: tests cover regression cases, and the build validates the proposed
link file. New commits rerun checks and cancel older runs for the same PR.
PR checks have read-only repository permissions and do not deploy the site.
For PRs changing only `AGENTS.md`, the required job succeeds without running
Bun tests or a build; mixed changes still run both.

For your own repository, configure an active branch ruleset under **Settings →
Rules → Rulesets**, targeting `main`. Require a pull request and the **PR validation**
status check from GitHub Actions, with the branch up to date before merging.
No approving review is required by this baseline; add one if your team needs it.
Run the workflow on an initial PR if the check is not yet available in the picker.
Merging to `main` triggers the existing production deployment.

## Run locally

Install [Bun 1.4.2](https://bun.com/docs/installation) and check with
`bun --version`. From the repository root, run (tests also require Bash):

```bash
bun ci
bun run dev
```

Open the URL printed by `http-server` (usually `http://localhost:8080/`). The
preview server supports dotted directory names such as `/dev.tools/`. Restart
`bun run dev` after editing the link map to rebuild the site.
To run the regression checks: `bun run test`. To build
without starting the preview server: `bun build.mjs`.

Run `bun run format` to apply pinned Prettier formatting locally, or
`bun run format:check` to check it without writing. Both CI workflows apply
formatting with `--write` before tests/build. Formatting covers application
build/source/test files, workflows, package metadata, and the root link map;
generated output, vendor files, and planning documents are excluded. HTML stays
in `.mjs` templates; `/* HTML */` comments enable Prettier's embedded HTML formatter
without a runtime tag. Preserve output escaping and whitespace inside code samples.

To return to Node.js 24 if the Bun workflow fails, revert the Bun migration
commit to restore the npm lockfile and Node-based CI commands together.

A successful build replaces `dist/` completely; edit the templates in
`src/pages.mjs` (Guide, redirects, legacy forwarding, and 404), shared layout in
`src/layout.mjs`, directory components in `src/directory.mjs`, styles in
`src/assets/site.css`, browser behaviors and content mounting in `src/assets/*.js`,
input validation in `src/links.mjs`, and output generation in
`src/build.mjs`, not the generated files. Validation fails before the old
output is removed. URL syntax is checked, but destination reachability is not.

`src/layout.mjs` owns the document foundation used by every HTML page. Links,
nested directories, Guide, and 404 compose its shared borderless shell;
destination and legacy forwards use its minimal document without chrome and
share forwarding logic in `src/pages.mjs`. The 404 and minimal documents embed
the same styles and storage-tolerant theme script, so nested or unknown request
paths cannot break their foundations. Recovery rebases shell links after the
first readable ancestor map; unavailable maps retain the relative fallback.
`src/links.mjs` owns validated leaf interpretation and the directory tree used
for rendering and counts. Shared tokens and control styles have one owner in
`src/assets/site.css`; `src/styles.mjs` and `src/browser.mjs` load the same CSS and
theme script relative to their modules for embedding. The build copies native
assets to `dist/assets/`; content selectors must not change shell appearance. See
[architecture AD-7–AD-9](aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md).

For a focused check: `bun test --test-name-pattern="404" ./test/build.test.mjs`.
The checks execute generated JavaScript in Bun with simulated browser APIs,
and Bash launchers with a stubbed downloader.
With installed Chrome (`google-chrome`, or set `CHROME_BIN`), the suite also
compares shell geometry and computed styles on Links, folders, Guide, and 404
at 390px and 1440px in light/dark themes, under root and project prefixes.
It covers direct loads, script-disabled native documents, and shell-preserving
app transitions, plus rendered tag disclosures. Chrome checks report a skip
when the browser is unavailable; a skipped check is not rendered verification.
CI requires Chrome via `SHL_REQUIRE_BROWSER=1`. To run the same required-browser
check locally: `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`.
Set `CHROME_BIN` to the browser executable if it is not named `google-chrome`.
After deploying, smoke-test a known code, a wrong-case code (with and without a
trailing slash), and an unknown code in a browser. Repeat under a project prefix
when changing routing; local preview servers may serve 404 pages differently
from GitHub Pages.

For app navigation, run `bun run dev` and open `/guide/#about` directly. In the
browser console, save `window.savedHeader = document.querySelector('header')`.
Change Theme, then use Links, folders, breadcrumbs, and the footer Guide link;
confirm `savedHeader === document.querySelector('header')`, the theme, page title,
active navigation, and keyboard focus after each transition. Click the current
navigation link and Guide section links, then use Back/Forward: content, fragments,
and saved scroll should match, with history restoration jumping instantly.
Check search, Show hidden links, and code/destination copy after returning from
Guide; each interaction should run once, and controls should reset after leaving
and returning. Repeat with browser JavaScript disabled to check native links.
Repeat on a deployed project-prefix URL such as `/<repo>/guide/#about`.

## How it works

- `dist/<path>/index.html` — either a directory page or a redirect with canonical
  link, meta refresh, and `location.replace`. These are browser redirects, not HTTP
  301/302 responses; `curl -L` does not follow them. A clickable fallback is included.
- `dist/<path>.sh` — an opt-in Bash launcher for links with `"script": true`.
- `dist/links.json` — the public link map generated from either input format.
- `dist/404.html` — GitHub Pages serves this for anything unmatched. It reads
  `links.json` client-side and catches wrong-case codes before giving up.
- `dist/index.html` — a directory with expandable nested groups, sorted by name,
  showing visible short codes beside destinations (with long URLs shortened visually in the middle).
  Show hidden links reveals hidden entries and hidden-only groups on the homepage and eligible directory pages.
  Hover a code for its optional title; titles remain searchable. Select a code to copy its
  short link, select a destination to copy its full URL, or use Open to visit the destination.
  Folder names still open directory pages. It updates on each deployment.

Routing supports both user-site roots and project-site prefixes. Wrong-case
requests rely on Pages serving `404.html`; JavaScript fetches the public link map
and matches the full relative path case-insensitively. No base-URL environment
variable is required.

## Limits

Published destinations are public, including hidden links in `links.json` and redirect pages.
The homepage lists visible links by default. There is no backend, database,
anonymous link submission, or built-in click tracking. Managing links is a
repository edit followed by a deployment.
