import { esc, scriptString, page as shell } from './layout.mjs';

const shellString = (value) => "'" + value.replace(/'/g, "'\\''") + "'";

export const scriptLauncher = ({ url }) => `#!/usr/bin/env bash
set -euo pipefail
script=$(mktemp)
trap 'rm -f "$script"' EXIT
curl -fsSL -o "$script" -- ${shellString(url)}
bash "$script" "$@"
`;

export const redirectPage = ({ url, title }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Redirecting · shl</title>
<link rel="canonical" href="${esc(url)}">
<meta http-equiv="refresh" content="0; url=${esc(url)}">
<link rel="stylesheet" href="./assets/site.css">
<script>location.replace(${scriptString(url)});</script>
</head>
<body>
  <p>Taking you to ${esc(title || url)}</p>
  <p><a href="${esc(url)}">Continue now</a></p>
</body>
</html>
`;

export const guidePage = (source) => shell('Guide', 'guide', '../', `<article class="prose">
   <h1>Guide</h1>
   <nav aria-label="On this page"><a href="#about" data-app-link>About</a> · <a href="#how-to-use" data-app-link>How to use</a> · <a href="#how-it-works" data-app-link>How it works</a></nav>
   <section id="about"><h2>About</h2>
   <p>shl publishes a public directory and browser redirects from a version-controlled JSON or YAML file. GitHub Pages serves the generated files; no application server or database is required.</p>
   <p>Links and destinations are public. Redirects are browser-based, not HTTP 301/302 responses. There is no anonymous submission or built-in click tracking.</p></section>
   <section id="how-to-use"><h2>How to use</h2><ol>
     <li>Create a repository with these files and a <code>main</code> branch. Set Settings → Pages → Source to <strong>GitHub Actions</strong>.</li>
     <li>Edit <code>${esc(source)}</code> on a branch. Add an absolute HTTP(S) destination:</li>
   </ol><pre><code>gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs</code></pre><ol start="3">
     <li>Open a pull request, pass checks, and merge. After deployment, visit <code>https://&lt;user&gt;.github.io/&lt;repo&gt;/gh/</code>.</li>
   </ol>
    <p>Change a URL to retarget a code; delete its entry to remove it. Nest objects for directories. Codes start with a letter or number and may also contain dots, underscores, and hyphens; sibling names cannot differ only by case.</p>
     <p>Optional: <code>script: true</code> builds a <code>&lt;path&gt;.sh</code> launcher. Use exact casing and no trailing slash; only run scripts from trusted sources.</p>
     <p>Add <code>tags: [documentation, github]</code> to a link object to show inline topic labels beside its code. Select the labels to see the full tags when they are shortened. Search by tag name or by its displayed <code>#tag</code> label, including in nested directories.</p>
    <p>Set <code>hidden: true</code> on a link object to omit it from directory listings, counts, and search by default. Use Show hidden links on a directory page to reveal hidden entries. Its redirect and optional launcher still work, and the destination remains public in <code>links.json</code>. Hiding controls discoverability, not secrecy.</p></section>
   <section id="how-it-works"><h2>How it works</h2>
   <p>The build validates codes, collisions, and URL syntax before replacing output. Each link gets a redirect page with JavaScript, meta refresh, and a clickable fallback. Directories get browsable pages.</p>
   <p>GitHub Actions deploys the files after merges to <code>main</code>. The 404 page checks the public link map for differently capitalized codes.</p>
   <p>See the <a href="https://github.com/ratrat64/shortlink#readme">repository documentation</a> for custom domains, local builds, and full validation rules.</p></section>
   </article>`);

export const oldInfoPage = (section) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guide · shl</title><meta http-equiv="refresh" content="0; url=../guide/#${section}"><link rel="canonical" href="../guide/#${section}"></head><body><p><a href="../guide/#${section}">Continue to the guide</a></p></body></html>`;

// GitHub Pages serves 404.html for anything unmatched. Catches codes that only
// differ by case, plus typos.
export const notFoundPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link not found · shl</title>
<link rel="stylesheet" href="./assets/site.css">
</head>
<body>
<main class="wrap prose">
  <h1 id="head">Checking that link</h1>
   <p class="lead" id="msg">One moment.</p>
   <p><a class="code" id="home" href="./">Home</a></p>
   <noscript><p>This link could not be found. Enable JavaScript to check for a differently capitalized code.</p></noscript>
</main>
<script>
(async () => {
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
        const hit = entry && typeof entry === 'object' && !('url' in entry)
          ? Object.entries(entry).find(([c]) => c.toLowerCase() === segment.toLowerCase()) : null;
        if (!hit) { entry = null; break; }
        canonical.push(hit[0]);
        entry = hit[1];
      }
      home.href = base;
      if (entry && typeof entry === 'object' && !('url' in entry)) {
        location.replace(base + canonical.join('/') + '/');
        return;
      }
      if (entry) { location.replace(typeof entry === 'string' ? entry : entry.url); return; }
      break;
    } catch (e) { /* try next */ }
  }
  document.getElementById('head').textContent = 'Link not found';
  document.getElementById('msg').textContent = seg ? '"' + seg + '" is not a short link here.' : 'That address does not exist.';
})();
</script>
</body>
</html>
`;
