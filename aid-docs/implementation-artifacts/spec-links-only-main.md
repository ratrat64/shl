---
title: 'Allow links-only commits directly to main'
type: 'chore'
created: '2026-10-10'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Allow maintainers and agents to commit and push links-config-only changes directly to `main`. Every outgoing commit must change only root `links.yaml`, `links.yml`, or `links.json`; exactly one valid config must remain, and formatting, tests, and build must pass. Other and mixed changes retain the task-branch, separate-worktree, and PR workflow.

Update `AGENTS.md`, `README.md`, and `docs/development.md` to document this exception. Enable an Always administrator bypass on GitHub's existing Require PR validation ruleset, preserving its current protections for non-bypass actors. The user selected this setup knowing that GitHub's bypass is not file-scoped and manual pushes rely on following the rule. Do not add hooks or a publishing workflow. Publish these instruction changes through a normal PR.

</frozen-after-approval>

## Implementation Notes

- Updated the agent exception and its branch/worktree/PR qualifiers, plus README and contributor guidance. Direct commits require local `main`, an isolated working tree, exact validated staged contents, required-browser tests, and inspection of every outgoing commit including merge diffs.
- Verification: Bun 1.4.2; `bun ci`, `bun run format`, `bun run format:check`, `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` (50 pass, 0 fail), and `bun build.mjs` (68 links) succeeded. Formatting made no application changes.

## Review Triage Log

- False: bypass described as active before applying it. Publication is coordinated with the authorized ruleset update, whose final state is checked before completion.
- Low, corrected: pull operates on the current checkout. Guidance now explicitly requires local `main`.
- Medium, corrected: formatting could modify unrelated work. Direct workflow now requires no unrelated working-tree changes, otherwise use the isolated branch/worktree/PR workflow.
- Medium, corrected: partial staging or unrelated work could invalidate checks. Stage complete validated contents and require no unstaged tracked changes.
- Medium, corrected: missing required-browser mode allowed skipped checks. Direct workflow now uses the same required-browser mode as CI.
- Medium, corrected: ordinary log omits merge diffs. Outgoing inspection now uses `--diff-merges=first-parent`.
- Low: missing ruleset verification evidence. Completion records compare active enforcement, main targeting, PR rule, and strict PR validation with the before-state, allowing only the administrator Always bypass addition.
