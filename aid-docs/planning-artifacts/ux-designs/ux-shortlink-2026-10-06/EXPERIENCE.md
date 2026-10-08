---
name: Shortlink directory experience
status: final
sources:
  - .memlog.md
  - DESIGN.md
  - ../../../../README.md
  - PRODUCT.md
  - ../../../../links.yaml
updated: 2026-10-08
---

# Directory Experience: Shortlink

## Foundation

The Working Index is a compact, static directory for finding and using public short links. Apply the refreshed high-contrast, easy-on-the-eyes palette in [DESIGN.md](DESIGN.md): standard actions use teal {colors.action-light}/{colors.action-dark}, scripts use amber {colors.script-light}/{colors.script-dark}, and page and text surfaces use {colors.paper-light}/{colors.paper-dark} and {colors.ink-light}/{colors.ink-dark}. Dark mode has a pure black background (#000) and softened light ink; light mode has an off-white background. Respect system light/dark preference and the visitor's saved theme override. Hidden links control discoverability, not secrecy.

## Information Architecture

The homepage is the root subtree; each folder has a browseable directory page and nested folders remain expandable. Every directory page has the prominent "N links" count as its sole heading at the same size. Nested pages use breadcrumbs to show the folder path instead of repeating its name as a heading; home reserves the same breadcrumb row so the listing does not move on navigation. Header navigation stays Links and Guide; the guide remains the informational page. Codes, destinations, optional titles and tags remain available in the directory as before.

Visual reference: [homepage directory](mockups/directory.html). The DESIGN.md and EXPERIENCE.md spines take precedence over the mock on any conflict; nested directory, guide, redirect and 404 surfaces follow these spines without separate mocks.

## Voice and Tone

Use short, functional labels. The visible search placeholder is exactly "Search link, title or tag"; its accessible label remains even when visually hidden. Count copy is "1 link" or "N links", including "0 links". The no-match message is "No links match your search." without a second numeric result. Keep "Show hidden links" / "Hide hidden links" and existing empty-directory language.

## Component Patterns

- **Directory tools:** On every directory page the count is the sole heading on the left; a single-line search and a compact grouped area for the hidden-links toggle sit on the right. Reserve the same control columns without hidden descendants: search retains its size and position, while Show hidden links stays visible, muted and disabled. Use the same {typography.display} size for home and nested counts, not the muted row metadata style; use {colors.ink-light}/{colors.ink-dark}. Search uses {rounded.control}, {colors.surface-light}/{colors.surface-dark} and {colors.rule-light}/{colors.rule-dark}.
- **Directory rows:** Code and destination remain side by side and copy their full URLs. Open visits enabled destinations; disabled destination is copy-only, and Open/Download remain visible but unavailable. Script identity retains Download without a SCRIPT label; regular scripts use amber, broken overrides with orange-red, disabled overrides both with grey. Folder names open their pages and disclosure expands the nested list. Titles remain available on hover and searchable. Full inline tags remain on one line without caps, ellipsis, or added height; crowded rows scroll horizontally. Native popovers do not shift rows: Enter/Space opens, Escape/outside click dismisses, complete labels remain accessible, and long panels scroll. Tags remain searchable independently of disclosure. Keep middle-truncated destinations with full copy/accessibility values and 4rem reserves (3rem below 500px). Only hover-capable fine-pointer mode without coarse input hides destination text until hover/focus, reserving its space. Any coarse input, including hybrids, or non-hover mode keeps destinations visible.
- **Folder summaries:** Keep full names and disclosure markers on one line without ellipsis; long summaries scroll horizontally while retaining 50px height. Horizontal scrollbar chrome must not add height to folder summaries or link rows.
- **Row emphasis:** Link rows and folder summaries share a 50px minimum height, 10px vertical and 12px horizontal padding, and a subtle 4px radius. Use {colors.wash-light}/{colors.wash-dark} on hover and focus-within; broken enabled rows instead mix 6% orange-red with the page background, while disabled rows retain the theme wash. Folder wash covers only the summary, never descendants. Hidden rows/tags retain their regular/broken/disabled colors and weights at reduced opacity (80% dark, 94% light). Dim hidden-only summaries independently. Keyboard focus restores full opacity. Keep full state tags without duplicate labels; preserve readability and focus indicators.
- **Button fills:** Use subtle teal fills for theme, hidden-toggle and Open controls, and amber for Download, as specified in DESIGN.md. Broken enabled rows use their orange-red short-code palette for Open text, border, fill, and row hover/focus highlight. Hover strengthens the button fill; disabled controls and rows retain their muted wash and existing disabled behavior.
- **Navigation:** The header brand reads `/shl/`, with `shl` in {colors.ink-light}/{colors.ink-dark}, the leading slash in teal {colors.action-light}/{colors.action-dark}, and the trailing slash in amber {colors.script-light}/{colors.script-dark}. Keep Links and Guide, active-link underline, theme control and keyboard focus treatment. Reuse identical borderless header/footer across Links, nested directories, Guide, and 404. Guide section rules belong to its content, not chrome. Match geometry and appearance at equal viewport/theme; only active navigation state changes.
- **Document variants:** Every page reuses document/theme/style foundations under AD-7–AD-9. Enabled redirects and legacy forwards remain minimal with native fallbacks and no chrome. Disabled explanations are minimal without forwarding or external fallback. 404 uses the full shell with embedded shared styles/theme and rebases shell links when recovery discovers the base; unavailable maps/JavaScript retain relative fallback. Page-specific selectors cannot restyle shared components.
- **Footer:** The page shell fills at least the viewport height, with main content growing to put the footer at the bottom on short pages. On long pages it follows content in normal flow without covering it.
- **Copy feedback:** A polite status message appears after copying a code or destination (or a clipboard failure) in a fixed toast that never changes the listing's position; clear it after five seconds. A second copy resets the timer.

## State Patterns

- **Initial:** Show one count of visible links within the current subtree, including nested descendants; hidden links do not contribute. Display zero as "0 links". The listing and initial count remain usable without JavaScript.
- **Search:** Trim outer whitespace and compare case-insensitively. Plain text is one broad substring of code/folder/title/destination/tags. Initial `#` matches an exact whole leaf tag only; spaces belong to the label, bare `#` matches nothing, and `#broken #disabled` is one literal label. Exact `#hidden`, `#broken`, and `#disabled` temporarily include matching hidden leaves and necessary ancestors, never unmatched siblings, without changing the toggle label/pressed state. All other queries respect the selected pool. Update the single count, expand matching groups with disclosure restoration, and show 0 links plus the no-match message for any nonempty zero-result query. Clearing restores the selected pool; search stays reachable.
- **Hidden toggle:** Show hidden links is disabled without hidden descendants. Otherwise it includes hidden entries/folders in the ordinary listing/search/count; Hide hidden links restores the default pool. Toggling during a state query saves the subsequent ordinary/empty-query pool without changing its matches. With JavaScript unavailable, enabled toggles stay hidden and hidden leaves remain omitted; disabled toggles remain visible.
- **Empty subtree:** Keep the current empty-directory explanation and "0 links"; if hidden entries exist, toggling reveals them. A no-match message is for a search with zero matches, not the initial empty state.
- **Tool availability:** Search is absent on a truly empty site, and enhanced whenever a subtree has leaves, including all-hidden pages. Initial all-hidden pages retain 0 links, No links listed here., and Show hidden links. A matching state query replaces the empty explanation with results; nonempty zero-result queries use the no-match message. Clearing restores the selected listing/empty explanation. Search and enabled hidden toggles stay hidden without JavaScript; disabled toggles stay visible. Consistent columns apply while interactive tools are shown.

## Manual leaf states and disabled interactions

Exact trimmed case-insensitive hidden/broken/disabled tags derive states without inheritance. Broken codes use orange-red without blocking actions; disabled grey overrides broken/script amber. Full tags remain non-color cues, with no duplicate badges. Hidden opacity independently remains 80% dark / 94% light, restores on focus, and hidden-only summaries never compound descendant opacity. Preserve existing row geometry, overflow, pointer visibility, and destination reserves above.

Broken enabled long destinations turn orange-red on hover, matching their short code and Open action while retaining underlining and copying.

Disabled code still copies the short URL; native activation reaches its explanation. Disabled destination is a copy-only button with full accessible/selectable text, never an external href or navigation fallback, including without JavaScript. Both copies retain polite success/failure feedback, five-second clearing, timer reset, and stale-copy cancellation. Open and script Download stay visibly unavailable as programmatically disabled controls with no actionable href, including modified/keyboard activation. Tags and directory navigation remain usable.

Disabled explanations select the shared minimal document/theme/styles without chrome. Title and heading are Link disabled. Exact paragraphs: “This short link has been disabled. shl will not forward you to its destination.” and “The destination remains public. Disabling this link does not prevent access outside shl.” No refresh, forwarding script, destination canonical link, or Continue fallback. Wrong-case recovery uses the same interpretation and canonical-cased short URL under root/project prefixes. Safe disabled launchers print the specified stderr explanation and exit 1 without download/payload/execution/argument handling. Disabling does not prevent external access or affect retained older artifacts.

## Interaction Primitives

Typing filters the current directory's descendants. Folder disclosure expands or collapses nested entries; folder names navigate. Clicking a code or destination copies its full URL, while Open follows the destination. The hidden-links toggle changes state and its label; the theme button changes the light/dark override. Folder links, breadcrumbs and Home remain navigable on direct loads and without JavaScript; with JavaScript, Back and Forward continue to work.

## Accessibility Floor

Keep the search input programmatically labelled even with its visual label hidden; the placeholder is not its label. Preserve visible keyboard focus and text cues for script links; focus-within row wash supplements rather than replaces focus outlines. Muted hidden codes remain legible in both themes. Expose the hidden-links toggle state programmatically (for example, `aria-pressed`) as well as through its label. Announce changes to the single count through a polite live region without another visible number; do not announce duplicate result counts. Retain the count heading, folder breadcrumbs, full destination text for assistive technology and functional links when JavaScript is off.

## Responsive & Platform

Use the centered directory width in DESIGN.md on desktop; at narrow widths wrap search and grouped controls beneath the count, with search able to fill the available width. Keep the breadcrumb row one line high, horizontally scrollable for long paths, and reserve it on home so rows do not shift. Preserve the two-column code/destination relationship where possible and the existing small-screen row behavior. Static GitHub Pages HTML remains the baseline; JavaScript enhances filtering, toggling, copying and in-page directory navigation.

## Key Flows

### Find a setup script — Rat, developer

1. Rat opens the homepage looking for an automation script, without remembering its short path.
2. Rat types `#shell` into search; the same prominent count narrows to the matching links, and the relevant nested folders expand.
3. Rat sees `setup/ohmyposh/stable` and the Download action; hovering or focusing the row shows its destination, which is always visible on touch.
4. **Climax:** Rat uses Download to get the `.sh` launcher for the intended setup resource, confident the directory has surfaced the right entry.

If the search has no match, the count reads "0 links" and the no-match message appears; clearing search restores the visible directory.

### Reveal a hidden alternative — Rat, developer

1. Rat searches for `ohmyposh` but needs the hidden `latest` entry rather than `stable`.
2. Rat turns on Show hidden links in the grouped controls; the current search and the single count update to include the hidden entry.
3. **Climax:** Rat sees both entries with Download actions, the hidden alternative visibly subdued, and can choose the intended launcher without losing the query.
4. Rat turns off the toggle to return to the visible-only view. Without JavaScript, Rat can still browse and open the visible `stable` entry through the folder pages.
