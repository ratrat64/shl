# Input reconciliation: README.md

Date: 2026-10-03. Compared `README.md` with `prd.md` and `addendum.md`; checked `build.mjs`, `links.yaml`, and `.github/workflows/{check,deploy}.yml`. The relevant source and implementation files are identical between the PRD's `565f20c` snapshot and the agent checkout.

## Substantive gap

1. **The recommended merge-policy baseline is only partially captured.** `README.md:133–137` specifies an active `main` ruleset requiring a PR, the GitHub Actions **PR validation** check, and an up-to-date branch; approving reviews are optional. `prd.md` FR-4 correctly distinguishes external ruleset configuration from application behavior, but does not preserve that baseline, especially the up-to-date-branch requirement. The addendum only says merge requirements are configured through rulesets. Preserve the baseline as recommended repository configuration, not as an enforced application capability or proof that the live repository has that ruleset.

## Captured commitments

- FR-1–FR-4 cover source selection, schema, nesting, path validation, retargeting/removal, validation-before-output-replacement, and PR publication.
- FR-5–FR-11 cover browser redirects, case recovery, root/project hosting, optional custom domains, browsing/search, guide compatibility URLs, and theme persistence.
- FR-12–FR-14 and the addendum cover launcher URL restrictions, prerequisites, download-before-execution, cleanup, argument/exit forwarding, and the public generated map.
- Quality constraints and open items preserve public metadata, no backend/tracking, destination syntax rather than reachability, complete output regeneration, and deployed routing smoke-test limitations.

## Stale source statements, not draft gaps

- `README.md:5,20` describes deployment as checking/building/deploying. `deploy.yml:26–29` installs and builds but does not run regression tests; `check.yml:40–45` runs tests/build on PRs. The addendum's Technical Context already makes the correct distinction.
- The README's root `ohmyposh-setup-stable` example and claim about a checked-in `scripts/ohmyposh-setup` entry (`README.md:95–112`) are illustrative/stale relative to `links.yaml:45–51`, which contains nested `ohmyposh-setup-latest` and `ohmyposh-setup-stable`. The draft correctly uses the current nested, commit-pinned example.

## Reconciliation boundary

Exact setup commands, DNS instructions, examples, and template filenames need not be duplicated in the PRD. Hidden links remain future-only; repository API editing remains external. No PRD, addendum, source, or implementation changes were made.
