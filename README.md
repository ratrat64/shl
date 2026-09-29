# Short links

A URL shortener that runs entirely on GitHub Pages. `links.json` is the source of
truth; a build step turns each entry into a static folder with an instant redirect,
and GitHub Actions deploys it on every push to `main`.

## Setup

1. Create a GitHub repository with these files and a `main` branch. A public
   repository works with GitHub Pages on GitHub Free.
2. Settings → Pages → **Source: GitHub Actions**.
3. Edit `links.json` with your links, then push to `main`. The workflow checks,
   builds, and deploys. Wait for **Actions → Deploy short links** to finish.

Your links live at `https://<user>.github.io/<repo>/<code>`. Want bare
`go.example.com/<code>`? Add a root `CNAME` file containing only `go.example.com`
(no scheme or path); the build copies it into `dist/`. Point that subdomain's DNS
CNAME record at `<user>.github.io`, set the custom domain in Settings → Pages,
and enable HTTPS once GitHub provisions the certificate. For an apex domain,
follow [GitHub's DNS instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Adding a link

Edit `links.json`, commit, done:

```json
{
  "gh": "https://github.com/",
  "docs": { "url": "https://docs.github.com/en/pages", "title": "GitHub Pages docs" }
}
```

Short form is just `"code": "url"`. Long form adds an optional string `title` shown
on the redirect fallback page. You can edit the file in GitHub's web editor;
the links become live after the commit to `main` finishes deploying.

Codes start with an ASCII letter or number, followed by letters, numbers, `.`,
`_`, or `-`. `index`, `404`, `assets`, and `links` are reserved in any casing.
Two codes cannot differ only by case. Destinations must be absolute HTTP or HTTPS
URLs. Edit a destination to retarget a link; delete its entry to remove it on the
next deployment.

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
