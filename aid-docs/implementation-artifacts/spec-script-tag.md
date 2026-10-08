---
title: 'Migrate script property to tag'
type: 'feature'
created: '2026-10-08'
status: 'in-progress'
baseline_commit: 'e49a77b685654ad2fbbae1fe4f3d08eeecb7cd5d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - aid-docs/specs/spec-link-state-tags/SPEC.md
  - aid-docs/specs/spec-link-state-tags/link-state-behavior.md
  - aid-docs/specs/spec-link-state-tags/architecture-alignment.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Script enablement still uses a property while other link behavior uses tags.

**Approach:** Replace the source `script` property with an exact trimmed case-insensitive `script` tag. Migrate checked-in configuration and examples, reject residual legacy properties, and preserve launcher URLs/behavior.

## Boundaries & Constraints

**Always:** Preserve unrelated tags/fields/order and raw public values, URL/path validation, launcher collision checks before output deletion, readonly projections, shared ownership and disabled enforcement. Keep internal derived script booleans. `#script` is ordinary exact tag search respecting Show hidden links; only hidden/broken/disabled queries bypass hidden visibility.

**Never:** Add runtime compatibility, a migrator service, new dependencies, automation, inherited directory script behavior, changed launchers/routing, or new search operators. Preserve historical records; update canonical specs only by their owning aid-spec memory/derivation workflow.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Enable | script / SCRIPT / trimmed or duplicate tags | One launcher and existing script styling/Download | Near matches and literal #script remain descriptive |
| Migration | Legacy true/false plus existing tags | True appends script unless equivalent exists; false removes property only | Never remove independently configured script tag |
| Residual property | Any script property value, even with script tag | Build fails with path and preservation-safe guidance | Existing output retained |
| Collision | Tagged leaf plus same-name .sh code/directory | Reject case-insensitive collision in either order | Output retained, including disabled/hidden leaves |
| Search | #script on visible/hidden leaves | Exact matching in toggle-selected pool | All-hidden search remains reachable, without forced reveal |
| State/rebuild | Script with disabled; later remove script tag | Existing inert launcher; removal deletes stale .sh but keeps HTML | No download/execution bypass |

</frozen-after-approval>

## Code Map

- `src/links.mjs`: `linkStates` normalizes tags; `linkFields` interprets script property. `collect` separately checks value.script and reserves .sh namespace. Consolidate both consumers on shared tag interpretation.
- `src/build.mjs`, `directory.mjs`, `pages.mjs`: consume derived script boolean; renderer/launcher bodies need no behavioral rewrite. Guide still documents script:true. Recovery serializes the pure state helper.
- `src/assets/search.js`: exact-tag data already supports #script; retain its explicit three-state reveal list. Existing CSS state precedence remains authoritative.
- `test/build.test.mjs`: migrate valid object/YAML fixtures and stateMap emission, retain internal boolean parameters/expectations; preserve collision, enabled/disabled Bash and rendered matrix checks.
- `links.yaml`: remove VS_Code false; append script to latest hidden tags and stable shell/setup tags, preserving URLs.

## Tasks & Acceptance

**Execution:**
- [ ] `src/links.mjs` -- derive script from normalized tags, reject every property and use shared interpretation for collisions -- one contract.
- [ ] `links.yaml`, `src/pages.mjs`, `README.md`, `AGENTS.md` -- migrate source and Guide/examples/rules -- preserve existing links and operations.
- [ ] `aid-docs/planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md`, `aid-docs/planning-artifacts/ux-designs/ux-shortlink-2026-10-06/{PRODUCT,DESIGN,EXPERIENCE}.md`, `aid-docs/planning-artifacts/prds/prd-shortlink-2026-10-02/{prd,addendum}.md`, `aid-docs/planning-artifacts/epics.md` -- synchronize live schema/launcher rules and append decisions to existing memory logs; retain archived evidence.
- [ ] `aid-docs/specs/spec-link-state-tags/` -- use aid-spec to append approved script-tag amendment and rederive SPEC/authored companions preserving IDs -- clarify script as behavioral tag, not a new hidden-reveal state.
- [ ] `test/build.test.mjs` -- migrate valid fixtures; extend interpretation, rejection, collisions, search and stale-resource checks -- cover every matrix row.

**Acceptance Criteria:**
- Given JSON/YAML/YML maps, when script tags are interpreted/built, then launcher presence and styling reflect exact labels and raw publication preserves configured values.
- Given legacy properties or colliding launcher names, when validation runs, then errors identify the path and existing output remains intact.
- Given hidden/script/disabled combinations, when searching, toggling and running launchers, then search obeys the unchanged visibility contract and enabled/disabled execution guarantees hold.
- Given the migrated repository, when required rendered/regression checks and build run, then all existing links, shell/layout, theme/lifecycle and script URLs remain functional.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

No unresolved intent gap; this migrates representation, not search visibility semantics. The source migration is a reversible repository edit; a merge publishes it. Rollback restores prior code and source together. Footprint is existing interpretation, fixtures and live contracts plus this execution record; no new public runtime API or dependency.

## Verification

- Bun 1.4.2: `bun ci`, `bun run format`, `bun run format:check`.
- `SHL_REQUIRE_BROWSER=1 bun test --timeout 30000 ./test/build.test.mjs` -- full regression/rendered suite passes without browser skips.
- `bun build.mjs`, `git diff --check` -- migrated root builds and diff is clean.
- Compare migrated leaf URLs/fields, tag preservation and generated launcher paths with baseline; validate canonical spec companion paths and stable capability IDs.
