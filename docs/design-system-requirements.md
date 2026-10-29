# shl — Design System Requirements

Derived from the product's functionality only (source in `src/`, README, test
fixtures). No existing design docs were consulted. Requirements use **MUST** /
**SHOULD** / **MAY** and carry IDs so later design work can trace back to them.
Decisions made with the product owner are marked **(decided)** and listed in §10.

---

## 1. What the product is

shl is a static URL shortener and link directory published to GitHub Pages. Links
live in one YAML/JSON file; a build turns them into static pages. There is no
server, database or tracking.

### Who uses it

| Audience | What they do | What they need from the UI |
| --- | --- | --- |
| **Link consumer** | Opens a short URL such as `/gh/`. | A near-invisible hop. If a link is disabled or missing, a clear and calm explanation. |
| **Browser of the directory** | Scans folders, searches, filters by tag, copies short URLs or destinations, opens links. | Dense, scannable lists. Fast filtering. Clear copy feedback. Link states they can see at a glance. |
| **Script user** | Runs `curl … /x.sh \| bash` or downloads a script. | Script links that stand out. Safe-looking download feedback. |
| **Maintainer** | Edits `links.yaml` and reads the Guide. | Readable docs with code samples. Accurate examples of each special tag. |

### Surfaces (every screen the system must cover)

1. **Directory page** — the home page and every nested folder page. This is the main surface.
2. **Guide** — a long-form prose page with code blocks and a live example listing.
3. **404 / recovery** — "Checking that link…" first, then either a redirect or "Link not found".
4. **Redirect interstitial** — "Taking you to …" with a "Continue now" fallback. Usually seen for only a moment.
5. **Disabled-link page** — explains that shl will not forward this link.
6. **Old-info forwarders** — minimal pages that send old URLs to the Guide.
7. *(Non-visual)* **Bash launcher messages** — stderr text such as "This link is disabled…". These need the same voice as the UI.

---

## 2. Product constraints that shape the system

| ID | Constraint | Consequence for the design system |
| --- | --- | --- |
| C1 | **Moving to Vue 3 (decided).** The pilot renders the directory at build time with `createSSRApp` + `renderToString` and hydrates it as a client-side island (`data-directory-island` plus a JSON model). Other pages stay template strings for now. | Components are Vue components written with **render functions (`h()`), not SFCs (decided)**. SFCs can be reconsidered once every page is on Vue. Components MUST be **SSR-safe** (no `window` or `document` access during render) and **hydration-stable**: build output and the first client render must match, so values such as tag colors are computed on the model, never on the client. The server-rendered HTML MUST be usable without JS (C4). Tokens stay **CSS-first** (custom properties), so non-Vue pages and the core layer share them. Component states map to props and to data attributes or classes on the rendered DOM, which keeps them styleable and testable outside Vue. |
| C2 | **Two delivery modes.** Normal pages link `assets/site.css`. Redirect, disabled and 404 pages **embed** CSS inline, so they work at any path depth and before assets load. | The system MUST define a small **core layer** (tokens, base type, theme, minimal-document layout) that can be inlined, separate from the full component layer. The core layer MUST NOT depend on Vue, because these pages never load the framework. Keep the core small, because it ships on every redirect. |
| C3 | **Arbitrary base path.** Sites can live at `user.github.io/repo/` or on a custom domain. | No absolute asset URLs. No external font or icon CDNs. **Fonts are the system stacks (decided, TYP-1)**, so there are no font files at all. |
| C4 | **Progressive enhancement.** Without JS, enabled visible links still navigate. Search, copy, tags and download need JS. Some controls start `hidden` and JS reveals them. | Components MUST have a defined no-JS appearance. Hidden-until-JS controls MUST NOT cause layout shift when they appear. |
| C5 | **Privacy stance.** No click tracking. | No third-party assets: fonts, analytics pixels or icon services. |
| C6 | **Reload-free navigation.** Directory, Guide and 404 pages swap content in place. Filters persist per tab (sessionStorage), including Back/Forward and BFCache. | Toolbar components MUST be stable across page swaps: same position, same size, no flicker. Transitions MUST survive interruption. |
| C7 | **Automated visual assertions.** Tests check computed colors, hover timing and layout stability through CDP. | Token values MUST be deterministic and inspectable as computed styles. Motion MUST come from tokens (`--motion-duration`, `--motion-easing`) so tests can read or freeze it. |

---

## 3. Foundations (tokens)

### 3.0 Token structure (decided)

| ID | Requirement |
| --- | --- |
| TOK-1 | Tokens come in **two tiers**. **Primitives** are raw values (`--gray-700`, `--teal-500`, `--space-3`). **Semantic tokens** are named by purpose (`--ink-muted`, `--surface-raised`, `--state-broken`, `--accent`). Components MUST use only semantic tokens. |
| TOK-2 | **Component tokens** (`--row-*`, `--chip-*`) are added only where a component really needs to be tuned on its own, not by default. |
| TOK-3 | Both themes are expressed at the semantic tier (for example with `light-dark()`). Primitives don't know about themes. |

### 3.1 Color

| ID | Requirement |
| --- | --- |
| COL-1 | MUST provide **light** and **dark** themes plus **system** (follows `prefers-color-scheme`). The user's explicit choice persists (localStorage). The theme MUST apply before first paint, with no flash, on embedded pages too. |
| COL-2 | MUST define semantic surface and ink roles: page background, raised surface (popover, tooltip), primary ink, muted ink (destinations, breadcrumbs, footer), border/divider, hover/row highlight, focus ring, and the brand accent family (COL-9 to COL-11). |
| COL-12 | **Neutrals are slightly cool and low in chroma (decided)**: grays with a hint of blue, kept muted enough that generated tag colors remain the most colorful thing on the page. |
| COL-3 | MUST define **link-state colors** as semantic tokens, shared by row styling, tag labels and actions: **broken** (warning, red-orange), **disabled** (neutral gray), **script** (**violet, decided**, moved from amber so it never reads as a second warning next to broken), **hidden** (neutral gray: readable gray in light mode, light gray in dark mode). |
| COL-4 | MUST support an **unbounded generated tag palette**. Any tag string hashes to a hue (0–360). Saturation and lightness are clamped per theme. Today this is light 20–22% L and dark 80–84% L, set via inline `--tag-light`/`--tag-dark`. The system MUST define (a) the allowed lightness/saturation band per theme, which MUST guarantee text contrast ≥ 4.5:1 against both the page surface **and** the tag's own tinted fill at every hue, and (b) how tint fill and border are derived from the ink (for example `color-mix`). The palette makes no promise that colors are unique. |
| COL-5 | Fixed-state tags (`broken`, `script`, `disabled`, `hidden`) MUST override the generated hue with the COL-3 tokens. |
| COL-6 | **Row states combine; no state outranks another (decided).** Each state owns its own **visual channel**, so any combination shows every state at once without the cues fighting:<br>• **disabled**: desaturated (grayscale) row ink, plus Open and Download in their disabled state.<br>• **broken**: warning-tinted hover on the actions that still work.<br>• **script**: the Download action.<br>• **hidden**: dimming.<br>On top of those, every state has a **marker**: its own state tag with an icon (TAG-2). No two states may use the same channel. In particular, only one state may own the row background tint, if any state uses it at all. State tags keep their own color inside a desaturated row, the way other tag labels keep their tinted fill and border. |
| COL-6a | **`hidden` is a visibility state with its own visual cue (decided).** It controls whether a row is listed at all, and when a hidden row *is* shown (revealed by a filter, or in the Guide examples), its cue combines with the other states like any other channel (COL-6). The cue is dimming plus the `#hidden` state tag with its eye-off icon, so it never relies on color or opacity alone. |
| COL-6b | **Every combination MUST stay legible**, up to all four at once (fixtures include `broken-disabled`, `script-disabled`, `hidden-broken`, `hidden-disabled` and `script-all-states`). Desaturation and dimming together MUST still meet A11Y-1 contrast for the code, destination, tags and icons. In practice that caps how far each one can reduce contrast on its own. |
| COL-7 | Hover and focus tints for actions in a **broken** row MUST use the broken palette. Disabled actions MUST look non-interactive and still pass non-text contrast (3:1) for their outline or icon. |
| COL-9 | **The brand accent is a reusable token family (decided)**, **teal, around hue 170° (decided)**, tuned to the cool neutrals: `--accent` (ink), `--accent-strong` (hover or pressed), `--accent-tint` (fill) and `--accent-contrast` (text on an accent fill), defined for both themes. Contrast: ≥ 4.5:1 as text on the page surface, and ≥ 3:1 as a focus ring or indicator against adjacent colors. |
| COL-10 | **Where the accent goes.** It marks the brand and the user's current context or primary choice: the `/shl/` wordmark slashes, the active nav indicator, the focus ring (A11Y-2), the Open button (ACT-1), and text selection. It MAY mark the expanded tag-picker toggle and the selected-tag track. Every new use MUST fit that rule; it is not a decoration color. |
| COL-11 | **Where the accent never goes.** It never encodes link state (broken, disabled, script, hidden) and is never used as a tag color. Generated tag hues cover the whole color wheel (COL-4), so some tags will share the accent's hue. The two MUST therefore differ in **form**, not just color: tags are always `#`-prefixed tinted labels, and the accent never appears in that shape. Teal stays clearly apart from broken (red-orange), script (violet) and the grays. |
| COL-8 | When the theme switches, all inks and surfaces MUST change together. Hover transitions MUST NOT animate across the switch, which would show mixed-theme frames. |

### 3.2 Typography

| ID | Requirement |
| --- | --- |
| TYP-1 | **System font stacks only (decided)**: `system-ui` (and fallbacks) for UI text, `ui-monospace` (and fallbacks) for short codes, destinations, tags, inline `code` and `pre`. Codes and URLs are the product's core content and must stay easy to tell apart (`l`/`1`/`I`, `0`/`O`); the preview page (SYS-3) MUST show those characters so a poor fallback is easy to spot. |
| TYP-2 | The link counter (for example "**42** Links") MUST use **tabular numerals**. The number and label MUST share a baseline, and changing the count MUST NOT shift layout. |
| TYP-3 | MUST define a compact scale: page title / counter, prose h2 and h3, body, small or meta (destinations, breadcrumbs, status, footer), and chip text. The Guide needs a readable long-form measure (≈60–75ch). |
| TYP-4 | MUST handle **unbreakable strings**: long codes (`code-with.dots`, `code_with_underscores`), long URLs, and long or Unicode tag names. Destinations need **split truncation**: an ellipsized start plus a preserved tail of up to about 55%, so the meaningful end of a URL stays visible. |
| TYP-5 | MUST render international, lowercase or uncased tag text, and punctuation such as `#` and `*`, without breaking alignment. Tags never contain uppercase or emoji (the build enforces this), but non-Latin scripts are allowed. |

### 3.3 Spacing, density and layout

| ID | Requirement |
| --- | --- |
| LAY-1 | **One row density (decided)**, dense enough for directories with hundreds of links (the test fixture has ~290 lines across several nesting levels). There is no compact/comfortable switch. |
| LAY-2 | MUST define an **indentation step** for nested folders that still works at three or more levels on a 320px-wide viewport. |
| LAY-3 | MUST define a single content width (`.wrap`) shared by header, main and footer. |
| LAY-4 | **One breakpoint: ≤740px (decided)**, named as a token. At or below it, the toolbar stacks into a column and link rows go two-line (§4.5 Mobile). The current 500px breakpoint is dropped unless something proves it's needed. |
| LAY-5 | MUST treat **input capability** as a layout dimension, not just width. On coarse pointers, copy icons are always visible and targets grow. Touch targets MUST be ≥ 44×44px (or 24px with spacing per WCAG 2.2 AA) on coarse pointers. Rows grow to meet this; that is not a second density. |
| LAY-6 | Directory toolbar order: on desktop, selected tags sit **left of** search. On mobile they sit **above** it. In both cases, DOM and keyboard order put selected tags before search. |

### 3.4 Iconography

| ID | Requirement |
| --- | --- |
| ICO-1 | 16×16 grid, 1.5px stroke, round caps and joins, `currentColor`, always `aria-hidden` and paired with a text label or an accessible name. |
| ICO-2 | Current set: **open-external**, **download**, **tag**, **chevron** (rotates for expanded), and theme **system / light / dark**. Required additions: **copy**, **check** (copied) and **error** (copy failed) for ACT-2, ACT-5 and ACT-6; **warning** (broken), **terminal** (script), **blocked** (disabled) and **eye-off** (hidden) for the state tags (TAG-2); **close** (×) for selected chips (TAG-4). Likely additions: **folder** and **search**. |
| ICO-3 | Icons MUST be inlineable SVG strings, since there is no icon font or sprite request (C2, C3). |

### 3.5 Motion

| ID | Requirement |
| --- | --- |
| MOT-1 | MUST expose `--motion-duration` (≈240ms today) and `--motion-easing` as the single source for scripted and CSS motion. |
| MOT-2 | Named motions to specify: **count-change** (counter number), **copy-confirm** (icon swap and "Copied" bubble), **feedback-appear** (status line), **picker FLIP** (content below the toolbar glides when the tag picker opens or closes), **popover open** (tag panel), **tooltip** (fade in and out), **theme crossfade** (View Transitions), and **row hover** (copy-icon reveal). |
| MOT-3 | Under `prefers-reduced-motion: reduce`, every motion MUST become instant, and switching that preference mid-animation MUST finish it. |
| MOT-4 | Motion MUST NOT block input. Moving elements ignore pointer events while in flight. Any pointerdown, keydown, input, scroll or toggle MUST settle an active theme transition right away. |
| MOT-5 | Rapid repeated triggers, such as typing into search or clicking copy again, MUST restart animations cleanly with no stacking or flicker. |

### 3.6 Elevation and layering

| ID | Requirement |
| --- | --- |
| ELV-1 | One raised layer for **popovers and tooltips**: the per-row tag panel (native `popover`, anchor positioning where supported, and a fallback) and the tooltip / "Copied" bubble (§4.9). It needs a surface, border or shadow, and max-width rules for long content. |
| ELV-2 | Focus rings MUST sit above row highlights and be unclipped inside horizontal scroll tracks (A11Y-2). |

---

## 4. Components

Each component lists its **variants and states** as the product's behavior requires them.

### 4.1 Shell

- **Site header**: brand wordmark `/shl/` (brand plus accent slashes, COL-10), primary nav (**Links**, **Guide**) with `aria-current` shown by an accent indicator that isn't color alone (for example an underline), and a theme toggle. Wraps at ≤740px.
- **Theme toggle**: icon plus text label showing the current state (**System**, **Light**, **Dark**). A click **cycles System → Light → Dark → System** (decided). Choosing *System* removes the stored preference, so the page follows the OS again. The icon and label always show the **chosen** mode, not the resolved one: in System mode it shows the system icon even while the page is dark. Each step that changes the rendered theme uses the theme crossfade (MOT-2). A step that doesn't change it, such as Dark → System on a dark OS, changes only the control.
- **Footer**: product name, Guide link and Repository link. Muted.
- **Minimal document layout** (core layer, C2): centered short text for the redirect, disabled and old-info pages. Optional h1, a lead paragraph and one link.

### 4.2 Directory header

- **Link counter / page title**: live number plus singular or plural label. It is an `aria-live` region and animates on change (MOT-2). The same component without a number serves as the plain page title (Guide).
- **Breadcrumbs**: `Home / folder / sub`. Ancestors are links and the current item is plain text. On the home page it shows plain "Home". An **empty placeholder** keeps vertical rhythm when there are no breadcrumbs.

### 4.3 Directory toolbar

| Component | States and requirements |
| --- | --- |
| **Search field** | Default, focus, filled, `aria-invalid` (an unknown `#tag` token), read-only (paused during navigation), and hidden (no JS, or no links). Placeholder: "Search link, title or tag". Supports IME composition and multi-line paste. |
| **Tag-picker toggle** | Disclosure button: tag icon, "Tags" label and chevron. States: collapsed, expanded (`aria-expanded`, MAY use the accent per COL-10), and disabled when the subtree has no tags. Hidden until JS. Shares a "ghost button" style with the theme toggle. |
| **Available-tags track** | Horizontally scrollable row of tag chips. It remembers its scroll offset across navigation, scrolls focused chips into view, and shows "All tags selected." when empty. Inner padding keeps focus rings unclipped (A11Y-2). |
| **Selected-tags track** | Same track pattern, holding selected chips (TAG-4). Hidden when nothing is selected. Selections that don't apply to the current folder stay visible and removable. |
| **Inline field error** | "Tag not found", shown next to search and announced politely. |
| **Screen-reader-only notices** | For example "Tag already selected." |

### 4.4 Tags

Three components share one color identity per tag:

1. **Tag label**: non-interactive `#name` inside a row, colored per COL-4/5, with a tinted fill and border. Labels are joined by `·`.
2. **Tag chip (filter button)**: states are *available*, *hover*, *focus*, *selected* and *hidden* (moved to the selected track).
3. **Row tag overflow**: the tag cluster in a row is a button that opens a **tag panel popover** listing all tags. The row clips the tags, so it needs a clear overflow affordance.

| ID | Requirement |
| --- | --- |
| TAG-1 | **Order in a row (decided)**: the four state tags come first, then every other tag in the order it's written in the link file. |
| TAG-2 | **State tags are the state markers (decided).** `#broken`, `#script`, `#disabled` and `#hidden` each carry an icon inside the label (warning, terminal, blocked, eye-off), use their COL-3 color, and give each state a cue that isn't color alone. No separate state icons are added elsewhere in the row. |
| TAG-3 | State tags MUST never be clipped into the overflow popover. Only descriptive tags overflow. |
| TAG-4 | **Selected chips show a × (decided)** after the label. The whole chip is the remove target and highlights as a whole on hover and focus. Its accessible name stays "Remove #tag filter". |

### 4.5 Link row (core component)

Anatomy: **code** (primary, mono), **tags** (TAG-1 order), **destination** (mono, muted, split-truncated, **always visible**, decided), and the row's **actions**.

#### Row actions (decided: copy short, copy destination, open)

Every link row offers three core actions, plus a fourth on script rows:

| Action | Control | Accessible name |
| --- | --- | --- |
| **Copy short link** | The **code**, a real link to the short URL that copies on click, with a copy icon. | "Copy short link for `<code>`" |
| **Copy destination** | The **destination**, a real link to the target that copies on click, with a copy icon. On disabled rows it's a copy button instead (ACT-7). | "Copy destination for `<code>`" |
| **Open** | An outlined accent button with an icon and the "Open" label. Opens in the same tab. | "Open destination for `<code>`" |
| **Download** (script rows only) | A neutral outlined button the same size as Open, placed just before it. | "Download script for `<code>`" |

| ID | Requirement |
| --- | --- |
| ACT-1 | **Open is obvious and the only way to go to the destination by a plain click.** It is outlined in `--accent` and fills with `--accent-tint` on hover and focus (decided). It shows its icon and **text label at every width** (decided), on every pointer type, and it is always the **last** control in the row. It MUST NOT look like either copy action. It opens in the **same tab** (decided); modifier-click and middle-click still open a new tab. |
| ACT-2 | **The two copy actions are visibly copy actions.** The code and destination each get a copy icon next to them, so it's clear which URL each copies. |
| ACT-3 | **When copy icons show (decided).** On fine pointers, hovering anywhere on the row, or focus anywhere inside it, shows **both** copy icons at once. On coarse pointers, both are always visible. The icons MUST NOT shift layout when they appear (reserve their space). |
| ACT-4 | **Each action has its own target.** No two actions share a click target or depend on modifier keys. Each target meets LAY-5's size rules on coarse pointers. |
| ACT-5 | **Confirming a copy (decided).** The clicked copy icon turns into a **check** for about 1.5s, and a small **"Copied"** bubble (§4.9) appears above it without moving anything. Screen readers hear "Short link copied." or "Destination copied." through a polite live region. Clicking again restarts the confirmation; it doesn't stack. Success is **not** repeated in the visible status line. |
| ACT-6 | **Copy failure** turns the icon into the **error** mark, and the visible status line (§4.7) explains what to do ("Select and copy the destination text."). The failure state MUST NOT rely on color alone. |
| ACT-7 | **Disabled rows** keep both copy actions working; the destination becomes a copy button with no external link. Open and Download render disabled. Their disabled look, or a tooltip, explains why (§4.7 "Link disabled"). |
| ACT-8 | **Without JS**, copy can't work. Copy icons MUST NOT render; they appear only once JS runs, without a hydration mismatch (for example via a JS-ready class on the root). The code and destination fall back to plain links (to the short URL and to the destination). |
| ACT-9 | **Native link behavior survives.** Because the code and destination stay real links, modifier-click, middle-click and the context menu ("Copy link address", "Open in new tab") MUST keep their browser behavior. Only a plain left click copies. |
| ACT-10 | **Order is fixed** across all rows: code (+ copy icon), tags, destination (+ copy icon), then the action group `[Download] [Open]`. Open never collapses into an overflow menu. |

| Variant | Requirement |
| --- | --- |
| Default | Hover and focus-within row highlight, which also reveals the copy icons (ACT-3). |
| `script` | `#script` state tag (violet, terminal icon). Download shown before Open. |
| `broken` | `#broken` state tag (warning icon). Does **not** block actions. Working actions use broken-tinted hover. |
| `disabled` | `#disabled` state tag (blocked icon). Grayscale row ink. Open and Download disabled. Both copies still work (ACT-7). |
| `hidden` | Normally absent. When revealed by a filter, or in the Guide examples, it shows dimming plus the `#hidden` state tag (eye-off icon) (COL-6a). |
| Combinations | No precedence. Each state adds its own cue (COL-6), and every combination stays legible (COL-6b). Example: `broken+disabled` is a grayscale row with Open and Download disabled, and both `#broken` and `#disabled` state tags in their own colors. |
| With title | **Tooltip only (decided).** The title appears in a tooltip (§4.9) on the row and code, and search matches it. It gets no visible line in the row. Touch users don't see titles; that tradeoff is accepted. |
| Mobile (≤740px) | **Two lines (decided).** Line 1: code and tags. Line 2: destination. The action group sits on the right and spans both lines. Nothing scrolls sideways and nothing hides off-screen. |
| No JS | Code and destination act as plain links. No copy icons and no copy feedback. |

**Action button** states: default, hover, focus, active, disabled, and **busy** (Download fetches first and is disabled in flight; a spinner or "Downloading…" cue is needed). **Copy controls** add two states: **copied** (check, about 1.5s) and **copy failed** (error mark) (ACT-5, ACT-6).

### 4.6 Folder row

A `details`/`summary` disclosure with a chevron and folder name. The name also links to the folder page. States: collapsed, expanded, hover, focus, and auto-expanded by search (restored to its previous state afterwards). Nested `ul.links` indent per LAY-2. It MUST look clearly different from a link row. **Folder rows are navigation only, with no copy action (decided)**; copying a folder link can be added later if people ask for it.

### 4.7 Feedback and empty states

| Message | Type | Requirement |
| --- | --- | --- |
| "Short link copied." / "Destination copied." | Transient success | Shown at the clicked control (check plus "Copied" bubble, ACT-5) and announced to screen readers. **Not** shown in the visible status line. |
| "Could not copy the link. …" | Transient error | Error mark on the control (ACT-6) plus the visible status line with guidance. The status line clears after 5s, a new message replaces the old one rather than stacking, and its fixed position relative to the list prevents layout shift. |
| "Script download started." / "Could not download the script. …CORS." | Transient success or error | Visible status line, same rules. Download has no inline confirmation. |
| "No links match your search." | Empty result | Inline, in the list area. |
| "No links listed here." | Empty folder | Neutral. |
| "No links available yet. Add your first entry to `links.yaml`…" | Onboarding empty state | Contains inline code. Aimed at maintainers. |
| "Checking that link" → "Link not found" + `"x" is not a short link here.` | Async page state | The heading and lead change in place. Needs a calm pending treatment. |
| "Link disabled" page | Explanatory | Two paragraphs, including a public-destination caveat. |
| "Taking you to …" / "Continue now" | Transitional | Must look fine even if it shows for only one frame. |
| noscript message (404) | Fallback | Plain prose. |

### 4.8 Prose (Guide)

h1 (title component), h2, h3, paragraphs, `strong`, ordered and unordered lists, inline `code`, **code blocks** (`pre[data-format]`, YAML and JSON, which SHOULD show a format label and MAY have syntax tint), an **in-page nav** ("Features · How to use · How it works"), and an **embedded example listing** that reuses real link-row components (§4.5) in a non-interactive demo context.

### 4.9 Tooltip and "Copied" bubble (decided)

One Vue component serves both uses, on the raised surface (ELV-1).

| Use | Behavior |
| --- | --- |
| **Tooltip** (link titles, disabled-action explanations) | Appears after about **500ms** of hover, **immediately** on keyboard focus. Closes on **Escape**, or when the pointer or focus leaves. Never steals focus. |
| **"Copied" bubble** | Appears **immediately** after a successful copy, stays about **1.5s**, never steals focus. A new copy restarts it. |
| **Reduced motion** | Both appear and disappear without fading (MOT-3). |

It MUST be SSR-safe (C1): nothing renders until JS is running, and it MUST NOT cause layout shift. It's linked to its trigger with `aria-describedby` (tooltip). The "Copied" bubble is visual only; the announcement comes from the live region (ACT-5).

---

## 5. Interaction and accessibility requirements

| ID | Requirement |
| --- | --- |
| A11Y-1 | Meet WCAG 2.2 AA in **both themes**. This includes text on tinted tag fills, muted destinations, disabled rows, broken rows, and rows that are both disabled and hidden. |
| A11Y-2 | **One focus outline everywhere (decided)**: 2px solid `--accent` with a 2px offset, shown only for keyboard focus (`:focus-visible`). It applies to every interactive element: chips in scroll tracks, popover content (the tag panel is focusable), summary elements, copy links and buttons, and disabled-row copy buttons. Scroll tracks use inner padding so the outline isn't clipped. |
| A11Y-3 | Focus management is part of component behavior. Removing a selected chip moves focus to its neighbor, or to search if none remain. After in-app navigation, focus goes to the section or h1. Restoring after Back/Forward returns focus to the previously focused chip or to search. |
| A11Y-4 | Live regions: the counter (polite, atomic), search status, tag error, tag notice, copy announcements and the status line. The design MUST reserve space for visible ones so announcements don't move content. |
| A11Y-5 | Every icon-plus-label control keeps a programmatic name that matches its visible label. Visually-hidden text (`.sr-only`) is a system utility. |
| A11Y-6 | The copy and open actions follow ACT-1 to ACT-10. Copy-on-click MUST NOT break native link behavior (ACT-9). |
| A11Y-7 | Native platform primitives (`details`, `popover`, `button[disabled]`, `input[type=search]`) are preferred. The system styles them; it doesn't replace them. |

---

## 6. Content and voice

- Short, plain, **sentence case for everything (decided)**: status messages, buttons and control labels ("Tags", "System", "Light", "Dark", "Open", "Download"). This replaces today's lowercase toggle labels.
- Status messages end with a period ("Destination copied.").
- Failure messages always say what to do next ("Select and copy the destination text.").
- Honest about limits: disabled and hidden links are still public, and this is stated, not hidden.
- Bash launcher stderr text belongs to the same voice.

---

## 7. Scale and edge cases the system must survive

Taken from the build fixtures:

- Folder depth of 3+, and folder names containing `.`, `_` and `-`.
- Rows with many tags (`many-tags`), Unicode tags, and tags where the label differs only by case.
- Titles with special characters (`special-title`). Rows with no title (`no-title`).
- Destinations with ports, query strings, fragments, trailing slashes or a root path.
- Directories with every link hidden (`hidden-only`) or disabled (`disabled-only`). Counter shows 0.
- A site with zero links (onboarding empty state).
- Filters selected in one folder that match nothing in another.
- A row with all four states at once (`script-all-states`).

---

## 8. Structure, documentation and verification (decided)

| ID | Requirement |
| --- | --- |
| SYS-1 | **Lives in the shl repo**, not a separate package: a `tokens.css` core layer (also inlined into redirect, disabled and 404 pages, C2), a component stylesheet, and Vue components in `src/`. |
| SYS-2 | **Documented in `docs/design-system.md`**: tokens, components, states and the decisions in §10. |
| SYS-3 | **A preview page** shows every component in every state and state combination, in both themes and at both sides of the 740px breakpoint. The local dev server builds it; it MUST NOT go to the live site, so it needs no reserved short-link name. |
| SYS-4 | **Automated contrast and state tests run against the preview page.** They cover every semantic color pair in both themes; the generated tag colors across all 3,600 hue steps, against the page surface and the tag's own tint; the worst case of desaturation plus dimming (COL-6b); and the accent as text and as a focus ring (COL-9). |

---

## 9. Rollout (decided)

1. **Tokens and core layer**, on the current template-string code, with **no visible change**. The existing color tests prove nothing moved.
2. **Visual changes**, as separate PRs: cool neutrals, violet script, sentence-case labels, always-visible destinations, copy icons and confirmation, outlined Open, state tags with icons, two-line mobile rows, the theme-toggle cycle, focus outline and selected-chip ×.
3. **Components**, rebuilt as Vue components page by page during the Vue migration.

Steps 2 and 3 may overlap per component, but each PR changes either appearance or structure, not both.

---

## 10. Decisions

| # | Question | Decision | Where |
| --- | --- | --- | --- |
| 1 | Theme control | Cycle System → Light → Dark → System. | §4.1 |
| 2 | Is `hidden` a visual state? | A visibility state with visual cues, layered on top of the row's state. | COL-6a |
| 3 | Combined row states | No precedence. Each state owns a separate visual channel. | COL-6, COL-6b |
| 4 | Titles | Tooltip only, via a shared tooltip component. | §4.5, §4.9 |
| 5 | Copy and open | Three actions per row: copy short link, copy destination, and an obvious Open. | ACT-1 to ACT-10 |
| 6 | Brand accent | Reusable token family, teal, kept to brand, context and primary actions. | COL-9 to COL-11 |
| 7 | Framework | Vue 3, SSR at build time plus hydration, render functions. | C1 |
| 8 | Where it lives | In the shl repo. | SYS-1 |
| 9 | Token structure | Primitives plus semantic tokens; component tokens only where needed. | TOK-1 to TOK-3 |
| 10 | Fonts | System stacks for UI and mono. | TYP-1 |
| 11 | Destination on desktop | Always visible, muted. | §4.5 |
| 12 | Mobile rows | Two lines at ≤740px; 500px breakpoint dropped. | LAY-4, §4.5 |
| 13 | Label case | Sentence case everywhere. | §6 |
| 14 | Neutrals | Slightly cool, low chroma. | COL-12 |
| 15 | Density | One density. | LAY-1 |
| 16 | Copy controls | Code and destination stay real links that copy, plus copy icons. | ACT-2, ACT-8, ACT-9 |
| 17 | Open style | Outlined accent, tint fill on hover, label at every width, same tab, always last. | ACT-1 |
| 18 | Download style | Neutral outlined, same size, just before Open. | §4.5 |
| 19 | Script color | Violet. | COL-3 |
| 20 | Docs and preview | `docs/design-system.md` plus a local-only preview page. | SYS-2, SYS-3 |
| 21 | Contrast tests | Automated, against the preview page, full hue sweep. | SYS-4 |
| 22 | Rollout | Tokens first with no visible change, then visual PRs, then Vue components. | §9 |
| 23 | Copy confirmation | Check plus "Copied" bubble at the click; status line for failures only. | ACT-5, ACT-6 |
| 24 | Copy-icon reveal | Both icons on row hover or focus; always on touch. | ACT-3 |
| 25 | State markers | The four state tags, first in the list, each with an icon. | TAG-1 to TAG-3 |
| 26 | Folder rows | Navigation only, no copy. | §4.6 |
| 27 | Selected chips | × after the label, whole chip removes. | TAG-4 |
| 28 | Focus outline | 2px solid accent, 2px offset, `:focus-visible` only. | A11Y-2 |
| 29 | Tooltip timing | 500ms hover, instant on focus, Escape closes; bubble 1.5s; no fade with reduced motion. | §4.9 |
| 30 | Tag order | State tags first, then file order. | TAG-1 |

## 11. Open questions

None. Exact color values (the teal, violet, red-orange and gray steps) are design work under COL-3, COL-9 and COL-12, checked by SYS-4.
