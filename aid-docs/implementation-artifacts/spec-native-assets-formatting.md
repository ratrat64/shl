---
title: Native browser assets and source formatting
type: refactor
created: 2026-10-07
status: done
route: oneshot
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Browser JavaScript and CSS currently live inside strings, making human editing harder. Extract them into native files without changing site behavior. Keep HTML in the existing modules and try embedded HTML formatting. Add a pinned formatter and local commands; CI may format its checkout before testing/building. Work in a separate worktree incorporating the uncommitted main formatting while preserving the original files.

</frozen-after-approval>

## Implementation Notes

- Updated main to the latest shared-UI refactor, preserving the original six uncommitted file snapshots in the original worktree and a named Git stash. Their formatting-only changes are incorporated through Prettier on the newer modules, rather than reverting the new shared-UI behavior.
- Native assets live in `src/assets/`; build copies them with stdlib `cp`. Module-relative CSS/theme loaders preserve embedded foundations on 404 and minimal documents and builds in temporary working directories.
- Prettier 3.9.9 uses default formatting, scoped to application source/tests/build/workflows/package/link-map files. Both CI workflows apply `format` before their existing gates; `format:check` provides an optional read-only local command.
- `/* HTML */` annotations enable embedded formatting without a runtime tag or changing template escape semantics. Complex conditional attribute templates remain partially unformatted; existing escaping and whitespace-sensitive Guide examples are preserved.
- Verified `bun ci`, formatting idempotence, 25 passing tests with Chrome required, `bun build.mjs` (26 links), and `git diff --check`.
- Independent workflow review found no substantiated actionable issues. It verified exact formatted runtime JS extraction, CSS equivalence, module-relative asset copies, embedded foundations, escaping, Guide sample whitespace, and retained regression assertions. No findings were deferred.
