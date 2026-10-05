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
    if (typeof value === 'object' && value && 'hidden' in value && typeof value.hidden !== 'boolean') {
      problems.push(`"${name}" — hidden must be a boolean`);
    }
    try {
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error();
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error();
    } catch {
      problems.push(`"${name}" — destination must be a valid absolute HTTP or HTTPS URL`);
    }
    links.push({ code: name, url, title, script: value?.script === true, hidden: value?.hidden === true });
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
        background:#fafafa;color:#171717}
   a{color:#1755a0}
   @media(prefers-color-scheme:dark){body{background:#000;color:#f2f2f2}a{color:#9ac6ff}}
</style>
</head>
<body>
  <p>Taking you to ${esc(title || url)}</p>
  <p><a href="${esc(url)}">Continue now</a></p>
</body>
</html>
`;

const styles = `
  :root{color-scheme:light;--bg:#fafafa;--panel:#fff;--ink:#171717;--muted:#555;--line:#dedede;--accent:#1755a0;--script:#875000;--wash:#f0f2f4}
  @media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#000;--panel:#0d0d0d;--ink:#f2f2f2;--muted:#aaa;--line:#303030;--accent:#9ac6ff;--script:#ffcb86;--wash:#191919}}
  :root[data-theme=light]{color-scheme:light;--bg:#fafafa;--panel:#fff;--ink:#171717;--muted:#555;--line:#dedede;--accent:#1755a0;--script:#875000;--wash:#f0f2f4}
  :root[data-theme=dark]{color-scheme:dark;--bg:#000;--panel:#0d0d0d;--ink:#f2f2f2;--muted:#aaa;--line:#303030;--accent:#9ac6ff;--script:#ffcb86;--wash:#191919}
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}
  ::selection{background:var(--accent);color:var(--bg)}
  a{color:var(--accent);text-underline-offset:.22em}
  a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  [hidden]{display:none!important}
  button{font:inherit;cursor:pointer}
  .wrap{max-width:1160px;margin:auto;padding-inline:clamp(1rem,3vw,2.5rem)}
  .site-head{border-bottom:1px solid var(--line)}
  .head-inner{min-height:64px;display:flex;align-items:center;gap:1.5rem;padding-block:.65rem}
  .brand{color:var(--ink);font-weight:700;letter-spacing:-.035em;font-size:1.2rem;text-decoration:none;line-height:1}
  .nav{display:flex;gap:1.5rem;align-items:center;margin-left:auto}
  .nav a{color:var(--muted);font-size:.9rem;text-decoration:none}
  .nav a[aria-current=page]{color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:.45em}
  .nav a:hover{color:var(--accent)}
  .theme-toggle{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:4px;padding:.35rem .7rem;font-size:.85rem;white-space:nowrap}
  .theme-toggle:hover{background:var(--wash)}
  main{padding-top:clamp(1.5rem,3vw,2.5rem);padding-bottom:4rem;min-height:70vh}
  h1,h2,h3,p{margin-top:0}
  h1{font-size:clamp(1.8rem,3vw,2.4rem);letter-spacing:-.035em;line-height:1.2;margin-bottom:1rem}
  h2{font-size:clamp(1.25rem,2vw,1.5rem);letter-spacing:-.025em;line-height:1.25;margin-bottom:.8rem}
  h3{font-size:1.06rem;letter-spacing:-.02em}
  p{max-width:68ch}
  .lead{color:var(--muted);max-width:65ch;margin-bottom:2rem}
  .section-head{display:flex;justify-content:space-between;gap:1rem;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:.6rem}
  .section-head h2{margin:0}.count{color:var(--muted);font-size:.85rem;font-variant-numeric:tabular-nums}
  .directory-tools{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}
  .directory-tools h1{margin:0}.directory-tools .count{margin-left:.5rem}
  .search{width:min(100%,360px)}
  .search label{display:block;font-size:.82rem;color:var(--muted);margin-bottom:.2rem}
  .search input{width:100%;font:inherit;padding:.45rem .7rem;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--ink);caret-color:var(--accent)}
  .search input::placeholder{color:var(--muted)}
  .search input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .search-status{font-size:.9rem;color:var(--muted);margin:0 0 .5rem}
  .links{list-style:none;padding:0;margin:0}
  .links li{padding:.65rem 0;overflow-wrap:anywhere}
  .links .links{margin:.35rem 0 0 .75rem;padding-left:1rem}
  summary{cursor:pointer;color:var(--ink);font-weight:600}
  summary:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
  summary a{color:inherit;text-decoration:none}
  summary a:hover{text-decoration:underline}
  .breadcrumbs{margin:0 0 1rem;color:var(--muted);font-size:.9rem}
  .link-row{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:1rem;align-items:baseline;overflow-x:auto}
  .code{font:600 .94rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none;color:var(--accent);white-space:nowrap}
  .code:hover{text-decoration:underline}
  .script-link{color:var(--script)}
  .script-label{font:600 .7rem/1.5 ui-sans-serif,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;margin-left:.5rem}
  .destination{display:flex;min-width:0;color:var(--muted);font-size:.85rem;white-space:nowrap}
  .destination-start{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .destination-end{flex-shrink:0;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .prose{max-width:740px}.prose section{border-top:1px solid var(--line);padding-top:1rem;margin-top:2.5rem;scroll-margin-top:1rem}.prose p,.prose li{color:var(--muted)}
  .prose ol,.prose ul{padding-left:1.4rem}.prose li{padding-left:.35rem;margin-bottom:.8rem}
  .prose strong{color:var(--ink)}
  pre{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1rem;color:var(--ink);line-height:1.55;font-size:.9rem}
  code{font: .9em/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
  .prose pre code{overflow-wrap:normal}
  .footer{border-top:1px solid var(--line);padding-block:1.5rem;color:var(--muted);font-size:.87rem}
  .footer .wrap{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.footer p{margin:0}
  @media(max-width:740px){.head-inner{flex-wrap:wrap;gap:.75rem}.nav{gap:1rem}.directory-tools{align-items:stretch;flex-direction:column}.search{width:100%}.link-row{gap:.5rem}.footer .wrap{display:block}}
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
        const found = all || (path + item.textContent + ' ' + (item.dataset.title || '')).toLowerCase().includes(query);
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
 <a class="brand" href="${depth}">shortlink</a>
 <nav class="nav" aria-label="Main navigation">
 ${[['Links', '', 'links'], ['Guide', 'guide/', 'guide']].map(([label, path, key]) => `<a href="${depth}${path}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
 </nav><button class="theme-toggle" type="button" aria-label="Change color theme">Theme: system</button></div></header>
 <main class="wrap">${content}</main>
 <footer class="footer"><div class="wrap"><p>Shortlink</p><p><a href="${depth}guide/">Guide</a> · <a href="https://github.com/ratrat64/shortlink#readme">Repository</a></p></div></footer>
</body></html>`;

const visibleCount = (entries) => Object.values(entries).reduce((count, value) =>
  count + (typeof value === 'object' && !('url' in value) ? visibleCount(value) : Number(value?.hidden !== true)), 0);

const listing = (entries, prefix = '') => `<ul class="links">${Object.entries(entries)
  .filter(([, value]) => typeof value === 'object' && !('url' in value) ? visibleCount(value) > 0 : value?.hidden !== true)
  .sort(([a], [b]) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
  .map(([code, value]) => {
    const href = `./${prefix}${code}/`;
    if (typeof value === 'object' && !('url' in value)) return `
      <li><details><summary><a href="${esc(href)}">${esc(code)}</a></summary>
        ${listing(value, `${prefix}${code}/`)}
      </details></li>`;
    const url = typeof value === 'string' ? value : value.url;
    const title = typeof value === 'string' ? '' : value.title;
    const originLength = new URL(url).origin.length;
    const path = url.slice(originLength).split(/[?#]/, 1)[0];
    const split = path.lastIndexOf('/', path.lastIndexOf('/') - 1);
    const cut = split > 0 ? originLength + split + 1 : url.length;
    return `
        <li${title ? ` data-title="${esc(title)}"` : ''}><div class="link-row"${title ? ` title="${esc(title)}"` : ''}><a class="code${value?.script === true ? ' script-link' : ''}" href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}>${esc(code)}${value?.script === true ? '<span class="script-label">script</span>' : ''}</a>
          <span class="destination"${title ? '' : ` title="${esc(url)}"`}><span class="sr-only">${esc(url)}</span><span class="destination-start" aria-hidden="true">${esc(url.slice(0, cut))}</span><span class="destination-end" aria-hidden="true">${esc(url.slice(cut))}</span></span></div></li>`;
  }).join('')}</ul>`;

const searchableListing = (entries, depth) => `<div class="search" hidden>
     <label for="link-search">Search links</label>
     <input id="link-search" type="search" placeholder="Code, title or destination" autocomplete="off">
   </div>`;

const directoryContents = (entries, depth, heading, count = '', breadcrumbs = '') => {
  const visible = visibleCount(entries);
  return `<section aria-label="Links">
  <div class="directory-tools"><div><h1>${heading}</h1>${count ? `<span class="count">${count}</span>` : ''}</div>${visible ? searchableListing(entries, depth) : ''}</div>
  ${breadcrumbs}
  ${visible ? `<p id="search-status" class="search-status" role="status" hidden></p>
  ${listing(entries)}<script src="${depth}assets/search.js" defer></script>` : '<p>No links listed here.</p>'}</section>`;
};

const indexPage = () => {
  const visible = links.filter((link) => !link.hidden).length;
  return shell('Links', 'links', './', `
    ${links.length ? directoryContents(raw, './', 'Links', visible ? `${visible} ${visible === 1 ? 'link' : 'links'}` : '') : `<h1>Links</h1><p>No links available yet. Add your first entry to <code>${source}</code> and rebuild the site.</p>`}`);
};

const directoryPage = ({ path, entries }) => {
  const depth = '../'.repeat(path.length);
  const breadcrumbs = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${depth}">Home</a>${path.map((code, i) => ` / ${i < path.length - 1 ? `<a href="${'../'.repeat(path.length - i - 1)}">${esc(code)}</a>` : esc(code)}`).join('')}</nav>`;
  return shell(path.at(-1), 'links', depth, `
   ${directoryContents(entries, depth, esc(path.at(-1)), '', breadcrumbs)}`);
};

const guidePage = () => shell('Guide', 'guide', '../', `<article class="prose">
   <h1>Guide</h1>
   <nav aria-label="On this page"><a href="#about">About</a> · <a href="#how-to-use">How to use</a> · <a href="#how-it-works">How it works</a></nav>
   <section id="about"><h2>About</h2>
   <p>Shortlink publishes a public directory and browser redirects from a version-controlled JSON or YAML file. GitHub Pages serves the generated files; no application server or database is required.</p>
   <p>Links and destinations are public. Redirects are browser-based, not HTTP 301/302 responses. There is no anonymous submission or built-in click tracking.</p></section>
   <section id="how-to-use"><h2>How to use</h2><ol>
     <li>Create a repository with these files and a <code>main</code> branch. Set Settings → Pages → Source to <strong>GitHub Actions</strong>.</li>
     <li>Edit <code>${source}</code> on a branch. Add an absolute HTTP(S) destination:</li>
   </ol><pre><code>gh: https://github.com/
docs:
  url: https://docs.github.com/en/pages
  title: GitHub Pages docs</code></pre><ol start="3">
     <li>Open a pull request, pass checks, and merge. After deployment, visit <code>https://&lt;user&gt;.github.io/&lt;repo&gt;/gh/</code>.</li>
   </ol>
    <p>Change a URL to retarget a code; delete its entry to remove it. Nest objects for directories. Codes start with a letter or number and may also contain dots, underscores, and hyphens; sibling names cannot differ only by case.</p>
    <p>Optional: <code>script: true</code> builds a <code>&lt;path&gt;.sh</code> launcher. Use exact casing and no trailing slash; only run scripts from trusted sources.</p>
    <p>Set <code>hidden: true</code> on a link object to omit it from directory listings, counts, and search. Its redirect and optional launcher still work, and the destination remains public in <code>links.json</code>. Hiding controls discoverability, not secrecy.</p></section>
   <section id="how-it-works"><h2>How it works</h2>
   <p>The build validates codes, collisions, and URL syntax before replacing output. Each link gets a redirect page with JavaScript, meta refresh, and a clickable fallback. Directories get browsable pages.</p>
   <p>GitHub Actions deploys the files after merges to <code>main</code>. The 404 page checks the public link map for differently capitalized codes.</p>
   <p>See the <a href="https://github.com/ratrat64/shortlink#readme">repository documentation</a> for custom domains, local builds, and full validation rules.</p></section>
   </article>`);

const oldInfoPage = (section) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guide · Short links</title><meta http-equiv="refresh" content="0; url=../guide/#${section}"><link rel="canonical" href="../guide/#${section}"></head><body><p><a href="../guide/#${section}">Continue to the guide</a></p></body></html>`;

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
for (const [name, page] of [['about', () => oldInfoPage('about')], ['guide', guidePage], ['how-it-works', () => oldInfoPage('how-it-works')]]) {
  await mkdir(join(OUT, name), { recursive: true });
  await writeFile(join(OUT, name, 'index.html'), page());
}
await writeFile(join(OUT, '404.html'), notFoundPage());
await writeFile(join(OUT, 'links.json'), JSON.stringify(raw, null, 2));
await writeFile(join(OUT, '.nojekyll'), '');
if (cname !== undefined) await writeFile(join(OUT, 'CNAME'), cname);

console.log(`Built ${links.length} short link${links.length === 1 ? '' : 's'} into ${OUT}/`);
