# Shortlink PRD Addendum

## Technical Context

The root `build.mjs` forwards to the generator in `src/build.mjs`; `test/build.test.mjs` verifies validation, generated behavior, and rendered consistency when Chrome is available. Bun 1.4.2 is the build/test CI runtime. The sole package dependency is the YAML parser; no frontend framework is required. Shared component ownership follows architecture AD-7–AD-9. Generated HTML, CSS, and JavaScript are published from `dist/`, which includes `.nojekyll` and optionally `CNAME`.

`.github/workflows/check.yml` runs tests and a build on pull requests targeting `main`, except its `AGENTS.md`-only shortcut. `.github/workflows/deploy.yml` installs dependencies, builds, and deploys on pushes to `main` or manual dispatch; it does not itself run the regression tests. Merge requirements are configured through GitHub repository rulesets.

The README recommends requiring a pull request, a passing GitHub Actions `PR validation` check, and an up-to-date branch before merging to `main`. Its baseline does not require an approving review. This is recommended repository configuration, not behavior enforced by the generated site.

### Maintainer's Script Example

The checked-in `setup/ohmyposh/stable` entry uses `script: true` and points to:

```text
https://raw.githubusercontent.com/ratrat64/homelab-public/9a32b5a83044bbbb0f7b01a7b76bb5e929950b80/scripts/ubuntu/oh-my-posh/setup.sh
```

The maintainer selected this commit as known-working; this PRD does not independently verify the destination script. The `latest` sibling uses the moving `main` reference.

```bash
curl -fsSL https://your-user.github.io/shl/setup/ohmyposh/stable.sh | bash
```

Launchers require Bash, curl, mktemp, and rm. The browser path ending in `/` returns redirect HTML rather than a runnable script. Arguments can be supplied through `bash -s --`.

## Automation Editing Options

**Selected now:** Use GitHub's existing API to edit the repository's YAML/JSON link map. This leaves Shortlink static and reuses its publication workflow; no Shortlink API integration is implemented by this documentation task. An automation needs its own appropriate GitHub credentials and repository permissions.

**Existing alternative:** Direct YAML/JSON editing through a Git checkout or GitHub's web editor already works. It is not a future feature. Improvements to this workflow may be considered later.

**Possible future conveniences:**

- CLI/helper tooling that writes entries into the same link map.
- A browser editor that submits repository changes using GitHub's API. Any design must preserve static hosting; authentication flows requiring a server-side secret would conflict with the no-backend constraint.

**Excluded:** A dedicated application API adds a backend, even if it stores changes in Git instead of a database.

## Future Enhancement Candidates

These ideas are recorded for later consideration, not included in the current-state functional requirements or assigned a delivery date.

### Implemented Since the Original Baseline

Directory-hidden links are now part of FR-1/FR-9/FR-10: `hidden: true` omits entries and hidden-only groups from default listings/search/counts, and the directory toggle reveals them. Redirects, launchers, and the public map remain available. Searchable tags and inline disclosures are also implemented. These are current capabilities, not future commitments.

### Organization Guidelines

Provide naming and grouping guidance for libraries with hundreds of entries. The maintainer sees organization as harder at that size, whereas config editing and PR publication are straightforward for the intended engineer. Guidelines should be distinguished from existing enforced syntax/collision rules and should not be represented as a current standard taxonomy.

## Evidence References

- User coaching conversation: vision, audience, reference-first directory use, expected scale, success criteria, and future scope.
- `README.md` and UX `PRODUCT.md`/`DESIGN.md`/`EXPERIENCE.md`: current product, usage, visual, and interaction contracts.
- `src/links.mjs`, `src/layout.mjs`, `src/directory.mjs`, `src/pages.mjs`, `src/styles.mjs`, `src/browser.mjs`, and `src/build.mjs`: validation, component composition, rendering, browser behavior, and publication.
- `.github/workflows/check.yml` and `.github/workflows/deploy.yml`: PR checks and publication behavior.
- `links.yaml`: current flat/nested examples and moving/commit-pinned script destinations.

Original evidence snapshot: repository commit `565f20c`. References refreshed 2026-10-07 alongside the approved modular consistency update; later changes require rechecking them.
