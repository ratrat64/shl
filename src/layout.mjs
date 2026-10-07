export const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// HTML's script parser recognizes </script> even inside a JavaScript string.
export const scriptString = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

export const NAV_ITEMS = [
  { label: 'Links', path: '', key: 'links' },
  { label: 'Guide', path: 'guide/', key: 'guide' }
];

const header = (active, depth) => `<header class="site-head"><div class="wrap head-inner">
 <a class="brand" href="${depth}" data-app-link><span class="brand-slash">/</span>shl<span class="brand-slash">/</span></a>
 <nav class="nav" aria-label="Main navigation">
 ${NAV_ITEMS.map(({ label, path, key }) => `<a href="${depth}${path}" data-app-link data-nav="${key}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
 </nav><button class="theme-toggle" type="button" aria-label="Change color theme">Theme: system</button></div></header>`;

const footer = (depth) => `<footer class="footer"><div class="wrap"><p>shl</p><p><a href="${depth}guide/" data-app-link>Guide</a> · <a href="https://github.com/ratrat64/shortlink#readme">Repository</a></p></div></footer>`;

export const page = (title, active, depth, content) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><title>${esc(title)} · shl</title>
<link rel="stylesheet" href="${depth}assets/site.css"><script src="${depth}assets/theme.js" defer></script><script src="${depth}assets/search.js" defer></script><script src="${depth}assets/copy.js" defer></script><script src="${depth}assets/navigation.js" defer></script></head>
<body${active === 'links' ? ' class="directory-page"' : ''}>${header(active, depth)}
<main class="wrap" data-app-page="${active}">${content}</main>
${footer(depth)}
</body></html>`;
