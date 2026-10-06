---
name: Shortlink
description: A clear, static directory for short links.
status: final
updated: 2026-10-06
colors:
  action-light: "#1755a0"
  action-dark: "#9ac6ff"
  script-light: "#875000"
  script-dark: "#ffcb86"
  paper-light: "#fafafa"
  surface-light: "#fff"
  ink-light: "#171717"
  secondary-light: "#555555"
  rule-light: "#dedede"
  wash-light: "#f0f2f4"
  paper-dark: "#000000"
  surface-dark: "#0d0d0d"
  ink-dark: "#f2f2f2"
  secondary-dark: "#aaaaaa"
  rule-dark: "#303030"
  wash-dark: "#191919"
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

A centered 1160px container carries the directory across its full width. On the homepage, a prominent live count ("N links", including "0 links") replaces the visible Links heading on the left. A single-line search sits on the right, followed by a compact grouped area for Show hidden links and any future toggles. In nested folders, keep the directory name prominent for orientation and show the same subtree count nearby; breadcrumbs follow the heading row. Entries put code and destination side by side. On narrow layouts, search and controls wrap beneath the count or folder heading; below 740px the layout stacks. The guide uses a narrower 740px column.

The [homepage composition](mockups/directory.html) illustrates the alignment at desktop and narrow widths.

## Elevation & Depth

Flat by design: surfaces use color instead of shadows; directory entries are separated by space rather than rules. On directory pages remove the two framing rules below the header and above the footer; use spacing to separate sections instead. Guide section rules remain.

## Shapes

Directory rows are square and unruled. Inputs and code blocks have subtle 4px corners.

## Components

### Navigation

The header has only Links and Guide navigation. Current links are underlined. The theme toggle has a fine border and a visible keyboard focus outline.

### Directory tools

The count is the homepage's visual label, not a small aside or a second search-result number. Keep the search label accessible but visually hidden; the visible placeholder is "Search link, title or tag". Keep the hidden-links toggle compact and adjacent to search within the grouped controls. The same count responds to searching and to the hidden-links toggle; see EXPERIENCE.md for states and announcements.

### Directory rows

A code copies its full short URL on click; script-enabled codes use amber and a visible script label. Destinations copy their full URL on click, and an Open control at the row end follows it. Folder names link to their browseable pages while the disclosure marker expands the nested list. Optional titles appear on hover over codes and remain searchable. Destinations display their ends without wrapping; the full URL is available for copying and to assistive technology.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.
- **Do** separate directory sections with spacing rather than header/footer framing rules.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
- **Don't** add a second visible numeric search-result count or invent a new color direction for the refresh.
