import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const buildScript = fileURLToPath(new URL('./build.mjs', import.meta.url));

async function fixture(t, links) {
  const cwd = await mkdtemp(join(tmpdir(), 'shortlink-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, 'links.json'), JSON.stringify(links));
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
  assert.match(await f.read('index.html'), /href="\.\/Mixed\/">Mixed<\/a> — Example/);
  assert.match(await f.read('Mixed/index.html'), /http-equiv="refresh"/);
  assert.match(await f.read('plain/index.html'), /http:\/\/example.org\//);
});

test('homepage lists sorted links safely with project-relative URLs and handles an empty map', async (t) => {
  const url = 'https://example.com/?q=<img>&x="quoted"';
  const f = await fixture(t, { zebra: url, Alpha: { url, title: '<script>title</script>' }, beta: { url, title: '' } });
  assert.equal(f.build().status, 0);
  const html = await f.read('index.html');
  const codes = [...html.matchAll(/class="code" href="([^"]+)">([^<]+)<\/a>/g)];
  assert.deepEqual(codes.map((match) => match[2]), ['Alpha', 'beta', 'zebra']);
  for (const [, href, code] of codes) {
    for (const prefix of ['/', '/project/']) {
      assert.equal(new URL(href, `https://example.org${prefix}`).pathname, `${prefix}${code}/`);
    }
  }
  assert.match(html, /&lt;script&gt;title&lt;\/script&gt;/);
  assert.match(html, /https:\/\/example\.com\/\?q=&lt;img&gt;&amp;x=&quot;quoted&quot;/);
  assert.doesNotMatch(html, /<script|<img|undefined/);
  const empty = await fixture(t, {});
  assert.equal(empty.build().status, 0);
  assert.match(await empty.read('index.html'), /No links available yet\./);
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
  const f = await fixture(t, { Run: { url, script: true }, disabled: { url, script: false }, plain: url });
  const build = f.build();
  assert.equal(build.status, 0, build.stderr);
  const launcher = await f.read('Run.sh');
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
    { gh: 'https://example.com', GH: 'https://example.org' },
    ...[null, 'true', 1, [], {}].map((script) => ({ code: { url: 'https://example.com', script } })),
    { code: { url: 'https://example.com', script: true }, 'code.sh': 'https://example.org' },
    { 'CODE.SH': 'https://example.org', code: { url: 'https://example.com', script: true } },
  ];
  const f = await fixture(t, {});
  await mkdir(join(f.cwd, 'dist'));
  await writeFile(join(f.cwd, 'dist', 'marker'), 'preserved');
  for (const value of cases) {
    await writeFile(join(f.cwd, 'links.json'), JSON.stringify(value));
    const result = f.build();
    assert.equal(result.status, 1, JSON.stringify(value));
    assert.match(result.stderr, /Build stopped/);
    assert.equal(await f.read('marker'), 'preserved');
  }
  await writeFile(join(f.cwd, 'links.json'), '{broken');
  assert.match(f.build().stderr, /Build stopped\. Fix links.json/);
});

test('404 script resolves root and project links with either casing and trailing slash', async (t) => {
  const map = { Mixed: { url: 'https://example.com/', script: true }, plain: 'https://example.org/' };
  const f = await fixture(t, map);
  assert.equal(f.build().status, 0);
  const [script] = scripts(await f.read('404.html'));
  for (const prefix of ['/', '/project/']) {
    for (const code of ['Mixed', 'mixed', 'MIXED/', 'plain', 'PLAIN/']) {
      const elements = { home: {}, head: {}, msg: {} };
      let destination;
      await runInNewContext(script, {
        location: { pathname: prefix + code, replace: (url) => { destination = url; } },
        document: { getElementById: (id) => elements[id] },
        fetch: async (path) => {
          assert.equal(path, prefix + 'links.json');
          return { ok: true, json: async () => map };
        },
      });
      assert.equal(destination, code.toLowerCase().startsWith('plain') ? map.plain : map.Mixed.url);
      assert.equal(elements.home.href, prefix);
    }
    for (const mode of ['missing', 'network failure']) {
      const elements = { home: {}, head: {}, msg: {} };
      await runInNewContext(script, {
        location: { pathname: prefix + 'unknown/', replace: () => assert.fail('unexpected redirect') },
        document: { getElementById: (id) => elements[id] },
        fetch: async () => {
          if (mode === 'network failure') throw new Error('offline');
          return { ok: true, json: async () => map };
        },
      });
      assert.equal(elements.head.textContent, 'Link not found');
      assert.equal(elements.home.href, prefix);
    }
  }
});
