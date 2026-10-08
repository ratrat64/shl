# Publication and rollout

## Workflow ownership — CAP-1/4/5

- Add a separate checker workflow: daily schedule plus `workflow_dispatch` for maintainer-started full-map rechecks. Scheduled Actions execution is best-effort. Exact UTC time is an implementation choice; choose an off-hour minute rather than the top of an hour.
- Do not add destination requests to required PR validation, `src/build.mjs`, or deployment. Builds validate syntax/schema and publish the repository snapshot, not current external availability.
- Use one checker concurrency group so scheduled/manual runs cannot race publisher state. A cancelled run cannot publish partial output.
- Report-only mode uses the same evaluation, mutation calculation and proposed diff as write mode, without committing, pushing, creating/updating/closing PRs or deploying. Ephemeral local calculation is allowed; published source remains unchanged.
- Use Bun 1.4.2 and native/stdlib request facilities plus installed `yaml`. Run source commands from the repository root; reuse current formatting and tests rather than add a second framework or source contract.

## Safe proposal lifecycle — CAP-3/4

1. Scan an explicit `main` SHA and associate evidence with each full configured destination. Compute the desired source diff from that snapshot, preserving the policy companion's fidelity rules.
2. Apply pinned formatting, source validation, required-browser regression tests and build to the proposed map. Only the authoritative root source file is eligible for a bot commit; generated `dist/` and report history are not committed.
3. Refetch `main` before publishing. If its SHA changed, discard the new candidate and report that a fresh run is needed. Do not automatically reconcile stale evidence over changed destinations or human tag edits.
4. Create or update at most one open bot PR against `main`. Use a recognizable bot-managed branch; verify its expected head and absence of unexpected human commits before writing. Unexpected edits or an unsafe refresh stop publication rather than overwrite work. Do not unconditionally force-push.
5. Calculate later proposals afresh from current `main`, not by replaying an old whole-file patch. Replace unsupported pending suggestions or close a now-empty bot PR only after the same ownership/freshness checks. If safe refresh cannot be made, stop and report the blocker.
6. Put source SHA, check time, proposed additions/removals, unknown/skipped coverage, policy limits and run evidence in the PR description. No new diff means no new source commit/PR. An existing obsolete PR still needs withdrawal/closure; unknown evidence does not justify carrying forward an unmerged change.
7. A maintainer approves validation when required, waits for required PR checks, refreshes aged findings or findings affected by destination edits, and merges. Confirm the existing **Deploy shl** workflow completes and the deployed map reflects the merged tags.

Withdrawing a pending suggestion is not clearing a live tag: if a previous run proposed adding `broken` but current `main` still lacks it and a new run is unknown, the new desired diff contains no addition. If `main` already has `broken`, the same unknown preserves it. No ownership metadata is needed.

Source-SHA checks limit stale proposals; they do not establish current reachability at merge time or guarantee the remote cannot change immediately afterward. Respect repository merge/up-to-date rules and show evidence age. Publisher/internal failures fail with available reports; never fall back to writing main or deploying uncommitted generated output.

## Credentials and existing checks

Use the repository `GITHUB_TOKEN`; grant `contents: write` and `pull-requests: write` only where source proposals are published. Destination requests do not send that token. Repository settings must allow workflow-created PRs; verify this and actual merge rules at rollout. Do not add privileged execution of untrusted PR code for the checker.

According to [GitHub's triggering documentation](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow), checked during exploration on 2026-10-08:

- `GITHUB_TOKEN`-created/updated PRs with opened/synchronize/reopened events create **approval-required workflow runs**. Document the maintainer's **Approve workflows to run** step; the checker does not bypass required validation.
- A `GITHUB_TOKEN` push does **not** trigger push workflows. This v1 therefore relies on human merge for the normal push-to-main deployment, not direct token writes.
- Dispatch exceptions and App/PAT event triggering exist, but alternate credentials, direct writes and unattended merging are outside this v1.

Current workflow responsibilities remain:

| Workflow | Trigger | Existing responsibility |
| --- | --- | --- |
| `.github/workflows/check.yml` | PR targeting `main` | Bun install, formatting, required-browser regression tests, build; read-only repository permission; preserve AGENTS-only exception |
| `.github/workflows/deploy.yml` | Push to `main` or manual dispatch | Format/build and deploy only `dist/`; no regression-test step |

Source proposals run the current checks before publication and still require **PR validation** before human merge. External unknown/broken findings do not fail structural CI or deployment. Invalid proposed maps and internal/publisher failures do.

## Rollout and contract alignment

1. Implement the manual state-tag spec and hidden migration. Preserve its forwarding, disabled enforcement, filtering and presentation guarantees.
2. Exercise representative full-map manual scans in report-only mode. Inspect classifications, coverage, remote rate limits and duration; record intentional budget tuning before source-writing activation.
3. Enable daily/manual source-edit proposals, document invocation, manual broken removal, uncertainty limitations, token workflow approval, review/merge and deployment confirmation.

The manual companion's “maintainer-assigned warning” expands to a warning assigned by maintainers or this checker, based on latest conclusive disappearance/recovery evidence. It is still not a current visitor-availability guarantee, and broken alone still does not block forwarding. Its deferred automation paragraph is resolved only by this separate contract.

AD-1/AD-6 already permit repository-owned external writing and ordinary static publication. AD-7's readonly build snapshots remain binding: the writer edits a separate source document rather than mutating shared build projections. Synchronize live instructions/README/Guide that would imply manual-only broken management; keep UI contracts and historical planning records intact. This spec-authoring task does not amend application code or assert implementation readiness of the manual feature.

## Acceptance cases

1. **Mode/timing:** Scheduled and manual invocations scan all leaves; report-only computes the same desired diff but performs zero repository/PR/deployment writes. Reachability checking is absent from ordinary build/PR-validation/deploy execution.
2. **Guards:** Changed main SHA, unexpected bot-branch commits/head, overlapping runs, hard cancellation, source validation/check failure and publisher failure produce no stale/partial commit or fallback deployment; safe cases commit only the source-map diff.
3. **PR refresh:** At most one open bot PR; fresh evidence removes unsupported suggestions and closes an empty PR. Verify unknown withdraws an unmerged addition without removing a live broken tag. Unsafe branch refresh reports a blocker rather than overwriting.
4. **Operational smoke:** In the actual repository, demonstrate permitted token PR creation, approval-required PR validation, passing required checks, human merge and successful Pages deployment reflecting the merged source. If settings prevent this, report the setup blocker rather than bypass it.
5. **Fidelity/no-op:** A repeated identical run produces no new source commit/PR, preserves human unrelated edits, and leaves generated output/evidence out of commits. No claim of reachability freshness survives beyond the recorded evaluation time.

These are implementation/rollout gates, not proof supplied by authoring the spec.
