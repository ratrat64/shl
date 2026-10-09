---
name: Shortlink
description: A clear, static directory for short links.
status: final
updated: 2026-10-08
colors:
  action-light: "#006b60"
  action-dark: "#64b6a4"
  script-light: "#895400"
  script-dark: "#c6a36a"
  broken-light: "#a33d20"
  broken-dark: "#ee967b"
  disabled-light: "#606060"
  disabled-dark: "#a3a3a3"
  paper-light: "#f6f7f5"
  surface-light: "#fff"
  ink-light: "#252b29"
  secondary-light: "#59645f"
  rule-light: "#7a8580"
  wash-light: "#e8eeeb"
  paper-dark: "#000"
  surface-dark: "#111715"
  ink-dark: "#c6d0ca"
  secondary-dark: "#96a59d"
  rule-dark: "#63736b"
  wash-dark: "#111b16"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.4rem)"
    lineHeight: 1.2
    letterSpacing: "-.035em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    lineHeight: 1.55
rounded:
  panel: "4px"
  control: "4px"
---

# Design System: Shortlink

## Brand & Style

**Creative North Star: "The Working Index"**

A compact index puts codes, destinations, and search above everything else. Sleek, elegant minimalism comes from hierarchy and spacing, not decoration. Titles appear on hover and remain searchable. A single guide contains the practical information.

**Key Characteristics:**
- Unruled, two-column entries instead of cards for the directory.
- Teal links and amber script links against softly green-tinted neutral surfaces.
- A pure black dark background and a near-white light background, with high contrast that is easy on the eyes.

## Colors

Teal is reserved for standard links and focus; amber marks enabled-script entries, with Download as a second cue instead of a SCRIPT label. Broken codes use orange-red; disabled codes use grey, overriding broken/script emphasis. Full tags are non-color cues without duplicate badges, and hidden opacity applies independently. Dark mode uses a pure black page (#000), softly green-tinted panels and softened light ink; light mode uses an off-white page and white panels. Verify state text at least 4.5:1, including dimmed combinations on background/wash, and visible focus in executed rendered checks. Respect system light/dark preference and retain the visitor's saved theme override.

The frontmatter roles map to shared CSS tokens in `src/assets/site.css`: paper → `--bg`, surface → `--panel`, ink → `--ink`, secondary → `--muted`, rule → `--line`, action → `--accent`, script → `--script`, broken → `--broken`, disabled → `--disabled`, and wash → `--wash`, with light/dark variants above. `src/styles.mjs` loads the same CSS for embedded documents.

Disabled codes, destinations, focus, selection and unavailable Open/Download remain grayscale: resting surfaces use #f7f7f7 light / #000 dark and wash #ebebeb light / #181818 dark. Full tag labels/chips alone retain independent ink, palette-matched tinted backgrounds and borders. Hidden opacity remains independent.

Every tag string, INCLUDING state labels, seeds generated HSL inks using UTF-16 FNV-1a (2166136261, Math.imul(seed ^ charCode,16777619) >>> 0). Hue=(seed%3600)/10, saturation=55+((seed>>>16)%21), light-theme lightness=20+((seed>>>24)%3), dark=80+((seed>>>24)%5). This fixed 0–359.9°/55–75%/20–22% light/80–84% dark envelope replaces finite palettes and special state-label assignments under the latest approved 2026-10-09 amendment. No storage or unique-color promise; state row/action colors remain separate. Renderer publishes lossless JSON-content identity and --tag-light/--tag-dark on each label/chip; selected chips clone metadata. Shared --tag-tone uses light-dark under existing root color-scheme. Color-mix into local panel stays 5% resting / 8% hover fill and 30% resting / 45% hover border. Verify generated hue samples and bounds ≥4.5:1 on actual tints, hidden opacity and row wash. Configured tag names reject Unicode uppercase/titlecase and emoji alongside whitespace/commas; valid lowercase/uncased languages, digits and ordinary punctuation retain raw values and order. Typed uppercase tokens still resolve known lowercase identities. See [Tag filter behavior](../../../specs/spec-colored-tag-filters/tag-filter-behavior.md#automatic-color-assignment--cap-1) for the canonical contract.

Disabled short codes keep their resting text appearance on hover; do not add an underline.

## Typography

The site uses the system sans for reading and modest headings. Codes and code samples use a system monospace. Codes stay on one line; long destinations truncate in the middle while their full value remains available for copying and to assistive technology.

## Layout & Spacing

A centered 1160px container carries the directory across its full width. Root/nested pages use one prominent live count on the left; tools on the right are a separate selected horizontal track LEFT of search, then Show tags. Selected tags precede search in DOM/tab order. The available horizontal track is below them. Below 740px tools stack beneath the count with selected tags above usable search and separate chip tracks; full labels never wrap. Nested breadcrumbs reserve the same one-line space as home and scroll on long paths. Entries retain code/destination pairing. The Guide uses a narrower 740px column.

The page shell fills at least the viewport height and lets main content grow: the footer sits at the bottom on short pages and follows long content in normal flow, never fixed over it.

The [homepage composition](mockups/directory.html) illustrates the alignment at desktop and narrow widths; these spines take precedence for the refreshed palette and behavior.

## Elevation & Depth

Flat by design: surfaces use color instead of shadows; directory entries are separated by space rather than rules. The shared header and footer are borderless on every shell page, including Links, nested directories, Guide, and 404; use spacing to separate sections instead. Guide content section rules remain.

## Shapes

Link rows and folder summaries are unruled with subtle 4px corners. Inputs and code blocks also have 4px corners.

## Components

### Ownership and composition

Follow AD-7–AD-9 in the [architecture spine](../../architecture/architecture-shortlink-2026-10-04/ARCHITECTURE-SPINE.md). Every HTML page reuses the document, theme, and style foundations. Browsable pages compose the same header/navigation/theme-control/footer shell; destination and legacy redirects select the minimal document without chrome. Shared components keep the same geometry, typography, color, spacing, and responsive behavior at equal viewport/theme, except active navigation state. Page-specific content stays inside main; it cannot restyle chrome. Variants identify component purpose or state, never page identity. Shared markup alone does not establish visual consistency: verify computed appearance and page/navigation states.

### Navigation

The header brand reads `/shl/`: `shl` uses ink, the leading slash uses teal action, and the trailing slash uses amber script. The header has only Links and Guide navigation. Current links are underlined. Buttons have subdued edges mixed from 25% of their action color and the page background; keep the visible keyboard focus outline. Theme, Show tags and Open controls have a subtle teal background; broken enabled rows use orange-red for Open text, edges, and fills. Download uses amber. Mix 10% of the action color into the page background, increasing to 18% on hover; broken Open uses 12% on hover to preserve hidden-row text contrast. Disabled controls retain the muted wash.

### Directory tools

The count is the sole heading and polite result count. Keep the accessible search label visually hidden and placeholder "Search link, title or tag". Show tags / Hide tags exposes expanded state and its controlled available region, changing only visibility. Disable it for no-tag catalogs. Selected chips appear left of search (above on mobile), in insertion order and matching DOM/tab order; available chips retain canonical catalog order. Native buttons name Filter by #tag / Remove #tag filter and selected state. Empty selected tracks hide; all-selected pickers remain open with "All tags selected.". Focus moves to the selected chip on activation and next/previous/search on removal; tracks reveal focused chips. Independent polite Tag not found feedback is associated with search.

An empty site has no search; every nonempty subtree has enhanced search, including all-hidden/untagged pages. Filters require selected-tag AND plus broad text; only selected reserved hidden/broken/disabled tags admit matching hidden leaves. Zero filtered results retain tools and show the no-match message; initial all-hidden pages show 0 links and No links listed here. Without JavaScript, search and usable picker controls stay hidden; disabled no-tag controls may remain visible.

### Directory rows

A code copies its full short URL on click; enabled script codes use amber and have Download without a SCRIPT label. Destinations copy their full URL; Open follows enabled destinations. Disabled code native links reach the explanation; disabled destinations are copy-only buttons with full accessible/selectable text and no external href. Open/Download stay visible as disabled buttons with muted wash and no actionable href. Folder names link to their browseable pages while disclosure expands the list. Titles appear on hover and remain searchable. Destinations display their ends without wrapping, retaining full copy/accessibility values.

Broken enabled destination text uses the short code's orange-red palette on hover, retaining its underline and copy behavior.

Only in hover-capable, fine-pointer mode with no coarse input available, destination text is visually hidden with opacity until row hover or focus-within. Its layout space and full accessible value remain reserved, so revealing it never shifts content. Any available coarse pointer, including hybrid touch/mouse devices, forces destinations visible; touch and non-hover modes always show them too. Long URLs remain on one line with the existing middle truncation; copying retains the full value. Every row variant, tagged or untagged, standard or script, reserves at least 4rem for the destination (3rem below 500px). Open and Download remain visible.

Copy feedback appears as a small, flat floating panel near the viewport edge and never displaces directory content.

Tags sit inline between code/destination at the existing metadata size, with each full #label using independent string-seeded ink and matching tinted fill/border. Compact label padding must preserve 50px row height. No cap, ellipsis or wrapping. The track fits actual label width; preserve 3rem label and destination reserves, horizontally scrolling crowded rows. Scrollbar chrome must not add row height. Row tags remain informational native-popover triggers, never filter controls. Popover containers retain shared theme surfaces/rules; their individual full labels use the same tinted tag treatment. Retain native keyboard/dismissal behavior and existing positioning.

Folder summaries stay on one line and scroll horizontally for long names, preserving the full name and disclosure marker without ellipsis or wrapping. Their height remains 50px; scrollbar chrome must not increase it.

Link rows and folder summaries share a 50px minimum height (3.125rem), 10px vertical and 12px horizontal padding (.625rem .75rem), and a 4px radius. Both use the theme wash on hover and focus-within; broken enabled rows instead use a 6% orange-red mix with the page background, preserving dimmed metadata contrast. Preserve visible focus outlines; folder wash applies only to the summary, never its descendant list. Revealed hidden links retain their regular/broken/disabled colors and weights with row/tag opacity 80% dark and 94% light. Hidden-only summaries dim independently without dimming descendants again. Keyboard focus restores full opacity. Keep full state tags; do not add duplicate hidden or SCRIPT labels.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.
- **Do** separate shell sections with spacing rather than header/footer framing rules on every page.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
- **Don't** add a second visible numeric search-result count.
