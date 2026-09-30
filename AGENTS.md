# Working in this repository

## Branch and worktree workflow
- Before creating a new branch or worktree, update local `main` from `origin/main` with a fast-forward pull.
- Before making changes, create one task branch and a separate Git worktree; do the work and run checks there. Keep related features for the task together in that worktree.
- Preserve existing uncommitted work when consolidating changes from other worktrees.
- If `main` advances during feature work, check whether the feature needs changes to align with it; if so, make a plan for those changes before editing.
- A feature is ready only after a pull request is opened and checked for merge conflicts against the current `main`.
- If resolving a conflict needs user input, report the blocker and stop; do not mark the feature ready.

## Git permissions
- The user authorizes agents to write commit messages, commit task changes, push commits, and publish new branches without asking again for each operation.

## Build and verification
- Use Node.js 22 (the CI version) and `npm ci` to install the YAML parser. Launcher tests also require Bash.
- CI installs dependencies, runs `node --test build.test.mjs`, then `node build.mjs`. Run from the repository root: build input and output paths are relative to the working directory. No lint or typecheck suite is configured.
- Focused routing checks: `node --test --test-name-pattern="404" build.test.mjs`. Tests build in temporary directories and execute generated scripts with simulated browser APIs; actual Pages 404 behavior needs a deployed browser smoke test.
- A successful build deletes and recreates `dist/`. Edit the templates in `build.mjs`, not generated files.
- Optional local preview: `npx serve dist`. Redirects use HTML meta refresh and JavaScript, not HTTP redirects; `curl -L` does not follow them.

## Link and routing constraints
- Exactly one of `links.json`, `links.yaml`, or `links.yml` must exist. Each accepts a URL string, a link object with `url`/optional `title`/optional `script`, or a nonempty nested object for a directory. All formats produce public `dist/links.json` for the browser-side 404 handler.
- `script: true` adds a `<code>.sh` Bash launcher. Launcher URLs require exact casing and no trailing slash; filename collisions with codes are rejected case-insensitively before output is removed.
- Every path segment must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`. Reserved names and case-insensitive collisions are rejected among siblings, including generated filenames such as `index.html` and launcher `.sh` files. A directory cannot also be a redirect.
- Destination validation requires an absolute HTTP(S) URL parsed by `URL`; it does not check reachability. Validation completes before output is removed.
- Inline-script values need `scriptString`, not just `JSON.stringify`: HTML recognizes `</script>` inside JavaScript strings. Use `esc` for HTML contexts.
- Bash destinations need `shellString` for shell quoting. Launchers download fully before execution, forward arguments and exit status, and clean up on exit. Tests use a stubbed `curl` and harmless payloads.
- Generated directories preserve code casing. Wrong-case requests rely on GitHub Pages serving `404.html`, which fetches the link map and matches the entire relative path case-insensitively, including directory pages.
- Routing must support both user-site roots and project-site prefixes (`/<repo>/`); no base-URL environment variable is needed. The homepage shows expandable nested directories, with browseable pages at each directory URL; use relative short-link paths and escape displayed values. The link map remains public.

## Deployment
- `.github/workflows/deploy.yml` checks, builds, and deploys on pushes to `main` or manual dispatch. Only `dist/` is uploaded; an optional root `CNAME` is copied there by the build.
