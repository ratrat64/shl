---
name: Shortlink
description: A clear, static directory for short links.
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

## Overview

**Creative North Star: "The Working Index"**

A compact index puts codes, destinations, and search above everything else. Titles appear on hover and remain searchable. A single guide contains the practical information.

**Key Characteristics:**
- Unruled, two-column entries instead of cards for the directory.
- Blue links and amber script links against grayscale surfaces.
- A true black dark background and a near-white light background.

## Colors

Blue is reserved for standard links and focus; amber marks executable-script entries with a text label as a second cue. Dark mode uses a black page and charcoal controls; light mode uses an off-white page and white controls. Muted text has theme-specific contrast.

## Typography

The site uses the system sans for reading and modest headings. Codes and code samples use a system monospace. Codes stay on one line; long destinations truncate in the middle while their full value remains available on hover and to assistive technology.

## Layout

A centered 1160px container carries the directory across its full width. Search shares the heading row on desktop and in nested folders; breadcrumbs follow the heading row. Entries put code and destination side by side. Below 740px search stacks under the heading, while the guide uses a narrower 740px column.

## Elevation & Depth

Flat by design: surfaces use color instead of shadows; directory entries are separated by space rather than rules.

## Shapes

Directory rows are square and unruled. Inputs and code blocks have subtle 4px corners.

## Components

### Navigation

The header has only Links and Guide navigation. Current links are underlined. The theme toggle has a fine border and a visible keyboard focus outline.

### Directory rows

A code links to its relative redirect page; script-enabled codes use amber and a visible script label. Folder names link to their browseable pages while the disclosure marker expands the nested list. Optional titles appear on hover over codes and remain searchable. Destinations display their ends without wrapping and reveal the full URL on hover.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
