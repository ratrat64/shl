---
title: 'Unruled Guide with more title spacing'
type: 'feature'
created: '2026-10-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Remove horizontal section dividers from the Guide and give the content below its title more breathing room.

</frozen-after-approval>

## Implementation Notes

- Small, reversible styling refinement with no unresolved intent gaps or irreversible operations.
- Reuse `.prose` in `src/assets/site.css`: increase its page-title bottom margin from 1rem to 2rem; remove section border while preserving section spacing.
- Update existing structural and rendered checks in `test/build.test.mjs`, including direct/native and in-app Guide spacing in the existing light/dark, desktop/mobile, root/project matrix.
- Synchronize Guide separator instructions in AGENTS.md, DESIGN.md, EXPERIENCE.md and architecture AD-8 with the requested unruled content.
- Inspected the existing desktop Guide screenshot before editing. Use Bun 1.4.2, formatting, required Chrome tests and build for verification.
- This requested refinement supersedes the Guide separator requirement in the completed `spec-modular-ui.md`; its remaining shared UI contracts still apply.
- Verification passed: `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (39 passed, no failures), and `bun build.mjs` (68 links). The existing browser matrix executed light/dark, desktop/mobile, root/project, direct/native and app navigation checks, plus minimal documents and 404 recovery.
- Inspected final desktop-light and mobile-dark screenshots; Guide title separation and unruled section rhythm render correctly. Mechanical UI detector returned no findings. Review corrections are resolved; no deferred findings.

## Review Triage Log

- Low, patched: the rendered title-gap check only enforced a pixel minimum; compare the gap with exactly 2rem using the computed root font size and rounding tolerance.
- Low, patched: preserved section spacing lacked regression proof; check existing 2.5rem margins and 1rem padding in the same rendered matrix.
- Low, patched: explicitly identify the older completed separator requirement as superseded here; retain historical frozen intent.
