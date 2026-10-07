---
name: Shortlink
description: A clear, static directory for short links.
status: final
updated: 2026-10-07
colors:
  action-light: "#006b60"
  action-dark: "#79d6c3"
  script-light: "#895400"
  script-dark: "#e9bf7a"
  paper-light: "#f6f7f5"
  surface-light: "#fff"
  ink-light: "#252b29"
  secondary-light: "#59645f"
  rule-light: "#7a8580"
  wash-light: "#e8eeeb"
  paper-dark: "#000"
  surface-dark: "#111715"
  ink-dark: "#e0e7e3"
  secondary-dark: "#a0afa7"
  rule-dark: "#63736b"
  wash-dark: "#17221d"
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

Teal is reserved for standard links and focus; amber marks executable-script entries with a text label as a second cue. Dark mode uses a pure black page (#000), softly green-tinted panels and softened light ink; light mode uses an off-white page and white panels. Muted text and visible control borders retain theme-specific contrast without harsh white-on-black glare. Respect system light/dark preference and retain the visitor's saved theme override.

The frontmatter roles map to the CSS tokens in `src/pages.mjs`: paper → `--bg`, surface → `--panel`, ink → `--ink`, secondary → `--muted`, rule → `--line`, action → `--accent`, script → `--script`, and wash → `--wash`, with light/dark variants above.

## Typography

The site uses the system sans for reading and modest headings. Codes and code samples use a system monospace. Codes stay on one line; long destinations truncate in the middle while their full value remains available for copying and to assistive technology.

## Layout & Spacing

A centered 1160px container carries the directory across its full width. On the homepage and in nested folders, a prominent live count ("N links", including "0 links") is the sole heading on the left, at the same size. A single-line search sits on the right, followed by a compact grouped area for Show hidden links and any future toggles. Nested pages use breadcrumbs below the count for folder orientation, without a separate folder-name heading. Home reserves the same one-line breadcrumb space, keeping the list in place across navigation; long paths scroll horizontally rather than wrapping. Entries put code and destination side by side. On narrow layouts, search and controls wrap beneath the count; below 740px the layout stacks. The guide uses a narrower 740px column.

The page shell fills at least the viewport height and lets main content grow: the footer sits at the bottom on short pages and follows long content in normal flow, never fixed over it.

The [homepage composition](mockups/directory.html) illustrates the alignment at desktop and narrow widths; these spines take precedence for the refreshed palette and behavior.

## Elevation & Depth

Flat by design: surfaces use color instead of shadows; directory entries are separated by space rather than rules. On directory pages remove the two framing rules below the header and above the footer; use spacing to separate sections instead. Guide section rules remain.

## Shapes

Directory rows are square and unruled. Inputs and code blocks have subtle 4px corners.

## Components

### Navigation

The header brand reads `/shl/`: `shl` uses ink, the leading slash uses teal action, and the trailing slash uses amber script. The header has only Links and Guide navigation. Current links are underlined. The theme toggle has a fine border and a visible keyboard focus outline. Theme, hidden-toggle and Open controls have a subtle teal background; Download uses amber. Mix 10% of the action color into the page background, increasing to 18% on hover. Disabled controls retain the muted wash.

### Directory tools

The count is every directory page's visual heading, not a small aside or a second search-result number. Keep the search label accessible but visually hidden; the visible placeholder is "Search link, title or tag". Reserve the same search and toggle columns on every directory page so the search size and position do not shift. The toggle stays visible but muted and disabled when there are no hidden links; otherwise it sits beside search on desktop and below it, right-aligned, on mobile. The same count responds to searching and to the hidden-links toggle; see EXPERIENCE.md for states and announcements.

### Directory rows

A code copies its full short URL on click; script-enabled codes use amber and a visible script label. Destinations copy their full URL on click, and an Open control at the row end follows it. Folder names link to their browseable pages while the disclosure marker expands the nested list. Optional titles appear on hover over codes and remain searchable. Destinations display their ends without wrapping; the full URL is available for copying and to assistive technology.

Copy feedback appears as a small, flat floating panel near the viewport edge and never displaces directory content.

Link rows and folder summaries use the theme wash on hover and focus-within, preserving visible focus outlines. Revealed hidden links are subtle: their code uses secondary (muted) ink without a hidden text label or reduced opacity on the entire row. Hidden-only folder summaries also use secondary ink. A hidden script code uses muted ink but retains its visible script label; destination, Open and Download actions remain readable and usable.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.
- **Do** separate directory sections with spacing rather than header/footer framing rules.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
- **Don't** add a second visible numeric search-result count.
