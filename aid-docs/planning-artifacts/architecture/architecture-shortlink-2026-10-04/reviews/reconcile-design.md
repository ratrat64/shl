# Independent input reconciliation — DESIGN.md

Verdict: PASS WITH FINDINGS. No contradiction; two quiet guarantees are implicit, and one existing implementation mismatch needs follow-up.
Scope: DESIGN.md against ARCHITECTURE-SPINE.md; read-only corroboration in build.mjs and build.test.mjs.

## Preserved
- Working Index/reference focus: AD-5 preserves the compact index direction, browseable directories, breadcrumbs, search, and a single guide (DESIGN.md:40–42,73,77; spine:63).
- Progressive enhancement: static browsing/native disclosures survive without JavaScript; search/recovery dependencies are explicit (spine:29,63; build.mjs:240–246,293–321).
- Accessible destinations/scripts: AD-5 requires full URLs for assistive technology, textual script identification alongside color, semantic controls, labeled search, and visible focus (DESIGN.md:51,55,77,86; spine:63).
- Browser-local theme ownership, system defaults, and storage-failure tolerance are explicit (spine:39,63); CSS also supplies system theming without JavaScript (build.mjs:157–160).
- Styling ownership is correct: AD-5 delegates exact styling to DESIGN.md; dimensions, colors, type, truncation mechanics, and row treatments need no frozen AD.

## Actionable findings
1. **Explicit code/destination transparency is under-specified.** DESIGN.md:42,82,86 requires readable codes together with destinations, never hidden behind decoration. AD-2 requires public/listed entries, but AD-5's “Working Index” shorthand does not explicitly preserve visible pairing.
   - Follow-up: clarify the behavioral rule in AD-5: listings expose each code with its destination; titles do not replace either. Leave layout mechanics code/DESIGN-owned.
2. **Shared theming is implicit.** DESIGN.md:83 requires shared color roles and consistent hierarchy across light/dark modes. AD-5 describes theme selection, not consistency across directory and guide surfaces; the shared shell/assets already implement it (build.mjs:156–223,280–291,323–354).
   - Follow-up: clarify that browse/guide surfaces share theme semantics and retain link/script/focus distinctions in both modes; do not bind specific tokens, values, or asset filenames.
3. **Existing full-URL hover mismatch, not an architectural contradiction.** DESIGN.md:55,77 promises full destinations on hover. For titled entries, build.mjs:308–309 omits the destination's URL tooltip and inherits the row's optional title instead; the screen-reader URL remains intact.
   - Follow-up: separately correct destination hover disclosure without losing code-title hover/search; update the titled/untitled regression check at build.test.mjs:157–167, which currently accepts this mismatch.

No new styling AD is warranted. Findings are recorded only; this reconciliation changes neither UI nor spine.

Final disposition: AD-5 now explicitly preserves visible pairing and shared theme semantics. The existing titled-entry hover mismatch is recorded as input/implementation drift; the spine promises accessible full destinations rather than uniform full-URL hover.
