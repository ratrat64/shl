---
name: Shortlink
description: A clear, static directory for short links.
colors:
  action-light: "#1755a0"
  action-dark: "#9ac6ff"
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

A compact index puts codes, titles, destinations, and search above everything else. A single guide contains the practical information.

**Key Characteristics:**
- Ruled, three-column entries instead of cards for the directory.
- One blue link color against grayscale surfaces.
- A true black dark background and a near-white light background.

## Colors

The single action color is reserved for links and focus. Dark mode uses a black page and charcoal controls; light mode uses an off-white page and white controls. Hairline dividers and muted text have theme-specific contrast.

## Typography

The site uses the system sans for reading and modest headings. Codes and code samples use a system monospace. Destinations may wrap without truncation.

## Layout

A centered 1160px container carries the directory across its full width. Search shares the title row on desktop; entries use code, title, and destination columns. Below 740px search and destinations stack, while the guide uses a narrower 740px column.

## Elevation & Depth

Flat by design: surfaces use color and a one-pixel rule instead of shadows.

## Shapes

Directory rows and sections are square and ruled. Inputs and code blocks have subtle 4px corners.

## Components

### Navigation

The header has only Links and Guide navigation. Current links are underlined. The theme toggle has a fine border and a visible keyboard focus outline.

### Directory rows

A code links to its relative redirect page; the optional title and full destination share its row. A bottom rule separates entries. Codes and long destinations wrap rather than overflow.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
