# shl

A URL shortener hosted entirely on GitHub Pages. Keep links in YAML or JSON;
merging changes to `main` publishes your updated site. No application server or
database to maintain.

## Features

- **Stable short URLs** — change a destination without changing the link you share.
- **Browsable folders** — organize links in nested directories.
- **Search and copy** — search codes, titles, destinations, or tags; select a code
  or destination to copy its URL, or use **Open** to visit it.
- **Link controls** — hide, flag, or disable links with tags.
- **Bash shortcuts** — generate script launchers or download destination scripts.
- **Light and dark themes** — follow the system preference or save your own choice.
- **Git-based publishing** — review link changes in pull requests and deploy with
  GitHub Actions. Supports project-site paths and custom domains.

## Quick start

1. Create a GitHub repository with these files and a `main` branch. A public
   repository supports GitHub Pages on GitHub Free.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Replace the examples in `links.yaml` with your links using the format below.
   Commit on a branch and open a pull request to `main`.
4. Once checks pass, merge and wait for **Actions → Deploy shl** to finish.

Your short URLs will look like `https://<user>.github.io/<repo>/gh/`.
For `go.example.com/gh/`, follow the [custom-domain instructions](docs/reference.md#custom-domains).

## Managing links

Edit `links.yaml`, including through GitHub's web editor, and publish via a pull
request:

```yaml
gh: https://github.com/
pages-docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs
  tags: [documentation, github]
tools:
  git: https://git-scm.com/
  setup:
    url: https://example.com/setup.sh
    tags: [shell, script]
```

A link can be a URL string or an object with `url`, optional `title`, and `tags`.
Nest entries to create folders: this example adds `/tools/`, `/tools/git/`, and
`/tools/setup/`. Edit a destination to retarget a link; delete its entry to remove
it after the next deployment.

| Tag | Effect |
| --- | --- |
| `hidden` | Omit from default listings and search; selecting hidden, broken or disabled admits only matching hidden links. The short URL still works. |
| `broken` | Show a warning without blocking actions. |
| `disabled` | Stop forwarding and script execution; Open and Download are unavailable, but both URLs remain copyable. |
| `script` | Generate a `<path>.sh` Bash launcher and show Download. |

Tags can be combined; configured names must contain no whitespace, commas,
Unicode uppercase/titlecase characters or emojis. Explicitly rename invalid names;
the build never silently lowercases or strips them. Lowercase/uncased international
text, digits and ordinary punctuation (including bare `#` and `*`) stay intact.
Every full label has stable HSL theme inks generated from its string seed, with
matched tinted backgrounds/borders, including disabled rows. There is no finite
palette or unique-color promise; row-state colors remain separate.

Show tags offers all tags in the current subtree, including hidden leaves.
Select tags to require every selection (AND), plus one broad substring of remaining
search text. Commit `#tag` with space, comma or Enter; uppercase input still
resolves known lowercase tags. Unknown tokens remain with
“Tag not found”. Selected tags appear left of search on desktop and above it on
mobile, preceding search in keyboard order. Remove them individually to return to the picker.
Opening or hiding the picker and clearing text retain selections. Only selected
hidden, broken or disabled tags admit matching hidden leaves; script alone does not.

Use absolute HTTP(S) destinations. Codes start with an ASCII letter or number and
contain only letters, numbers, `.`, `_`, or `-`; reserved names and case-insensitive
collisions are rejected. Keep exactly one root link file: `links.yaml`, `links.yml`,
or `links.json`. See [formats and validation](docs/reference.md#link-formats-and-validation).

## Running Bash scripts

Replace `https://example.com/setup.sh` above with a real Bash script you trust,
then deploy and use its launcher URL:

```bash
set -o pipefail
curl -fsSL https://your-user.github.io/your-repo/tools/setup.sh | bash

# Forward arguments to the destination script:
curl -fsSL https://your-user.github.io/your-repo/tools/setup.sh | bash -s -- --verbose
```

Replace `your-user` and `your-repo` with your GitHub user and repository names before
running. Use exact path casing, `.sh`, and **no trailing slash**. Only run scripts
you trust. Launchers require Bash, curl, mktemp, and rm; they download fully before
execution, forward arguments and exit status, and clean up the temporary file.

The directory's **Download** button saves the current destination script without
executing it. It requires JavaScript and a host that allows browser access through
CORS. See [script behavior](docs/reference.md#bash-launchers-and-downloads).

## Local development

Install [Bun 1.4.2](https://bun.com/docs/installation), then run from the repository root:

```bash
bun ci
bun run dev
```

Open the printed preview URL (usually `http://localhost:8080/`). Restart the command
after editing links to rebuild. Use `bun run test` for regression checks (Bash is
required), `bun build.mjs` to build, and `bun run format` to format application files.
See [contributor guidance](docs/development.md) for browser checks, PR rules, and source ownership.

## Important limits

- **All destinations are public**, including hidden and disabled links. Hiding
  controls discovery; disabling stops shl actions, not external access.
- Redirects happen in the browser, not through HTTP 301/302 responses. `curl -L`
  does not follow them; use `.sh` URLs for launchers.
- Validation checks URL syntax, not destination reachability.
- Search, copying, tag filters, and Download require JavaScript. Enabled
  visible links remain navigable without it.
- No anonymous link submission or built-in click tracking.

For more detail, see the [reference](docs/reference.md) and
[development guide](docs/development.md). The published site also includes a Guide.
