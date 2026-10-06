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
