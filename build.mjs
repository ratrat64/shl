#!/usr/bin/env node
// Turns links.json into a static site: one folder per short code, each with an
// instant redirect and optional Bash launcher. No dependencies, no server.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'dist';
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RESERVED = new Set(['index', '404', 'assets', 'links']);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// ---- load + validate ------------------------------------------------------

let raw;
try {
  raw = JSON.parse(await readFile('links.json', 'utf8'));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('expected an object mapping short codes to destinations');
  }
} catch (error) {
  console.error(`Build stopped. Fix links.json: ${error.message}`);
  process.exit(1);
}
const problems = [];
const seen = new Map();
const links = [];

for (const [code, value] of Object.entries(raw)) {
  const url = typeof value === 'string' ? value : value?.url;
  const title = typeof value === 'object' ? value?.title ?? '' : '';
  if (typeof value !== 'string' && (!value || typeof value !== 'object' || Array.isArray(value))) {
    problems.push(`"${code}" — expected a URL string or an object with url, optional title and script`);
  }
  if (typeof value === 'object' && value && 'title' in value && typeof value.title !== 'string') {
    problems.push(`"${code}" — title must be a string`);
  }
  if (typeof value === 'object' && value && 'script' in value && typeof value.script !== 'boolean') {
    problems.push(`"${code}" — script must be a boolean`);
  }

  if (!CODE_RE.test(code)) problems.push(`"${code}" — codes must start with a letter or number and contain only letters, numbers, . _ -`);
  if (RESERVED.has(code.toLowerCase())) problems.push(`"${code}" — reserved name`);
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error();
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error();
  } catch {
    problems.push(`"${code}" — destination must be a valid absolute HTTP or HTTPS URL`);
  }

  const key = code.toLowerCase();
  if (seen.has(key)) problems.push(`"${code}" — collides with "${seen.get(key)}" (codes are matched case-insensitively)`);
  seen.set(key, code);

  links.push({ code, url, title, script: value?.script === true });
}

for (const { code, script } of links) {
  const filename = `${code}.sh`;
  if (script && seen.has(filename.toLowerCase())) {
    problems.push(`"${code}" — launcher "${filename}" collides with code "${seen.get(filename.toLowerCase())}"`);
  }
}

if (problems.length) {
  console.error('Build stopped. Fix these in links.json:');
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
  :root{--bg:#fff;--ink:#1a1d24;--muted:#5d6472;--accent:#0b6e4f}
  @media(prefers-color-scheme:dark){
    :root{--bg:#12151c;--ink:#e6e8ee;--muted:#949cad;--accent:#5fd0a3}
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);padding:clamp(1.5rem,6vw,5rem);
       font:16px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif}
  main{max-width:46rem;margin:0 auto}
  h1{font-size:1.4rem;font-weight:600;letter-spacing:-.01em;margin:0 0 .25rem}
  .sub{color:var(--muted);margin:0 0 2.5rem}
  .code{font:600 .95rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
        color:var(--accent);text-decoration:none;min-width:8rem}
  .code:hover,.code:focus-visible{text-decoration:underline}
  a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
`;

const indexPage = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Short links</title>
<style>${styles}</style>
</head>
<body>
<main>
  <h1>Short links</h1>
  <p class="sub">A simple home for short links.</p>
  <p>Open the full short link you were given to continue to its destination.</p>
</main>
</body>
</html>
`;

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
<main>
  <h1 id="head">Checking that link</h1>
  <p class="sub" id="msg">One moment.</p>
   <p><a class="code" id="home" href="./">Home</a></p>
   <noscript><p>This link could not be found. Enable JavaScript to check for a differently capitalized code.</p></noscript>
</main>
<script>
(async () => {
  const parts = location.pathname.replace(/\\/+$/, '').split('/');
  const seg = parts.pop() || '';
  const base = (parts.join('/') || '') + '/';   // works on user AND project pages
  document.getElementById('home').href = base;
  for (const path of [base + 'links.json', '/links.json']) {
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) continue;
      const map = await res.json();
      const hit = Object.entries(map).find(([c]) => c.toLowerCase() === seg.toLowerCase());
      if (hit) {
        location.replace(typeof hit[1] === 'string' ? hit[1] : hit[1].url);
        return;
      }
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

for (const link of links) {
  await mkdir(join(OUT, link.code), { recursive: true });
  await writeFile(join(OUT, link.code, 'index.html'), redirectPage(link));
  if (link.script) await writeFile(join(OUT, `${link.code}.sh`), scriptLauncher(link));
}

await writeFile(join(OUT, 'index.html'), indexPage());
await writeFile(join(OUT, '404.html'), notFoundPage());
await writeFile(join(OUT, 'links.json'), JSON.stringify(raw, null, 2));
await writeFile(join(OUT, '.nojekyll'), '');
if (cname !== undefined) await writeFile(join(OUT, 'CNAME'), cname);

console.log(`Built ${links.length} short link${links.length === 1 ? '' : 's'} into ${OUT}/`);
