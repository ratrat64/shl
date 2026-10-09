---
name: Shortlink directory experience
status: final
sources:
  - .memlog.md
  - DESIGN.md
  - ../../../../README.md
  - PRODUCT.md
  - ../../../../links.yaml
updated: 2026-10-09
---

# Directory Experience: Shortlink

## Foundation

The Working Index is a compact, static directory for finding and using public short links. Apply the refreshed high-contrast, easy-on-the-eyes palette in [DESIGN.md](DESIGN.md): standard actions use teal {colors.action-light}/{colors.action-dark}, scripts use amber {colors.script-light}/{colors.script-dark}, and page and text surfaces use {colors.paper-light}/{colors.paper-dark} and {colors.ink-light}/{colors.ink-dark}. Dark mode has a pure black background (#000) and softened light ink; light mode has an off-white background. Respect system light/dark preference and the visitor's saved theme override. Hidden links control discoverability, not secrecy.

## Information Architecture

The homepage is the root subtree; each folder has a browseable directory page and nested folders remain expandable. Every directory page has the prominent "N links" count as its sole heading at the same size. Nested pages use breadcrumbs to show the folder path instead of repeating its name as a heading; home reserves the same breadcrumb row so the listing does not move on navigation. Header navigation stays Links and Guide; the guide remains the informational page. Codes, destinations, optional titles and tags remain available in the directory as before.

Visual reference: [homepage directory](mockups/directory.html). The DESIGN.md and EXPERIENCE.md spines take precedence over the mock on any conflict; nested directory, guide, redirect and 404 surfaces follow these spines without separate mocks.

## Voice and Tone

Use short, functional labels. Search placeholder is exactly "Search link, title or tag", with an accessible label. Count copy is "1 link" / "N links", including "0 links". Filtered zero results use "No links match your search." without a second count. Use "Show tags" / "Hide tags", "All tags selected.", independent "Tag not found" and polite "Tag already selected.". Retain initial empty-directory language.

## Component Patterns

- **Directory tools:** The count is the sole heading on the left; tools on the right place the selected horizontal track LEFT of search, then Show tags, with an available track below. Selected chips precede search in DOM/tab order and stack ABOVE search on mobile beneath the count. Preserve usable search, separate horizontal tracks and full labels. Use existing type/radius roles with palette-matched tinted tag fills/borders. Available buttons name Filter by #tag; selected buttons name Remove #tag filter and expose selected state. Activation focuses the selected chip; removal focuses next, previous or search. Tracks reveal focused chips. Empty selected tracks hide; all-selected pickers remain available with their message; no-tag pickers are disabled.
- **Directory rows:** Code and destination remain side by side and copy their full URLs. Open visits enabled destinations; disabled destination is copy-only, and Open/Download remain visible but unavailable. Script identity retains Download without a SCRIPT label; regular scripts use amber, broken overrides with orange-red, disabled overrides both with grey. Folder names open their pages and disclosure expands the nested list. Titles remain available on hover and searchable. Full inline tags remain on one line without caps, ellipsis, or added height; crowded rows scroll horizontally. Native popovers do not shift rows: Enter/Space opens, Escape/outside click dismisses, complete labels remain accessible, and long panels scroll. Tags remain searchable independently of disclosure. Keep middle-truncated destinations with full copy/accessibility values and 4rem reserves (3rem below 500px). Only hover-capable fine-pointer mode without coarse input hides destination text until hover/focus, reserving its space. Any coarse input, including hybrids, or non-hover mode keeps destinations visible.
- **Folder summaries:** Keep full names and disclosure markers on one line without ellipsis; long summaries scroll horizontally while retaining 50px height. Horizontal scrollbar chrome must not add height to folder summaries or link rows.
- **Row emphasis:** Link rows and folder summaries share a 50px minimum height, 10px vertical and 12px horizontal padding, and a subtle 4px radius. Use {colors.wash-light}/{colors.wash-dark} on hover and focus-within; broken enabled rows instead mix 6% orange-red with the page background, while disabled rows use their neutral grayscale wash. Folder wash covers only the summary, never descendants. Hidden rows/tags retain their regular/broken/disabled colors and weights at reduced opacity (80% dark, 94% light). Dim hidden-only summaries independently. Keyboard focus restores full opacity. Keep full state tags without duplicate labels; preserve readability and focus indicators.
- **Button fills:** Use subtle teal fills for theme, Show tags and Open, amber for Download. Full tag labels/chips share --tag-tone-based color-mix fills (5% resting / 8% hover) and borders (30% resting / 45% hover) against their local panel. Broken enabled Open retains orange-red and row wash. Disabled non-tag controls remain neutral; tag treatments keep independent ink/tints/borders.
- **Navigation:** The header brand reads `/shl/`, with `shl` in {colors.ink-light}/{colors.ink-dark}, the leading slash in teal {colors.action-light}/{colors.action-dark}, and the trailing slash in amber {colors.script-light}/{colors.script-dark}. Keep Links and Guide, active-link underline, theme control and keyboard focus treatment. Reuse identical borderless header/footer across Links, nested directories, Guide, and 404. Guide section rules belong to its content, not chrome. Match geometry and appearance at equal viewport/theme; only active navigation state changes.
- **Document variants:** Every page reuses document/theme/style foundations under AD-7–AD-9. Enabled redirects and legacy forwards remain minimal with native fallbacks and no chrome. Disabled explanations are minimal without forwarding or external fallback. 404 uses the full shell with embedded shared styles/theme and identical content/navigation behaviors. Recovery rebases shell/Home links after the first readable ancestor map, ending probing even without a match. Canonical directories mount through the existing controller with replacement history; leaves retain native destination forwarding or canonical disabled explanations. Unavailable maps/JavaScript retain relative fallback without guessing a project root; not-found completion follows request completion. Page-specific selectors cannot restyle shared components.
- **Footer:** The page shell fills at least the viewport height, with main content growing to put the footer at the bottom on short pages. On long pages it follows content in normal flow without covering it.
- **Copy feedback:** A polite status message appears after copying a code or destination (or a clipboard failure) in a fixed toast that never changes the listing's position; clear it after five seconds. A second copy resets the timer.

## State Patterns

- **Initial:** Show one count of visible links within the current subtree, including nested descendants; hidden links do not contribute. Display zero as "0 links". The listing and initial count remain usable without JavaScript.
- **Search/filter:** Outer-trim remaining text and compare case-insensitively as one broad substring of code/folder/title/destination/tags. Require every selected exact canonical tag. Only selected hidden/broken/disabled tags admit matching hidden leaves; script or descriptive selections alone never do. Show only matching ancestors, expand matching groups while active and restore visitor disclosures when filters clear. One live count counts leaves; zero active results retain tools and show no-match. Removing the last reserved selection restores hidden exclusion.
- **Picker:** Show tags / Hide tags changes only visibility with expanded state/controlled region. Catalog includes every subtree leaf, even hidden descendants in closed folders; results never shrink it. Identities dedup without mutating raw values, choosing the smallest UTF-16 raw case variant and sorting by canonical identity. Selected tags retain insertion order; returned tags restore catalog order. Clearing text or collapsing the picker retains selections.
- **Tokens:** Candidates start with # at input start or after whitespace/comma, never inside words/HTTP(S) URL spans. Whitespace/comma/Enter commits known tags, consuming syntax once and preserving prose/caret/native edits. Duplicates are idempotent with Tag already selected. Unknown attempted tokens remain with independent Tag not found until corrected/committed or removed. IME commits after composition; native multiline paste preserves delimiters before sanitization. Pending tokens are broad text without hidden reveal; bare # matches nothing. Configured names reject whitespace/commas, Unicode uppercase/titlecase and emoji with explicit maintainer rename guidance; uppercase input still resolves known lowercase tags. Keep lowercase/uncased languages, bare digits/#/* and punctuation valid without normalization.
- **Empty/tools:** Truly empty sites have no search and retain static empty explanations. Every nonempty subtree enhances search, including untagged/all-hidden pages. Initial all-hidden pages show 0 links and No links listed here. Selected reserved filters can reveal matching leaves; removing them restores the initial explanation. Without JavaScript, search and usable picker controls stay hidden, static visible links/popovers remain usable and hidden leaves stay omitted.

## Manual leaf states and disabled interactions

Exact hidden/broken/disabled identities derive states without inheritance; source names must meet lowercase/uncased/no-emoji/no-whitespace/comma rules. Typed queries and defensive recovery can ignore case. Broken codes warn without blocking; disabled non-tag content overrides broken/script with grey, while tag labels use independent seeded inks. Hidden opacity remains 80% dark / 94% light, restores on focus and never compounds through summaries. Preserve row geometry, overflow, pointer visibility and destination reserves.

Broken enabled long destinations turn orange-red on hover, matching their short code and Open action while retaining underlining and copying.

Disabled code still copies the short URL; native activation reaches its explanation. Disabled destination is a copy-only button with full accessible/selectable text, never an external href or navigation fallback, including without JavaScript. Both copies retain polite success/failure feedback, five-second clearing, timer reset, and stale-copy cancellation. Open and script Download stay visibly unavailable as programmatically disabled controls with no actionable href, including modified/keyboard activation. Tags and directory navigation remain usable.

Disabled code, destination, Open/Download, row/container surfaces/wash, focus and selection remain neutral grayscale. Every tag label/chip, including hidden/broken/disabled/script, gets light/dark HSL inks directly from its string seed with matched tinted fills/borders; no finite palette or special state-label slots. Follow DESIGN.md's fixed generation bounds and shared native light-dark/color-mix treatment. Hidden opacity remains independent and restores on focus. Verify the full generated hue spectrum, current-map tags and envelope extremes ≥4.5:1 on actual rest/hover tints including dimming and row wash; no dots or hover-only labels.

Disabled explanations select the shared minimal document/theme/styles without chrome. Title and heading are Link disabled. Exact paragraphs: “This short link has been disabled. shl will not forward you to its destination.” and “The destination remains public. Disabling this link does not prevent access outside shl.” No refresh, forwarding script, destination canonical link, or Continue fallback. Wrong-case recovery uses the same interpretation and canonical-cased short URL under root/project prefixes. Safe disabled launchers print the specified stderr explanation and exit 1 without download/payload/execution/argument handling. Disabling does not prevent external access or affect retained older artifacts.

## Interaction Primitives

Typing and selected-tag AND filter the current subtree. Native chip buttons select/remove with Enter/Space; row tags remain informational native popovers. Folder disclosure expands/collapses; folder names navigate. Codes/destinations copy and Open follows enabled links. Theme changes the saved override. Ordinary internal browsing and local actions preserve the live document, root, header, footer and theme control, including Links/Guide/Home/directory navigation from 404 and Back/Forward through recognizable generated HTTP-404 content. Title, current navigation and accessible focus follow content; 404 has no active header link. Cross-page mounts, including Back/Forward, reset text/selections/error/picker/disclosures; same-page fragments retain them and existing complete-URL scroll restoration. Outgoing listeners/work are cleaned before replacement and content mounts once. New navigation/history intent cancels pending recovery/copy/download work; stale results cannot mutate content, rebase links, save or forward. External destinations, launchers, downloads and minimal documents retain their native boundaries, as do modified clicks and failure fallback. Native folder/breadcrumb/Home navigation remains usable without JavaScript.

## Accessibility Floor

Keep programmatic search labeling, named tag regions, search-associated independent error, visible keyboard focus and full chip labels. Expose picker expanded/controlled state and selected removal/state cues beyond color. Announce one polite live count without duplicate numbers. Preserve script Download cues, readable hidden labels, breadcrumbs, full accessible destinations and native foundations.

## Responsive & Platform

Use the centered directory width in DESIGN.md on desktop; narrow widths wrap tools beneath count with usable search and separate horizontal chip tracks. Full labels stay one line. Breadcrumbs retain their reserved scrolling row. Preserve code/destination pairing and small-screen row behavior. Static GitHub Pages remains baseline; JavaScript enhances filters, copying and in-page navigation.

## Key Flows

### Find a setup script — Rat, developer

1. Rat opens the homepage looking for an automation script, without remembering its short path.
2. Rat commits `#shell` with space, comma or Enter (or selects shell from Show tags); the same prominent count narrows and matching folders expand.
3. Rat sees `setup/ohmyposh/stable` and the Download action; hovering or focusing the row shows its destination, which is always visible on touch.
4. **Climax:** Rat uses Download to fetch and save the current destination script's exact bytes without executing it. The filename uses a safe destination URL basename, falling back to `<code>.sh` when unusable. This needs JavaScript and a readable response; cross-origin hosts must allow CORS. Network, HTTP, CORS, and body-read failures announce a download error and save no file or launcher. Leaving the directory aborts pending work and suppresses stale saves and feedback; temporary browser resources are released.

If filters have no match, the count reads "0 links" and no-match appears; choices remain reachable. Clearing text retains shell; removing shell restores the visible directory.

### Reveal a hidden alternative — Rat, developer

1. Rat searches for `ohmyposh` but needs the hidden `latest` entry rather than `stable`.
2. Rat opens Show tags and selects hidden; the current text and every selected tag still constrain results.
3. **Climax:** Rat sees only matching hidden alternatives with Download, visibly subdued, and chooses the intended script without losing the query.
4. Rat removes hidden to return to visible-only results. Without JavaScript, Rat still browses and opens visible stable through folder pages.
