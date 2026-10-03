---
title: Remove vendor branding from local AID installation
type: chore
created: 2026-10-03
status: in-review
baseline_commit: 565f20c90a0688224e8b73d26d7c29c0b1c6c618
route: dispatch
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Remove every case-insensitive occurrence of the requested vendor-name substring from this repository's files, including hidden installed skill/config files and any affected Git history. The target is the seven ASCII bytes represented by hexadecimal `53 6f 6e 72 69 73 61`, matched case-insensitively. Encoding the target here avoids reintroducing it into repository content.

The user has authorized editing the existing uncommitted AID installation while preserving unrelated changes, and rewriting/force-pushing affected history if necessary. Investigation found 543 matching occurrences across 308 local files, but none in currently reachable or reflog-reachable Git objects. No history rewrite is required unless verification discovers additional historical matches.

## Boundaries & Constraints

**Always:** Delete only the matching substring, preserving every other byte, file path, permission, and unrelated change. Cover installed `.aid/`, `.agents/`, `.claude/`, `.opencode/`, `.gitignore`, ignored files, and existing generated workflow snapshots. Keep script source and matching test expectations consistent. Preserve original tracked/untracked status of the user's installation; do not publish it or personal configuration as a side effect. Work and test in the task worktree, then apply verified edits to the original local installation.

**Never:** Replace the target with another brand, normalize remaining whitespace/punctuation, discard uncommitted work, alter application behavior, introduce dependencies, or rewrite history that contains no matches. This is repository-local cleanup, not modification of global tooling or upstream packages.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Mixed casing or repeated occurrences | Any casing of the target substring | Remove every occurrence, including within larger strings | Verify zero matches afterward |
| Nonmatching bytes | Surrounding text, scripts, paths, line endings | Remain byte-identical | Reject edits exceeding literal deletion |
| Existing user work | Modified ignore file and untracked installation | Preserve unrelated changes and tracking status | Verify against pre-edit inventory |
| No historical matches | Commit/blob/tree/tag scans are clean | Preserve commit identifiers and remote refs | Repeat object scan after cleanup |

</frozen-after-approval>

## Code Map

- Original installation: `/home/rat/Git/shortlink/shortlink-aid-test/`; uncommitted changes are intentional and user-approved for this cleanup.
- Task worktree: `/home/rat/Git/shortlink/shortlink-branding/`, based on main `565f20c90a0688224e8b73d26d7c29c0b1c6c618`.
- Matching groups: `.agents/` 135 files, `.claude/` 135, `.aid/` 34, `.opencode/` 3, `.gitignore` 1. No matching filenames or executable identifiers were found.
- `.aid/scripts/tests/`: config, customization, renderer, tracker, and review-helper suites. Brainstorming script/test pairs in both installed skill trees contain matching branded HTML text.
- `.aid/_config/aid-help.csv`: matching module labels must be edited consistently; literal deletion may leave leading spaces. Existing rendered snapshots also need cleanup.
- Other active worktrees and inspected Git history are clean. Stale worktree registrations are unrelated to this task.

## Tasks & Acceptance

**Execution:**
- [x] Inventory original bytes and tracking state; confirm remote branch/tag tips are represented in the historical scan. All 15 branch tips from the prior live inventory match cached refs; no remote tags were listed.
- [x] Apply case-insensitive substring deletion in the task copy using file patches, then verify exact byte-preserving transformations.
- [x] Run relevant AID and brainstorming checks; apply validated patches back to the original installation and verify all active worktrees and history are clean. All 225 tests passed using an isolated temporary test environment; exact-byte and history verification passed again afterward.
- [ ] Publish only the task specification and completion evidence through the task branch; do not add the user's untracked installation to version control.

**Acceptance Criteria:**
- Given installed files containing the target in any casing, when cleanup finishes, then no occurrence remains in repository-local files or inspected historical objects.
- Given original files and their cleaned versions, when compared, then each changed file equals the original with only matching substrings deleted.
- Given the existing modified/untracked installation, when cleanup completes, then unrelated changes and original tracking status remain intact.
- Given installed AID scripts and their assertions, when applicable checks run, then the cleanup introduces no test regressions.
- Given history without matching objects, when final verification runs, then existing commit IDs and remote refs remain unchanged.

## Implementation Notes

- The user approved this specification and continuing implementation. Publication is deferred to the final workflow step; implementation must not commit, push, or perform remote operations. Use already fetched refs and the prior remote-tip inventory when verifying history.
- Applied the approved literal deletion to 308 original files and their task copies. Exact comparison of all 5,879 original files proves preservation of unrelated bytes, permissions, paths, index entries, and tracking status.
- Verification includes all matrix rows: mixed-case/repeated/embedded/binary literal-deletion assertions, exact original-file comparisons, original Git index/status equality, unchanged refs, and raw-history scans.
- The initially missing test runner was installed only in a temporary external environment; 159 AID tests and both 33-test brainstorming suites passed.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and disposition |
| --- | --- | --- |
| Blind 1: directory/symlink coverage | low | Initial helper omitted those checks. Extended verifier inspected 1,426 directories and 8 symlink names/targets with zero matches; evidence corrected. |
| Blind 2: unreachable history objects | low | Initial history scan was refs/reflogs only. All-object scan also checked unreachable objects, 271 stored objects at that snapshot, with zero matches; evidence corrected. |
| Blind 3: deletion exposing a new target | false | This is possible for constructed input, but every actual cleaned file was independently scanned and contains zero matches. Exact-byte comparisons prove the approved single deletion is sufficient for this installation; no general-purpose replacement API is shipped. |
| Blind 4: publication conflicts with implementation boundary | false | Implementation Notes explicitly defer publication to the final workflow step, which is separate from the implementation phase's no-remote rule. |
| Blind 5: absolute temporary diff headers | false | The temporary review artifact is never applied or published; original changes were separately patched and independently verified byte-for-byte. Publication uses repository-relative Git paths. |
| Blind 6: successful test evidence | low | Added exact successful pytest commands and their 159/33/33 results; failed attempt logs are explicitly labeled historical. |
| Blind 7: private/hard-coded verification artifacts | low | Added sanitized reproduction guidance and snapshot boundaries; private before-inventory stays outside Git. |
| Blind 8: upstream refresh can restore branding | low | Documented installation-refresh lifetime and the scan/removal to rerun afterward. No requirement to modify upstream/global tooling was requested. |
| Blind 9: post-publication verification boundary | low | Evidence now distinguishes pre-existing ref preservation from the new documentation branch commits; final all-object/filesystem scan is required after publication. |
| Blind 10: existing framework-version mismatch | false | Both version labels predate cleanup and contain no target substring; exact-byte-preservation intent expressly excludes changing them. No version behavior was introduced. |

Edge-case review returned no findings. Verification-gap review returned no gaps. No scope ambiguity or implementation blocker remains.

## Verification

Implementation cleanup and full-suite verification are complete; publication remains pending. See [completion evidence](verification-remove-vendor-branding.md) for exact checks, results, and scope. No history rewrite was needed.

- Complete case-insensitive filesystem scan including hidden/ignored files, excluding Git object internals from the filesystem traversal.
- Raw Git object scan over all refs and reflogs, including blob, commit, tree, and tag bytes.
- Exact before/after byte comparison for the 308 affected files.
- Existing `.aid/scripts/tests/` and both brainstorming script test suites; distinguish unavailable dependencies or pre-existing failures from cleanup regressions.
- `git diff --check` and final status/ref inspection.
