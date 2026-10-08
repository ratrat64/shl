---
title: 'Simplify the README and preserve reference guidance'
type: 'refactor'
created: '2026-10-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Make the README concise and maintainer-first, focusing on features, deployment,
link management, Bash launchers, local development, and important limits. Aim for
100–150 lines. Preserve useful reference guidance in `docs/reference.md` and
contributor guidance in `docs/development.md`; delete repetition and obsolete
notes. Preserve the Running Bash scripts anchor used by the Guide and correct
outdated script-property examples to tags. Check documentation links and examples.

</frozen-after-approval>

## Implementation Notes

- No unresolved intent gaps or irreversible changes; this is a documentation-only
  refactor of three Markdown files plus this workflow record.
- Checked `src/links.mjs`, `src/build.mjs`, `src/pages.mjs`, package scripts, and PR
  workflow against the current README. Reuse existing validation and formatting.
- Updated local main before creating `docs/simplify-readme` in a separate worktree.
  The merged Download change is included: browser Download saves the destination
  script, needs CORS, and does not save or execute the launcher.
- Replaced the long README with seven sections and linked reference/development
  guidance. Removed stale script-property usage and the historical Bun rollback
  note. Preserved script commands, migration rules, validation, custom domains,
  browser checks, and navigation smoke tests.
- Verification passed: README 119 lines versus 315; local documentation links and
  Guide anchors resolve; Bash snippets pass `bash -n`; YAML/JSON examples pass the
  real link-map validator. `bun ci`, `bun run format`, `bun run format:check`,
  `bun build.mjs`, and `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs`
  succeeded (33 tests, no failures). No runtime or generated-file changes.

## Review Triage Log

- Medium, patched: the placeholder script destination needed explicit replacement
  instructions before execution; the README now requires a real trusted script.
- Low, patched: the outer curl pipeline could mask a failed launcher fetch; added
  Bash `set -o pipefail` to the example without changing launcher behavior.
- Low, patched: the JSON conversion example omitted `tools.git`; it now preserves
  the full README example.
- Low, patched: exact-tag query case-insensitivity was implicit; reference states
  it explicitly.
- Low, patched: root user-site support lacked its repository naming requirement;
  reference includes `<owner>.github.io` and prefix-free URL examples.
- Low, patched: deployment "checks" could imply regression tests; development guide
  distinguishes build validation from PR-only regression/browser tests.
- Low, patched: document variant guidance was only linked; added a brief full-shell
  versus minimal-document summary and embedded-foundation rationale.
