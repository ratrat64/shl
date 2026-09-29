# Short links

A URL shortener that runs entirely on GitHub Pages. `links.json` is the source of
truth; a build step turns each entry into a static folder with an instant redirect,
and GitHub Actions deploys it on every push to `main`.

## Setup

1. Create a GitHub repository with these files and a `main` branch. A public
   repository works with GitHub Pages on GitHub Free.
2. Settings → Pages → **Source: GitHub Actions**.
3. Edit `links.json` with your links on a branch and open a pull request to `main`.
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

Codes start with an ASCII letter or number, followed by letters, numbers, `.`,
`_`, or `-`. `index`, `404`, `assets`, and `links` are reserved in any casing.
Two codes cannot differ only by case. Destinations must be absolute HTTP or HTTPS
URLs. Edit a destination to retarget a link; delete its entry to remove it on the
next deployment.

## Pull request checks

Every pull request targeting `main` runs **Check pull request**, using Node.js 22
on Ubuntu. The **PR validation** job runs `node --test build.test.mjs` followed by
`node build.mjs`: tests cover regression cases, and the build validates the proposed
`links.json`. New commits rerun checks and cancel older runs for the same PR.
PR checks have read-only repository permissions and do not deploy the site.

For your own repository, configure an active branch ruleset under **Settings →
Rules → Rulesets**, targeting `main`. Require a pull request and the **PR validation**
status check from GitHub Actions, with the branch up to date before merging.
No approving review is required by this baseline; add one if your team needs it.
Run the workflow on an initial PR if the check is not yet available in the picker.
Merging to `main` triggers the existing production deployment.

## Local build

Use Node.js 22. No package installation is needed.

```bash
node --test build.test.mjs # validation and generated-script regression checks
node build.mjs          # writes ./dist
npx serve dist          # optional preview
```

Run from the repository root. A successful build replaces `dist/` completely;
edit the HTML templates in `build.mjs`, not the generated files. Validation fails
before the old output is removed. URL syntax is checked, but destination
reachability is not.

For a focused check: `node --test --test-name-pattern="404" build.test.mjs`.
The checks execute generated JavaScript in Node with simulated browser APIs.
After deploying, smoke-test a known code, a wrong-case code (with and without a
trailing slash), and an unknown code in a browser. Repeat under a project prefix
when changing routing; local preview servers may serve 404 pages differently
from GitHub Pages.

## How it works

- `dist/<code>/index.html` — canonical link, meta refresh, and `location.replace`.
  These are browser redirects, not HTTP 301/302 responses; `curl -L` does not
  follow them. A clickable fallback is included.
- `dist/404.html` — GitHub Pages serves this for anything unmatched. It reads
  `links.json` client-side and catches wrong-case codes before giving up.
- `dist/index.html` — a minimal landing page without a link directory.

Routing supports both user-site roots and project-site prefixes. Wrong-case
requests rely on Pages serving `404.html`; JavaScript fetches the public link map
and matches the final path segment case-insensitively. No base-URL environment
variable is required.

## Limits

Published destinations are public, including `links.json` and redirect pages,
even though the homepage does not list them. There is no backend, database,
anonymous link submission, or built-in click tracking. Managing links is a
repository edit followed by a deployment.
