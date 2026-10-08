---
id: SPEC-broken-link-validation
companions:
  - check-policy.md
  - publication.md
  - ../spec-link-state-tags/SPEC.md
  - ../spec-link-state-tags/link-state-behavior.md
  - ../spec-link-state-tags/architecture-alignment.md
  - ../../planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md
sources:
  - ../../forge/link-state-tags/forged-idea.md
---

> **Canonical contract.** This SPEC and its companions define what to build and verify. This automation extends the manual state-tag contract only at its deferred checking/writing boundary; visitor state behavior and static publication remain binding.

# Automated broken-link validation — v1

## Why

Maintainers need broken-link warnings to follow observed disappearance and recovery without repeatedly checking destinations and editing tags by hand. Keep the repository link map authoritative, treat uncertain failures conservatively, and publish proposed changes through the existing reviewed GitHub Pages path.

## Capabilities

- **CAP-1**
  - **intent:** Maintainers receive destination evaluations daily or on demand.
  - **success:** Scheduled and manually started full-map scans evaluate all leaves, including hidden and disabled links, under the bounds in `check-policy.md`; required PR validation, builds, and deployment do not gain an external reachability prerequisite.
- **CAP-2**
  - **intent:** Maintainers distinguish explicit disappearance from inconclusive availability evidence.
  - **success:** The evaluation matrix classifies matching 404/404 or 410/410 as broken, terminal 2xx as reachable, remaining completed outcomes as unknown, and unvisited links as skipped; reports identify evidence, source commit, time, and coverage.
- **CAP-3**
  - **intent:** The source reflects decisive results without losing configured information.
  - **success:** Broken adds the tag if absent; reachable removes every exact case-insensitive instance, including manual assignments; unknown/skipped preserve state. Source edits retain unrelated tags/fields, nesting and YAML comments, and repeated application is a no-op.
- **CAP-4**
  - **intent:** Maintainers inspect automated changes before publishing them.
  - **success:** Changed source proposals maintain at most one guarded bot PR; stale source or unexpected branch edits stop publication; required validation and a human merge lead to the existing Pages deployment with no direct main write.
- **CAP-5**
  - **intent:** Maintainers assess checker behavior before enabling source updates.
  - **success:** Report-only runs calculate the same classifications and proposed diff without repository writes; representative trial evidence precedes daily/manual bot-PR publication.

## Constraints

- Implement the manual state tags and hidden-property migration first. Exact trimmed case-insensitive state interpretation has one owner; reuse validated loading/traversal and preserve readonly build snapshots while editing a separate writable source document.
- Automation changes only `broken`, even when manually assigned. It never changes `hidden` or `disabled`, introduces ownership metadata, or rewrites destination URLs.
- Use only the latest completed bounded evaluation, with at most two attempts and no cross-run counters/cache. Unknown is report evidence, not a persisted tag; it preserves both presence and absence of `broken`.
- Check destination HTTP(S) URLs with bounded GET/HTTP-redirect requests, not shl's HTML forwarding. Never execute downloaded content; 2xx establishes observed HTTP reachability, not content, complete download, or script correctness.
- Keep Bun 1.4.2, native/stdlib facilities and installed `yaml`; no new service, database, dependency or frontend framework. Build output remains deterministic and reachability-independent.
- Use `GITHUB_TOKEN` bot PRs, repository-enabled PR creation, maintainer approval of approval-required validation runs, and human merge. Keep evidence outside the committed link map and preserve the existing required tests/build and Pages deployment path.

## Non-goals

- Tagging sustained DNS/TLS/server outages, content or soft-404 detection, browser/script execution, per-domain rules, ownership tracking, or automatic hiding/disabling.
- Cross-run failure history, adaptive/sliced scans, targeted manual selectors, PR-triggered network gates, or per-link check metadata.
- Direct main writes, unattended merge, App/PAT setup, uncommitted-output deployment, or implementing the checker during spec authoring.

## Success signal

- A report-only run demonstrates bounded evidence and the exact proposed source diff; enabled publication proposes a confirmed disappeared link and removes a recovered link's manual `broken` tag while preserving unrelated state. A maintainer approves validation and merges the PR, and the deployed map reflects those changes.
- Deterministic policy/source/publication cases in the companions pass. Unknown failures retain existing state and remain visible in reports; this v1 deliberately does not tag every sustained outage.

## Assumptions

- Numeric bounds are unmeasured starting defaults; tune them through recorded trial evidence without silently changing classification. Exact daily UTC time, pacing/jitter values, and bot branch name are implementation choices within the contract.
- Repository settings permit workflow-created PRs and maintainers can approve validation runs. Verify these at rollout; unavailable permissions cause a reported failure, not a bypass or alternate credential.
