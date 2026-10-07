---
name: Shortlink
description: A clear, static directory for short links.
status: final
updated: 2026-10-07
colors:
  action-light: "#1a5fb0"
  action-dark: "#8ab8ff"
  script-light: "#9b6000"
  script-dark: "#e8b460"
  paper-light: "#f6f6f6"
  surface-light: "#fff"
  ink-light: "#2a2a2a"
  secondary-light: "#666666"
  rule-light: "#e0e0e0"
  wash-light: "#eeefef"
  paper-dark: "#121212"
  surface-dark: "#1a1a1a"
  ink-dark: "#e8e8e8"
  secondary-dark: "#999999"
  rule-dark: "#2a2a2a"
  wash-dark: "#1e1e1e"
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
- Blue links and amber script links against grayscale surfaces.
- A true black dark background and a near-white light background.

## Colors

Blue is reserved for standard links and focus; amber marks executable-script entries with a text label as a second cue. Dark mode uses a black page and charcoal controls; light mode uses an off-white page and white controls. Muted text has theme-specific contrast.

## Typography

The site uses the system sans for reading and modest headings. Codes and code samples use a system monospace. Codes stay on one line; long destinations truncate in the middle while their full value remains available for copying and to assistive technology.

## Layout & Spacing

A centered 1160px container carries the directory across its full width. On the homepage and in nested folders, a prominent live count ("N links", including "0 links") is the sole heading on the left, at the same size. A single-line search sits on the right, followed by a compact grouped area for Show hidden links and any future toggles. Nested pages use breadcrumbs below the count for folder orientation, without a separate folder-name heading. Home reserves the same one-line breadcrumb space, keeping the list in place across navigation; long paths scroll horizontally rather than wrapping. Entries put code and destination side by side. On narrow layouts, search and controls wrap beneath the count; below 740px the layout stacks. The guide uses a narrower 740px column.

The [homepage composition](mockups/directory.html) illustrates the alignment at desktop and narrow widths.

## Elevation & Depth

Flat by design: surfaces use color instead of shadows; directory entries are separated by space rather than rules. On directory pages remove the two framing rules below the header and above the footer; use spacing to separate sections instead. Guide section rules remain.

## Shapes

Directory rows are square and unruled. Inputs and code blocks have subtle 4px corners.

## Components

### Navigation

The header has only Links and Guide navigation. Current links are underlined. The theme toggle has a fine border and a visible keyboard focus outline.

### Directory tools

The count is every directory page's visual heading, not a small aside or a second search-result number. Keep the search label accessible but visually hidden; the visible placeholder is "Search link, title or tag". Reserve the same search and toggle columns on every directory page so the search size and position do not shift. The toggle stays visible but muted and disabled when there are no hidden links; otherwise it sits beside search on desktop and below it, right-aligned, on mobile. The same count responds to searching and to the hidden-links toggle; see EXPERIENCE.md for states and announcements.

### Directory rows

A code copies its full short URL on click; script-enabled codes use amber and a visible script label. Destinations copy their full URL on click, and an Open control at the row end follows it. Folder names link to their browseable pages while the disclosure marker expands the nested list. Optional titles appear on hover over codes and remain searchable. Destinations display their ends without wrapping; the full URL is available for copying and to assistive technology.

Copy feedback appears as a small, flat floating panel near the viewport edge and never displaces directory content.

Tags sit inline between the code and destination in muted text at the existing metadata size. Cap their width at 9rem (5rem below 500px), keep them on one line, and truncate with an ellipsis rather than increasing row height. Reserve at least 3rem for the labels and 4rem for the destination (3rem below 500px); let long-code or script rows scroll horizontally instead of reducing either target to zero. Horizontal scrollbar chrome must not add row height. Selecting the labels reveals the full tags in a flat floating panel using existing surface, rule, ink, and control-radius roles. Place it near the labels where CSS anchor positioning is supported; otherwise use the browser's centered popover. See EXPERIENCE.md for keyboard and dismissal behavior.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.
- **Do** separate directory sections with spacing rather than header/footer framing rules.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
- **Don't** add a second visible numeric search-result count or invent a new color direction for the refresh.
