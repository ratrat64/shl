---
name: Shortlink
description: A clear, static directory for short links.
status: final
updated: 2026-10-07
colors:
  action-light: "#006b60"
  action-dark: "#64b6a4"
  script-light: "#895400"
  script-dark: "#c6a36a"
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

Teal is reserved for standard links and focus; amber marks executable-script entries, with their Download action as a second cue instead of a SCRIPT label. Dark mode uses a pure black page (#000), softly green-tinted panels and softened light ink; light mode uses an off-white page and white panels. The dark palette is deliberately lower in brightness; hidden-row text remains readable with a distinct subdued role. Respect system light/dark preference and retain the visitor's saved theme override.

The frontmatter roles map to the CSS tokens in `src/styles.mjs`: paper → `--bg`, surface → `--panel`, ink → `--ink`, secondary → `--muted`, rule → `--line`, action → `--accent`, script → `--script`, and wash → `--wash`, with light/dark variants above.

## Typography

The site uses the system sans for reading and modest headings. Codes and code samples use a system monospace. Codes stay on one line; long destinations truncate in the middle while their full value remains available for copying and to assistive technology.

## Layout & Spacing

A centered 1160px container carries the directory across its full width. On the homepage and in nested folders, a prominent live count ("N links", including "0 links") is the sole heading on the left, at the same size. A single-line search sits on the right, followed by a compact grouped area for Show hidden links and any future toggles. Nested pages use breadcrumbs below the count for folder orientation, without a separate folder-name heading. Home reserves the same one-line breadcrumb space, keeping the list in place across navigation; long paths scroll horizontally rather than wrapping. Entries put code and destination side by side. On narrow layouts, search and controls wrap beneath the count; below 740px the layout stacks. The guide uses a narrower 740px column.

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

The header brand reads `/shl/`: `shl` uses ink, the leading slash uses teal action, and the trailing slash uses amber script. The header has only Links and Guide navigation. Current links are underlined. Buttons have subdued edges mixed from 25% of their action color and the page background; keep the visible keyboard focus outline. Theme, hidden-toggle and Open controls have a subtle teal background; Download uses amber. Mix 10% of the action color into the page background, increasing to 18% on hover. Disabled controls retain the muted wash.

### Directory tools

The count is every directory page's visual heading, not a small aside or a second search-result number. Keep the search label accessible but visually hidden; the visible placeholder is "Search link, title or tag". Reserve the same search and toggle columns on every directory page so the search size and position do not shift. The toggle stays visible but muted and disabled when there are no hidden links; otherwise it sits beside search on desktop and below it, right-aligned, on mobile. The same count responds to searching and to the hidden-links toggle; see EXPERIENCE.md for states and announcements.

Column consistency applies when interactive tools are shown. Preserve the existing empty states: an empty site has no search, and an all-hidden subtree hides search until links are revealed. With JavaScript disabled, search and enabled hidden toggles remain hidden; disabled toggles remain visible.

### Directory rows

A code copies its full short URL on click; script-enabled codes use amber and have a Download action without a SCRIPT label. Destinations copy their full URL on click, and an Open control at the row end follows it. Folder names link to their browseable pages while the disclosure marker expands the nested list. Optional titles appear on hover over codes and remain searchable. Destinations display their ends without wrapping; the full URL is available for copying and to assistive technology.

Only in hover-capable, fine-pointer mode with no coarse input available, destination text is visually hidden with opacity until row hover or focus-within. Its layout space and full accessible value remain reserved, so revealing it never shifts content. Any available coarse pointer, including hybrid touch/mouse devices, forces destinations visible; touch and non-hover modes always show them too. Long URLs remain on one line with the existing middle truncation; copying retains the full value. Every row variant, tagged or untagged, standard or script, reserves at least 4rem for the destination (3rem below 500px). Open and Download remain visible.

Copy feedback appears as a small, flat floating panel near the viewport edge and never displaces directory content.

Tags sit inline between the code and destination in muted text at the existing metadata size. Show full labels on one line with no width cap or ellipsis, without increasing row height. Let the tag track fit its actual label width so the gap to destinations stays consistent. Reserve at least 3rem for the labels; let crowded rows scroll horizontally instead of wrapping tags or reducing either target to zero. Horizontal scrollbar chrome must not add row height. Retain the native tag-button popover as an optional convenient view of all tags, not a requirement for reading shortened labels. Its flat floating panel uses existing surface, rule, ink, and control-radius roles. Place it near the labels where CSS anchor positioning is supported; otherwise use the browser's centered popover. See EXPERIENCE.md for unchanged keyboard and dismissal behavior.

Folder summaries stay on one line and scroll horizontally for long names, preserving the full name and disclosure marker without ellipsis or wrapping. Their height remains 50px; scrollbar chrome must not increase it.

Link rows and folder summaries share a 50px minimum height (3.125rem), 10px vertical and 12px horizontal padding (.625rem .75rem), and a 4px radius. Both use the theme wash on hover and focus-within, preserving visible focus outlines; folder wash applies only to the summary, never its descendant list. Revealed hidden links use exactly the regular colors and font weights, with reduced opacity across the row and tags: 80% in dark mode and 94% in light mode. Hidden-only folder summaries use the same opacity without dimming their nested lists again. Keyboard focus restores full row or summary opacity so focus outlines stay clear. Do not add hidden or SCRIPT labels.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.
- **Do** separate shell sections with spacing rather than header/footer framing rules on every page.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
- **Don't** add a second visible numeric search-result count.
