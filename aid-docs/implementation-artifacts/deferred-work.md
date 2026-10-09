- source_spec: `aid-docs/implementation-artifacts/spec-hidden-links.md`
  summary: Decide whether to preserve the old oh-my-posh redirect and launcher paths when publishing the user's link-map reorganization.
  evidence: The uncommitted `links.yaml` replaces both `scripts/ohmyposh-setup-*` entries with `setup/ohmyposh/*`; a successful build removes the old paths. The open hidden-links PR does not include the map edit.
- source_spec: `aid-docs/implementation-artifacts/spec-hidden-links.md`
  summary: Update the README launcher examples when choosing the final published oh-my-posh link paths.
  evidence: The existing README examples use paths that already differ from the baseline map; publishing the uncommitted map reorganization would add another mismatch.
- source_spec: `aid-docs/implementation-artifacts/spec-organize-project-root.md`
  summary: Investigate local serve preview of dotted directory paths.
  evidence: Both before and after the file move, `serve` returns a directory listing for `/dev.tools/` while `/dev.tools/index.html` returns the generated directory page; build/test routing does not exercise the preview server.
- source_spec: `aid-docs/implementation-artifacts/spec-local-preview-command.md`
  summary: Update AGENTS.md local preview instructions to use the working npm command.
  evidence: AGENTS.md still recommends `serve` and claims its `cleanUrls: false` setting preserves dotted directory pages, but that command serves directory listings instead of generated pages.
- source_spec: `spec-modular-ui.md`
  summary: Verify saved-theme first-paint behavior before deciding whether an early restoration hook is needed.
  evidence: Asset-backed deferred restoration predates this task; code review raised a possible flash, but no browser paint trace establishes it. Embedded documents run the same restoration synchronously. Capture a paint trace under opposite system/saved themes to settle the claim.

- source_spec: `spec-modular-ui.md`
  summary: Give script-disabled 404 a coherent final heading instead of the existing checking state.
  evidence: Existing 404 markup defaults to Checking that link and One moment; without JavaScript only the noscript explanation clarifies that recovery cannot run. This pre-existing state was preserved by the shared-shell refactor.

- source_spec: `aid-docs/implementation-artifacts/spec-broken-link-palette.md`
  summary: Preserve 4.5:1 contrast for standard hidden Open buttons on light-theme hover.
  evidence: The unchanged teal 18% hover fill, #006b60 text, #f6f7f5 page, and 94% parent opacity produce approximately 4.11:1 contrast; applying the new dimmed hover assertion to unchanged variants failed. Warning controls now use a scoped 12% hover fill, while the existing standard palette needs its own correction.

- source_spec: `aid-docs/implementation-artifacts/spec-colored-tag-filters.md`
  summary: Consider full short-path text searching from a nested directory page.
  evidence: Both baseline and current search start traversal at the current subtree root, so a nested page searches descendant folder paths but not its own ancestor prefix; the colored-tag task preserves existing broad-search behavior.

- source_spec: `aid-docs/implementation-artifacts/spec-colored-tag-filters.md`
  summary: Verify first token-error announcements with a screen reader before deciding whether the live-region exposure needs adjustment.
  evidence: Unverified medium concern: the independent role=status/aria-live region is synchronously revealed and populated, which may affect first announcements in some assistive technology; executed screen-reader evidence would settle it. Browser checks establish separate error state and search association, not spoken output.
- source_spec: `aid-docs/implementation-artifacts/spec-shared-page-title.md`
  summary: Refresh DESIGN.md to document the shared two-part sans page title, optional reserved counter slot, and logo-amber numeric emphasis.
  evidence: The user approved this heading behavior; existing design prose describes amber primarily as script emphasis and omits Guide title alignment.
