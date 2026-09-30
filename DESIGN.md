---
name: Shortlink
description: A clear, static directory for short links.
colors:
  action-light: "#154db8"
  action-dark: "#a5c4ff"
  paper-light: "#f5f7f8"
  surface-light: "#fff"
  ink-light: "#172232"
  secondary-light: "#526174"
  rule-light: "#d9e0e6"
  wash-light: "#eaf0f9"
  paper-dark: "#101923"
  surface-dark: "#172331"
  ink-dark: "#edf2f6"
  secondary-dark: "#adbac9"
  rule-dark: "#374657"
  wash-dark: "#22354e"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.7rem, 6vw, 5rem)"
    lineHeight: 1.08
    letterSpacing: "-.06em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    lineHeight: 1.65
rounded:
  panel: "10px"
  control: "999px"
---

# Design System: Shortlink

## Overview

**Creative North Star: "The Bookmark Register"**

A quiet, precise index: codes, destinations, and practical guidance are the material. The UI keeps the link directory visible without requiring an account or a search interface.

**Key Characteristics:**
- Ruled entries instead of cards for the directory.
- One blue link color against cool, neutral surfaces.
- A legible light and dark version of the same structure.

## Colors

The single action color is reserved for links and navigational feedback. Background, text, secondary text, and hairline dividers each have explicit light and dark counterparts. The soft wash distinguishes callouts and hovered controls.

## Typography

The site uses the system sans for reading and large, tightly tracked headings. Codes, URLs in prose, and code samples use a system monospace. Supporting prose stays within a readable measure; destinations may wrap without truncation.

## Layout

A centered 1120px outer container carries the site header and content. At wider widths the directory shares space with a narrow explanatory aside; below 740px the columns stack and navigation wraps to a separate line. Reading pages use a narrower 740px column.

## Elevation & Depth

Flat by design: surfaces use color and a one-pixel rule instead of shadows.

## Shapes

Directory rows and sections are square and ruled. Code blocks and callouts have 10px corners; the theme control is pill-shaped.

## Components

### Navigation

Muted text links turn blue on hover or when current. On small screens navigation wraps below the brand and theme toggle. The toggle has a fine border and a visible keyboard focus outline.

### Directory rows

A code links to its relative redirect page; the optional title and full destination appear beneath. A bottom rule separates each entry. Codes and long destinations wrap rather than overflow.

## Do's and Don'ts

### Do:
- **Do** keep link codes and destinations readable together.
- **Do** use shared color roles so light and dark modes retain the same hierarchy.

### Don't:
- **Don't** hide destinations behind decorative cards or rely on color alone for keyboard focus.
