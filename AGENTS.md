# Working in this repository

## Git workflow
- The agent may write commit messages, push commits, and publish new branches for requested work. Use a task branch for changes intended for a pull request; do not push directly to `main`.

## Session startup
- At the start of a new session, before tackling the first task, read `README.md`, `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/PRODUCT.md`, `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md`, and `package.json`. For UI tasks, also read the adjacent `EXPERIENCE.md`. Identify the relevant code paths, then briefly summarize how the project works and what you will inspect for the task.

## Branch and worktree workflow
- Before creating a new branch or worktree, update local `main` from `origin/main` with a fast-forward pull.
- Before making changes, create one task branch and a separate Git worktree; do the work and run checks there. Keep related features for the task together in that worktree.
- Preserve existing uncommitted work when consolidating changes from other worktrees.
- If `main` advances during feature work, check whether the feature needs changes to align with it; if so, make a plan for those changes before editing.
- For every task that changes repository files, after checks pass, commit and push the task branch and open a pull request against `main` without waiting for a separate request. Check the pull request for merge conflicts against the latest `main` and report its status.
- Check the pull request's merge status before finishing and again in later sessions. Once it is merged, remove its local worktree and delete its local task branch; do not discard uncommitted work.
- If resolving a conflict needs user input, report the blocker and stop; do not mark the feature ready.

## Git permissions
- The user authorizes agents to write commit messages, commit task changes, push commits, and publish new branches without asking again for each operation.

## Build and verification
- Use Bun 1.4.2 (the CI version) and `bun ci` to install the YAML parser. Launcher tests also require Bash.
- CI installs dependencies, runs `bun test --timeout 30000 ./test/build.test.mjs`, then `bun build.mjs`. Run from the repository root: build input and output paths are relative to the working directory. No lint or typecheck suite is configured.
- Focused routing checks: `bun test --test-name-pattern="404" ./test/build.test.mjs`. Tests build in temporary directories and execute generated scripts with simulated browser APIs; actual Pages 404 behavior needs a deployed browser smoke test.
- A successful build deletes and recreates `dist/`. Edit the templates in `src/pages.mjs`, not generated files; input validation lives in `src/links.mjs`, and `src/build.mjs` writes the site.
- Optional local preview: `bun run dev` builds and serves `dist/` with pinned `http-server`; restart it after editing links. Redirects use HTML meta refresh and JavaScript, not HTTP redirects; `curl -L` does not follow them.

## Link and routing constraints
- Exactly one of `links.json`, `links.yaml`, or `links.yml` must exist. Each accepts a URL string, a link object with `url`, optional `title`, boolean `script` and `hidden`, and an optional `tags` array of nonblank strings, or a nonempty nested object for a directory. All formats produce public `dist/links.json` for the browser-side 404 handler.
- `script: true` adds a `<code>.sh` Bash launcher. Launcher URLs require exact casing and no trailing slash; filename collisions with codes are rejected case-insensitively before output is removed.
- Every path segment must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`. Reserved names and case-insensitive collisions are rejected among siblings, including generated filenames such as `index.html` and launcher `.sh` files. A directory cannot also be a redirect.
- Destination validation requires an absolute HTTP(S) URL parsed by `URL`; it does not check reachability. Validation completes before output is removed.
- Inline-script values need `scriptString`, not just `JSON.stringify`: HTML recognizes `</script>` inside JavaScript strings. Use `esc` for HTML contexts.
- Bash destinations need `shellString` for shell quoting. Launchers download fully before execution, forward arguments and exit status, and clean up on exit. Tests use a stubbed `curl` and harmless payloads.
- Generated directories preserve code casing. Wrong-case requests rely on GitHub Pages serving `404.html`, which fetches the link map and matches the entire relative path case-insensitively, including directory pages.
- Routing must support both user-site roots and project-site prefixes (`/<repo>/`); no base-URL environment variable is needed. The homepage shows expandable nested directories, with browseable pages at each directory URL; use relative short-link paths and escape displayed values. The link map remains public.

## Deployment
- `.github/workflows/deploy.yml` checks, builds, and deploys on pushes to `main` or manual dispatch. Only `dist/` is uploaded; an optional root `CNAME` is copied there by the build.

## Shared UI ownership and consistency
- Before adding or changing UI, inspect and reuse the existing component, helper, or pattern. Extract repeated structure or behavior with the same responsibility; keep unique page content local.
- Render the shared site shell (header, navigation, theme control, and footer) through `src/layout.mjs`; pages supply content inside `<main>`. Reuse directory components in `src/directory.mjs` and browser behavior in `src/browser.mjs`; do not duplicate them in page templates.
- Keep shared styles and design tokens in `src/styles.mjs`. Scope page-specific styles to page content; do not override shared chrome through page selectors unless the variant is explicitly approved and documented in `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md` and the adjacent `EXPERIENCE.md`.
- Keep shared chrome visually consistent across Links, nested directories, and Guide, except active navigation state and documented variants. Reconcile conflicting design instructions before implementing a new consistency rule.
- For shared UI changes, verify generated structure and rendered appearance across those pages in light/dark themes and desktop/mobile layouts, including direct loads and in-app navigation. Reuse existing checks; add a focused regression check when it can catch the changed behavior.
- Do not treat shared markup as proof of visual consistency: body classes and CSS overrides can change the same component's appearance. Check those selectors and the design specifications when diagnosing differences.
