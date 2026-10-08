import {
  esc,
  scriptString,
  documentPage,
  page as shell,
  NAV_ITEMS,
} from "./layout.mjs";
import { isDirectory, linkUrl, linkStates } from "./links.mjs";

const shellString = (value) => "'" + value.replace(/'/g, "'\\''") + "'";

export const scriptLauncher = ({ url, disabled }) =>
  disabled
    ? `#!/usr/bin/env bash
printf '%s\\n' 'This link is disabled. No script was downloaded or executed.' >&2
exit 1
`
    : `#!/usr/bin/env bash
set -euo pipefail
script=$(mktemp)
trap 'rm -f "$script"' EXIT
curl -fsSL -o "$script" -- ${shellString(url)}
bash "$script" "$@"
`;

const forwardingPage = (title, url, content) =>
  documentPage({
    title,
    embedded: true,
    head: /* HTML */ `<meta name="robots" content="noindex" /><link
        rel="canonical"
        href="${esc(url)}"
      /><meta http-equiv="refresh" content="0; url=${esc(url)}" />`,
    body: /* HTML */ `<main class="wrap minimal-document">${content}</main>`,
    scripts: `<script data-behavior="forward">location.replace(${scriptString(url)});</script>`,
  });

export const redirectPage = ({ url, title, disabled }) =>
  disabled
    ? documentPage({
        title: "Link disabled",
        embedded: true,
        body: /* HTML */ `<main class="wrap minimal-document">
          <h1>Link disabled</h1>
          <p>
            This short link has been disabled. shl will not forward you to its
            destination.
          </p>
          <p>
            The destination remains public. Disabling this link does not prevent
            access outside shl.
          </p>
        </main>`,
      })
    : forwardingPage(
        "Redirecting",
        url,
        /* HTML */ `<p>Taking you to ${esc(title || url)}</p>
          <p><a href="${esc(url)}">Continue now</a></p>`,
      );

export const guidePage = (source) =>
  shell(
    "Guide",
    "guide",
    "../",
    /* HTML */ `<article class="prose">
      <h1>Guide</h1>
      <nav aria-label="On this page">
        <a href="#about" data-app-link>About</a> ·
        <a href="#how-to-use" data-app-link>How to use</a> ·
        <a href="#how-it-works" data-app-link>How it works</a>
      </nav>
      <section id="about">
        <h2>About</h2>
        <p>
          shl publishes a public directory and browser redirects from a
          version-controlled JSON or YAML file. GitHub Pages serves the
          generated files; no application server or database is required.
        </p>
        <p>
          Links and destinations are public. Redirects are browser-based, not
          HTTP 301/302 responses. There is no anonymous submission or built-in
          click tracking.
        </p>
      </section>
      <section id="how-to-use">
        <h2>How to use</h2>
        <ol>
          <li>
            Create a repository with these files and a <code>main</code> branch.
            Set Settings → Pages → Source to <strong>GitHub Actions</strong>.
          </li>
          <li>
            Edit <code>${esc(source)}</code> on a branch. Add an absolute
            HTTP(S) destination:
          </li>
        </ol>
        <pre><code>gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs</code></pre>
        <ol start="3">
          <li>
            Open a pull request, pass checks, and merge. After deployment, visit
            <code>https://&lt;user&gt;.github.io/&lt;repo&gt;/gh/</code>.
          </li>
        </ol>
        <p>
          Change a URL to retarget a code; delete its entry to remove it. Nest
          objects for directories. Codes start with a letter or number and may
          also contain dots, underscores, and hyphens; sibling names cannot
          differ only by case.
        </p>
        <p>
          Optional: <code>script: true</code> builds a
          <code>&lt;path&gt;.sh</code> launcher. Use exact casing and no
          trailing slash; only run scripts from trusted sources.
        </p>
        <p>
          Add <code>tags: [documentation, github]</code> to a link object to
          show full inline topic labels beside its code on one line. Crowded
          rows scroll horizontally; selecting labels optionally opens a
          convenient popover with all tags. Plain text search is one broad
          substring. Use <code>#tag</code> for an exact whole tag, including
          spaces: <code>#release notes</code>. A bare <code>#</code> matches
          nothing; <code>#broken #disabled</code> is one literal tag label.
        </p>
        <p>
          On hover-capable fine-pointer devices without coarse input,
          destinations appear when a row is hovered or focused, without shifting
          content. Coarse-pointer and touch devices always show them. Long URLs
          stay on one line with middle truncation; assistive technology and
          copying retain the full URL. Select a destination to copy it, or use
          Open to visit it.
        </p>
        <p>
          Add <code>tags: [hidden]</code> on a link object to omit it from
          directory listings, counts, and search by default. Use Show hidden
          links on a directory page to reveal hidden entries. Its redirect and
          optional launcher still work unless also disabled, and the destination
          remains public in <code>links.json</code>. Hiding controls
          discoverability, not secrecy. Exact <code>#hidden</code>,
          <code>#broken</code> and <code>#disabled</code> searches temporarily
          reveal matching hidden links, even in all-hidden folders, without
          changing the toggle. Clearing restores the toggle-selected listing.
        </p>
        <p>
          Exact trimmed, case-insensitive <code>broken</code> tags mark an
          orange-red warning without blocking actions. <code>disabled</code>
          tags make links grey and stop shl forwarding and execution: the short
          URL shows an explanation, Open and Download are unavailable, and the
          launcher exits 1 without downloading or executing. Both URL copy
          actions remain available. Destinations remain public; disabling does
          not prevent access outside shl. The legacy hidden property is
          rejected.
        </p>
      </section>
      <section id="how-it-works">
        <h2>How it works</h2>
        <p>
          The build validates codes, collisions, and URL syntax before replacing
          output. Each enabled link gets a redirect page with JavaScript, meta
          refresh, and a clickable fallback. Directories get browsable pages.
        </p>
        <p>
          GitHub Actions deploys the files after merges to <code>main</code>.
          The 404 page checks the public link map for differently capitalized
          codes.
        </p>
        <p>
          See the
          <a href="https://github.com/ratrat64/shortlink#readme"
            >repository documentation</a
          >
          for custom domains, local builds, and full validation rules.
        </p>
      </section>
    </article>`,
  );

export const oldInfoPage = (section) => {
  const url = `../guide/#${section}`;
  return forwardingPage(
    "Guide",
    url,
    /* HTML */ `<p><a href="${esc(url)}">Continue to the guide</a></p>`,
  );
};

// GitHub Pages serves 404.html for anything unmatched. Catches codes that only
// differ by case, plus typos.
export const notFoundPage = () =>
  shell(
    "Link not found",
    "not-found",
    "./",
    /* HTML */ `<article class="prose">
      <h1 id="head">Checking that link</h1>
      <p class="lead" id="msg">One moment.</p>
      <p><a class="code" id="home" href="./">Home</a></p>
      <noscript
        ><p>
          This link could not be found. Enable JavaScript to check for a
          differently capitalized code.
        </p></noscript
      >
    </article>`,
    {
      embedded: true,
      scripts: `<script data-behavior="recovery">
(async () => {
  const isDirectory = ${isDirectory.toString()};
  const linkUrl = ${linkUrl.toString()};
  const linkStates = ${linkStates.toString()};
  const parts = location.pathname.split('/').filter(Boolean);
  const seg = parts.at(-1) || '';
  const home = document.getElementById('home');
  home.href = '/' + parts.slice(0, -1).join('/') + (parts.length > 1 ? '/' : '');
  for (let depth = parts.length - 1; depth >= 0; depth--) {
    const base = '/' + parts.slice(0, depth).join('/') + (depth ? '/' : '');
    try {
      const res = await fetch(base + 'links.json', { cache: 'no-cache' });
      if (!res.ok) continue;
      let entry = await res.json();
      const canonical = [];
      for (const segment of parts.slice(depth)) {
        const hit = isDirectory(entry)
          ? Object.entries(entry).find(([c]) => c.toLowerCase() === segment.toLowerCase()) : null;
        if (!hit) { entry = null; break; }
        canonical.push(hit[0]);
        entry = hit[1];
      }
      home.href = base;
      const navItems = ${scriptString(NAV_ITEMS)};
      for (const link of document.querySelectorAll('.site-head a, .footer a[data-app-link]')) {
        const item = navItems.find(item => item.key === link.dataset.nav);
        link.href = base + (item ? item.path : link.classList.contains('brand') ? '' : 'guide/');
      }
      if (isDirectory(entry)) {
        location.replace(base + canonical.join('/') + '/');
        return;
      }
      if (entry) { location.replace(linkStates(entry).disabled ? base + canonical.join('/') + '/' : linkUrl(entry)); return; }
      break;
    } catch (e) { /* try next */ }
  }
  document.getElementById('head').textContent = 'Link not found';
  document.getElementById('msg').textContent = seg ? '"' + seg + '" is not a short link here.' : 'That address does not exist.';
})();
</script>`,
    },
  );
