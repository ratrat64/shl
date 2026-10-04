# Independent divergence review

**Verdict: PASS — no demonstrated in-scope incompatible pair obeys every AD.**
Lens: independently construct two epics below this feature spine; challenge their shared boundaries, not their private implementation details.
Target: ARCHITECTURE-SPINE.md, corroborated against build.mjs, build.test.mjs, and both Actions workflows. Current functionality is documented, not changed.

## Independently constructed future units
- **Epic A — Modularize repository compilation/publication:** load and validate the authoritative nested map; generate redirects, directories, public JSON, launchers, and hosting artifacts; preserve validation-before-replacement and static publication.
- **Epic B — Modularize browser reference/recovery:** consume generated HTML and public JSON for subtree search, shared directory/guide theme semantics, and root/project-prefix case recovery; preserve no-JavaScript browsing and browser-local preferences.
- Both are compatible maintenance epics under AD-1 and the Structural Seed; neither requires a new product capability, runtime service, or dependency.

## Attempted incompatible constructions
- **Shared-data format:** A expands URL strings into link objects or publishes a flattened index while B traverses the configured nested shape. This would break B, but A violates AD-2 and Shared data: public JSON preserves the validated input shape, nesting, keys, casing, and destinations. Existing equality checks corroborate that boundary (build.test.mjs:25–64,118–154).
- **Dual ownership:** A and B each maintain their own authoritative link index or assign different meanings to `url`/`script`. This violates AD-1/AD-2; B reads derived artifacts, and the dependency direction forbids consumer write-back (spine:73–88). Temporary derived representations are not competing authoritative stores.
- **Mutation paths:** A publishes repository edits while B retargets links through browser storage or an editing endpoint. B violates AD-1 and Mutation; browser-owned theme/search state is explicitly distinct from repository-owned links. First-writer credentials/concurrency are expressly deferred, not a current second mutation path.
- **Route/code namespace:** A emits canonical-cased paths and reserves generated names while B lowercases canonical directory targets or resolves only the final segment. B violates AD-3. Launcher/code collisions are validated among siblings, including nested entries (build.mjs:53–105; build.test.mjs:320–395).
- **Browser versus Bash:** A emits exact-case `<path>.sh` launchers while B treats wrong-case or trailing-slash requests as aliases for those launchers. B violates AD-3. Likewise, streaming a partial download into Bash violates AD-4; browser redirect resources remain distinct from executable resources (build.test.mjs:269–318).

## Details that do not establish an AD hole
- A may expose a private flat array while B expects a private tree after extraction; that is an incompatible newly invented module API, not a disagreement at the specified public boundary. Current code owns those interfaces; AD-1 and Deferred deliberately allow modular refactors without freezing a speculative module tree.
- Separate theme implementations cannot justify conflicting user-facing preferences by choosing different storage keys: AD-5 already requires shared directory/guide theme semantics. The existing shared script corroborates that interpretation; its exact key and asset filename remain code-owned (build.mjs:225–238,280–291).
- A code ending in `.sh` remains a valid browser code when no launcher collision exists. A blanket browser ban on that suffix would contradict AD-2/AD-3; the launcher distinction does not reserve every `.sh` code.
- Hidden entries, application editors, new hosting providers, concurrent external writer integrations, and atomic write recovery cannot supply an in-scope divergence proof; they are excluded or explicitly deferred.
- Workflow packaging and internal template ownership can vary only while preserving AD-6's single static artifact publication contract; workflow step versions and internal file layout are code-owned.

**Actionable findings: none. Minimal AD fix: none justified by this lens.**
The attempted public-boundary incompatibilities each require violating an existing AD; the remaining disagreements concern code-owned interfaces or separately scoped capabilities.
