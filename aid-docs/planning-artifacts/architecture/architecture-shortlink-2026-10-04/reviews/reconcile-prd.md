# PRD reconciliation — internal

Verdict: aligned with approved existing-system scope; no blocking conflict. Two nonblocking preservation clarifications below.
Inputs: approved `prd.md`, its `.memlog.md`, and `addendum.md`; current workflows corroborate settled decisions.
Target: `ARCHITECTURE-SPINE.md` (draft, 2026-10-04).

## Settled constraints retained
- AD-1/AD-2 retain static operation, repository-owned mutation, public data, no backend/database/application authentication, and one JSON/YAML contract.
- AD-1 and Deferred permit modularity, templating, maintainability, and extensibility under preserved static contracts and minimal dependencies; the current single-file layout is not binding.
- AD-2–AD-4 retain namespace validation, root/project-prefix routing, exact-case slashless launchers, context-specific encoding, validation-before-replacement, and safe download/execute semantics.
- AD-5 retains progressive enhancement, current-subtree recorded-text search, browser-local theme, accessibility basics, and Working Index direction; it makes no audited-conformance claim.
- Stable short paths do not guarantee immutable or correct destinations; AD-4 leaves destination selection and access restrictions with their owners.

## Current versus future
- Direct config editing is current; external GitHub API editing is selected but no Shortlink client, credential manager, or application editing endpoint is claimed (AD-1, Mutation, Deferred).
- Hidden listings, editing conveniences, and naming/grouping guidance remain separately scoped ideas, not implementation demands or a fixed taxonomy.
- Any future hidden-listing design remains discoverability control, not confidentiality; public-map and static-operation constraints still apply.
- Hundreds of links is expected usage, not proven capacity; Deferred preserves evidence ownership and revisit conditions without inventing latency/availability targets.

## Operations
- AD-6 matches both workflows: Node 24, dependency install, PR tests then build with the AGENTS-only exception; main/manual deployment builds without rerunning tests and uploads only dist.
- Rulesets and DNS/domain/HTTPS are external configuration; no staging environment, enforced merge policy, or deployed-browser verification is implied.
- Routing-change smoke tests remain required; atomic write-failure recovery, destination health checks, and script version selection are not current guarantees.

## Actionable preservation clarifications (nonblocking)
1. Spine AD-5, line 63: explicitly retain **reference-first** use (codes/destinations for known resources; discovery secondary). PRD lines 14–24 and memlog line 6 settle this quiet priority; “Working Index” alone leaves that ordering implicit.
2. Spine AD-5, line 63: state that search **expands ancestor groups to reveal matching descendants**. PRD FR-10, line 66, requires this; filtering/counting alone could preserve matches inside collapsed groups. Existing behavior is confirmed in `build.mjs:254–259`.

Process: independent input reconciliation before the final reviewer gate.
Final disposition: both preservation clarifications were applied to AD-5 before that gate; no outstanding PRD reconciliation finding.
