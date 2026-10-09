import {
  esc,
  scriptString,
  documentPage,
  page as shell,
  GUIDE_NAV,
  pageTitle,
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
    GUIDE_NAV.label,
    GUIDE_NAV.key,
    "../",
    /* HTML */ `<article class="prose">
      ${pageTitle(GUIDE_NAV.label)}
      <nav aria-label="On this page">
        <a href="#about" data-app-link>Features</a> ·
        <a href="#how-to-use" data-app-link>How to use</a> ·
        <a href="#how-it-works" data-app-link>How it works</a>
      </nav>
      <section id="about">
        <h2>Features</h2>
        <ul>
          <li>
            <strong>Stable short URLs.</strong> Change a destination without
            changing the link you've shared.
          </li>
          <li>
            <strong>Easy discovery.</strong> Browse folders or search codes,
            titles, destinations and tags, including nested links.
          </li>
          <li>
            <strong>Copy or open.</strong> Select a code or destination to copy
            its URL; use Open to visit enabled links.
          </li>
          <li>
            <strong>Script shortcuts.</strong> Enabled Bash launchers download
            fully before running and forward arguments and exit status.
          </li>
          <li>
            <strong>Visibility and control.</strong> Hide, flag or disable links
            with tags, without deleting their destinations.
          </li>
          <li>
            <strong>No server to maintain.</strong> Keep links in Git-reviewed
            JSON or YAML; GitHub Pages hosts the site. No database or built-in
            click tracking.
          </li>
          <li>
            <strong>Your theme.</strong> Follow system light/dark mode or save
            your own choice.
          </li>
        </ul>
      </section>
      <section id="how-to-use">
        <h2>How to use</h2>
        <ol>
          <li>
            Create a repository with these files and a <code>main</code> branch.
            In Settings → Pages, choose <strong>GitHub Actions</strong> as
            Source.
          </li>
          <li>
            Edit <code>${esc(source)}</code> on a branch. Use absolute HTTP(S)
            destinations:
          </li>
        </ol>
        <pre><code>${esc(
          source === "links.json"
            ? JSON.stringify(
                {
                  gh: "https://github.com/",
                  docs: {
                    url: "https://docs.github.com/en/pages",
                    title: "GitHub Pages docs",
                    tags: ["documentation"],
                  },
                },
                null,
                2,
              )
            : `gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs
  tags: [documentation]`,
        )}</code></pre>
        <ol start="3">
          <li>
            Open a pull request, pass checks, and merge. After deployment, use
            <code>https://&lt;user&gt;.github.io/&lt;repo&gt;/gh/</code>.
          </li>
        </ol>
        <p>
          Edit a URL to retarget its code; delete an entry to remove it. Nest
          entries for folders.
        </p>
        <p>
          Plain text searches as one broad substring. Use Show tags to select
          filters, or commit <code>#tag</code> with space, comma or Enter. Every
          selected tag and the remaining text must match. Remove a selected tag
          to return it to the picker. Unknown tokens remain with “Tag not
          found”. Configured tags must not contain whitespace, commas, Unicode
          uppercase/titlecase characters or emoji (including flags and keycaps).
          Explicitly rename invalid names; the build never lowercases or strips
          them automatically. Lowercase/uncased languages, digits and ordinary
          punctuation remain valid. Uppercase search tokens still match known
          lowercase names.
        </p>
        <p>
          Descriptive tags use stable light/dark HSL inks generated from their
          string seeds. Broken, script and disabled tags reuse shared link-state
          colors; hidden uses theme-aware neutral gray. All labels and filter
          chips keep matching tinted backgrounds and borders. There is no finite
          palette or unique-color promise; row-state precedence remains
          separate.
        </p>
        <p>
          Add <code>script</code> to <code>tags</code> for a
          <code>&lt;path&gt;.sh</code> launcher. Use exact casing, no trailing
          slash, and only scripts you trust. See the
          <a href="https://github.com/ratrat64/shl#running-bash-scripts"
            >script commands</a
          >.
        </p>
        <p>
          Download saves the current destination script, not the Bash launcher,
          without executing it. It needs JavaScript and a destination host that
          allows CORS. Failed requests show a download error and save no file.
          The filename comes from the destination URL, falling back to
          <code>&lt;code&gt;.sh</code> when no usable basename exists.
        </p>
        <p>Add state names to a link object's <code>tags</code>:</p>
        <ul>
          <li>
            <code>hidden</code> omits it from default listings, counts and
            search.
          </li>
          <li><code>broken</code> adds a warning without blocking actions.</li>
          <li>
            <code>disabled</code> shows an explanation instead of forwarding;
            Open, Download and script execution are blocked. Both URLs remain
            copyable.
          </li>
        </ul>
        <p>
          State names match exactly, ignoring case. The old
          <code>hidden</code> and <code>script</code> properties are rejected.
        </p>
        <p>
          Selecting hidden, broken or disabled admits only matching hidden links
          and their ancestors, still constrained by all filters. Selecting
          script alone never reveals hidden links. Show tags includes all
          subtree tags, even at zero results. Clearing text or hiding the picker
          retains selections.
        </p>
        <p>
          Search, copying and tag filters need JavaScript. Without it, enabled
          visible links still open normally.
        </p>
      </section>
      <section id="how-it-works">
        <h2>How it works</h2>
        <p>
          The build validates codes and URL syntax, then generates directory and
          redirect or disabled pages. Merges to <code>main</code> deploy through
          GitHub Actions; the 404 page recovers differently capitalized paths.
        </p>
        <p>
          All destinations are public; hiding or disabling does not block access
          outside shl. Redirects happen in the browser, not through HTTP 301/302
          responses; destination reachability is not checked.
        </p>
        <p>
          See the
          <a href="https://github.com/ratrat64/shl#readme">README</a>
          for custom domains, local builds, and full validation rules.
        </p>
      </section>
    </article>`,
  );

export const oldInfoPage = (section) => {
  const url = `../${GUIDE_NAV.path}#${section}`;
  return forwardingPage(
    GUIDE_NAV.label,
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
      for (const link of document.querySelectorAll('[data-site-path]'))
        link.href = base + link.dataset.sitePath;
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
