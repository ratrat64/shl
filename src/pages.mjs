import {
  esc,
  scriptString,
  documentPage,
  page as shell,
  GUIDE_NAV,
  pageTitle,
} from "./layout.mjs";
import { guideExampleListing } from "./directory.mjs";

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
        <p>
          This site builds from <code>${esc(source)}</code>. Keep exactly one
          link file with absolute HTTP(S) destinations.
        </p>
        <h3>links.yaml</h3>
        <pre data-format="yaml"><code>${esc(
          `gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs
  tags: [documentation]`,
        )}</code></pre>
        <h3>links.json</h3>
        <pre data-format="json"><code>${esc(
          JSON.stringify(
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
          ),
        )}</code></pre>
        <ul>
          <li>
            Edit a URL to retarget its code; delete an entry to remove it. Nest
            entries for folders.
          </li>
          <li>
            Search matches codes, titles, destinations and tags as one broad
            substring. Pick tags with Show tags, or type
            <code>#tag</code> plus space, comma or Enter; every selection must
            match. Unknown tokens show “Tag not found”.
          </li>
          <li>
            Tag names must not contain whitespace, commas, uppercase/titlecase
            characters or emoji; the build rejects them for explicit renaming.
          </li>
        </ul>
        <h3>Script links</h3>
        <p>
          Add <code>script</code> to <code>tags</code> for a
          <code>&lt;path&gt;.sh</code> launcher (exact casing, trusted scripts
          only). Download saves the destination script without running it; it
          needs JavaScript and a host that allows CORS.
        </p>
        <h3>Special tags</h3>
        <p>Examples use placeholder destinations.</p>
        ${guideExampleListing()}
        <ul>
          <li>
            <code>hidden</code> looks dimmed here; it is omitted from listings,
            counts and search unless a selected hidden, broken or disabled tag
            admits it. Script alone never reveals hidden links.
          </li>
          <li><code>broken</code> warns without blocking actions.</li>
          <li>
            <code>disabled</code> shows an explanation instead of forwarding;
            Open and Download are unavailable, but both URLs stay copyable.
          </li>
          <li><code>script</code> shows Download alongside Open.</li>
        </ul>
        <p>
          Search, copying and tag filters need JavaScript. Without it, enabled
          visible links still open normally.
        </p>
      </section>
      <section id="how-it-works">
        <h2>How it works</h2>
        <ol>
          <li>Edit the link file on a branch.</li>
          <li>
            Open a pull request; checks validate codes, destinations, collisions
            and tags, then build.
          </li>
          <li>
            Merge to <code>main</code>; Actions rebuilds and publishes
            <code>dist/</code> to GitHub Pages.
          </li>
          <li>
            Open a short URL; the browser forwards to its destination.
            Wrong-case paths fall back to 404 recovery.
          </li>
        </ol>
        <p>
          All destinations stay public; hiding or disabling never blocks access
          outside shl. Redirects run in the browser, not as HTTP 301/302
          responses; reachability is not checked.
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
      <p><a class="code" id="home" href="./" data-app-link>Home</a></p>
      <noscript
        ><p>
          This link could not be found. Enable JavaScript to check for a
          differently capitalized code.
        </p></noscript
      >
    </article>`,
    {
      embedded: true,
    },
  );
