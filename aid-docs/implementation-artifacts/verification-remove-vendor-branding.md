# Vendor branding cleanup verification

Date: 2026-10-03

## Changes

- Removed 543 case-insensitive matches of the seven-byte target encoded in the specification from 308 local files: `.agents/` 135, `.claude/` 135, `.aid/` 34, `.opencode/` 3, and `.gitignore` 1.
- Changes were generated as file patches, checked and applied in the existing task worktree, then applied to the original local installation after verification.
- Script source, matching test assertions, help CSV labels, and existing rendered snapshots received the same literal deletion. Remaining whitespace and punctuation were preserved.

## Passed checks

- Inventoried all 5,879 regular files in the original installation before cleanup, recording exact bytes and permission modes, index entries, porcelain status, and refs.
- Compared every original file afterward: each equals its original bytes with only the target substrings removed; the path set and all permission modes are identical. The index and modified/untracked status are identical to the pre-edit inventory.
- Scanned hidden and ignored files in all four existing worktrees: no target remains in contents or filenames. Stale registrations were left alone.
- Scanned 235 raw Git objects reachable from refs or reflogs: 111 blobs, 60 commits, and 64 trees. No matching objects were found before or after cleanup. Ref tips were explicitly included, covering 16 cached remote refs; no local tags exist. All local and cached remote refs remain byte-identical. A separate scan of 109 shared Git metadata files, excluding object storage, also found no matches.
- Ten existing configuration/customization tests accepting only a temporary directory ran directly using the standard library and passed, including Unicode output, credential redaction, layer resolution, and invalid-root handling.
- Both brainstorming generators produced HTML for the shipped 108-technique, 13-category catalog and listed categories successfully. Their generated HTML equals pre-cleanup output with only the target deleted. Changed Python sources parsed successfully.
- A runnable literal-deletion check passed for mixed casing, repeated adjacent matches, embedded matches, CRLF, and nonmatching binary bytes.
- `git diff --check` passed in both the task worktree and original installation.
- Full test suites passed using an isolated environment outside the repository: 159 tests in `.aid/scripts/tests/`, 33 in the `.agents/` brainstorming suite, and 33 in the `.claude/` brainstorming suite (225 total). No application dependency was added.
- Repeated exact-byte, tracking-state, all-worktree, metadata, and raw-history checks after the full suites passed.
- Compared all 15 branch tips from the preceding live `git ls-remote --heads --tags origin` inventory against the cached remote refs: every tip matches and is included in the raw-object scan; the live inventory contained no tags.
- Node.js 24 verification also passed: `npm ci`, all 12 existing application tests, and a successful build of 26 configured links.
- The later `python3 /tmp/opencode/branding_final_verify.py` check passed with zero matches in directory names, regular-file names/content, symlink names/targets, and all stored Git objects, including unreachable objects. Its snapshot inspected 1,426 directories, 12,102 regular files, 8 symlinks, 134 blobs, 64 commits, and 73 trees. These are verification-time snapshot counts, not fixed expectations; documentation publication can change file and object counts.

### Successful isolated-environment commands

Run from `/home/rat/Git/shortlink/shortlink-branding` using the existing external test environment:

```bash
/tmp/opencode/branding-test-env/bin/python -m pytest -q -p no:cacheprovider .aid/scripts/tests
/tmp/opencode/branding-test-env/bin/python -m pytest -q -p no:cacheprovider .agents/skills/aid-brainstorming/scripts/tests/test_brain.py
/tmp/opencode/branding-test-env/bin/python -m pytest -q -p no:cacheprovider .claude/skills/aid-brainstorming/scripts/tests/test_brain.py
```

The recorded successful results were respectively **159 passed**, **33 passed**, and **33 passed**. The external environment and `/tmp` artifacts are local prerequisites, not repository dependencies or published artifacts.

### Sanitized scan guidance

Construct the case-insensitive byte matcher as `re.compile(bytes.fromhex('53 6f 6e 72 69 73 61'), re.I)` so the target is not reintroduced in verification instructions. Enumerate every existing worktree, including hidden and ignored entries; inspect directory and file names, regular-file bytes, and symlink names plus `os.readlink()` targets without following links outside the repository. Scan Git metadata separately from object storage. For historical coverage, use `git cat-file --batch-all-objects --batch` and inspect every object's raw payload by the header's byte length, including unreachable objects; a refs/reflog-only traversal is insufficient. Require zero matches and compare exact bytes, permissions, paths, and tracking state against the private pre-edit inventory. Keep that inventory outside version control; publish only sanitized counts and outcomes.

## Publication and Scope

- Initial full-suite attempts lacked pytest; this was resolved by installing pytest in `/tmp/opencode/branding-test-env`, then successfully running all three suites.
- No history rewrite or force-push is necessary: the current installation was never committed, and scanned history contains no matching content.
- The initial prepublication snapshot recorded unchanged local/cached remote refs and commit identifiers relative to the cleanup inventory. That statement describes the cleanup verification boundary, not a promise that refs remain unchanged after publication. Planned new documentation commits may advance the task branch and add Git objects; they do not rewrite existing history. Only this evidence and the specification are intended for publication; the copied installation and personal configuration must stay local.
- An installation refresh can restore the removed text from upstream files. After each refresh, rerun the same repository-local scan and literal-substring removal, then verify again.

## Local reproducibility artifacts

Outside the repository, `/tmp/opencode/branding_cleanup.py` and `/tmp/opencode/branding_checks.py` contain the initial checks, and `/tmp/opencode/branding_final_verify.py` contains the passed all-stored-object and directory/symlink check. `/tmp/opencode/branding-before.pickle` stores the private before-inventory. The `baseline-{0,1,2}.log`, `cleaned-{0,1,2}.log`, and `pytest-cleaned-{0,1,2}.log` files are historical failed attempts before the isolated pytest environment was available, **not successful-suite logs**. Successful suite results are recorded above. These local artifacts and private installation configuration are not publication material.
