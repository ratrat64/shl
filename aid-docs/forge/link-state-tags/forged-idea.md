# Link-state tags — hardened

- Use tags for shared state filtering and behavior; reserve exact, case-insensitive `hidden`, `broken`, and `disabled`. Other tags remain descriptive; no configurable rule engine.
- `hidden`: existing default omission and reduced opacity when revealed; forwarding remains available unless disabled.
- `broken`: orange-red tint; forwarding remains available unless disabled.
- `disabled`: greyed out; short URLs show an explanation instead of forwarding. Block Open, Download, and direct `.sh` execution too. Retaining a URL does not make its external destination private or prevent access outside shl.
- Combined states: disabled grey overrides broken tint; hidden opacity applies independently. Keep tags readable as non-color indicators.
- `#tag` searches match whole tags case-insensitively. Explicit `#hidden`, `#broken`, and `#disabled` searches reveal matching hidden links and their hidden-only ancestors. Clearing search restores normal hidden visibility; ordinary text search retains broad matching and respects Show hidden links.
- Replace `hidden` boolean cleanly: migrate true values to the tag, preserve other tags, remove false values, and reject the old property with guidance to use tags. No ongoing legacy compatibility.
- First change: manual tags, filtering, presentation, disabled enforcement, and migration. Automation is separate.
- Later automation may add/remove `broken` based on its latest check, even when manually assigned; no ownership tracking. Users assign `disabled`; users or automation may assign `hidden`, but broken detection must not automatically hide links.
- Deferred: checker failure/recovery policy, multi-term search syntax, disabled explanation copy and copying interactions. Explicit state search must remain reachable in all-hidden directories; exact visual colors require accessible UI verification.
- Rejected: a separate toggle per state (shared search covers filtering), parallel hidden property/tag conventions (ambiguous maintenance), and ownership metadata (unwanted complexity now).
