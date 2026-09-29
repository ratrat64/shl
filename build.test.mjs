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
  assert.doesNotMatch(await f.read('index.html'), /example\.com|Mixed|Example/);
  assert.match(await f.read('Mixed/index.html'), /http-equiv="refresh"/);
  assert.match(await f.read('plain/index.html'), /http:\/\/example.org\//);
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

test('invalid input fails before replacing an existing build', async (t) => {
  const cases = [
    null, [], 'https://example.com',
    { code: null }, { code: [] }, { code: 42 }, { code: {} },
    { code: { url: 123 } }, { code: { url: 'https://example.com', title: null } },
    { code: 'https://' }, { code: 'https://bad host/' }, { code: 'javascript:alert(1)' },
    { code: '/relative' }, { '.hidden': 'https://example.com' },
    { '../escape': 'https://example.com' }, { INDEX: 'https://example.com' },
    { gh: 'https://example.com', GH: 'https://example.org' },
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
  const map = { Mixed: { url: 'https://example.com/' }, plain: 'https://example.org/' };
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
