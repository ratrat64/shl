---
id: SPEC-link-state-tags
companions:
  - link-state-behavior.md
  - architecture-alignment.md
  - ../../planning-artifacts/architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-shortlink-2026-10-06/PRODUCT.md
  - ../../planning-artifacts/ux-designs/ux-shortlink-2026-10-06/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-shortlink-2026-10-06/EXPERIENCE.md
sources:
  - ../../forge/link-state-tags/forged-idea.md
---

> **Canonical contract.** This SPEC and its companions define what to build and verify. `architecture-alignment.md` identifies the explicit feature amendments to the adopted existing-system documents; their other rules remain binding.

# Manual link-state tags

## Why

Maintainers need one reviewable convention for marking hidden, broken, and disabled links; visitors need to find those states and distinguish warnings from links that shl will not forward or execute. Extend the existing static directory's tags rather than introduce another property convention or a rule engine.

## Capabilities

- **CAP-1**
  - **intent:** Maintainers assign link states through the existing tags field.
  - **success:** Exact, trimmed, case-insensitive `hidden`, `broken`, and `disabled` labels activate their respective states in JSON and YAML; other tags remain descriptive and published values remain intact.
- **CAP-2**
  - **intent:** Visitors recognize states and their combinations without relying on color alone.
  - **success:** Broken links have orange-red emphasis, disabled links are grey, disabled overrides broken/script emphasis, and hidden opacity applies independently; full tags remain readable across all eight combinations in both themes.
- **CAP-3**
  - **intent:** Visitors filter the current subtree by whole tags or ordinary text, including finding hidden state-marked links.
  - **success:** Search follows the syntax and visibility rules in `link-state-behavior.md`; exact reserved-state queries reveal matching hidden leaves and ancestors even in all-hidden directories, while clearing restores the toggle-selected pool and the single count.
- **CAP-4**
  - **intent:** Maintainers disable shl forwarding and execution while retaining public link information and copying.
  - **success:** Disabled direct URLs show the specified explanation without forwarding, wrong-case recovery reaches that explanation, Open/Download are unavailable, and direct launchers exit 1 without downloading or executing; both directory copy actions still work and no-JavaScript behavior cannot navigate to the destination through a disabled action.
- **CAP-5**
  - **intent:** Maintainers replace the hidden boolean with one unambiguous tag convention.
  - **success:** Checked-in entries and examples migrate without losing other fields/tags; true adds `hidden` without a case-insensitive duplicate, false is removed, and any remaining legacy property fails validation with tags guidance before existing output is removed.

## Constraints

- Keep one static JSON/YAML source and public map, no backend or frontend framework, and existing path/URL/collision validation and output-boundary encoding; disabled destinations still require valid absolute HTTP(S) URLs.
- Preserve AD-7–AD-9's shared responsibility ownership, readonly data, acyclic imports, shared foundations/styles, and browser mount/cleanup semantics; apply the explicit AD-2–AD-5 and UX amendments in `architecture-alignment.md` together during implementation.
- No inherited directory states, per-state toggles, configurable rule engine, ongoing legacy compatibility, or ownership metadata.
- Preserve the directory's count, row geometry, full inline tags, destination visibility/truncation, hidden-opacity and focus rules; select exact state colors through executed accessible rendered verification rather than guessing unverified hex values.
- Disabling controls shl forwarding/execution, not external access or secrecy. Both copy actions remain available; destination copying must have no external navigation fallback.

## Non-goals

- Automated checking, state mutation, schedules, workflows, checker failure/recovery policy, and external writer integrations.
- Multi-term search grammar, destination access control, private destinations, or automatic hiding of broken links.
- Implementing this feature in the spec-authoring task or producing a story breakdown.

## Success signal

- A maintainer can migrate the map and publish manually tagged links; a visitor can find hidden broken/disabled entries from an initially all-hidden directory, copy either URL, and encounter an explanation or inert launcher instead of shl forwarding/execution for disabled entries.
- The behavior companion's acceptance matrix passes, including native/no-JavaScript behavior, required rendered checks, and deployed root/project-prefix routing smoke tests.
