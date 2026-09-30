# Short links

A URL shortener that runs entirely on GitHub Pages. A JSON or YAML link map is
the source of truth; a build step turns each entry into a static folder with an
instant redirect, and GitHub Actions deploys it on every push to `main`.

The generated site includes a browsable directory, an About page, a setup guide,
and a How it works page. It follows the system light/dark preference; visitors
can override it with the Theme button, saved in their browser.

## Setup

1. Create a GitHub repository with these files and a `main` branch. A public
   repository works with GitHub Pages on GitHub Free.
2. Settings → Pages → **Source: GitHub Actions**.
3. Edit your link file with your links on a branch and open a pull request to `main`.
   Once checks pass, merge it. The deployment workflow checks, builds, and deploys.
   Wait for **Actions → Deploy short links** to finish.

Your links live at `https://<user>.github.io/<repo>/<code>`. Want bare
`go.example.com/<code>`? Add a root `CNAME` file containing only `go.example.com`
(no scheme or path); the build copies it into `dist/`. Point that subdomain's DNS
CNAME record at `<user>.github.io`, set the custom domain in Settings → Pages,
and enable HTTPS once GitHub provisions the certificate. For an apex domain,
follow [GitHub's DNS instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Adding a link

Edit `links.json` on a branch and submit a pull request:

```json
{
  "gh": "https://github.com/",
  "docs": { "url": "https://docs.github.com/en/pages", "title": "GitHub Pages docs" }
}
```

Short form is just `"code": "url"`. Long form adds an optional string `title` shown
on the redirect fallback page. You can edit the file in GitHub's web editor;
choose to create a branch and pull request. The links become live after the merge
to `main` finishes deploying.

Nest objects to create directories in JSON or YAML:

```json
{
  "tools": {
    "git": "https://git-scm.com/",
    "editors": {
      "code": { "url": "https://code.visualstudio.com/", "title": "VS Code" }
    }
  }
}
```

This creates browseable `/tools/` and `/tools/editors/` pages and redirect URLs
`/tools/git/` and `/tools/editors/code/`. The homepage has expandable directories;
each directory page also lists links and subdirectories. Existing top-level links
keep their URLs. Directory names are their display labels, and a directory must
contain at least one entry. A path cannot be both a directory and a redirect.

Each path segment starts with an ASCII letter or number, followed by letters,
numbers, `.`, `_`, or `-`. `index`, `404`, `assets`, `links`, `about`, `guide`,
`how-it-works`, and generated filenames (such as `index.html`) are reserved in
any casing. Siblings cannot differ only by case. Destinations must be absolute HTTP or HTTPS
URLs. Edit a destination to retarget a link; delete its entry to remove it on the
next deployment.

To use YAML instead, rename `links.json` to `links.yaml` (or `links.yml`) and
write the same link entries as YAML:

```yaml
gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs
```

Keep **exactly one** of `links.json`, `links.yaml`, and `links.yml` in the root.
The build rejects missing or multiple sources. Both formats use the same link
validation; the generated site always publishes a `links.json` for browser routing.

## Running Bash scripts

Set `"script": true` in JSON (or `script: true` in YAML) to generate an
additional `<path>.sh` launcher alongside its browser redirect, including in
nested directories:

```json
{
  "ohmyposh-setup-stable": {
    "url": "https://raw.githubusercontent.com/ratrat64/homelab-public/refs/heads/main/scripts/ubuntu/oh-my-posh/setup.sh",
    "script": true
  }
}
```

After deployment, use the `.sh` URL for remote execution:

```bash
curl -fsSL https://ratrat64.github.io/shortlink/ohmyposh-setup-stable.sh | bash

# Arguments are forwarded to the destination script:
curl -fsSL https://ratrat64.github.io/shortlink/ohmyposh-setup-stable.sh | bash -s -- --verbose
```

Use the full link path's exact casing, with `.sh` and **no trailing slash**. The browser
URL ending in `/<path>/` returns HTML, which `curl -L` cannot follow.

Launchers require Bash, curl, mktemp, and rm. Each run downloads the current
destination into a temporary file, executes it only after a successful download,
and removes it on exit. Download failures and the script's exit status are
returned by the launcher.

The `script` field must be a boolean; omitting it or setting it to `false` produces
only the browser redirect. A generated `<code>.sh` must not collide with another
short code or directory in the same folder, regardless of casing.

## Pull request checks

Every pull request targeting `main` runs **Check pull request**, using Node.js 22
on Ubuntu. The **PR validation** job runs `node --test build.test.mjs` followed by
`node build.mjs`: tests cover regression cases, and the build validates the proposed
link file. New commits rerun checks and cancel older runs for the same PR.
PR checks have read-only repository permissions and do not deploy the site.
For PRs changing only `AGENTS.md`, the required job succeeds without running
Node.js tests or a build; mixed changes still run both.

For your own repository, configure an active branch ruleset under **Settings →
Rules → Rulesets**, targeting `main`. Require a pull request and the **PR validation**
status check from GitHub Actions, with the branch up to date before merging.
No approving review is required by this baseline; add one if your team needs it.
Run the workflow on an initial PR if the check is not yet available in the picker.
Merging to `main` triggers the existing production deployment.

## Optional advertisements

`ads.json` controls two text-only placements: `directory` (beside the link
list) and `guide` (at the end of the setup guide). They are off by default.
To show them, set `enabled` to `true` and fill in either slot:

```json
{
  "enabled": true,
  "directory": {
    "label": "Your sponsor name",
    "text": "A short description of the offer.",
    "url": "https://example.com/"
  },
  "guide": null
}
```

Set `enabled` back to `false` to hide all placements. Set an individual slot
to `null` to hide only that slot. Only text and an HTTP(S) link are accepted;
the build escapes displayed content and does not load ad scripts.

## Local build

Use Node.js 22; launcher tests also require Bash. Install the YAML parser once:

```bash
npm ci
node --test build.test.mjs # validation and generated-script regression checks
node build.mjs          # writes ./dist
npx serve dist          # optional preview
```

Run from the repository root. A successful build replaces `dist/` completely;
edit the templates in `build.mjs`, not the generated files. Validation fails
before the old output is removed. URL syntax is checked, but destination
reachability is not.

For a focused check: `node --test --test-name-pattern="404" build.test.mjs`.
The checks execute generated JavaScript in Node with simulated browser APIs,
and Bash launchers with a stubbed downloader.
After deploying, smoke-test a known code, a wrong-case code (with and without a
trailing slash), and an unknown code in a browser. Repeat under a project prefix
when changing routing; local preview servers may serve 404 pages differently
from GitHub Pages.

## How it works

- `dist/<path>/index.html` — either a directory page or a redirect with canonical
  link, meta refresh, and `location.replace`. These are browser redirects, not HTTP
  301/302 responses; `curl -L` does not follow them. A clickable fallback is included.
- `dist/<path>.sh` — an opt-in Bash launcher for links with `"script": true`.
- `dist/links.json` — the public link map generated from either input format.
- `dist/404.html` — GitHub Pages serves this for anything unmatched. It reads
  `links.json` client-side and catches wrong-case codes before giving up.
- `dist/index.html` — a directory with expandable nested groups, sorted by name,
  showing optional link titles and destinations. Select a code to follow its short
  link or browse a directory page. It updates on each deployment.

Routing supports both user-site roots and project-site prefixes. Wrong-case
requests rely on Pages serving `404.html`; JavaScript fetches the public link map
and matches the full relative path case-insensitively. No base-URL environment
variable is required.

## Limits

Published destinations are public, including `links.json` and redirect pages,
and the homepage lists all links. There is no backend, database,
anonymous link submission, or built-in click tracking. Managing links is a
repository edit followed by a deployment.
