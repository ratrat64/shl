# shl reference

[README](../README.md) · [Development guide](development.md)

## Custom domains

GitHub Pages serves project sites at `https://<user>.github.io/<repo>/` and user
sites at `https://<user>.github.io/`. shl supports either without a base-URL
environment variable.

A user or organization site requires a repository named `<owner>.github.io`.
Its short URLs omit the repository prefix, for example
`https://<owner>.github.io/gh/` or `https://<owner>.github.io/tools/setup.sh`.

To use a subdomain such as `go.example.com`:

1. Add a root `CNAME` file containing only `go.example.com`, with no scheme or path.
   The build copies it into `dist/`.
2. Point that subdomain's DNS CNAME record at `<user>.github.io`.
3. Set the custom domain in **Settings → Pages**.
4. Enable HTTPS once GitHub provisions the certificate.

For an apex domain, follow [GitHub's DNS instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Link formats and validation

Keep exactly one of `links.json`, `links.yaml`, or `links.yml` in the repository
root. Missing or multiple sources fail the build. Both formats accept:

- A URL string for a simple link.
- An object with `url`, an optional string `title`, and an optional `tags` array of
  nonblank strings without whitespace, commas, Unicode uppercase/titlecase or emoji
  characters anywhere. Lowercase/uncased languages, digits and punctuation remain
  valid. Invalid names require explicit renaming; no silent lowercase/strip/migration
  occurs. Titles appear on code hover and redirect fallback pages and
  remain searchable.
- A nonempty nested object for a directory. A path cannot be both a directory and
  a redirect; folder names are their display labels.

To switch to JSON, replace `links.yaml` with `links.json` and convert its entries:

```json
{
  "gh": "https://github.com/",
  "pages-docs": {
    "url": "https://docs.github.com/en/pages",
    "title": "GitHub Pages docs",
    "tags": ["documentation", "github"]
  },
  "tools": {
    "git": "https://git-scm.com/",
    "setup": {
      "url": "https://example.com/setup.sh",
      "tags": ["shell", "script"]
    }
  }
}
```

Validation rules apply to both formats:

- Every path segment matches `^[A-Za-z0-9][A-Za-z0-9._-]*$`.
- Reserved names, in any casing, are `index`, `404`, `assets`, `links`, `about`,
  `guide`, `how-it-works`, `index.html`, `404.html`, `links.json`, and `CNAME`.
- Siblings cannot differ only by case. A generated `<code>.sh` launcher cannot
  collide with another code or directory in the same folder, regardless of casing.
- Destinations must be valid absolute HTTP(S) URLs. Reachability is not checked.
- Legacy `hidden` and `script` properties are rejected for every value.

Validation finishes before existing build output is deleted. Edit a destination
to retarget its short URL; delete an entry to remove it on the next deployment.
The build always publishes `links.json`, regardless of the source format.

## Tags and link states

`hidden`, `broken`, `disabled`, and `script` are special tags. They match whole
labels, ignoring case. Tags such as `hiddenish` or
literal `#hidden` are descriptive, not states.

- **Hidden:** omitted from default listings, counts, and ordinary search. Selecting
  hidden, broken or disabled admits only matching leaves and their ancestors. Their
  direct URLs and launchers still work unless disabled. Hidden-only directories
  remain directly browseable and initially show an empty state with search and Show tags.
- **Broken:** adds an orange-red warning without blocking actions.
- **Disabled:** grey styling overrides broken/script emphasis. The short URL
  shows **Link disabled** rather than forwarding. Open and Download are disabled;
  code and destination copying still work. Destination text is selectable and
  copy-only, with no external href. Disabled launchers do not download or execute.
- **Script:** adds a `.sh` launcher beside the browser page and a Download button.

Tags can be combined. Hidden opacity applies independently of broken/disabled
styling. Labels stay readable on one line; crowded rows scroll horizontally.
Selecting the labels opens an informational popover with all tags. Full labels use
deterministic HSL light/dark inks generated from the descriptive tag string's
UTF-16 FNV-1a seed, with matched tinted backgrounds/borders. Broken, script and
disabled labels instead reuse their shared link-state colors; hidden uses readable
neutral gray in light mode and light gray in dark mode. These colors are consistent
across rows, popovers and available/selected filters regardless of row-state
precedence. No finite palette, storage or unique-color promise. Other disabled
row content remains neutral.

Unicode validation uses Uppercase and titlecase categories, not ASCII-only checks.
Emoji detection covers pictographs, emoji-presentation symbols, ZWJ/modifier
sequences, flags/regional indicators and U+20E3 keycaps. Bare digits, `#` and `*`
are allowed; they are not rejected just for being possible keycap bases.

### Migrating legacy properties

For each legacy `hidden` or `script` property:

1. If its value is `true`, append the equivalent tag unless a trimmed,
   case-insensitive equivalent already exists.
2. Explicitly rename existing tags containing whitespace (including padding),
   commas, Unicode uppercase/titlecase or emoji to maintainer-chosen valid names.
   Preserve all other valid raw tags, fields and order. The build never silently
   trims, lowercases, strips or automatically renames tags.
3. Remove the property for both `true` and `false`. A `false` value must not remove
   an independently configured tag.

For example, replace `hidden: true` with `tags: [hidden]`, or append `hidden` to an
existing tag array. Replace `script: true` with `tags: [script]` in the same way.

## Browsing and search

Each directory page lists its links and subdirectories. The homepage also has
expandable folders. Select a short code to copy its full short URL, select a
destination to copy its full URL, or use Open to visit an enabled destination.

Plain search is one broad, case-insensitive substring across code/folder path,
title, destination and tags. Show tags reveals a horizontal catalog of every tag
in the current subtree, including hidden descendants, minus selected tags. It
does not shrink with results. Available tags move to a selected track left of search
on desktop and above it on mobile, preceding search in DOM/keyboard order;
remove them individually to restore catalog order. Every selected tag must match
(AND), together with remaining text. Labels retain full text and stable colors.

Commit known `#tag` tokens with whitespace, comma or Enter; uppercase input can
still resolve known lowercase identities. Duplicates consume
syntax without toggling; unknown tokens remain with “Tag not found”. Uncommitted
tokens are ordinary text and bare `#` matches nothing. URL fragments are not tokens.
Only selected hidden/broken/disabled tags admit hidden leaves satisfying all
constraints. Selecting script alone never reveals them. Clearing text or collapsing
Show tags retains selections. Search remains available on all nonempty subtrees,
including all-hidden or untagged pages. The one polite count reflects matching leaves;
zero filtered results show “No links match your search.” No-tag pickers are disabled.

With JavaScript, Links, Guide, folder links, breadcrumbs, and Guide section anchors
navigate without reloading the shared shell. Back/Forward restores content and
the latest saved scroll position per URL. Text, selected tags, token error, picker
visibility and expanded folders reset on cross-page transitions; same-page fragments
retain them. Direct loads and refreshes use generated pages.
Without JavaScript, enabled visible links remain navigable and hidden links stay hidden.

Destinations appear on row hover or keyboard focus on hover-capable fine-pointer
devices without any coarse pointer. Touch, hybrid touch/mouse, and non-hover
devices always show them. Long URLs are shortened visually in the middle; copying
and accessible text retain the full URL. Theme follows the system light/dark
preference unless the visitor saves an override with the Theme button.

## Bash launchers and downloads

Add `script` to a link's tags to generate `<path>.sh`, including for nested links.
See [Running Bash scripts](../README.md#running-bash-scripts) for commands.
Launcher URLs require exact casing, `.sh`, and no trailing slash. The browser
URL `/<path>/` returns HTML; `curl -L` does not follow its browser redirect.

Enabled launchers require Bash, curl, mktemp, and rm. Each run downloads the current
destination fully into a temporary file before executing it, forwards arguments
and exit status, and removes the file on exit. Download failures are returned.
Only run scripts you trust.

Disabled launchers print
`This link is disabled. No script was downloaded or executed.` to stderr and exit
1 without creating a payload, downloading, executing, or processing arguments.
These guarantees apply to currently deployed artifacts, not retained older
launchers or deployments.

The directory's Download button fetches the current destination on click and
saves its exact bytes, without executing it or saving the launcher. It needs
JavaScript and a readable response; cross-origin hosts must allow CORS. Network,
HTTP, CORS, partial-response, or body-read failures report an error and save no
file. The filename uses the destination URL basename with unsafe characters
replaced, falling back to `<code>.sh` for missing or unusable names.

## Generated site and routing

| Output | Purpose |
| --- | --- |
| `dist/index.html` | Homepage directory, sorted by name, with expandable folders. |
| `dist/<path>/index.html` | Folder page, disabled explanation, or enabled redirect with canonical destination, meta refresh, JavaScript `location.replace`, and a clickable fallback. |
| `dist/<path>.sh` | Bash launcher for a link with the `script` tag. |
| `dist/links.json` | Public link map used by browser routing. |
| `dist/404.html` | Recovery for unknown paths, including differently capitalized codes and folders. |
| `dist/guide/index.html` | Features, usage, and how-it-works guidance. |

The former `/about/` and `/how-it-works/` URLs forward to Guide sections.
Wrong-case requests rely on GitHub Pages serving `404.html`; JavaScript fetches
the public map and matches the entire relative path case-insensitively. Recovery
supports both user-site roots and project prefixes, including disabled explanations.

All published destinations, including hidden and disabled ones, remain public in
`links.json` and directory text. Enabled redirects and launchers also contain
destinations; disabled explanations and inert launchers do not. Hiding is not
secrecy, and disabling does not prevent access outside shl. There is no backend,
database, anonymous submission, or built-in click tracking.
