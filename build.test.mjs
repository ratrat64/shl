import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const buildScript = fileURLToPath(new URL('./build.mjs', import.meta.url));

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
  const links = { gh: 'https://github.com/', Run: { url: 'https://example.com/setup.sh', title: 'Setup #1', script: true, hidden: true } };
  const yaml = `gh: https://github.com/
Run:
  url: https://example.com/setup.sh
  title: 'Setup #1'
  script: true
  hidden: true
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
  const empty = await fixture(t, {});
  assert.equal(empty.build().status, 0);
  assert.match(await empty.read('index.html'), /No links available yet\./);
});

test('nested JSON and YAML build themed directory pages and redirects', async (t) => {
  const links = { tools: { git: 'https://git-scm.com/', editors: { Code: { url: 'https://example.org/?x=<img>&q="', title: '<Editor>' } } }, gh: 'https://github.com/' };
  const f = await fixture(t, links);
  assert.equal(f.build().status, 0);
  const home = await f.read('index.html');
  assert.match(home, /<details><summary><a href="\.\/tools\/">tools<\/a><\/summary>/);
  assert.match(home, /href="\.\/tools\/editors\/Code\/" title="&lt;Editor&gt;">Code<\/a>/);
  assert.match(home, /data-title="&lt;Editor&gt;"/);
  assert.match(home, /class="link-row" title="&lt;Editor&gt;"/);
  assert.doesNotMatch(home, /<img>/);
  const tools = await f.read('tools/index.html');
  assert.match(tools, /href="\.\.\/assets\/site\.css"/);
  assert.match(tools, /href="\.\/git\/">git<\/a>/);
  assert.match(tools, /<summary><a href="\.\/editors\/">editors<\/a><\/summary>/);
  assert.ok(tools.indexOf('class="directory-tools"') < tools.indexOf('class="breadcrumbs"'));
  const editors = await f.read('tools/editors/index.html');
  assert.match(editors, /href="\.\.\/\.\.\/assets\/site\.css"/);
  assert.match(editors, /href="\.\.\/\.\.\/">Home<\/a>/);
  assert.match(editors, /href="\.\.\/">tools<\/a>/);
  assert.match(editors, /href="\.\/Code\/" title="&lt;Editor&gt;">Code<\/a>/);
  assert.match(editors, /class="link-row" title="&lt;Editor&gt;"/);
  for (const prefix of ['/', '/project/']) {
    assert.equal(new URL('./tools/editors/Code/', `https://example.org${prefix}`).pathname, `${prefix}tools/editors/Code/`);
  }
  assert.match(await f.read('tools/git/index.html'), /https:\/\/git-scm\.com\//);
  assert.match(await f.read('tools/editors/Code/index.html'), /&lt;img&gt;/);
  const css = await f.read('assets/site.css');
  assert.doesNotMatch(css, /\.links li\{[^}]*border-bottom|\.links \.links\{[^}]*border-left/);
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

test('hidden links and hidden-only folders disappear from listings and counts but keep their resources', async (t) => {
  const links = {
    visible: 'https://example.com/visible',
    shown: { url: 'https://example.com/shown', hidden: false },
    secret: { url: 'https://example.com/secret', hidden: true, script: true },
    tools: {
      public: 'https://example.com/public',
      private: { deep: { SecretCode: { url: 'https://example.com/deep', hidden: true } } },
    },
    onlyHidden: { nested: { OtherSecret: { url: 'https://example.com/other', hidden: true } } },
  };
  const f = await fixture(t, links);
  assert.equal(f.build().status, 0);
  for (const page of ['index.html', 'tools/index.html']) {
    const html = await f.read(page);
    assert.doesNotMatch(html, /SecretCode|OtherSecret|onlyHidden|private|https:\/\/example\.com\/(secret|deep|other)/);
    assert.doesNotMatch(html, /href="\.\/secret\/"/);
  }
  const home = await f.read('index.html');
  assert.match(home, /3 links/);
  assert.match(home, /href="\.\/shown\/">shown<\/a>/);
  assert.match(home, /href="\.\/visible\/">visible<\/a>/);
  assert.match(home, /href="\.\/tools\/public\/">public<\/a>/);
  assert.match(await f.read('tools/index.html'), /href="\.\/public\/">public<\/a>/);
  for (const page of ['onlyHidden/index.html', 'onlyHidden/nested/index.html', 'tools/private/index.html', 'tools/private/deep/index.html']) {
    const html = await f.read(page);
    assert.match(html, /No links listed here\./);
    assert.doesNotMatch(html, /SecretCode|OtherSecret|href="\.\/nested\/"|href="\.\/deep\/"/);
    assert.doesNotMatch(html, /id="link-search"/);
  }
  assert.match(await f.read('secret/index.html'), /https:\/\/example\.com\/secret/);
  assert.match(await f.read('tools/private/deep/SecretCode/index.html'), /https:\/\/example\.com\/deep/);
  assert.match(await f.read('secret.sh'), /curl -fsSL/);
  assert.deepEqual(JSON.parse(await f.read('links.json')), links);

  const allHidden = await fixture(t, { private: { nested: { code: { url: 'https://example.com/', hidden: true } } } });
  assert.equal(allHidden.build().status, 0);
  assert.match(await allHidden.read('index.html'), /No links listed here\./);
  assert.doesNotMatch(await allHidden.read('index.html'), /Add your first entry|private|\d+ links/);
  assert.match(await allHidden.read('private/nested/index.html'), /No links listed here\./);
  assert.match(await allHidden.read('private/nested/code/index.html'), /https:\/\/example\.com/);
});

test('long destinations keep their trailing path beside single-line short codes', async (t) => {
  const url = 'https://raw.githubusercontent.com/ratrat64/homelab-public/refs/heads/main/scripts/ubuntu/oh-my-posh/setup.sh';
  const f = await fixture(t, { setup: { url, title: 'Install shell prompt' }, plain: url });
  assert.equal(f.build().status, 0);
  const html = await f.read('index.html');
  assert.match(html, /class="link-row" title="Install shell prompt"/);
  assert.match(html, /class="destination"><span class="sr-only">https:\/\/raw\.githubusercontent\.com\/ratrat64/);
  assert.match(html, /class="destination" title="https:\/\/raw\.githubusercontent\.com\/ratrat64/);
  assert.match(html, /class="destination-start" aria-hidden="true">https:\/\/raw\.githubusercontent\.com\/.*\/ubuntu\//);
  assert.match(html, /class="destination-end" aria-hidden="true">oh-my-posh\/setup\.sh<\/span>/);
  assert.doesNotMatch(html, /class="link-title"/);
});

test('search filters nested links on the homepage and directory pages', async (t) => {
  const f = await fixture(t, { gh: 'https://github.com/', tools: { git: 'https://git-scm.com/', editors: { Code: { url: 'https://example.org/', title: 'VS Code' } } } });
  assert.equal(f.build().status, 0);
  for (const [page, depth] of [['index.html', './'], ['tools/index.html', '../'], ['tools/editors/index.html', '../../']]) {
    const html = await f.read(page);
    assert.match(html, /<div class="search" hidden>\s*<label for="link-search">Search links<\/label>/);
    assert.match(html, new RegExp(`src="${depth.replaceAll('.', '\\.')}assets/search\\.js"`));
    assert.match(html, /id="search-status"[^>]*role="status" hidden/);
  }

  const leaf = (text, title = '') => ({ firstElementChild: { tagName: 'DIV' }, textContent: text, dataset: { title }, hidden: false });
  const group = (name, ...children) => {
    const details = { tagName: 'DETAILS', open: false, querySelector: (selector) => selector === 'summary' ? { textContent: name } : { children } };
    return { firstElementChild: details, hidden: false };
  };
  const gh = leaf('gh https://github.com/');
  const git = leaf('git https://git-scm.com/');
  const code = leaf('Code https://example.org/', 'VS Code');
  const editors = group('editors', code);
  const tools = group('tools', git, editors);
  const list = { children: [gh, tools] };
  const search = { hidden: true };
  const input = { value: '', parentElement: search, addEventListener: (_, listener) => { input.update = listener; } };
  const status = { hidden: true, textContent: '' };
  const elements = { '#link-search': input, '.links': list, '#search-status': status };
  runInNewContext(await f.read('assets/search.js'), { document: { querySelector: (selector) => elements[selector] } });
  assert.equal(search.hidden, false);

  tools.firstElementChild.open = true; // Preserve directories opened by the visitor.
  input.value = 'vs code';
  input.update();
  assert.equal(status.textContent, '1 matching link.');
  assert.equal(code.hidden, false);
  assert.equal(git.hidden, true);
  assert.equal(gh.hidden, true);
  assert.equal(editors.firstElementChild.open, true);

  input.value = 'TOOLS/GIT';
  input.update();
  assert.equal(git.hidden, false);
  assert.equal(code.hidden, true);
  assert.equal(editors.hidden, true);

  input.value = 'tools';
  input.update();
  assert.equal(status.textContent, '2 matching links.');
  assert.equal(git.hidden, false);
  assert.equal(code.hidden, false);

  input.value = 'missing';
  input.update();
  assert.equal(status.textContent, 'No links match your search.');
  assert.equal(tools.hidden, true);

  input.value = '';
  input.update();
  assert.equal(status.hidden, true);
  assert.equal(gh.hidden, false);
  assert.equal(editors.firstElementChild.open, false);
  assert.equal(tools.firstElementChild.open, true);
});

test('information pages use relative navigation and shared theme assets', async (t) => {
  const f = await fixture(t, { aboutme: 'https://example.org/' });
  assert.equal(f.build().status, 0);
  const home = await f.read('index.html');
  assert.match(home, /href="\.\/assets\/site\.css"/);
  assert.match(home, /href="\.\/guide\/"/);
  assert.doesNotMatch(home, /href="\.\/about\/"|Simple by design|Good links/);
  for (const page of ['about', 'guide', 'how-it-works']) {
    const html = await f.read(`${page}/index.html`);
    if (page === 'guide') {
      assert.match(html, /href="\.\.\/assets\/site\.css"/);
      assert.match(html, /src="\.\.\/assets\/theme\.js"/);
      assert.match(html, /href="\.\.\/"/);
      for (const section of ['about', 'how-to-use', 'how-it-works']) assert.match(html, new RegExp(`id="${section}"`));
    } else {
      assert.match(html, new RegExp(`url=\\.\\.\\/guide\\/#${page}`));
    }
  }
  assert.match(await f.read('assets/site.css'), /data-theme=dark/);
  assert.match(await f.read('assets/site.css'), /--bg:#000/);
  assert.match(await f.read('assets/theme.js'), /shortlink-theme/);
  assert.match(await f.read('guide/index.html'), /github\.com\/ratrat64\/shortlink#readme/);
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
  const f = await fixture(t, { Run: { url, script: true, hidden: true }, tools: { Nested: { url, script: true } }, disabled: { url, script: false }, plain: url });
  const build = f.build();
  assert.equal(build.status, 0, build.stderr);
  const launcher = await f.read('Run.sh');
  assert.equal(await f.read('tools/Nested.sh'), launcher);
  const home = await f.read('index.html');
  assert.doesNotMatch(home, /href="\.\/Run\/"|Run<span class="script-label">/);
  assert.match(home, /3 links/);
  assert.match(home, /class="code" href="\.\/disabled\/">disabled<\/a>/);
  assert.match(await f.read('assets/site.css'), /--script:#ffcb86/);
  assert.match(await f.read('tools/Nested/index.html'), /http-equiv="refresh"/);
  assert.match(await f.read('Run/index.html'), /http-equiv="refresh"/);
  await assert.rejects(f.read('disabled.sh'), { code: 'ENOENT' });
  await assert.rejects(f.read('plain.sh'), { code: 'ENOENT' });

  const log = join(f.cwd, 'curl.json');
  const payload = 'printf \'%s\\n\' "$@"\nexit "$SCRIPT_STATUS"\n';
  await writeFile(join(f.cwd, 'curl'), `#!/usr/bin/env node
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
