# Working in this repository

## Build and verification
- Use Node.js 22 (the CI version). There is no package manifest or dependency-install step.
- CI runs `node --test build.test.mjs` then `node build.mjs`. Run from the repository root: build input and output paths are relative to the working directory. No lint or typecheck suite is configured.
- Focused routing checks: `node --test --test-name-pattern="404" build.test.mjs`. Tests build in temporary directories and execute generated scripts with simulated browser APIs; actual Pages 404 behavior needs a deployed browser smoke test.
- A successful build deletes and recreates `dist/`. Edit the templates in `build.mjs`, not generated HTML.
- Optional local preview: `npx serve dist`. Redirects use HTML meta refresh and JavaScript, not HTTP redirects; `curl -L` does not follow them.

## Link and routing constraints
- `links.json` accepts either a URL string or `{ "url": "...", "title": "..." }` per code. It is copied into the public site and used by the browser-side 404 handler.
- Codes must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`. `index`, `404`, `assets`, and `links` are reserved, case-insensitively; codes differing only by case are rejected.
- Destination validation requires an absolute HTTP(S) URL parsed by `URL`; it does not check reachability. Validation completes before output is removed.
- Inline-script values need `scriptString`, not just `JSON.stringify`: HTML recognizes `</script>` inside JavaScript strings. Use `esc` for HTML contexts.
- Generated directories preserve code casing. Wrong-case requests rely on GitHub Pages serving `404.html`, which fetches the link map and matches the final path segment case-insensitively.
- Routing must support both user-site roots and project-site prefixes (`/<repo>/`); no base-URL environment variable is needed. The homepage intentionally does not list links, but the link map remains public.

## Deployment
- `.github/workflows/deploy.yml` checks, builds, and deploys on pushes to `main` or manual dispatch. Only `dist/` is uploaded; an optional root `CNAME` is copied there by the build.
