---
name: Shortlink directory experience
status: final
sources:
  - .memlog.md
  - DESIGN.md
  - ../../../../README.md
  - ../../../../PRODUCT.md
  - ../../../../links.yaml
updated: 2026-10-06
---

# Directory Experience: Shortlink

## Foundation

The Working Index is a compact, static directory for finding and using public short links. Apply the visual roles in [DESIGN.md](DESIGN.md): standard actions use {colors.action-light}/{colors.action-dark}, scripts use {colors.script-light}/{colors.script-dark}, and page and text surfaces retain {colors.paper-light}/{colors.paper-dark} and {colors.ink-light}/{colors.ink-dark}. Respect system light/dark preference and the visitor's theme override. Hidden links control discoverability, not secrecy.

## Information Architecture

The homepage is the root subtree; each folder has a browseable directory page and nested folders remain expandable. Every directory page has the prominent "N links" count as its sole heading at the same size. Nested pages use breadcrumbs to show the folder path instead of repeating its name as a heading. Header navigation stays Links and Guide; the guide remains the informational page. Codes, destinations, optional titles and tags remain available in the directory as before.

Visual reference: [homepage directory](mockups/directory.html). The DESIGN.md and EXPERIENCE.md spines take precedence over the mock on any conflict; nested directory, guide, redirect and 404 surfaces follow these spines without separate mocks.

## Voice and Tone

Use short, functional labels. The visible search placeholder is exactly "Search link, title or tag"; its accessible label remains even when visually hidden. Count copy is "1 link" or "N links", including "0 links". The no-match message is "No links match your search." without a second numeric result. Keep "Show hidden links" / "Hide hidden links" and existing empty-directory language.

## Component Patterns

- **Directory tools:** On every directory page the count is the sole heading on the left; a single-line search and a compact grouped area for the hidden-links toggle sit on the right. Reserve the same control columns even without hidden descendants: search retains its size and position, but no inapplicable toggle appears. Use the same {typography.display} size for home and nested counts, not the muted row metadata style; use the existing {colors.ink-light}/{colors.ink-dark} roles. Search uses {rounded.control} and existing surface/rule roles; no new palette.
- **Directory rows:** Code and destination remain side by side; code copies the full short URL, destination copies its full URL, and Open visits the destination. Script links retain their visible script label and existing amber role. Folder names open their pages and disclosure expands the nested list. Optional titles remain available on hover and searchable; tags remain visible below entries. Keep the existing middle-truncation behavior for long destinations while preserving full values for copying and assistive technology.
- **Navigation:** Keep Links and Guide, active-link underline, theme control and keyboard focus treatment. Remove directory-page framing rules below the header and above the footer; separate sections by space, as specified in DESIGN.md. Keep guide section rules.
- **Copy feedback:** A polite status message appears after copying a code or destination (or a clipboard failure) in a fixed toast that never changes the listing's position; clear it after five seconds. A second copy resets the timer.

## State Patterns

- **Initial:** Show one count of visible links within the current subtree, including nested descendants; hidden links do not contribute. Display zero as "0 links". The listing and initial count remain usable without JavaScript.
- **Search:** Match code, folder name, title, destination and tags (including nested links) case-insensitively. Update the same count to the number of matching links within the current subtree and active visibility pool; do not add a second visible numeric result. Expand matching nested groups as needed to show results. If nothing matches, show "0 links" and the short no-match message.
- **Hidden toggle:** Only where hidden links exist, Show hidden links includes hidden entries and hidden-only folders in the listing, search pool and count; Hide hidden links restores the default pool and recalculates matches. With JavaScript unavailable, hidden links remain hidden and the default listing/count remain usable.
- **Empty subtree:** Keep the current empty-directory explanation and "0 links"; if hidden entries exist, toggling reveals them. A no-match message is for a search with zero matches, not the initial empty state.

## Interaction Primitives

Typing filters the current directory's descendants. Folder disclosure expands or collapses nested entries; folder names navigate. Clicking a code or destination copies its full URL, while Open follows the destination. The hidden-links toggle changes state and its label; the theme button changes the light/dark override. Folder links, breadcrumbs and Home remain navigable on direct loads and without JavaScript; with JavaScript, Back and Forward continue to work.

## Accessibility Floor

Keep the search input programmatically labelled even with its visual label hidden; the placeholder is not its label. Preserve visible keyboard focus and text cues for script links. Expose the hidden-links toggle state programmatically (for example, `aria-pressed`) as well as through its label. Announce changes to the single count through a polite live region without another visible number; do not announce duplicate result counts. Retain the count heading, folder breadcrumbs, full destination text for assistive technology and functional links when JavaScript is off.

## Responsive & Platform

Use the centered directory width in DESIGN.md on desktop; at narrow widths wrap search and grouped controls beneath the count, with search able to fill the available width. Preserve the two-column code/destination relationship where possible and the existing small-screen row behavior. Static GitHub Pages HTML remains the baseline; JavaScript enhances filtering, toggling, copying and in-page directory navigation.

## Key Flows

### Find a setup script — Rat, developer

1. Rat opens the homepage looking for an automation script, without remembering its short path.
2. Rat types `#shell` into search; the same prominent count narrows to the matching links, and the relevant nested folders expand.
3. Rat sees `setup/ohmyposh/stable`, its destination and the visible script label.
4. **Climax:** Rat uses Download to get the `.sh` launcher for the intended setup resource, confident the directory has surfaced the right entry.

If the search has no match, the count reads "0 links" and the no-match message appears; clearing search restores the visible directory.

### Reveal a hidden alternative — Rat, developer

1. Rat searches for `ohmyposh` but needs the hidden `latest` entry rather than `stable`.
2. Rat turns on Show hidden links in the grouped controls; the current search and the single count update to include the hidden entry.
3. **Climax:** Rat sees both script-labelled entries and can choose the intended launcher without losing the query.
4. Rat turns off the toggle to return to the visible-only view. Without JavaScript, Rat can still browse and open the visible `stable` entry through the folder pages.
