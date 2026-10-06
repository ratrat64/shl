const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// HTML's script parser recognizes </script> even inside a JavaScript string.
const scriptString = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

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

export const cssVariables = `
  :root{color-scheme:light;--bg:#f6f6f6;--panel:#fff;--ink:#2a2a2a;--muted:#666;--line:#e0e0e0;--accent:#1a5fb0;--script:#9b6000;--wash:#eeefef}
  @media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#121212;--panel:#1a1a1a;--ink:#e8e8e8;--muted:#999;--line:#2a2a2a;--accent:#8ab8ff;--script:#e8b460;--wash:#1e1e1e}}
  :root[data-theme=light]{color-scheme:light;--bg:#f6f6f6;--panel:#fff;--ink:#2a2a2a;--muted:#666;--line:#e0e0e0;--accent:#1a5fb0;--script:#9b6000;--wash:#eeefef}
  :root[data-theme=dark]{color-scheme:dark;--bg:#121212;--panel:#1a1a1a;--ink:#e8e8e8;--muted:#999;--line:#2a2a2a;--accent:#8ab8ff;--script:#e8b460;--wash:#1e1e1e}
`;

export const styles = cssVariables + `
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
  .theme-toggle:disabled{background:var(--wash);color:var(--muted);cursor:default}
  main{padding-top:clamp(1.5rem,3vw,2.5rem);padding-bottom:4rem;min-height:70vh}
  h1,h2,h3,p{margin-top:0}
  h1{font-size:clamp(1.8rem,3vw,2.4rem);letter-spacing:-.035em;line-height:1.2;margin-bottom:1rem}
  h2{font-size:clamp(1.25rem,2vw,1.5rem);letter-spacing:-.025em;line-height:1.25;margin-bottom:.8rem}
  h3{font-size:1.06rem;letter-spacing:-.02em}
  p{max-width:68ch}
  .lead{color:var(--muted);max-width:65ch;margin-bottom:2rem}
  .directory-page .site-head,.directory-page .footer{border:0}
  .directory-tools{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;margin-bottom:1.4rem}
  .directory-tools h1{margin:0}
  .count{font-variant-numeric:tabular-nums}
  .directory-actions{display:grid;grid-template-columns:minmax(0,1fr) 9rem;align-items:center;gap:.65rem;width:min(100%,30rem);min-width:0}
  .directory-toggles{grid-column:2;display:flex;align-items:center;justify-content:flex-end;gap:.5rem}
  .search{grid-column:1;min-width:0}
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
  .breadcrumbs{height:2rem;line-height:1.5rem;white-space:nowrap;overflow-x:auto;overflow-y:hidden;margin:0 0 .5rem;color:var(--muted);font-size:.9rem}
  .link-row{display:grid;grid-template-columns:max-content minmax(0,1fr) max-content;gap:1rem;align-items:center;overflow-x:auto}
  .link-row.script-row{grid-template-columns:max-content minmax(0,1fr) max-content max-content}
  .code{font:600 .94rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;text-decoration:none;color:var(--accent);white-space:nowrap}
  .code:hover{text-decoration:underline}
  .script-link{color:var(--script)}
  .script-label{font:600 .7rem/1.5 ui-sans-serif,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;margin-left:.5rem}
  .destination{display:flex;min-width:0;color:var(--muted);font-size:.85rem;white-space:nowrap;text-decoration:none}
  .destination:hover{text-decoration:underline;color:var(--accent)}
  .destination-start{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .destination-end{flex-shrink:0;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .visit{border:1px solid var(--line);border-radius:4px;padding:.2rem .55rem;text-decoration:none;font-size:.85rem;white-space:nowrap}
  .visit:hover{background:var(--wash)}
  .download{border:1px solid var(--line);border-radius:4px;padding:.2rem .55rem;text-decoration:none;font-size:.85rem;white-space:nowrap;color:var(--script)}
  .download:hover{background:var(--wash)}
  .tags{display:block;color:var(--muted);font-size:.78rem;margin-top:.2rem}
  #copy-status:empty{display:none}
  #copy-status:not(:empty){position:fixed;bottom:1rem;right:1rem;z-index:1;max-width:min(24rem,calc(100vw - 2rem));margin:0;padding:.55rem .8rem;background:var(--panel);border:1px solid var(--line);border-radius:4px;color:var(--ink)}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .prose{max-width:740px}.prose section{border-top:1px solid var(--line);padding-top:1rem;margin-top:2.5rem;scroll-margin-top:1rem}.prose p,.prose li{color:var(--muted)}
  .prose ol,.prose ul{padding-left:1.4rem}.prose li{padding-left:.35rem;margin-bottom:.8rem}
  .prose strong{color:var(--ink)}
  pre{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1rem;color:var(--ink);line-height:1.55;font-size:.9rem}
  code{font: .9em/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
  .prose pre code{overflow-wrap:normal}
  .footer{border-top:1px solid var(--line);padding-block:1.5rem;color:var(--muted);font-size:.87rem}
  .footer .wrap{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.footer p{margin:0}
  @media(max-width:740px){.head-inner{flex-wrap:wrap;gap:.75rem}.nav{gap:1rem}.directory-tools{align-items:stretch;flex-direction:column}.directory-actions{width:100%;grid-template-columns:minmax(0,1fr)}.directory-toggles{grid-column:1}.link-row{gap:.5rem}.footer .wrap{display:block}}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

export const themeScript = `(() => {
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

export const searchScript = `globalThis.initSearch = () => {
  const input = document.querySelector('#link-search');
  if (!input) return;
  const list = document.querySelector('.links');
  const status = document.querySelector('#search-status');
  const toggle = document.querySelector('#hidden-toggle');
  const countLabel = document.querySelector('#link-count');
  const empty = document.querySelector('#empty-directory');
  const opened = new Map();
  let showHidden = false;
  input.parentElement.hidden = !!empty;
  if (toggle && !toggle.disabled) toggle.hidden = false;

  function filter(list, query, path = '', all = false) {
    let count = 0;
    for (const item of list.children) {
      if (item.dataset.hidden === 'true' && !showHidden) { item.hidden = true; continue; }
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
        const found = all || (path + (item.dataset.search || item.textContent) + ' ' + (item.dataset.title || '')).toLowerCase().includes(query);
        item.hidden = !found;
        count += Number(found);
      }
    }
    return count;
  }

  function update() {
    for (const [details, wasOpen] of opened) details.open = wasOpen;
    opened.clear();
    const query = input.value.trim().toLowerCase();
    const count = filter(list, query);
    status.hidden = !query || !!count || (!!empty && !showHidden);
    status.textContent = query && !count ? 'No links match your search.' : '';
    if (empty) {
      empty.hidden = showHidden;
      list.parentElement.hidden = !showHidden;
      input.parentElement.hidden = !showHidden;
    }
    countLabel.textContent = count + ' link' + (count === 1 ? '' : 's');
  }

  input.addEventListener('input', update);
  if (toggle && !toggle.disabled) toggle.addEventListener('click', () => {
    showHidden = !showHidden;
    toggle.textContent = showHidden ? 'Hide hidden links' : 'Show hidden links';
    toggle.setAttribute('aria-pressed', String(showHidden));
    update();
  });
};
globalThis.initSearch();`;

export const copyScript = `globalThis.initCopy = () => {
  const list = document.querySelector('.links');
  const status = document.querySelector('#copy-status');
  let timeout;
  list.addEventListener('click', async (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a.code, a.destination');
    if (!link) return;
    event.preventDefault();
    clearTimeout(timeout);
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(link.classList.contains('code') ? link.href : link.getAttribute('href'));
      status.textContent = link.classList.contains('code') ? 'Short link copied.' : 'Destination copied.';
    } catch {
      status.textContent = 'Could not copy the link. Try your browser\u2019s copy-link action.';
    }
    timeout = setTimeout(() => { status.textContent = ''; }, 5000);
  });
};
globalThis.initCopy();`;

export const navigationScript = `(() => {
  const rebase = (main, url) => {
    for (const link of main.querySelectorAll('a[href^="."]')) {
      link.href = new URL(link.getAttribute('href'), url).href;
    }
  };
  // The header and footer survive page swaps, so their relative links must not drift.
  for (const link of document.querySelectorAll('.site-head a, .footer a')) link.href = link.href;
  rebase(document.querySelector('main'), location.href);

  let request = 0;
  let displayed = location.pathname;
  // ponytail: one scroll position per directory; use history-entry state if per-visit restoration matters.
  const scroll = new Map();
  async function navigate(url, push) {
    const current = ++request;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Directory unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const main = page.querySelector('main[data-directory]');
      const title = page.querySelector('title');
      if (!main || !title) throw new Error('Not a directory');
      if (current !== request) return;
      rebase(main, url);
      for (const script of main.querySelectorAll('script')) script.remove();
      document.querySelector('main').replaceWith(main);
      document.title = title.textContent;
      if (push) history.pushState(null, '', url);
      displayed = location.pathname;
      if (main.querySelector('.links')) {
        globalThis.initSearch();
        globalThis.initCopy();
      }
      window.scrollTo(0, push ? 0 : scroll.get(displayed) || 0);
      const heading = main.querySelector('h1');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    } catch {
      if (current === request) location.assign(url);
    }
  }

  history.scrollRestoration = 'manual';
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[data-directory-link]');
    if (!link || link.target && link.target !== '_self' || link.origin !== location.origin) return;
    if (link.pathname === displayed) { ++request; return; }
    event.preventDefault();
    scroll.set(displayed, window.scrollY);
    navigate(link.href, true);
  });
  window.addEventListener('popstate', () => {
    scroll.set(displayed, window.scrollY);
    if (location.pathname !== displayed) navigate(location.href, false);
    else ++request;
  });
})();`;

const shell = (title, active, depth, content) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><title>${esc(title)} · shl</title>
<link rel="stylesheet" href="${depth}assets/site.css"><script src="${depth}assets/theme.js" defer></script>${active === 'links' ? `<script src="${depth}assets/navigation.js" defer></script>` : ''}</head>
<body${active === 'links' ? ' class="directory-page"' : ''}><header class="site-head"><div class="wrap head-inner">
 <a class="brand" href="${depth}"${active === 'links' ? ' data-directory-link' : ''}>shl</a>
 <nav class="nav" aria-label="Main navigation">
 ${[['Links', '', 'links'], ['Guide', 'guide/', 'guide']].map(([label, path, key]) => `<a href="${depth}${path}"${active === 'links' && key === 'links' ? ' data-directory-link' : ''}${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
 </nav><button class="theme-toggle" type="button" aria-label="Change color theme">Theme: system</button></div></header>
 <main class="wrap"${active === 'links' ? ' data-directory' : ''}>${content}</main>
 <footer class="footer"><div class="wrap"><p>shl</p><p><a href="${depth}guide/">Guide</a> · <a href="https://github.com/ratrat64/shortlink#readme">Repository</a></p></div></footer>
</body></html>`;

const visibleCount = (entries, includeHidden = false) => Object.values(entries).reduce((count, value) =>
  count + (typeof value === 'object' && !('url' in value) ? visibleCount(value, includeHidden) : Number(includeHidden || value?.hidden !== true)), 0);

const listing = (entries, prefix = '') => `<ul class="links">${Object.entries(entries)
  .sort(([a], [b]) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
  .map(([code, value]) => {
    const href = `./${prefix}${code}/`;
    if (typeof value === 'object' && !('url' in value)) return `
      <li${visibleCount(value) ? '' : ' data-hidden="true" hidden'}><details><summary><a href="${esc(href)}" data-directory-link>${esc(code)}</a></summary>
        ${listing(value, `${prefix}${code}/`)}
      </details></li>`;
    const url = typeof value === 'string' ? value : value.url;
    const title = typeof value === 'string' ? '' : value.title;
    const tags = Array.isArray(value?.tags) ? value.tags.map((tag) => tag.trim()) : [];
    const originLength = new URL(url).origin.length;
    const path = url.slice(originLength).split(/[?#]/, 1)[0];
    const split = path.lastIndexOf('/', path.lastIndexOf('/') - 1);
    const cut = split > 0 ? originLength + split + 1 : url.length;
    return `
         <li${value?.hidden === true ? ' data-hidden="true" hidden' : ''}${title ? ` data-title="${esc(title)}"` : ''} data-search="${esc(`${code} ${value?.script === true ? 'script ' : ''}${url} ${tags.join(' ')} ${tags.map((tag) => `#${tag}`).join(' ')}`.trim())}"><div class="link-row${value?.script === true ? ' script-row' : ''}"${title ? ` title="${esc(title)}"` : ''}><a class="code${value?.script === true ? ' script-link' : ''}" href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}>${esc(code)}${value?.script === true ? '<span class="script-label">script</span>' : ''}</a>
           <a class="destination" href="${esc(url)}" aria-label="Copy destination: ${esc(url)}"${title ? '' : ` title="${esc(url)}"`}><span class="sr-only">${esc(url)}</span><span class="destination-start" aria-hidden="true">${esc(url.slice(0, cut))}</span><span class="destination-end" aria-hidden="true">${esc(url.slice(cut))}</span></a>${value?.script === true ? `<a class="download" href="${esc(`./${prefix}${code}.sh`)}" aria-label="Download script for ${esc(code)}" download>Download</a>` : ''}<a class="visit" href="${esc(url)}" aria-label="Open destination for ${esc(code)}">Open</a></div>${tags.length ? `<span class="tags">${tags.map((tag) => `#${esc(tag)}`).join(' · ')}</span>` : ''}</li>`;
  }).join('')}</ul>`;

const searchableListing = () => `<div class="search" hidden>
      <label class="sr-only" for="link-search">Search links</label>
      <input id="link-search" type="search" placeholder="Search link, title or tag" autocomplete="off">
    </div>`;

const directoryContents = (entries, depth, breadcrumbs = '', emptyMessage = 'No links listed here.') => {
  const visible = visibleCount(entries);
  const total = visibleCount(entries, true);
  return `<section aria-label="Links">
    <div class="directory-tools"><h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">${visible} link${visible === 1 ? '' : 's'}</h1>
    <div class="directory-actions">${total ? searchableListing() : ''}<div class="directory-toggles"><button id="hidden-toggle" class="theme-toggle" type="button" aria-pressed="false" ${total > visible ? 'hidden' : 'disabled'}>Show hidden links</button></div></div></div>
    ${breadcrumbs || '<div class="breadcrumbs" aria-hidden="true"></div>'}
   ${total ? `<p id="search-status" class="search-status" role="status" hidden></p><p id="copy-status" class="search-status" role="status" aria-live="polite"></p>
    ${visible ? '' : '<p id="empty-directory">No links listed here.</p>'}
     <div${visible ? '' : ' hidden'}>${listing(entries)}</div><script src="${depth}assets/search.js" defer></script><script src="${depth}assets/copy.js" defer></script>` : `<p>${emptyMessage}</p>`}</section>`;
};

export const indexPage = ({ raw, links, source }) => shell('Links', 'links', './', `
    ${directoryContents(raw, './', '', links.length ? 'No links listed here.' : `No links available yet. Add your first entry to <code>${esc(source)}</code> and rebuild the site.`)}`);

export const directoryPage = ({ path, entries }) => {
  const depth = '../'.repeat(path.length);
  const breadcrumbs = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${depth}" data-directory-link>Home</a>${path.map((code, i) => ` / ${i < path.length - 1 ? `<a href="${'../'.repeat(path.length - i - 1)}" data-directory-link>${esc(code)}</a>` : esc(code)}`).join('')}</nav>`;
  return shell(path.at(-1), 'links', depth, `
    ${directoryContents(entries, depth, breadcrumbs)}`);
};

export const guidePage = (source) => shell('Guide', 'guide', '../', `<article class="prose">
   <h1>Guide</h1>
   <nav aria-label="On this page"><a href="#about">About</a> · <a href="#how-to-use">How to use</a> · <a href="#how-it-works">How it works</a></nav>
   <section id="about"><h2>About</h2>
   <p>shl publishes a public directory and browser redirects from a version-controlled JSON or YAML file. GitHub Pages serves the generated files; no application server or database is required.</p>
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
     <p>Add <code>tags: [documentation, github]</code> to a link object to show topic labels under it. Search by tag name or by its displayed <code>#tag</code> label, including in nested directories.</p>
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
