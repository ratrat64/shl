---
title: 'Concise feature-focused Guide'
type: 'refactor'
created: '2026-10-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Replace the Guide's About content with concise benefits and useful project functions, and shorten the remaining instructions while keeping them accurate to shipped behavior. Emphasize retargetable short links, searchable folders/tags, copying, visibility control, optional script launchers, and repository-owned static publication. Keep practical setup, editing, public-destination and browser-redirect limitations; link to the current repository README for detailed rules. Preserve the existing Guide layout, shared shell, section fragments and legacy forwards. Do not advertise the planned broken-link checker as available; align state terminology if the concurrent manual-state feature merges during this task.

</frozen-after-approval>

## Implementation Notes

- Small reversible copy-only task; no unresolved intent choices or application side effects. `src/pages.mjs` owns `guidePage`; reuse its `.prose` sections and shared shell. Keep `#about` as the compatibility anchor while changing its visible heading/link to Features.
- `src/build.mjs` passes the actual JSON/YAML source filename and forwards legacy `/about/` to `#about`. Format the editing example for that source; no new helper/module or styles needed. Update README's Guide-section description and moved repository URL.
- Existing Guide/navigation and required-Chrome checks in `test/build.test.mjs` cover section IDs, direct/native loads, legacy forwarding and app history. Run formatting, required-browser suite and build, plus batched desktop/mobile Guide captures. Inspect current rendered Guide before editing.
- Branch/worktree: `docs/concise-feature-guide` at `/tmp/opencode/shl-concise-feature-guide`; starting main revision `007cd020d06cadbae6862ec575577c141bf68413`. Concurrent PR #66 changes manual state tags; inspect any main advancement before merging and keep copy truthful.
- Replaced About's visible title/navigation label with Features, retained all fragment IDs/legacy targets, and condensed setup/usage/build copy. Updated README's section name and the Guide's moved repository URL. Source-format examples now include a tag and use JSON for `links.json`, YAML otherwise, escaped through `esc`.
- Updated existing Guide checks for revised copy and buildable examples from generated Guide pages in all three source formats. Existing native/navigation/theme/legacy checks remain the verification base; no new test suite or styles.
- Review fixes: identify hidden as a link-object field, mention progressive-enhancement dependencies, link directly to script execution commands, and test source-format examples through the builder rather than only the template.
- Main advanced to `e49a77b` with PR #66 during verification. Before resolving the merge, planned to retain the concise feature structure and merged redirect/launcher/recovery code, replacing boolean-hidden instructions with exact state-tag/search behavior and qualifying disabled actions. Resolved only Guide-content conflicts; adopted all state-feature implementation/tests and README changes.
- Canonical integrated main revision: `e49a77b685654ad2fbbae1fe4f3d08eeecb7cd5d`. The final Guide is 411 whitespace-delimited words versus 505 in the merged main Guide (19% less), while its Features section adds state control. Preserved the public-destination, disabled-copy/forwarding, whole-tag search and native behavior facts.
- Verification: Bun 1.4.2 dependency install, format/write and read-only format check, all 30 tests with `SHL_REQUIRE_BROWSER=1`, and build passed on the integrated tree. Existing required rendered matrix covers root/project-prefix direct/native/app loads and themes; inspected current desktop light and mobile dark Guide captures. Mechanical UI detector returned no findings. All four copy/verification review findings were corrected; nothing deferred.

## Review Triage Log

- **Medium / patch:** Hidden instruction could be applied to a directory, which `src/links.mjs` traverses as nested entries and rejects. Specify a link object and default listing/search omission.
- **Low / patch:** Search/copy/reveal claims lacked their JavaScript qualification; native controls are hidden and visible links navigate. Added one concise native-behavior sentence.
- **Low / patch:** Script configuration lacked an execution pointer. Linked README's Running Bash scripts section instead of duplicating its commands.
- **Medium / patch:** Template-only format checks missed incorrect build-to-Guide source propagation. Extract and rebuild samples from generated JSON/YAML/YML Guide pages and assert their source filename.
