#!/usr/bin/env node
// Turns a JSON or YAML link map into a static site: one folder per short path,
// each with an instant redirect and optional Bash launcher. No server.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDocument } from 'yaml';

const OUT = 'dist';
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RESERVED = new Set(['index', '404', 'assets', 'links', 'about', 'guide', 'how-it-works', 'index.html', '404.html', 'links.json', 'cname']);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// ---- load + validate ------------------------------------------------------

let raw;
let source = 'link source';
try {
  const files = [];
  for (const name of ['links.json', 'links.yaml', 'links.yml']) {
    try {
      files.push([name, await readFile(name, 'utf8')]);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (files.length !== 1) throw new Error(`expected exactly one of links.json, links.yaml, links.yml (found ${files.length ? files.map(([name]) => name).join(', ') : 'none'})`);
  const text = files[0][1];
  source = files[0][0];
  if (source === 'links.json') {
    raw = JSON.parse(text);
  } else {
    const document = parseDocument(text, { uniqueKeys: true });
    if (document.errors.length) throw document.errors[0];
    raw = document.toJS();
  }
  if (!raw || Object.getPrototypeOf(raw) !== Object.prototype) {
    throw new Error('expected an object mapping short codes to destinations');
  }
} catch (error) {
  console.error(`Build stopped. Fix ${source}: ${error.message}`);
  process.exit(1);
}
const problems = [];
const links = [];
const directories = [];
const active = new Set();

function collect(entries, path = []) {
  const seen = new Map();
  const launchers = [];
  if (active.has(entries)) {
    problems.push(`"${path.join('/')}" — directory cannot contain itself`);
    return;
  }
  if (!entries || Object.getPrototypeOf(entries) !== Object.prototype || (path.length && !Object.keys(entries).length)) {
    problems.push(`"${path.join('/') || '/'}" — directory must contain links or subdirectories`);
    return;
  }
  active.add(entries);
  directories.push({ path, entries });
  for (const [code, value] of Object.entries(entries)) {
    const full = [...path, code];
    const name = full.join('/');
    if (!CODE_RE.test(code)) problems.push(`"${name}" — codes must start with a letter or number and contain only letters, numbers, . _ -`);
    if (RESERVED.has(code.toLowerCase())) problems.push(`"${name}" — reserved name`);
    const key = code.toLowerCase();
    if (seen.has(key)) problems.push(`"${name}" — collides with "${seen.get(key)}" (codes are matched case-insensitively)`);
    seen.set(key, name);

    if (value && typeof value === 'object' && !Array.isArray(value) && !('url' in value)) {
      collect(value, full);
      continue;
    }
    const url = typeof value === 'string' ? value : value?.url;
    const title = typeof value === 'object' ? value?.title ?? '' : '';
    if (typeof value !== 'string' && (!value || typeof value !== 'object' || Array.isArray(value))) {
      problems.push(`"${name}" — expected a URL string, an object with url, or a directory`);
    }
    if (typeof value === 'object' && value && 'title' in value && typeof value.title !== 'string') {
      problems.push(`"${name}" — title must be a string`);
    }
    if (typeof value === 'object' && value && 'script' in value && typeof value.script !== 'boolean') {
      problems.push(`"${name}" — script must be a boolean`);
    }
    try {
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error();
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error();
    } catch {
      problems.push(`"${name}" — destination must be a valid absolute HTTP or HTTPS URL`);
    }
    links.push({ code: name, url, title, script: value?.script === true });
    if (value?.script === true) launchers.push(code);
  }
  for (const code of launchers) {
    const filename = `${code}.sh`;
    if (seen.has(filename.toLowerCase())) {
      problems.push(`"${[...path, code].join('/')}" — launcher "${filename}" collides with "${seen.get(filename.toLowerCase())}"`);
    }
  }
  active.delete(entries);
}
collect(raw);

if (problems.length) {
  console.error(`Build stopped. Fix these in ${source}:`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

// ---- templates ------------------------------------------------------------

// HTML's script parser recognizes </script> even inside a JavaScript string.
const scriptString = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

const shellString = (value) => "'" + value.replace(/'/g, "'\\''") + "'";

const scriptLauncher = ({ url }) => `#!/usr/bin/env bash
set -euo pipefail
script=$(mktemp)
trap 'rm -f "$script"' EXIT
curl -fsSL -o "$script" -- ${shellString(url)}
bash "$script" "$@"
`;

const redirectPage = ({ url, title }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Redirecting</title>
<link rel="canonical" href="${esc(url)}">
<meta http-equiv="refresh" content="0; url=${esc(url)}">
<script>location.replace(${scriptString(url)});</script>
<style>
  body{font:16px/1.6 ui-sans-serif,system-ui,sans-serif;margin:0;min-height:100svh;
       display:grid;place-content:center;gap:.5rem;padding:2rem;text-align:center;
       background:#fff;color:#1a1d24}
  a{color:#0b6e4f}
  @media(prefers-color-scheme:dark){body{background:#12151c;color:#e6e8ee}a{color:#5fd0a3}}
</style>
</head>
<body>
  <p>Taking you to ${esc(title || url)}</p>
  <p><a href="${esc(url)}">Continue now</a></p>
</body>
</html>
`;

const styles = `
  :root{color-scheme:light;--bg:#f5f7f8;--panel:#fff;--ink:#172232;--muted:#526174;--line:#d9e0e6;--accent:#154db8;--wash:#eaf0f9}
  @media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#101923;--panel:#172331;--ink:#edf2f6;--muted:#adbac9;--line:#374657;--accent:#a5c4ff;--wash:#22354e}}
  :root[data-theme=light]{color-scheme:light;--bg:#f5f7f8;--panel:#fff;--ink:#172232;--muted:#526174;--line:#d9e0e6;--accent:#154db8;--wash:#eaf0f9}
  :root[data-theme=dark]{color-scheme:dark;--bg:#101923;--panel:#172331;--ink:#edf2f6;--muted:#adbac9;--line:#374657;--accent:#a5c4ff;--wash:#22354e}
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,sans-serif}
  ::selection{background:var(--accent);color:var(--panel)}
  a{color:var(--accent);text-underline-offset:.22em}
  a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  [hidden]{display:none!important}
  button{font:inherit;cursor:pointer}
  .wrap{max-width:1120px;margin:auto;padding-inline:clamp(1.25rem,4vw,3rem)}
  .site-head{border-bottom:1px solid var(--line);background:var(--panel)}
  .head-inner{min-height:82px;display:flex;align-items:center;gap:2rem;flex-wrap:wrap;padding-block:1rem}
  .brand{color:var(--ink);font-weight:760;letter-spacing:-.055em;font-size:1.45rem;text-decoration:none;line-height:1}
  .brand-mark{color:var(--accent);margin-right:.3rem}
  .nav{display:flex;gap:clamp(.8rem,2.4vw,2rem);align-items:center;flex-wrap:wrap;margin-left:auto}
  .nav a{color:var(--muted);font-size:.9rem;text-decoration:none;font-weight:550}
  .nav a[aria-current=page],.nav a:hover{color:var(--accent)}
  .theme-toggle{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:.42rem .85rem;font-size:.85rem;white-space:nowrap}
  .theme-toggle:hover{background:var(--wash)}
  main{padding-top:clamp(3.5rem,7vw,6rem);padding-bottom:6rem}
  h1,h2,h3,p{margin-top:0}
  h1{font-size:clamp(2.7rem,6vw,5rem);letter-spacing:-.06em;line-height:1.08;max-width:13ch;margin-bottom:1rem}
  h2{font-size:clamp(1.5rem,2.4vw,2rem);letter-spacing:-.04em;line-height:1.2;margin-bottom:.8rem}
  h3{font-size:1.06rem;letter-spacing:-.02em}
  p{max-width:68ch}
  .lead{color:var(--muted);font-size:clamp(1.05rem,1.5vw,1.25rem);max-width:52ch;margin-bottom:3rem}
  .grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,290px);gap:clamp(2rem,5vw,5rem);align-items:start}
  .section-head{display:flex;justify-content:space-between;gap:1rem;align-items:baseline;border-bottom:1px solid var(--ink);padding-bottom:.9rem}
  .section-head h2{margin:0}.count{color:var(--muted);font-size:.85rem;font-variant-numeric:tabular-nums}
  .search{margin:1.25rem 0 .25rem}
  .search label{display:block;font-weight:600;margin-bottom:.35rem}
  .search input{width:100%;font:inherit;padding:.6rem .85rem;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink)}
  .search input::placeholder{color:var(--muted)}
  .search input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .search-status{font-size:.9rem;color:var(--muted);margin:.75rem 0 0}
  .links{list-style:none;padding:0;margin:0}
  .links li{border-bottom:1px solid var(--line);padding:1.2rem 0;overflow-wrap:anywhere}
  .links .links{margin:1rem 0 0 1rem;padding-left:1rem;border-left:1px solid var(--line)}
  .links .links li:last-child{border-bottom:0}
  summary{cursor:pointer;color:var(--accent);font-weight:650}
  summary:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  .browse{margin:.5rem 0 0}
  .breadcrumbs{margin-bottom:2rem;color:var(--muted)}
  .link-top{display:flex;gap:.75rem;justify-content:space-between;align-items:baseline}
  .code{font:650 1.03rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none;color:var(--accent)}
  .code:hover{text-decoration:underline}
  .arrow{color:var(--accent);font-size:1.15rem}
  .link-title{color:var(--ink);margin:.35rem 0 .05rem;font-weight:550}
  .destination{display:block;color:var(--muted);font-size:.88rem}
  .side{border-top:1px solid var(--ink);padding-top:1.2rem;color:var(--muted)}
  .side h2{color:var(--ink);font-size:1.25rem}.side p{font-size:.93rem}
  .side a{font-weight:600}
  .prose{max-width:740px}.prose h2{margin-top:3.5rem}.prose p,.prose li{color:var(--muted)}
  .prose ol,.prose ul{padding-left:1.4rem}.prose li{padding-left:.35rem;margin-bottom:.8rem}
  .prose strong{color:var(--ink)}
  pre{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:1.5rem;color:var(--ink);line-height:1.55;font-size:.9rem}
  code{font: .9em/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
  .prose pre code{overflow-wrap:normal}
  .callout{background:var(--wash);padding:1.5rem;border-radius:10px;margin-top:3rem}
  .callout p:last-child{margin-bottom:0}
  .footer{border-top:1px solid var(--line);padding-block:2rem;color:var(--muted);font-size:.87rem}
  .footer .wrap{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.footer p{margin:0}
  @media(max-width:740px){.head-inner{gap:1rem}.nav{order:3;width:100%;margin:0;gap:1rem}.grid{grid-template-columns:1fr}.side{margin-top:1rem}main{padding-top:3rem}.footer .wrap{display:block}}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

const themeScript = `(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  try { const saved = localStorage.getItem('shortlink-theme'); if (saved === 'light' || saved === 'dark') root.dataset.theme = saved; } catch {}
  const update = () => { button.textContent = 'Theme: ' + (root.dataset.theme || 'system'); };
  update();
  button.addEventListener('click', () => {
    const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('shortlink-theme', root.dataset.theme); } catch {}
    update();
  });
})();`;

const searchScript = `(() => {
  const input = document.querySelector('#link-search');
  if (!input) return;
  const list = document.querySelector('.links');
  const status = document.querySelector('#search-status');
  const opened = new Map();
  input.parentElement.hidden = false;

  function filter(list, query, path = '', all = false) {
    let count = 0;
    for (const item of list.children) {
      const details = item.firstElementChild;
      if (details.tagName === 'DETAILS') {
        const next = path + details.querySelector('summary').textContent + '/';
        const found = filter(details.querySelector('.links'), query, next, all || next.toLowerCase().includes(query));
        item.hidden = !found;
        if (query && found && !details.open) {
          opened.set(details, false);
          details.open = true;
        }
        count += found;
      } else {
        const found = all || (path + item.textContent).toLowerCase().includes(query);
        item.hidden = !found;
        count += Number(found);
      }
    }
    return count;
  }

  input.addEventListener('input', () => {
    for (const [details, wasOpen] of opened) details.open = wasOpen;
    opened.clear();
    const query = input.value.trim().toLowerCase();
    const count = filter(list, query);
    status.hidden = !query;
    status.textContent = !query ? '' : count ? count + ' matching link' + (count === 1 ? '.' : 's.') : 'No links match your search.';
  });
})();`;

const shell = (title, active, depth, content) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><title>${esc(title)} · Short links</title>
<link rel="stylesheet" href="${depth}assets/site.css"><script src="${depth}assets/theme.js" defer></script></head>
<body><header class="site-head"><div class="wrap head-inner">
<a class="brand" href="${depth}"><span class="brand-mark" aria-hidden="true">/</span>shortlink</a>
<nav class="nav" aria-label="Main navigation">
${[['Links', '', 'links'], ['About', 'about/', 'about'], ['How to use', 'guide/', 'guide'], ['How it works', 'how-it-works/', 'how-it-works']].map(([label, path, key]) => `<a href="${depth}${path}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
</nav><button class="theme-toggle" type="button" aria-label="Change color theme">Theme: system</button></div></header>
<main class="wrap">${content}</main>
<footer class="footer"><div class="wrap"><p>Short links, built from a file.</p><p><a href="${depth}guide/">Documentation</a> · <a href="${depth}about/">About this project</a></p></div></footer>
</body></html>`;

const listing = (entries, prefix = '') => `<ul class="links">${Object.entries(entries)
  .sort(([a], [b]) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
  .map(([code, value]) => {
    const href = `./${prefix}${code}/`;
    if (typeof value === 'object' && !('url' in value)) return `
      <li><details><summary>${esc(code)}</summary>
        <p class="browse"><a href="${esc(href)}">Browse ${esc(code)}</a></p>
        ${listing(value, `${prefix}${code}/`)}
      </details></li>`;
    const url = typeof value === 'string' ? value : value.url;
    const title = typeof value === 'string' ? '' : value.title;
    return `
      <li><div class="link-top"><a class="code" href="${esc(href)}">${esc(code)}</a><span class="arrow" aria-hidden="true">↗</span></div>${title ? `<p class="link-title">${esc(title)}</p>` : ''}
        <span class="destination">${esc(url)}</span></li>`;
  }).join('')}</ul>`;

const searchableListing = (entries, depth) => `<div class="search" hidden>
    <label for="link-search">Search links</label>
    <input id="link-search" type="search" placeholder="Code, title or destination" autocomplete="off">
  </div><p id="search-status" class="search-status" role="status" hidden></p>
  ${listing(entries)}<script src="${depth}assets/search.js" defer></script>`;

const indexPage = () => shell('Links', 'links', './', `
  <h1>Good links. Less distance.</h1>
  <p class="lead">A small directory of shortcuts. Pick a code to go straight to its destination.</p>
  <div class="grid"><section aria-labelledby="directory-title">
    <div class="section-head"><h2 id="directory-title">The directory</h2><span class="count">${links.length} ${links.length === 1 ? 'link' : 'links'}</span></div>
    ${links.length ? searchableListing(raw, './') : `<p>No links available yet. Add your first entry to ${source} and rebuild the site.</p>`}
  </section><aside class="side"><h2>Simple by design.</h2>
  <p>Each shortcut is a static page made from a link in <code>${source}</code>. No account, database, or application server required.</p>
  <p><a href="./about/">Why this approach ↗</a></p></aside></div>`);

const directoryPage = ({ path, entries }) => shell(path.at(-1), 'links', '../'.repeat(path.length), `
  <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${'../'.repeat(path.length)}">Home</a>${path.map((code, i) => ` / ${i < path.length - 1 ? `<a href="${'../'.repeat(path.length - i - 1)}">${esc(code)}</a>` : esc(code)}`).join('')}</nav>
  <h1>${esc(path.at(-1))}</h1><p class="lead">Browse links and subdirectories in ${esc(path.at(-1))}.</p>
  <div class="grid"><section aria-labelledby="directory-title">
    <div class="section-head"><h2 id="directory-title">The directory</h2></div>
    ${searchableListing(entries, '../'.repeat(path.length))}
  </section><aside class="side"><h2>Simple by design.</h2>
    <p>Each shortcut is a static page made from a link in <code>${source}</code>.</p>
    <p><a href="${'../'.repeat(path.length)}about/">Why this approach ↗</a></p></aside></div>`);

const aboutPage = () => shell('About', 'about', '../', `<article class="prose">
  <h1>Small infrastructure. Useful links.</h1>
  <p class="lead">Shortlink turns a version-controlled list of URLs into a static directory and browser redirects on GitHub Pages.</p>
  <h2>What you get</h2>
  <p><strong>No backend or database.</strong> Your links live in <code>${source}</code>. A Node.js build generates plain files; GitHub Pages serves them. There is no application server for you to run.</p>
  <p><strong>Changes you can review.</strong> Edit the map on a branch, open a pull request, and merge to publish. Every destination has a place in version history.</p>
  <p><strong>A public directory.</strong> Visitors can see available links and where they go before following one. You can also use a custom domain with GitHub Pages.</p>
  <h2>Trade-offs, plainly</h2>
  <p>GitHub Pages is still the hosting provider: you do not need to operate your own hosting. These are browser redirects, not HTTP 301/302 responses. Destinations and the link map are public; there is no anonymous submission or built-in click tracking.</p>
  <p><a href="../guide/">Set up your own links →</a></p></article>`);

const guidePage = () => shell('How to use', 'guide', '../', `<article class="prose">
  <h1>Make a short link.</h1>
  <p class="lead">A link is one entry in a JSON or YAML file. Edit, review, merge; the build takes care of the rest.</p>
  <h2>Get started</h2><ol>
    <li>Create a GitHub repository with these project files and a <code>main</code> branch. In Settings → Pages, set the source to <strong>GitHub Actions</strong>.</li>
    <li>Edit <code>${source}</code> on a branch. Add a code and its absolute HTTP(S) destination (YAML example):</li>
  </ol><pre><code>gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs</code></pre><ol start="3">
    <li>Open a pull request to <code>main</code>. Once checks pass, merge it and wait for the deploy workflow to finish.</li>
    <li>Visit <code>https://&lt;user&gt;.github.io/&lt;repo&gt;/gh/</code>, or use your configured custom domain.</li>
  </ol>
  <h2>Editing and removing links</h2>
  <p>Change the URL to retarget an existing code; delete the entry to remove it on the next deployment. Nest objects to make browseable directories and URLs such as <code>/tools/git/</code>. Codes start with a letter or number and may contain letters, numbers, dots, underscores and hyphens. Sibling names cannot differ only by case.</p>
  <h2>Optional script launchers</h2>
  <p>Set <code>script: true</code> on an object entry to also build a <code>&lt;path&gt;.sh</code> launcher. Use the exact casing and no trailing slash. Only run scripts from sources you trust; the launcher downloads the current destination each time.</p>
  <div class="callout"><h3>Want the full reference?</h3><p>The <a href="https://github.com/ratrat64/shortlink#readme">repository documentation ↗</a> covers YAML, custom domains, validation rules, local builds, and deployment checks.</p></div>
  </article>`);

const howPage = () => shell('How it works', 'how-it-works', '../', `<article class="prose">
  <h1>From a file to a link.</h1><p class="lead">The route is short because the system is short. Here is the whole path.</p>
  <h2>One source of truth</h2><p><code>${source}</code> maps codes to destinations. The build checks every entry before replacing the output, including code collisions and URL syntax.</p>
  <h2>A page for every path</h2><p>For each valid link path the build writes <code>&lt;path&gt;/index.html</code>. The page uses JavaScript and a meta refresh to send visitors to the destination, with a clickable fallback if neither redirect runs. Directories get browseable pages instead. This is a browser redirect, not an HTTP 301/302.</p>
  <h2>Published as static files</h2><p>GitHub Actions builds and deploys the generated files to GitHub Pages after a merge to <code>main</code>. The directory is built from the same map. A 404 page checks differently capitalized codes in the public map before showing an error.</p>
  </article>`);

// GitHub Pages serves 404.html for anything unmatched. Catches codes that only
// differ by case, plus typos.
const notFoundPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link not found</title>
<style>${styles}</style>
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

// ---- write ----------------------------------------------------------------

let cname;
try {
  cname = await readFile('CNAME', 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await mkdir(join(OUT, 'assets'), { recursive: true });
await writeFile(join(OUT, 'assets', 'site.css'), styles);
await writeFile(join(OUT, 'assets', 'theme.js'), themeScript);
await writeFile(join(OUT, 'assets', 'search.js'), searchScript);

for (const link of links) {
  await mkdir(join(OUT, link.code), { recursive: true });
  await writeFile(join(OUT, link.code, 'index.html'), redirectPage(link));
  if (link.script) await writeFile(join(OUT, `${link.code}.sh`), scriptLauncher(link));
}

await writeFile(join(OUT, 'index.html'), indexPage());
for (const directory of directories.slice(1)) {
  await mkdir(join(OUT, ...directory.path), { recursive: true });
  await writeFile(join(OUT, ...directory.path, 'index.html'), directoryPage(directory));
}
for (const [name, page] of [['about', aboutPage], ['guide', guidePage], ['how-it-works', howPage]]) {
  await mkdir(join(OUT, name), { recursive: true });
  await writeFile(join(OUT, name, 'index.html'), page());
}
await writeFile(join(OUT, '404.html'), notFoundPage());
await writeFile(join(OUT, 'links.json'), JSON.stringify(raw, null, 2));
await writeFile(join(OUT, '.nojekyll'), '');
if (cname !== undefined) await writeFile(join(OUT, 'CNAME'), cname);

console.log(`Built ${links.length} short link${links.length === 1 ? '' : 's'} into ${OUT}/`);
