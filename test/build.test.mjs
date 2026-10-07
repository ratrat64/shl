import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createContext, runInContext, runInNewContext } from 'node:vm';

const buildScript = fileURLToPath(new URL('../build.mjs', import.meta.url));

async function fixture(t, links, source = 'links.json') {
  const cwd = await mkdtemp(join(tmpdir(), 'shortlink-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, source), source === 'links.json' ? JSON.stringify(links) : links);
  return {
    cwd,
    build: () => spawnSync(process.execPath, [buildScript], { cwd, encoding: 'utf8' }),
    read: (path) => readFile(join(cwd, 'dist', path), 'utf8'),
  };
}

const scripts = (html) => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

test('build produces a minimal site, copies the map and CNAME, and cleans stale output', async (t) => {
  const links = { Mixed: { url: 'https://example.com/path', title: 'Example' }, plain: 'http://example.org/' };
  const f = await fixture(t, links);
  await writeFile(join(f.cwd, 'CNAME'), 'go.example.com\n');
  await mkdir(join(f.cwd, 'dist'));
  await writeFile(join(f.cwd, 'dist', 'stale.html'), 'old');
  const result = f.build();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(await f.read('links.json')), links);
  assert.equal(await f.read('CNAME'), 'go.example.com\n');
  assert.equal(await f.read('.nojekyll'), '');
  await assert.rejects(f.read('stale.html'), { code: 'ENOENT' });
  assert.match(await f.read('index.html'), /href="\.\/Mixed\/" title="Example">Mixed<\/a>/);
  assert.match(await f.read('index.html'), /data-title="Example"/);
  assert.match(await f.read('Mixed/index.html'), /http-equiv="refresh"/);
  assert.match(await f.read('plain/index.html'), /http:\/\/example.org\//);
});

test('YAML sources generate the same site and public JSON map as JSON', async (t) => {
  const links = { gh: 'https://github.com/', Run: { url: 'https://example.com/setup.sh', title: 'Setup #1', script: true, hidden: true, tags: ['setup', 'shell'] } };
  const yaml = `gh: https://github.com/
Run:
  url: https://example.com/setup.sh
  title: 'Setup #1'
  script: true
  hidden: true
  tags: [setup, shell]
`;
  const json = await fixture(t, links);
  assert.equal(json.build().status, 0);
  for (const source of ['links.yaml', 'links.yml']) {
    const f = await fixture(t, yaml, source);
    const result = f.build();
    assert.equal(result.status, 0, result.stderr);
    for (const path of ['links.json', '404.html', 'Run/index.html', 'Run.sh', 'index.html']) {
      assert.equal(await f.read(path), await json.read(path), `${source}: ${path}`);
    }
    assert.doesNotMatch(await f.read('index.html'), /Simple by design|Good links/);
    assert.match(await f.read('guide/index.html'), new RegExp(`<code>${source.replace('.', '\\.')}<\\/code>`));
    assert.deepEqual(JSON.parse(await f.read('links.json')), links);
  }
});

test('missing, conflicting, malformed, or invalid YAML input preserves the prior build', async (t) => {
  const f = await fixture(t, 'Run:\n  url: https://example.com/setup.sh\n', 'links.yaml');
  await mkdir(join(f.cwd, 'dist'));
  await writeFile(join(f.cwd, 'dist', 'marker'), 'preserved');
  const fails = (pattern) => {
    const result = f.build();
    assert.equal(result.status, 1);
    assert.match(result.stderr, pattern);
  };
  await writeFile(join(f.cwd, 'links.json'), '{}');
  fails(/expected exactly one.*links\.json, links\.yaml/);
  await unlink(join(f.cwd, 'links.json'));
  await writeFile(join(f.cwd, 'links.yml'), '{}');
  fails(/expected exactly one.*links\.yaml, links\.yml/);
  await unlink(join(f.cwd, 'links.yml'));
  for (const [value, pattern] of [
    ['Run: [', /Fix links\.yaml/],
    ['Run: https://example.com/\nRun: https://example.org/\n', /unique|duplicate/i],
    ['Run:\n  url: https://example.com/\n  script: yes\n', /script must be a boolean/],
    ['Run:\n  url: https://example.com/\n  hidden: yes\n', /hidden must be a boolean/],
    ['Run:\n  url: https://example.com/\n  tags: [ok, " "]\n', /tags must be an array of nonblank strings/],
    ['- https://example.com/\n', /expected an object mapping/],
    ['!!set {Run: null}\n', /expected an object mapping/],
    ['tools: &tools\n  again: *tools\n', /directory cannot contain itself/],
  ]) {
    await writeFile(join(f.cwd, 'links.yaml'), value);
    fails(pattern);
    assert.equal(await f.read('marker'), 'preserved');
  }
  await unlink(join(f.cwd, 'links.yaml'));
  fails(/expected exactly one.*none/);
  assert.equal(await f.read('marker'), 'preserved');
});

test('homepage lists sorted links safely with project-relative URLs and handles an empty map', async (t) => {
  const url = 'https://example.com/?q=<img>&x="quoted"';
  const f = await fixture(t, { zebra: url, Alpha: { url, title: '<script>title</script>' }, beta: { url, title: '' } });
  assert.equal(f.build().status, 0);
  const html = await f.read('index.html');
  const codes = [...html.matchAll(/class="code" href="([^"]+)"(?: title="[^"]*")?>([^<]+)<\/a>/g)];
  assert.deepEqual(codes.map((match) => match[2]), ['Alpha', 'beta', 'zebra']);
  for (const [, href, code] of codes) {
    for (const prefix of ['/', '/project/']) {
      assert.equal(new URL(href, `https://example.org${prefix}`).pathname, `${prefix}${code}/`);
    }
  }
  assert.match(html, /&lt;script&gt;title&lt;\/script&gt;/);
  assert.match(html, /https:\/\/example\.com\/\?q=&lt;img&gt;&amp;x=&quot;quoted&quot;/);
  assert.doesNotMatch(html, /<script>title|<img|undefined/);
  assert.match(html, /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">3<\/span><span class="count-label"> links<\/span><\/h1>/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.doesNotMatch(html, /<h[1-6]>Links<\/h[1-6]>|data-visible=|data-total=/);
  assert.match(html, /<ul class="links">[\s\S]*href="\.\/Alpha\/"/); // Browsable before scripts run.
  const empty = await fixture(t, {});
  assert.equal(empty.build().status, 0);
  const emptyHtml = await empty.read('index.html');
  assert.match(emptyHtml, /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">0<\/span><span class="count-label"> links<\/span><\/h1>/);
  assert.equal([...emptyHtml.matchAll(/<h1\b/g)].length, 1);
  assert.match(emptyHtml, /id="hidden-toggle"[^>]*disabled>Show hidden links/);
  assert.match(emptyHtml, /No links available yet\./);
});

test('nested JSON and YAML build themed directory pages and redirects', async (t) => {
  const links = { tools: { git: 'https://git-scm.com/', editors: { Code: { url: 'https://example.org/?x=<img>&q="', title: '<Editor>' } } }, gh: 'https://github.com/' };
  const f = await fixture(t, links);
  assert.equal(f.build().status, 0);
  const home = await f.read('index.html');
  assert.match(home, /<details><summary><a href="\.\/tools\/" data-app-link>tools<\/a><\/summary>/);
  assert.match(home, /href="\.\/tools\/editors\/Code\/" title="&lt;Editor&gt;">Code<\/a>/);
  assert.match(home, /data-title="&lt;Editor&gt;"/);
  assert.match(home, /class="link-row" title="&lt;Editor&gt;"/);
  assert.doesNotMatch(home, /<img>/);
  const tools = await f.read('tools/index.html');
  assert.match(tools, /href="\.\.\/assets\/site\.css"/);
  for (const page of [home, tools]) assert.match(page, /<div class="directory-toggles"><button id="hidden-toggle"[^>]*disabled>Show hidden links<\/button><\/div>/);
  assert.match(home, /<div class="breadcrumbs" aria-hidden="true"><\/div>/);
  assert.match(tools, /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">2<\/span><span class="count-label"> links<\/span><\/h1>/);
  assert.equal([...tools.matchAll(/<h1\b/g)].length, 1);
  assert.doesNotMatch(tools, /<h1>tools<\/h1>/);
  assert.match(tools, /<nav class="breadcrumbs" aria-label="Breadcrumb">.*Home<\/a> \/ tools<\/nav>/);
  assert.match(tools, /href="\.\/git\/">git<\/a>/);
  assert.match(tools, /<summary><a href="\.\/editors\/" data-app-link>editors<\/a><\/summary>/);
  assert.ok(tools.indexOf('class="directory-tools"') < tools.indexOf('class="breadcrumbs"'));
  const editors = await f.read('tools/editors/index.html');
  assert.match(editors, /href="\.\.\/\.\.\/assets\/site\.css"/);
  assert.match(editors, /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">1<\/span><span class="count-label"> link<\/span><\/h1>/);
  assert.equal([...editors.matchAll(/<h1\b/g)].length, 1);
  assert.match(editors, /href="\.\.\/\.\.\/" data-app-link>Home<\/a>/);
  assert.match(editors, /href="\.\.\/" data-app-link>tools<\/a>/);
  assert.match(editors, /href="\.\/Code\/" title="&lt;Editor&gt;">Code<\/a>/);
  assert.match(editors, /class="link-row" title="&lt;Editor&gt;"/);
  for (const prefix of ['/', '/project/']) {
    assert.equal(new URL('./tools/editors/Code/', `https://example.org${prefix}`).pathname, `${prefix}tools/editors/Code/`);
  }
  assert.match(await f.read('tools/git/index.html'), /https:\/\/git-scm\.com\//);
  assert.match(await f.read('tools/editors/Code/index.html'), /&lt;img&gt;/);
  const css = await f.read('assets/site.css');
  assert.doesNotMatch(css, /\.links li\{[^}]*border-bottom|\.links \.links\{[^}]*border-left/);
  assert.match(css, /\.directory-page \.site-head,\.directory-page \.footer\{border:0\}/);
  assert.match(css, /\.footer\{border-top:1px solid var\(--line\)/);
  assert.match(css, /\.prose section\{border-top:1px solid var\(--line\)/);
  assert.match(css, /\.code\{[^}]*white-space:nowrap/);
  assert.match(css, /\.destination-start\{[^}]*text-overflow:ellipsis/);
  assert.deepEqual(JSON.parse(await f.read('links.json')), links);
  const yaml = await fixture(t, 'tools:\n  git: https://git-scm.com/\n  editors:\n    Code:\n      url: https://example.org/?x=<img>&q="\n      title: <Editor>\ngh: https://github.com/\n', 'links.yaml');
  assert.equal(yaml.build().status, 0);
  for (const path of ['links.json', 'tools/editors/Code/index.html']) {
    assert.equal(await yaml.read(path), await f.read(path), path);
  }
  assert.match(await yaml.read('tools/editors/index.html'), /href="\.\/Code\/" title="&lt;Editor&gt;">Code<\/a>/);
});

for (const prefix of ['/', '/project/']) test(`app navigation swaps pages, handles sections/history, mounts controls, and preserves native actions at ${prefix}`, async (t) => {
  const f = await fixture(t, { tools: { git: 'https://git-scm.com/', editors: { Code: 'https://example.org/' } }, hidden: { secret: { url: 'https://example.org/private', hidden: true } } });
  assert.equal(f.build().status, 0);
  const emptySite = await fixture(t, {});
  assert.equal(emptySite.build().status, 0);
  const base = `https://short.example${prefix}`;
  const pages = new Map(await Promise.all(['', 'guide/', 'tools/', 'tools/editors/', 'hidden/', 'tools/git/'].map(async (path) =>
    [`${base}${path}`, await f.read(`${path}index.html`)])));
  assert.match(pages.get(base), /src="\.\/assets\/navigation\.js"/);
  assert.match(pages.get(base + 'tools/'), /src="\.\.\/assets\/navigation\.js"/);
  assert.match(await f.read('guide/index.html'), /navigation\.js/);

  const location = {
    href: base + 'guide/#about',
    get pathname() { return new URL(this.href).pathname; },
    get origin() { return new URL(this.href).origin; },
    assign(url) { this.assigned = url; },
  };
  const makeLink = (href, base, app = true) => ({
    app, dataset: {},
    raw: href,
    get href() { return new URL(this.raw, base || location.href).href; },
    set href(value) { this.raw = value; },
    get pathname() { return new URL(this.href).pathname; },
    get origin() { return new URL(this.href).origin; },
    getAttribute() { return this.raw; },
    hasAttribute(name) { return name === 'download' && !!this.download; },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
  });
  const anchors = (html, url) => [...html.matchAll(/<a\b([^>]*)>/g)].map((match) => {
    const attributes = Object.fromEntries([...match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((attribute) => [attribute[1], attribute[2] ?? '']));
    const link = makeLink(attributes.href, url, 'data-app-link' in attributes);
    link.dataset = Object.fromEntries(Object.entries(attributes).filter(([name]) => name.startsWith('data-')).map(([name, value]) => [name.slice(5), value]));
    link.hasAttribute = (name) => name in attributes;
    for (const name of ['class', 'target', 'aria-current']) if (name in attributes) link[name] = attributes[name];
    return link;
  });
  const main = (html, url) => {
    const content = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
    const links = anchors(content, url);
    const heading = content.includes('<h1') ? { focus(options) { this.focused = options.preventScroll; } } : null;
    const ids = [...content.matchAll(/id="([^"]+)"/g)].map((match) => ({ id: match[1], focus(options) { this.focused = options.preventScroll; }, scrollIntoView() { this.scrolled = true; window.scrollY = 400; } }));
    const control = (extra = {}) => ({
      handlers: new Map(), ...extra,
      addEventListener(name, callback) { const handlers = this.handlers.get(name) || []; handlers.push(callback); this.handlers.set(name, handlers); },
      removeEventListener(name, callback) { this.handlers.set(name, this.handlers.get(name).filter((handler) => handler !== callback)); },
      setAttribute(name, value) { this[name] = value; },
    });
    const elements = {};
    if (content.includes('id="link-search"')) {
      elements['#link-search'] = control({ value: '', parentElement: { hidden: true } });
      elements['#search-status'] = { textContent: '', hidden: true };
      elements['#copy-status'] = { textContent: '' };
      elements['#link-count'] = { textContent: '' };
      elements['#hidden-toggle'] = control({ disabled: /id="hidden-toggle"[^>]*disabled/.test(content), hidden: true });
      if (content.includes('id="empty-directory"')) elements['#empty-directory'] = { hidden: false };
      const children = [...content.matchAll(/<li([^>]*)><div class="link-row/g)].map((match) => ({
        dataset: { search: match[1].match(/data-search="([^"]*)"/)?.[1], ...(match[1].includes('data-hidden') ? { hidden: 'true' } : {}) },
        firstElementChild: { tagName: 'DIV' },
      }));
      elements['.links'] = control({ children, parentElement: { hidden: !!elements['#empty-directory'] } });
    }
    return {
      links, heading, ids, elements, dataset: { appPage: html.match(/data-app-page="([^"]+)"/)?.[1] },
      querySelectorAll(selector) {
        if (selector === 'script') return [{ remove() { document.scriptsRemoved++; } }];
        if (selector === '[id]') return ids;
        return links;
      },
      querySelector(selector) { return selector === 'h1' ? heading : elements[selector] || null; },
      replaceWith(next) { document.currentMain = next; },
    };
  };
  const entryHtml = pages.get(base + 'guide/');
  const headerHtml = entryHtml.match(/<header\b[^>]*>[\s\S]*?<\/header>/)[0];
  const footerHtml = entryHtml.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)[0];
  const headerLinks = anchors(headerHtml, location.href);
  const footerLinks = anchors(footerHtml, location.href);
  const shellLinks = [...headerLinks, ...footerLinks];
  const hasClass = (html, name) => html.match(/^<\w+\b[^>]*class="([^"]*)"/)?.[1].split(/\s+/).includes(name);
  const persistentLinks = [...(hasClass(headerHtml, 'site-head') ? headerLinks : []), ...(hasClass(footerHtml, 'footer') ? footerLinks : [])];
  const brand = headerLinks.find((link) => link.class === 'brand');
  const guide = headerLinks.find((link) => link.dataset.nav === 'guide');
  const linksNav = headerLinks.find((link) => link.dataset.nav === 'links');
  const footerGuide = footerLinks.find((link) => link.app);
  assert.ok(brand?.app && guide?.app && linksNav?.app && footerGuide?.app, 'generated shell links carry app markers and navigation keys');
  const themeButton = { addEventListener(name, callback) { this[name] = callback; } };
  const listeners = {};
  const document = {
    title: entryHtml.match(/<title>([^<]+)<\/title>/)[1], scriptsRemoved: 0,
    body: { classList: { toggle(name, on) { document.directory = on; } } },
    documentElement: { dataset: {} },
    currentMain: main(pages.get(base + 'guide/'), location.href),
    querySelector(selector) { return selector === '.theme-toggle' ? themeButton : selector === '.brand' ? brand : selector === 'main' ? this.currentMain : this.currentMain.querySelector(selector); },
    querySelectorAll(selector) { return selector === '[data-nav]' ? shellLinks.filter((link) => link.hasAttribute('data-nav')) : selector === '.site-head a, .footer a' ? persistentLinks : []; },
    addEventListener(name, callback) { listeners[name] = callback; },
  };
  const history = {
    pushState(_state, _unused, url) { location.href = url; this.pushed = (this.pushed || 0) + 1; },
  };
  const window = { scrollY: 0, addEventListener(name, callback) { listeners[name] = callback; }, scrollTo(options) { this.scrollY = options.top; this.scrollBehavior = options.behavior; } };
  let heldUrl, release;
  const fetched = [];
  const fetchOverrides = new Map();
  const fetch = async (url, options) => {
    fetched.push(url);
    assert.ok(options.signal instanceof AbortSignal);
    if (fetchOverrides.has(url)) return fetchOverrides.get(url)(options.signal);
    if (url === heldUrl) await new Promise((resolve) => { release = resolve; });
    return { ok: pages.has(url), text: async () => pages.get(url) };
  };
  class DOMParser {
    parseFromString(html) {
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
      const url = [...pages].find(([, page]) => page === html)?.[0];
      return { querySelector: (selector) => selector === 'title' ? title && { textContent: title } : selector === 'main[data-app-page]' && html.includes('data-app-page=') ? main(html, url) : null };
    }
  }
  const copied = [];
  const timers = new Map();
  let timer = 0;
  let shortTimeout = false;
  const context = createContext({ document, location, history, window, fetch, DOMParser, URL,
    AbortSignal: { timeout(ms) { assert.equal(ms, 10000); return AbortSignal.timeout(shortTimeout ? 10 : ms); } },
    localStorage: { getItem: () => 'dark' },
    navigator: { clipboard: { writeText: async (text) => copied.push(text) } },
    clearTimeout: (id) => timers.delete(id), setTimeout: (callback) => { timers.set(++timer, callback); return timer; } });
  const assetOrder = [];
  for (const tag of entryHtml.matchAll(/<script\b([^>]*)><\/script>/g)) {
    assert.match(tag[1], /\bdefer\b/);
    const src = tag[1].match(/src="([^"]+)"/)[1];
    const asset = new URL(src, location.href).href.slice(base.length);
    assetOrder.push(asset);
    runInContext(await f.read(asset), context);
  }
  assert.deepEqual(assetOrder, ['assets/theme.js', 'assets/search.js', 'assets/copy.js', 'assets/navigation.js']);
  assert.equal(themeButton.textContent, 'Theme: dark');
  assert.equal(typeof themeButton.click, 'function');
  assert.equal(brand.href, base);
  assert.equal(guide.href, base + 'guide/');
  assert.equal(history.scrollRestoration, 'manual');
  assert.equal(document.currentMain.ids.find((id) => id.id === 'about').focused, true);
  assert.equal(fetched.length, 0);

  const click = async (link, options = {}) => {
    let prevented = false;
    listeners.click({ button: 0, defaultPrevented: false, target: { closest: (selector) => selector === 'a[data-app-link]' && link?.app ? link : null }, preventDefault() { prevented = true; }, ...options });
    await new Promise((resolve) => setImmediate(resolve));
    return prevented;
  };
  const folder = (suffix) => document.currentMain.links.find((link) => link.href.endsWith(suffix));
  assert.equal(await click(brand), true);
  assert.equal(document.title, 'Links · shl');
  history.pushed = 0;
  assert.equal(await click(null), false); // Redirect and destination links remain native.
  assert.equal(await click(folder('/tools/'), { ctrlKey: true }), false);
  assert.equal(await click(folder('/tools/')), true);
  assert.equal(location.pathname, prefix + 'tools/');
  assert.equal(document.title, 'tools · shl');
  assert.equal(document.currentMain.heading.focused, true);
  assert.equal(folder('/tools/git/').href, base + 'tools/git/');
  assert.equal(guide.href, base + 'guide/');
  assert.equal(document.currentMain.elements['#link-search'].handlers.get('input').length, 1);
  assert.equal(document.currentMain.elements['.links'].handlers.get('click').length, 1);
  window.scrollY = 250;
  assert.equal(await click(folder('/tools/editors/')), true);
  assert.equal(history.pushed, 2);
  assert.equal(location.pathname, prefix + 'tools/editors/');
  assert.equal(window.scrollY, 0);
  heldUrl = base + 'tools/';
  location.href = heldUrl;
  listeners.popstate();
  location.href = base + 'tools/editors/';
  listeners.popstate();
  release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(document.title, 'editors · shl'); // A late Back response cannot replace the Forward page.
  heldUrl = null;
  location.href = base + 'tools/';
  listeners.popstate();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(document.title, 'tools · shl');
  assert.equal(window.scrollY, 250);
  assert.equal(window.scrollBehavior, 'instant');
  location.href = base;
  listeners.popstate();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(document.title, 'Links · shl');
  assert.equal(await click(folder('/hidden/')), true);
  const controls = document.currentMain.elements;
  assert.equal(controls['#link-search'].handlers.get('input').length, 1);
  assert.equal(controls['#hidden-toggle'].handlers.get('click').length, 1);
  assert.equal(controls['.links'].handlers.get('click').length, 1);
  controls['#hidden-toggle'].handlers.get('click')[0]();
  assert.equal(controls['#hidden-toggle']['aria-pressed'], 'true');
  assert.equal(controls['#link-count'].textContent, '1 link');
  controls['#link-search'].value = 'missing';
  controls['#link-search'].handlers.get('input')[0]();
  assert.equal(controls['#link-count'].textContent, '0 links');
  const copyLink = { href: base + 'hidden/secret/', hasAttribute: () => false, classList: { contains: () => true } };
  await controls['.links'].handlers.get('click')[0]({ button: 0, target: { closest: () => copyLink }, preventDefault() {} });
  assert.equal(copied.length, 1);
  assert.equal(timers.size, 1);
  assert.equal(await click(footerGuide), true);
  assert.equal(timers.size, 0);
  assert.equal(controls['#copy-status'].textContent, '');
  assert.equal(controls['.links'].handlers.get('click').length, 0);
  assert.equal(document.title, 'Guide · shl');
  assert.equal(document.directory, false);
  assert.equal(guide['aria-current'], 'page');
  assert.equal(linksNav['aria-current'], undefined);
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(footerGuide.href, base + 'guide/');
  const guideMain = document.currentMain;
  const beforeSections = fetched.length;
  assert.equal(await click(folder('#how-to-use')), true);
  assert.equal(location.href, base + 'guide/#how-to-use');
  assert.equal(guideMain.ids.find((id) => id.id === 'how-to-use').focused, true);
  window.scrollY = 550;
  assert.equal(await click(folder('#about')), true);
  location.href = base + 'guide/#how-to-use';
  listeners.popstate();
  assert.equal(window.scrollY, 550);
  assert.equal(window.scrollBehavior, 'instant');
  assert.equal(document.currentMain, guideMain);
  assert.equal(fetched.length, beforeSections);
  assert.equal(await click(makeLink(base + 'guide/#missing')), true);
  assert.equal(guideMain.heading.focused, true);
  assert.equal(await click(guide), true); // Current route without fragment returns to top.
  assert.equal(window.scrollY, 0);
  heldUrl = base + 'tools/';
  const pending = click(makeLink(heldUrl));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(await click(guide), true); // Same-route click invalidates the fetch.
  release();
  await pending;
  assert.equal(document.currentMain, guideMain);
  heldUrl = null;
  assert.equal(await click(makeLink(base + 'hidden/')), true);
  assert.equal(document.directory, true);
  assert.equal(linksNav['aria-current'], 'page');
  assert.equal(document.currentMain.elements['#link-search'].value, '');
  assert.equal(document.currentMain.elements['#empty-directory'].hidden, false);
  assert.equal(await click(makeLink(base + 'guide/#how-it-works')), true);
  assert.equal(document.currentMain.ids.find((id) => id.id === 'how-it-works').scrolled, true);
  const beforeNative = fetched.length;
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) assert.equal(await click(brand, options), false);
  for (const attrs of [{ target: '_blank' }, { download: true }]) assert.equal(await click(Object.assign(makeLink(base), attrs)), false);
  for (const link of [makeLink(base + 'tools/git/', undefined, false), makeLink('https://example.org/', undefined, false), makeLink(base + 'tools/git.sh', undefined, false)]) assert.equal(await click(link), false);
  assert.equal(fetched.length, beforeNative);
  assert.ok(document.scriptsRemoved > 0);
  assert.equal(await click(makeLink(base + 'tools/git/')), true);
  assert.equal(location.assigned, base + 'tools/git/'); // A redirect page is never injected.
  pages.delete(base + 'tools/');
  assert.equal(await click(makeLink(base + 'tools/')), true);
  assert.equal(location.assigned, base + 'tools/');
  assert.equal(await click(makeLink('https://other.example/tools/')), false);
  pages.set(base, await emptySite.read('index.html'));
  assert.equal(await click(brand), true);
  assert.equal(document.title, 'Links · shl');
  assert.equal(document.currentMain.elements['#link-search'], undefined);
  assert.equal(await click(makeLink(base + 'hidden/')), true);
  assert.equal(document.currentMain.elements['#hidden-toggle'].handlers.get('click').length, 1);
  assert.equal(await click(brand), true);
  assert.equal(await click(guide), true);
  assert.equal(await click(makeLink(base + 'hidden/')), true);
  assert.equal(document.currentMain.elements['.links'].handlers.get('click').length, 1);

  const tick = () => new Promise((resolve) => setImmediate(resolve));
  pages.set(base + 'tools/', await f.read('tools/index.html'));
  const response = (path) => ({ ok: true, text: async () => pages.get(base + path) });
  const deferFetch = (url) => {
    let resolve, reject;
    fetchOverrides.set(url, () => new Promise((yes, no) => { resolve = yes; reject = no; }));
    return { resolve: (value) => resolve(value), reject: (error) => reject(error) };
  };
  // Two distinct clicks complete in reverse order; only the newest may commit.
  const first = deferFetch(base + 'tools/');
  const second = deferFetch(base + 'guide/');
  await click(makeLink(base + 'tools/'));
  await click(guide);
  second.resolve(response('guide/'));
  await tick();
  const winner = document.currentMain;
  const pushed = history.pushed;
  location.assigned = undefined;
  first.resolve(response('tools/'));
  await tick();
  assert.equal(document.currentMain, winner);
  assert.equal(location.href, base + 'guide/');
  assert.equal(history.pushed, pushed);
  assert.equal(location.assigned, undefined);
  fetchOverrides.delete(base + 'guide/');
  // A superseded request rejecting must not perform a native fallback either.
  const stale = deferFetch(base + 'tools/');
  await click(makeLink(base + 'tools/'));
  await click(makeLink(base + 'hidden/'));
  const newer = document.currentMain;
  const newerPushed = history.pushed;
  stale.reject(new Error('stale fetch failed'));
  await tick();
  assert.equal(document.currentMain, newer);
  assert.equal(location.href, base + 'hidden/');
  assert.equal(history.pushed, newerPushed);
  assert.equal(location.assigned, undefined);
  fetchOverrides.delete(base + 'tools/');

  // Save scrolling done while the fetch was in flight, just before replacement.
  await click(guide);
  const slow = deferFetch(base + 'tools/');
  window.scrollY = 180;
  await click(makeLink(base + 'tools/'));
  window.scrollY = 360;
  slow.resolve(response('tools/'));
  await tick();
  location.href = base + 'guide/';
  listeners.popstate();
  await tick();
  assert.equal(window.scrollY, 360);
  assert.equal(window.scrollBehavior, 'instant');
  fetchOverrides.delete(base + 'tools/');

  const valid = pages.get(base + 'hidden/');
  for (const [name, html] of [
    ['missing-title', valid.replace(/<title>[\s\S]*?<\/title>/, '')],
    ['missing-heading', valid.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, '')],
    ['unsupported-marker', valid.replace('data-app-page="links"', 'data-app-page="redirect"')],
  ]) {
    const url = base + name + '/';
    pages.set(url, html);
    const before = document.currentMain;
    const beforePushed = history.pushed;
    await click(makeLink(url));
    assert.equal(location.assigned, url);
    assert.equal(document.currentMain, before);
    assert.equal(history.pushed, beforePushed);
  }
  const aborted = (signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  for (const [name, handler, timed] of [
    ['fetch-timeout', (signal) => aborted(signal), true],
    ['body-timeout', (signal) => ({ ok: true, text: () => aborted(signal) }), true],
    ['fetch-rejection', () => { throw new Error('network rejected'); }, false],
    ['body-rejection', () => ({ ok: true, text: async () => { throw new Error('body rejected'); } }), false],
  ]) {
    const url = base + name + '/';
    fetchOverrides.set(url, handler);
    shortTimeout = timed;
    location.assigned = undefined;
    const before = document.currentMain;
    const beforePushed = history.pushed;
    await click(makeLink(url));
    if (timed) await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(location.assigned, url, name + ' uses native navigation');
    assert.equal(document.currentMain, before);
    assert.equal(history.pushed, beforePushed);
  }
});

test('hidden links and hidden-only folders are hidden by default but keep their resources', async (t) => {
  const links = {
    visible: 'https://example.com/visible',
    shown: { url: 'https://example.com/shown', hidden: false },
    secret: { url: 'https://example.com/secret', hidden: true, script: true },
    tools: {
      public: 'https://example.com/public',
      private: { deep: { SecretCode: { url: 'https://example.com/deep', hidden: true } } },
      nested: {
        hiddenOnly: { HiddenDeep: { url: 'https://example.com/hidden-deep', hidden: true } },
        branch: { further: { VisibleDeep: 'https://example.com/visible-deep' } },
      },
    },
    onlyHidden: { nested: { OtherSecret: { url: 'https://example.com/other', hidden: true } } },
  };
  const f = await fixture(t, links);
  assert.equal(f.build().status, 0);
  for (const page of ['index.html', 'tools/index.html']) {
    const html = await f.read(page);
    assert.match(html, /<div class="directory-toggles"><button id="hidden-toggle"/);
    assert.match(html, /id="hidden-toggle"[^>]*aria-pressed="false" hidden>Show hidden links/);
    assert.doesNotMatch(html, /data-visible=|data-total=/);
    assert.match(html, /<li data-hidden="true" hidden><details><summary><a href="\.\/.*(?:private|hiddenOnly|onlyHidden)\/" data-app-link>/);
    assert.match(html, /<li data-hidden="true" hidden data-search="[^"]+"><div class="link-row"[^>]*><a class="code[^>]* href="\.\/.*(?:secret|SecretCode|HiddenDeep)\/"/);
  }
  const home = await f.read('index.html');
  assert.match(home, /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">4<\/span><span class="count-label"> links<\/span><\/h1>/);
  assert.match(home, /href="\.\/tools\/nested\/" data-app-link>nested<\/a>/);
  assert.match(home, /href="\.\/tools\/nested\/branch\/further\/VisibleDeep\/">VisibleDeep<\/a>/);
  assert.match(home, /href="\.\/shown\/">shown<\/a>/);
  assert.match(home, /href="\.\/visible\/">visible<\/a>/);
  assert.match(home, /href="\.\/tools\/public\/">public<\/a>/);
  assert.match(await f.read('tools/index.html'), /href="\.\/public\/">public<\/a>/);
  assert.match(await f.read('tools/index.html'), /href="\.\/nested\/" data-app-link>nested<\/a>/);
  assert.match(await f.read('tools/nested/index.html'), /href="\.\/branch\/" data-app-link>branch<\/a>/);
  assert.match(await f.read('tools/nested/index.html'), /<li data-hidden="true" hidden><details><summary><a href="\.\/hiddenOnly\/" data-app-link>hiddenOnly/);
  assert.match(await f.read('tools/nested/branch/index.html'), /href="\.\/further\/" data-app-link>further<\/a>/);
  assert.match(await f.read('tools/nested/branch/further/index.html'), /href="\.\/VisibleDeep\/">VisibleDeep<\/a>/);
  for (const page of ['onlyHidden/index.html', 'onlyHidden/nested/index.html', 'tools/private/index.html', 'tools/private/deep/index.html']) {
    const html = await f.read(page);
    assert.match(html, /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">0<\/span><span class="count-label"> links<\/span><\/h1>/);
    assert.match(html, /<p id="empty-directory">No links listed here\.<\/p>/);
    assert.match(html, /<div hidden><ul class="links">/);
    assert.match(html, /id="hidden-toggle"[^>]*hidden>Show hidden links/);
    assert.match(html, /id="link-search"/);
  }
  assert.match(await f.read('secret/index.html'), /https:\/\/example\.com\/secret/);
  assert.match(await f.read('tools/private/deep/SecretCode/index.html'), /https:\/\/example\.com\/deep/);
  assert.match(await f.read('secret.sh'), /curl -fsSL/);
  assert.deepEqual(JSON.parse(await f.read('links.json')), links);

  const allHidden = await fixture(t, { private: { nested: { code: { url: 'https://example.com/', hidden: true } } } });
  assert.equal(allHidden.build().status, 0);
  assert.match(await allHidden.read('index.html'), /No links listed here\./);
  assert.match(await allHidden.read('index.html'), /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">0<\/span><span class="count-label"> links<\/span><\/h1>/);
  assert.match(await allHidden.read('index.html'), /<li data-hidden="true" hidden><details><summary><a href="\.\/private\/" data-app-link>/);
  assert.match(await allHidden.read('private/nested/index.html'), /No links listed here\./);
  assert.match(await allHidden.read('private/nested/code/index.html'), /https:\/\/example\.com/);
});

test('long destinations keep their trailing path beside single-line short codes', async (t) => {
  const url = 'https://raw.githubusercontent.com/ratrat64/homelab-public/refs/heads/main/scripts/ubuntu/oh-my-posh/setup.sh';
  const f = await fixture(t, { setup: { url, title: 'Install shell prompt' }, plain: url });
  assert.equal(f.build().status, 0);
  const html = await f.read('index.html');
  assert.match(html, /class="link-row" title="Install shell prompt"/);
  assert.match(html, /class="destination" href="https:\/\/raw\.githubusercontent\.com\/ratrat64/);
  assert.match(html, /class="destination"[^>]* title="https:\/\/raw\.githubusercontent\.com\/ratrat64/);
  assert.match(html, /<span class="sr-only">https:\/\/raw\.githubusercontent\.com\/ratrat64/);
  assert.match(html, /class="destination-start" aria-hidden="true">https:\/\/raw\.githubusercontent\.com\/.*\/ubuntu\//);
  assert.match(html, /class="destination-end" aria-hidden="true">oh-my-posh\/setup\.sh<\/span><\/a><a class="visit" href="https:\/\/raw\.githubusercontent\.com\/ratrat64[^>]*>Open<\/a>/);
  assert.doesNotMatch(html, /class="link-title"/);
});

test('directory clicks copy full short or long URLs while Open follows the destination', async (t) => {
  const url = 'https://example.com/a/b/setup.sh?q=<tag>&x=\'"';
  const f = await fixture(t, { tools: { Setup: { url, hidden: true } } });
  assert.equal(f.build().status, 0);
  const script = await f.read('assets/copy.js');
  for (const [page, prefix, shortHref] of [
    ['index.html', '/project/', './tools/Setup/'],
    ['tools/index.html', '/project/tools/', './Setup/'],
  ]) {
    const html = await f.read(page);
    assert.match(html, /id="copy-status"[^>]*role="status"/);
    assert.match(html, new RegExp(`src="${page === 'index.html' ? './' : '../'}assets/copy\\.js"`));
    assert.ok(html.includes(`class="code" href="${shortHref}"`));
    assert.match(html, /class="destination" href="https:\/\/example\.com\/a\/b\/setup\.sh\?q=&lt;tag&gt;&amp;x=&#39;&quot;"/);
    assert.match(html, /class="visit" href="https:\/\/example\.com\/a\/b\/setup\.sh\?q=&lt;tag&gt;&amp;x=&#39;&quot;"[^>]*>Open<\/a>/);

    const copied = [];
    const status = { textContent: '' };
    const list = { addEventListener: (_, listener) => { list.click = listener; } };
    const timers = new Map();
    let nextTimer = 0;
    runInNewContext(script + '\ninitCopy();', {
      document: { querySelector: (selector) => ({ '.links': list, '#copy-status': status })[selector] },
      navigator: { clipboard: { writeText: async (text) => { copied.push(text); } } },
      setTimeout: (callback, delay) => { assert.equal(delay, 5000); timers.set(++nextTimer, callback); return nextTimer; },
      clearTimeout: (id) => timers.delete(id),
    });
    const anchor = (kind, href) => ({
      href: new URL(href, `https://short.example${prefix}`).href,
      classList: { contains: (value) => value === kind },
      getAttribute: () => href,
      hasAttribute: () => false,
    });
    const click = async (target, options = {}) => {
      let prevented = false;
      await list.click({ button: 0, target: { closest: () => target.classList.contains('visit') ? null : target }, preventDefault: () => { prevented = true; }, ...options });
      return prevented;
    };
    assert.equal(await click(anchor('code', shortHref)), true);
    assert.equal(copied.at(-1), 'https://short.example/project/tools/Setup/');
    assert.equal(status.textContent, 'Short link copied.');
    assert.equal(await click(anchor('destination', url)), true);
    assert.equal(copied.at(-1), url);
    assert.equal(status.textContent, 'Destination copied.');
    assert.equal(timers.size, 1);
    timers.values().next().value();
    assert.equal(status.textContent, '');
    assert.equal(await click(anchor('visit', url)), false);
    assert.equal(await click(anchor('code', shortHref), { ctrlKey: true }), false);
    assert.equal(copied.length, 2);
  }

  const status = { textContent: '' };
  const list = { addEventListener: (_, listener) => { list.click = listener; } };
  let dismiss;
  runInNewContext(script + '\ninitCopy();', {
    document: { querySelector: (selector) => ({ '.links': list, '#copy-status': status })[selector] },
    navigator: { clipboard: { writeText: async () => { throw new Error('permission denied'); } } },
    setTimeout: (callback) => { dismiss = callback; }, clearTimeout: () => {},
  });
  let prevented = false;
  await list.click({ button: 0, target: { closest: () => ({ href: 'https://short.example/project/tools/Setup/', classList: { contains: () => true }, hasAttribute: () => false }) }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.match(status.textContent, /Could not copy/);
  dismiss();
  assert.equal(status.textContent, '');

  // A clipboard promise settling after a swap must not resurrect outgoing feedback.
  const pendingStatus = { textContent: '' };
  const pendingList = { addEventListener(_, callback) { this.click = callback; }, removeEventListener(_, callback) { assert.equal(callback, this.click); this.click = null; } };
  let resolveCopy, timerCount = 0;
  const context = {
    document: { querySelector: (selector) => ({ '.links': pendingList, '#copy-status': pendingStatus })[selector] },
    navigator: { clipboard: { writeText: () => new Promise((resolve) => { resolveCopy = resolve; }) } },
    setTimeout: () => { timerCount++; }, clearTimeout() {},
  };
  runInNewContext(script + '\ninitCopy();', context);
  const pendingCopy = pendingList.click({ button: 0, target: { closest: () => ({ href: 'https://short.example/code/', classList: { contains: () => true }, hasAttribute: () => false }) }, preventDefault() {} });
  context.cleanupCopy();
  resolveCopy();
  await pendingCopy;
  assert.equal(pendingStatus.textContent, '');
  assert.equal(timerCount, 0);
  assert.equal(pendingList.click, null);
  runInNewContext(script + '\ninitCopy();', { document: { querySelector: () => null } });
});

test('search filters nested links on the homepage and directory pages', async (t) => {
  const f = await fixture(t, { gh: 'https://github.com/', tools: { git: 'https://git-scm.com/', editors: { Code: { url: 'https://example.org/', title: 'VS Code' } } } });
  assert.equal(f.build().status, 0);
  for (const [page, depth] of [['index.html', './'], ['tools/index.html', '../'], ['tools/editors/index.html', '../../']]) {
    const html = await f.read(page);
    assert.match(html, /<div class="search" hidden>\s*<label class="sr-only" for="link-search">Search links<\/label>\s*<input id="link-search" type="search" placeholder="Search link, title or tag"/);
    assert.match(html, /id="link-count" class="count" aria-live="polite" aria-atomic="true"/);
    assert.match(html, new RegExp(`src="${depth.replaceAll('.', '\\.')}assets/search\\.js"`));
    assert.match(html, /id="search-status"[^>]*role="status" hidden/);
    assert.match(html, /id="hidden-toggle"[^>]*disabled>Show hidden links/);
  }

  const leaf = (text, title = '') => ({ firstElementChild: { tagName: 'DIV' }, textContent: text, dataset: { title }, hidden: false });
  const group = (name, ...children) => {
    const details = { tagName: 'DETAILS', open: false, querySelector: (selector) => selector === 'summary' ? { textContent: name } : { children } };
    return { firstElementChild: details, dataset: {}, hidden: false };
  };
  const gh = leaf('gh https://github.com/ Open');
  gh.dataset.search = 'gh https://github.com/';
  const git = leaf('git https://git-scm.com/');
  const code = leaf('Code https://example.org/', 'VS Code');
  const editors = group('editors', code);
  const tools = group('tools', git, editors);
  const list = { children: [gh, tools] };
  const search = { hidden: true };
  const input = { value: '', parentElement: search, addEventListener: (_, listener) => { input.update = listener; } };
  const status = { hidden: true, textContent: '' };
  const count = { textContent: '3 links' };
  const disabledToggle = { disabled: true, hidden: false, addEventListener() { throw new Error('disabled toggle should not activate'); } };
  const elements = { '#link-search': input, '.links': list, '#search-status': status, '#link-count': count, '#hidden-toggle': disabledToggle };
  runInNewContext(await f.read('assets/search.js') + '\ninitSearch();', { document: { querySelector: () => null } });
  runInNewContext(await f.read('assets/search.js') + '\ninitSearch();', { document: { querySelector: (selector) => selector === '#link-search' ? {} : null } });
  runInNewContext(await f.read('assets/search.js') + '\ninitSearch();', { document: { querySelector: (selector) => elements[selector] } });
  assert.equal(search.hidden, false);
  assert.equal(disabledToggle.hidden, false);

  tools.firstElementChild.open = true; // Preserve directories opened by the visitor.
  input.value = 'vs code';
  input.update();
  assert.equal(status.textContent, '');
  assert.equal(status.hidden, true);
  assert.equal(count.textContent, '1 link');
  assert.equal(code.hidden, false);
  assert.equal(git.hidden, true);
  assert.equal(gh.hidden, true);
  assert.equal(editors.firstElementChild.open, true);

  input.value = 'TOOLS/GIT';
  input.update();
  assert.equal(count.textContent, '1 link');
  assert.equal(git.hidden, false);
  assert.equal(code.hidden, true);
  assert.equal(editors.hidden, true);

  input.value = 'tools';
  input.update();
  assert.equal(status.textContent, '');
  assert.equal(count.textContent, '2 links');
  assert.equal(git.hidden, false);
  assert.equal(code.hidden, false);

  input.value = 'missing';
  input.update();
  assert.equal(status.textContent, 'No links match your search.');
  assert.equal(status.hidden, false);
  assert.equal(count.textContent, '0 links');
  assert.equal(tools.hidden, true);

  input.value = 'open';
  input.update();
  assert.equal(gh.hidden, true);
  assert.equal(count.textContent, '0 links');

  input.value = '';
  input.update();
  assert.equal(status.hidden, true);
  assert.equal(status.textContent, '');
  assert.equal(count.textContent, '3 links');
  assert.equal(gh.hidden, false);
  assert.equal(editors.firstElementChild.open, false);
  assert.equal(tools.firstElementChild.open, true);
});

test('tags are displayed safely and searchable on home and nested pages without revealing hidden links', async (t) => {
  const links = {
    tools: {
      manual: { url: 'https://example.com/guide', tags: ['How To', '<img src=x onerror=alert(1)>'] },
      editor: { url: 'https://example.com/editor', tags: [' editor '] },
      private: { url: 'https://example.com/private', tags: ['How To'], hidden: true },
    },
    other: 'https://example.com/other',
  };
  const f = await fixture(t, links);
  const build = f.build();
  assert.equal(build.status, 0, build.stderr);
  assert.deepEqual(JSON.parse(await f.read('links.json')), links);
  for (const page of ['index.html', 'tools/index.html']) {
    const html = await f.read(page);
    assert.match(html, /data-search="manual https:\/\/example\.com\/guide How To &lt;img src=x onerror=alert\(1\)&gt; #How To #&lt;img src=x onerror=alert\(1\)&gt;"/);
    assert.match(html, /class="tags">#How To · #&lt;img src=x onerror=alert\(1\)&gt;<\/span>/);
    assert.match(html, /class="tags">#editor<\/span>/);
    assert.doesNotMatch(html, /<img/);
    const rows = [...html.matchAll(/<li([^>]*)><div class="link-row"[^>]*>[\s\S]*?<\/div>(?:<span class="tags">[\s\S]*?<\/span>)?<\/li>/g)];
    const leaf = (code) => {
      const [, attributes] = rows.find(([, attributes]) => attributes.includes(`data-search="${code} `)) || [];
      assert.ok(attributes, `missing ${code} on ${page}`);
      const searchValue = attributes.match(/data-search="([^"]*)"/)[1].replaceAll('&lt;', '<').replaceAll('&gt;', '>');
      return { firstElementChild: { tagName: 'DIV' }, dataset: { search: searchValue, ...(attributes.includes('data-hidden="true"') ? { hidden: 'true' } : {}) }, hidden: attributes.includes(' hidden') };
    };
    const guide = leaf('manual');
    const editor = leaf('editor');
    const privateLink = leaf('private');
    const group = { firstElementChild: { tagName: 'DETAILS', open: false, querySelector: (selector) => selector === 'summary' ? { textContent: 'tools' } : { children: [guide, editor, privateLink] } }, dataset: {}, hidden: false };
    const list = { children: page === 'index.html' ? [group] : [guide, editor, privateLink] };
    const search = { hidden: true };
    const input = { value: '', parentElement: search, addEventListener: (_, callback) => { input.update = callback; } };
    const status = { hidden: true, textContent: '' };
    const count = { textContent: page === 'index.html' ? '3 links' : '2 links' };
    const toggle = { hidden: true, textContent: 'Show hidden links', setAttribute(name, value) { this[name] = value; }, addEventListener: (_, callback) => { toggle.click = callback; } };
    runInNewContext(await f.read('assets/search.js') + '\ninitSearch();', { document: { querySelector: (selector) => ({ '#link-search': input, '.links': list, '#search-status': status, '#hidden-toggle': toggle, '#link-count': count })[selector] ?? null } });
    input.value = '#HOW TO';
    input.update();
    assert.equal(status.textContent, '');
    assert.equal(count.textContent, '1 link');
    assert.equal(guide.hidden, false);
    assert.equal(editor.hidden, true);
    assert.equal(privateLink.hidden, true);
    if (page === 'index.html') assert.equal(group.firstElementChild.open, true);
    toggle.click();
    assert.equal(toggle['aria-pressed'], 'true');
    assert.equal(count.textContent, '2 links');
    assert.equal(status.textContent, '');
    assert.equal(privateLink.hidden, false);
    input.value = '<img src=x onerror=alert(1)>';
    input.update();
    assert.equal(count.textContent, '1 link');
    assert.equal(status.textContent, '');
    input.value = '#editor';
    input.update();
    assert.equal(count.textContent, '1 link');
    assert.equal(status.textContent, '');
    assert.equal(editor.hidden, false);
  }
});

test('toggle updates hidden rows, nested search, counts, and hidden-only empty state', async (t) => {
  const f = await fixture(t, { public: 'https://example.com/public', secret: { url: 'https://example.com/private', title: 'Private notes', hidden: true }, folder: { visible: 'https://example.com/visible', private: { deep: { url: 'https://example.com/deep', hidden: true } } }, onlyHidden: { nested: { code: { url: 'https://example.com/code', hidden: true } } } });
  assert.equal(f.build().status, 0);
  const script = await f.read('assets/search.js');
  const leaf = (name, hidden = false) => ({ firstElementChild: { tagName: 'DIV' }, textContent: name, dataset: hidden ? { hidden: 'true' } : {}, hidden });
  const group = (name, children, hidden = false) => ({
    firstElementChild: { tagName: 'DETAILS', open: false, querySelector: (selector) => selector === 'summary' ? { textContent: name } : { children } },
    dataset: hidden ? { hidden: 'true' } : {}, hidden,
  });
  const exercise = async (page, children, visible, site = f) => {
    const html = await site.read(page);
    assert.match(html, /id="hidden-toggle"[^>]*aria-pressed="false" hidden>Show hidden links/);
    assert.doesNotMatch(html, /data-visible=|data-total=/);
    assert.match(html, new RegExp(`id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">${visible}</span><span class="count-label">${visible === 1 ? ' link' : ' links'}</span></`));
    const wrapper = { hidden: !visible };
    const list = { children, parentElement: wrapper };
    const search = { hidden: true };
    const input = { value: '', parentElement: search, addEventListener: (_, callback) => { input.update = callback; } };
    const status = { hidden: true, textContent: '' };
    const toggle = { hidden: true, textContent: 'Show hidden links', setAttribute(name, value) { this[name] = value; }, addEventListener: (_, callback) => { toggle.click = callback; } };
    const numberEl = { textContent: visible };
  const labelEl = { textContent: visible === 1 ? ' link' : ' links' };
  const count = {
    get textContent() { return `${numberEl.textContent}${labelEl.textContent}`; },
    querySelector: (sel) => sel === '.count-number' ? numberEl : sel === '.count-label' ? labelEl : null
  };
    const empty = visible ? null : { hidden: false };
    const elements = { '#link-search': input, '.links': list, '#search-status': status, '#hidden-toggle': toggle, '#link-count': count, '#empty-directory': empty };
    runInNewContext(script + '\ninitSearch();', { document: { querySelector: (selector) => elements[selector] } });
    assert.equal(toggle.hidden, false);
    assert.equal(search.hidden, !visible);
    return { html, input, status, toggle, count, empty, wrapper };
  };

  const homeMarkup = await f.read('index.html');
  const titled = homeMarkup.match(/<li([^>]*)><div class="link-row" title="Private notes"><a class="code" href="([^"]+)" title="Private notes">secret<\/a>/);
  assert.ok(titled, 'generated hidden titled link is present');
  const [, attributes, secretHref] = titled;
  assert.match(attributes, /data-hidden="true" hidden data-title="Private notes"/);
  const secret = leaf('secret https://example.com/private');
  secret.dataset = { hidden: attributes.match(/data-hidden="([^"]+)"/)?.[1], title: attributes.match(/data-title="([^"]+)"/)?.[1] };
  secret.hidden = attributes.includes(' hidden');
  const deep = leaf('deep https://example.com/deep', true);
  const privateGroup = group('private', [deep], true);
  const visibleLeaf = leaf('visible https://example.com/visible');
  const folder = group('folder', [visibleLeaf, privateGroup]);
  const nestedCode = leaf('code https://example.com/code', true);
  const hiddenGroup = group('onlyHidden', [group('nested', [nestedCode], true)], true);
  const home = await exercise('index.html', [folder, hiddenGroup, leaf('public https://example.com/public'), secret], 2);
  assert.match(home.html, /<li data-hidden="true" hidden><details><summary><a href="\.\/onlyHidden\/" data-app-link>/);
  const deepHref = home.html.match(/href="(\.\/folder\/private\/deep\/)"/)?.[1];
  assert.ok(deepHref, 'nested short link was generated');
  for (const prefix of ['/', '/project/']) {
    assert.equal(new URL(secretHref, `https://example.org${prefix}`).pathname, `${prefix}secret/`);
    assert.equal(new URL(deepHref, `https://example.org${prefix}`).pathname, `${prefix}folder/private/deep/`);
  }
  home.input.value = 'private notes';
  home.input.update();
  assert.equal(home.status.textContent, 'No links match your search.');
  assert.equal(home.count.textContent, '0 links');
  assert.equal(privateGroup.hidden, true);
  assert.equal(secret.hidden, true);
  home.toggle.click();
  assert.equal(home.toggle.textContent, 'Hide hidden links');
  assert.equal(home.toggle['aria-pressed'], 'true');
  assert.equal(home.count.textContent, '1 link');
  assert.equal(home.status.textContent, '');
  assert.equal(secret.hidden, false);
  home.input.value = 'private';
  home.input.update();
  assert.equal(home.count.textContent, '2 links');
  assert.equal(home.status.textContent, '');
  assert.equal(secret.hidden, false);
  assert.equal(privateGroup.hidden, false);
  assert.equal(deep.hidden, false);
  home.input.value = '';
  home.input.update();
  assert.equal(home.count.textContent, '5 links');
  assert.equal(hiddenGroup.hidden, false);
  assert.equal(nestedCode.hidden, false);
  home.input.value = 'private notes';
  home.input.update();
  home.toggle.click();
  assert.equal(home.toggle.textContent, 'Show hidden links');
  assert.equal(home.toggle['aria-pressed'], 'false');
  assert.equal(home.count.textContent, '0 links');
  assert.equal(home.status.textContent, 'No links match your search.');
  assert.equal(secret.hidden, true);
  assert.equal(hiddenGroup.hidden, true);
  assert.equal(privateGroup.hidden, true);

  const nested = group('private', [leaf('deep https://example.com/deep', true)], true);
  const directory = await exercise('folder/index.html', [nested, leaf('visible https://example.com/visible')], 1);
  assert.match(directory.html, /href="\.\/private\/"/);
  directory.toggle.click();
  assert.equal(directory.count.textContent, '2 links');
  assert.equal(nested.hidden, false);
  directory.toggle.click();
  assert.equal(directory.count.textContent, '1 link');
  assert.equal(nested.hidden, true);

  const only = group('nested', [leaf('code https://example.com/code', true)], true);
  const hiddenPage = await exercise('onlyHidden/index.html', [only], 0);
  assert.match(hiddenPage.html, /<div hidden><ul class="links">/);
  assert.equal(hiddenPage.empty.hidden, false);
  hiddenPage.toggle.click();
  assert.equal(hiddenPage.count.textContent, '1 link');
  assert.equal(hiddenPage.empty.hidden, true);
  assert.equal(hiddenPage.wrapper.hidden, false);
  assert.equal(hiddenPage.input.parentElement.hidden, false);
  assert.equal(only.hidden, false);
  hiddenPage.input.value = 'code';
  hiddenPage.input.update();
  assert.equal(hiddenPage.count.textContent, '1 link');
  assert.equal(hiddenPage.status.textContent, '');
  hiddenPage.toggle.click();
  assert.equal(hiddenPage.count.textContent, '0 links');
  assert.equal(hiddenPage.empty.hidden, false);
  assert.equal(hiddenPage.wrapper.hidden, true);
  assert.equal(hiddenPage.input.parentElement.hidden, true);
  assert.equal(hiddenPage.status.hidden, true);
  assert.equal(hiddenPage.status.textContent, 'No links match your search.');

  const allHidden = await fixture(t, { secret: { url: 'https://example.com/', hidden: true } });
  assert.equal(allHidden.build().status, 0);
  const root = await exercise('index.html', [leaf('secret https://example.com/', true)], 0, allHidden);
  assert.equal(root.count.textContent, '0 links');
  root.toggle.click();
  assert.equal(root.count.textContent, '1 link');
  root.toggle.click();
  assert.equal(root.count.textContent, '0 links');
  assert.equal(root.empty.hidden, false);
});

test('information pages use relative navigation and shared theme assets', async (t) => {
  const f = await fixture(t, { aboutme: 'https://example.org/' });
  assert.equal(f.build().status, 0);
  const home = await f.read('index.html');
  assert.match(home, /<title>Links · shl<\/title>/);
  assert.match(home, /class="brand" href="\.\/" data-app-link>shl<\/a>/);
  assert.match(home, /<footer class="footer">[\s\S]*?<p>shl<\/p>/);
  assert.match(home, /href="\.\/assets\/site\.css"/);
  assert.match(home, /href="\.\/guide\/"/);
  assert.doesNotMatch(home, /href="\.\/about\/"|Simple by design|Good links/);
  for (const page of ['about', 'guide', 'how-it-works']) {
    const html = await f.read(`${page}/index.html`);
    if (page === 'guide') {
      assert.match(html, /<title>Guide · shl<\/title>/);
      assert.match(html, /<p>shl publishes a public directory/);
      assert.match(html, /href="\.\.\/assets\/site\.css"/);
      assert.match(html, /src="\.\.\/assets\/theme\.js"/);
      assert.match(html, /href="\.\.\/"/);
      for (const section of ['about', 'how-to-use', 'how-it-works']) assert.match(html, new RegExp(`id="${section}"`));
    } else {
      assert.match(html, /<title>Guide · shl<\/title>/);
      assert.match(html, new RegExp(`url=\\.\\.\\/guide\\/#${page}`));
    }
  }
  assert.match(await f.read('assets/site.css'), /data-theme=dark/);
  assert.match(await f.read('assets/site.css'), /--bg:#121212/);
  const theme = await f.read('assets/theme.js');
  assert.match(theme, /shortlink-theme/);
  const button = { addEventListener() {} };
  const root = { dataset: {} };
  runInNewContext(theme, {
    document: { documentElement: root, querySelector: () => button },
    localStorage: { getItem: (key) => { assert.equal(key, 'shortlink-theme'); return 'dark'; } },
  });
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(button.textContent, 'Theme: dark');
  assert.match(await f.read('guide/index.html'), /github\.com\/ratrat64\/shortlink#readme/);
  assert.match(await f.read('guide/index.html'), /tags: \[documentation, github\]/);
  assert.match(await f.read('aboutme/index.html'), /<title>Redirecting · shl<\/title>/);
  assert.match(await f.read('404.html'), /<title>Link not found · shl<\/title>/);
});

test('redirect script safely preserves destinations containing HTML and quotes', async (t) => {
  const url = 'https://example.com/?q=</script><script>alert("x")</script>&a=\'quoted\'';
  const f = await fixture(t, { safe: { url, title: '<img src=x onerror=alert(1)>' } });
  assert.equal(f.build().status, 0);
  const html = await f.read('safe/index.html');
  assert.equal(scripts(html).length, 1);
  assert.doesNotMatch(html, /<img|<script>alert/);
  let destination;
  runInNewContext(scripts(html)[0], { location: { replace: (value) => { destination = value; } } });
  assert.equal(destination, url);
  assert.match(html, /&lt;img/);
});

test('script launchers are opt-in, quote URLs, forward arguments and statuses, and clean up', async (t) => {
  const url = 'https://example.com/setup.sh?q=\'";printf injected;#$(printf expanded)&x=`printf backticks`\\path\nnext';
  const f = await fixture(t, { Run: { url, script: true, hidden: true, tags: ['shell'] }, tools: { Nested: { url, script: true } }, disabled: { url, script: false }, plain: url });
  const build = f.build();
  assert.equal(build.status, 0, build.stderr);
  const launcher = await f.read('Run.sh');
  assert.equal(await f.read('tools/Nested.sh'), launcher);
  const home = await f.read('index.html');
  assert.match(home, /<li data-hidden="true" hidden data-search="Run script [^"]+"><div class="link-row script-row"><a class="code script-link" href="\.\/Run\/">Run<span class="script-label">/);
  assert.match(home, /class="download" href="\.\/Run\.sh"[^>]* download>Download<\/a><a class="visit" href="https:\/\/example\.com\/setup\.sh/);
  assert.match(home, /#shell"[^>]*><div class="link-row script-row">/);
  assert.match(home, /<span class="tags">#shell<\/span><\/li>/);
  assert.match(home, /class="download" href="\.\/tools\/Nested\.sh"[^>]* download>Download<\/a><a class="visit"/);
  assert.match(await f.read('tools/index.html'), /class="download" href="\.\/Nested\.sh"[^>]* download>Download<\/a><a class="visit"/);
  assert.doesNotMatch(home, /class="download" href="\.\/disabled\.sh"/);
  assert.match(home, /<span class="count-number" aria-hidden="true">3<\/span><span class="count-label"> links<\/span>/);
  assert.match(home, /class="code" href="\.\/disabled\/">disabled<\/a>/);
  assert.match(await f.read('assets/site.css'), /--script:#e8b460/);
  assert.match(await f.read('assets/site.css'), /\.download\{/);
  assert.match(await f.read('assets/site.css'), /\.link-row\.script-row\{grid-template-columns:max-content minmax\(0,1fr\) max-content max-content\}/);
  assert.match(await f.read('tools/Nested/index.html'), /http-equiv="refresh"/);
  assert.match(await f.read('Run/index.html'), /http-equiv="refresh"/);
  await assert.rejects(f.read('disabled.sh'), { code: 'ENOENT' });
  await assert.rejects(f.read('plain.sh'), { code: 'ENOENT' });

  const log = join(f.cwd, 'curl.json');
  const payload = 'printf \'%s\\n\' "$@"\nexit "$SCRIPT_STATUS"\n';
  await writeFile(join(f.cwd, 'curl'), `#!/usr/bin/env bun
const { writeFileSync } = require('node:fs');
const args = process.argv.slice(2);
writeFileSync(process.env.CURL_LOG, JSON.stringify(args));
writeFileSync(args[args.indexOf('-o') + 1], ${JSON.stringify(payload)});
process.exit(Number(process.env.CURL_STATUS));
`, { mode: 0o755 });

  const args = ['--verbose', 'two words', '', '$HOME; $(printf injected)'];
  // Even failed/partial downloads leave executable content: it must never run.
  for (const [curlStatus, scriptStatus] of [[0, 0], [0, 7], [22, 0], [18, 0]]) {
    const result = spawnSync('bash', ['-s', '--', ...args], {
      cwd: f.cwd,
      input: launcher,
      encoding: 'utf8',
      timeout: 5000,
      env: {
        ...process.env,
        PATH: `${f.cwd}:${process.env.PATH}`,
        TMPDIR: f.cwd,
        CURL_LOG: log,
        CURL_STATUS: String(curlStatus),
        SCRIPT_STATUS: String(scriptStatus),
      },
    });
    assert.equal(result.status, curlStatus || scriptStatus, result.stderr);
    assert.equal(result.stdout, curlStatus ? '' : args.join('\n') + '\n');
    const request = JSON.parse(await readFile(log, 'utf8'));
    assert.equal(request.at(-1), url);
    await assert.rejects(readFile(request[request.indexOf('-o') + 1]), { code: 'ENOENT' });
  }
});

test('invalid input fails before replacing an existing build', async (t) => {
  const cases = [
    null, [], 'https://example.com',
    { code: null }, { code: [] }, { code: 42 }, { code: {} },
    { code: { url: 123 } }, { code: { url: 'https://example.com', title: null } },
    { code: 'https://' }, { code: 'https://bad host/' }, { code: 'javascript:alert(1)' },
    { code: '/relative' }, { '.hidden': 'https://example.com' },
    { '../escape': 'https://example.com' }, { INDEX: 'https://example.com' },
    ...['about', 'GUIDE', 'how-it-works'].map((code) => ({ [code]: 'https://example.com' })),
    { gh: 'https://example.com', GH: 'https://example.org' },
    { tools: { Git: 'https://example.com', git: 'https://example.org' } },
    { tools: { 'index.html': 'https://example.com' } },
    { tools: { git: 'https://example.com', 'GIT.SH': {} } },
    { tools: {} }, { tools: { git: { title: 'missing URL' } } },
    ...[null, 'true', 1, [], {}].map((script) => ({ code: { url: 'https://example.com', script } })),
    ...[null, 'true', 1, [], {}].map((hidden) => ({ code: { url: 'https://example.com', hidden } })),
    ...[null, 'tag', 1, {}, [null], [1], [''], ['  ']].map((tags) => ({ code: { url: 'https://example.com', tags } })),
    { code: { url: 'https://example.com', hidden: true }, CODE: 'https://example.org' },
    { code: { url: 'https://example.com', hidden: true, script: true }, 'CODE.SH': 'https://example.org' },
    { code: { url: 'https://example.com', script: true }, 'code.sh': 'https://example.org' },
    { 'CODE.SH': 'https://example.org', code: { url: 'https://example.com', script: true } },
    { tools: { run: { url: 'https://example.com', script: true }, 'RUN.SH': { git: 'https://example.org' } } },
  ];
  const f = await fixture(t, {});
  await mkdir(join(f.cwd, 'dist'));
  await writeFile(join(f.cwd, 'dist', 'marker'), 'preserved');
  for (const value of cases) {
    await writeFile(join(f.cwd, 'links.json'), JSON.stringify(value));
    const result = f.build();
    assert.equal(result.status, 1, JSON.stringify(value));
    assert.match(result.stderr, /Build stopped/);
    if (value?.code && typeof value.code === 'object' && 'hidden' in value.code && typeof value.code.hidden !== 'boolean') assert.match(result.stderr, /"code" — hidden must be a boolean/);
    assert.equal(await f.read('marker'), 'preserved');
  }
  await writeFile(join(f.cwd, 'links.json'), '{broken');
  assert.match(f.build().stderr, /Build stopped\. Fix links.json/);
});

test('404 resolves root and nested paths under user and project sites', async (t) => {
  const map = {
    tools: { Git: 'https://git-scm.com/', editors: { Code: { url: 'https://example.org/', hidden: true } }, hiddenOnly: { Secret: { url: 'https://example.com/secret', hidden: true } } },
    Mixed: { url: 'https://example.com/', script: true, hidden: true }, plain: 'https://example.org/',
  };
  const f = await fixture(t, map);
  assert.equal(f.build().status, 0);
  const [script] = scripts(await f.read('404.html'));
  for (const prefix of ['/', '/project/']) {
    const visit = async (path, offline = false) => {
      const elements = { home: {}, head: {}, msg: {} };
      const requests = [];
      let destination;
      await runInNewContext(script, {
        location: { pathname: prefix + path, replace: (url) => { destination = url; } },
        document: { getElementById: (id) => elements[id] },
        fetch: async (url) => {
          requests.push(url);
          if (offline) throw new Error('offline');
          return url === prefix + 'links.json' ? { ok: true, json: async () => map } : { ok: false };
        },
      });
      return { elements, requests, destination };
    };
    for (const [path, expected] of [
      ['TOOLS/git/', map.tools.Git], ['tools/EDITORS/code', map.tools.editors.Code.url],
      ['TOOLS/editors/', prefix + 'tools/editors/'],
      ['TOOLS/HIDDENONLY/secret', map.tools.hiddenOnly.Secret.url], ['tools/HIDDENONLY/', prefix + 'tools/hiddenOnly/'],
      ...['Mixed', 'mixed', 'MIXED/'].map((code) => [code, map.Mixed.url]),
      ['plain', map.plain], ['PLAIN/', map.plain],
    ]) {
      const { elements, requests, destination } = await visit(path);
      assert.equal(destination, expected);
      assert.equal(elements.home.href, prefix);
      assert.equal(requests.at(-1), prefix + 'links.json');
    }
    for (const [path, offline] of [['tools/missing/', false], ['unknown/', false], ['unknown/', true]]) {
      const { elements, destination } = await visit(path, offline);
      assert.equal(destination, undefined);
      assert.equal(elements.head.textContent, 'Link not found');
      assert.equal(elements.home.href, prefix);
    }
  }
});
