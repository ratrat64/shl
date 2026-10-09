import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  rm,
  unlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createContext, runInContext, runInNewContext } from "node:vm";
import { stringify, parse } from "yaml";
import { linkFields, entryTree } from "../src/links.mjs";
import { scriptString } from "../src/layout.mjs";
import { tagColors } from "../src/directory.mjs";

// Actual generated identities cover every degree of the hue spectrum.
const hueSamples = new Map();
for (let n = 0; n < 10000 && hueSamples.size < 360; n++) {
  const tag = `spectrum-${n}`;
  const hue = Math.floor(
    Number(tagColors(tag).light.match(/hsl\(([\d.]+)/)[1]),
  );
  if (!hueSamples.has(hue)) hueSamples.set(hue, tag);
}
const spectrumTags = [...hueSamples]
  .sort(([a], [b]) => a - b)
  .map(([, tag]) => tag);
const representativeTags = spectrumTags.filter((_, i) => i % 10 === 0);

test("raw invalid tag names fail every format before output deletion; valid lowercase and uncased Unicode stay public", async (t) => {
  for (const source of ["links.json", "links.yaml", "links.yml"]) {
    const valid = {
      folder: {
        code: {
          url: "https://example.com/",
          tags: [
            "shell",
            "café",
            "日本語",
            "emoji-party",
            "ελληνικά",
            "русский",
            "ａｂｃ",
            "𐐨",
            "123",
            "#",
            "*",
            "a._-:;!/?&='\"\\",
            "a\u0000b",
            "#literal",
            "<img/onerror=alert(1)>",
          ],
        },
      },
    };
    const encode = (map) => (source === "links.json" ? map : stringify(map));
    const f = await fixture(t, encode(valid), source);
    assert.equal(f.build().status, 0);
    assert.deepEqual(JSON.parse(await f.read("links.json")), valid);
    await writeFile(join(f.cwd, "dist", "marker"), "preserved");
    for (const tag of [
      "release notes",
      " Hidden",
      "Disabled ",
      "a\tb",
      "a\nb",
      "a,b",
      "a\u00a0b",
      "a\u2028b",
      "a\ufeffb",
      "SHELL",
      "sHeLl",
      "café-É",
      "Αλφα",
      "Журнал",
      "Ａｂｃ",
      "ǅuro",
      "Ⅳ",
      "emoji-🎉",
      "👩‍💻",
      "👍🏽",
      "🏽",
      "🇬🇧",
      "1️⃣",
      "#️⃣",
      "*️⃣",
      "a\u20e3b",
      "☀️",
      "⌚",
    ]) {
      const map = {
        folder: { code: { url: "https://example.com/", tags: [tag] } },
      };
      await writeFile(
        join(f.cwd, source),
        source === "links.json" ? JSON.stringify(map) : stringify(map),
      );
      const result = f.build();
      assert.equal(result.status, 1, source + "/" + JSON.stringify(tag));
      assert.ok(
        result.stderr.includes(source) &&
          result.stderr.includes('"folder/code"') &&
          result.stderr.includes(JSON.stringify(tag)),
      );
      assert.match(
        result.stderr,
        /Tag names must not contain whitespace, commas, Unicode uppercase\/titlecase characters or emoji \(pictographs, emoji-presentation symbols, flags or keycaps\); rename this tag explicitly\. No automatic renaming is performed\./,
      );
      assert.equal(await f.read("marker"), "preserved");
    }
  }
});

test("renderer publishes deduplicated lexical catalogs, safe full labels and stable UTF-16 seeded colors", async (t) => {
  const leaf = (tags) => ({ url: "https://example.com/", tags });
  const entries = {
    first: leaf(["shell", "shell", "shell", "café", "<tag>", "emoji-party"]),
    folder: {
      hidden: leaf(["hidden", "broken", "disabled", "script", "shell"]),
    },
  };
  const a = await fixture(t, entries);
  const b = await fixture(t, {
    unrelated: leaf(["added"]),
    folder: entries.folder,
    first: entries.first,
  });
  const c = await fixture(t, { folder: entries.folder });
  for (const f of [a, b, c]) assert.equal(f.build().status, 0);
  assert.deepEqual(JSON.parse(await a.read("links.json")), entries);
  const first = await a.read("index.html");
  const inline = first.match(
    /aria-label="[^"]*Show all tags for first">([\s\S]*?)<\/button>/,
  )[1];
  const popover = first.match(
    /aria-label="Tags for first">([\s\S]*?)<\/div>/,
  )[1];
  assert.equal(inline, popover);
  assert.deepEqual(
    [...inline.matchAll(/class="tag-label"[^>]*>(.*?)<\/span>/g)].map(
      (match) => match[1],
    ),
    ["#shell", "#café", "#&lt;tag&gt;", "#emoji-party"],
  );
  assert.equal(
    new Set(representativeTags.map((tag) => tagColors(tag).light)).size,
    36,
  );
  for (const [tag, light, dark] of [
    ["hidden", "hsl(55.3 55% 20%)", "hsl(55.3 55% 81%)"],
    ["disabled", "hsl(288.5 61% 20%)", "hsl(288.5 61% 81%)"],
    ["broken", "hsl(80 56% 20%)", "hsl(80 56% 80%)"],
    ["script", "hsl(153 56% 22%)", "hsl(153 56% 82%)"],
    ["shell", "hsl(238.5 75% 22%)", "hsl(238.5 75% 82%)"],
    ["café", "hsl(146.8 57% 20%)", "hsl(146.8 57% 81%)"],
    ["𐐨", "hsl(223.6 69% 21%)", "hsl(223.6 69% 80%)"],
    ["a\u0000b", "hsl(109 68% 21%)", "hsl(109 68% 81%)"],
  ])
    assert.deepEqual(tagColors(tag), { light, dark });
  const catalogs = [];
  for (const [f, path] of [
    [a, "index.html"],
    [a, "folder/index.html"],
    [b, "index.html"],
    [c, "index.html"],
  ]) {
    const html = await f.read(path);
    assert.doesNotMatch(html, /<tag>/);
    const catalog = html.match(/id="available-tags"[\s\S]*?<\/div>/)[0];
    catalogs.push(catalog);
    assert.doesNotMatch(html, /data-slot=/);
    for (const match of html.matchAll(
      /data-tag="([^"]*)" style="--tag-light:([^;]+);--tag-dark:([^"]+)"/g,
    )) {
      const identity = match[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">");
      assert.deepEqual(
        { light: match[2], dark: match[3] },
        tagColors(identity),
      );
    }
  }
  assert.match(
    catalogs[0],
    /data-tag="shell"[^>]*aria-label="Filter by #shell">#shell/,
  );
  assert.equal([...catalogs[0].matchAll(/data-tag="shell"/g)].length, 1);
  assert.ok(
    catalogs[0].indexOf('data-tag="broken"') <
      catalogs[0].indexOf('data-tag="shell"'),
  );
  for (const catalog of catalogs)
    assert.match(catalog, /data-tag="hidden" style="--tag-light:hsl\(/);
});

test("colored tag filters execute catalog, AND/text, tokens, focus, lifecycle and rendered root/nested matrix", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const leaf = (tags, title = "") => ({
    url: "https://example.com/setup.sh",
    tags,
    title,
  });
  const subtree = {
    Both: leaf(
      [
        "shell",
        "setup",
        "script",
        "café",
        "#literal",
        "a-very-long-label-that-must-scroll-fully".repeat(3),
      ],
      "setup notes",
    ),
    Shell: leaf(["shell"]),
    Setup: leaf(["setup"]),
    Hidden: leaf(["hidden", "shell", "setup"]),
    Broken: leaf(["hidden", "broken", "shell"]),
    Disabled: leaf(["hidden", "disabled", "setup"]),
    Combined: leaf([
      "hidden",
      "broken",
      "disabled",
      "shell",
      "setup",
      "script",
    ]),
    VisibleBroken: leaf(["broken", "shell"]),
    deeper: { Nested: leaf(["shell", "setup"]) },
  };
  const f = await fixture(t, {
    tools: subtree,
    onlyHidden: { Secret: leaf(["hidden"]) },
    noTags: { Plain: "https://example.com/" },
    Outside: leaf(["outside"]),
  });
  assert.equal(f.build().status, 0);
  const origin = await browserServer(t, f.cwd);
  await writeFile(
    join(f.cwd, "dist", "filters-check.html"),
    `<!doctype html><html><body><iframe style="height:900px;border:0"></iframe><script>
  (async () => { try {
    const frame = document.querySelector('iframe');
    const wait = () => new Promise(resolve => setTimeout(resolve, 30));
    const load = path => new Promise(resolve => { frame.onload = resolve; frame.src = path; });
    const check = (yes, label) => { if (!yes) throw Error(label); };
    for (const prefix of ['/', '/project/']) for (const page of ['', 'tools/']) for (const width of [320, 1440]) for (const theme of ['light', 'dark']) {
      frame.style.width = width + 'px'; localStorage.setItem('shortlink-theme', theme);
      await load(prefix + page);
      const doc = frame.contentDocument, win = frame.contentWindow;
      const input = doc.querySelector('#link-search'), picker = doc.querySelector('#available-tags'), selected = doc.querySelector('#selected-tags'), toggle = doc.querySelector('#tag-toggle');
      const count = () => Number(doc.querySelector('.count-number').textContent);
      const pool = () => [...picker.querySelectorAll('button')].filter(b => !b.hidden).map(b => b.dataset.tag).join(',');
      const choices = () => [...selected.querySelectorAll('button')].map(b => b.dataset.tag).join(',');
      const pick = tag => picker.querySelector('button[data-tag="' + tag + '"]').click();
      const remove = tag => selected.querySelector('button[data-tag="' + tag + '"]').click();
      const clear = () => { for (const b of [...selected.querySelectorAll('button')]) b.click(); type(''); };
      const type = (value, caret = value.length, event = 'input') => { input.value = value; input.setSelectionRange(caret, caret); input.dispatchEvent(new win.Event(event)); };
      const enter = () => input.dispatchEvent(new win.KeyboardEvent('keydown', {key: 'Enter', cancelable: true}));
      const shown = () => [...doc.querySelectorAll('.link-row')].filter(r => !r.closest('li').hidden && r.getClientRects().length).map(r => r.querySelector('.code').textContent).sort().join(',');
      const baseline = page ? 5 : 7;
      check(count() === baseline && choices() === '' && picker.hidden && selected.hidden, 'Fresh mount');
      const catalog = pool(); check(catalog.includes('hidden') && catalog.includes('disabled') && (page ? !catalog.includes('outside') : catalog.includes('outside')), 'Subtree scope');
      toggle.click(); check(!picker.hidden && toggle.getAttribute('aria-expanded') === 'true' && count() === baseline, 'Opening changed results');
      pick('shell'); check(doc.activeElement === selected.querySelector('button') && choices() === 'shell' && count() === 4, 'Picker move/focus');
      pick('setup'); check(count() === 2 && choices() === 'shell,setup', 'Ordinary AND');
      check(selected.querySelectorAll('button')[1].getAttribute('aria-label') === 'Remove #setup filter' && selected.querySelector('button').getAttribute('aria-pressed') === 'true', 'Removal accessibility');
      type('setup notes'); check(count() === 1 && shown() === 'Both', 'AND with broad title');
      type('setup  notes'); check(count() === 0 && !doc.querySelector('#search-status').hidden && !picker.hidden, 'Prose split or choices lost');
      check(pool() === catalog.split(',').filter(t => !['shell','setup'].includes(t)).join(','), 'Result-dependent pool');
      type('deeper'); check(count() === 1 && shown() === 'Nested', 'Ancestor text/AND');
      type(''); toggle.click(); check(picker.hidden && count() === 2 && choices() === 'shell,setup', 'Collapse/clear lost filters');
      remove('shell'); check(doc.activeElement.dataset.tag === 'setup', 'Removal next focus');
      remove('setup'); check(doc.activeElement === input && selected.hidden && pool() === catalog, 'Removal search/order');
      type('#hidden'); check(count() === 0 && !choices(), 'Pending hidden revealed');
      enter(); check(count() === (page ? 4 : 5) && input.value === '' && choices() === 'hidden', 'Enter commit'); clear();
      type('#broken '); check(count() === 3 && !shown().includes('Hidden') && !shown().includes('Disabled'), 'Broken admission');
      type('#shell,#setup '); check(count() === 1 && shown() === 'Combined', 'Reserved plus ordinary AND');
      type('combined'); check(count() === 1, 'Reserved AND with text'); type('both'); check(count() === 0, 'Reserved text leaked hidden sibling');
      remove('shell'); remove('setup'); type('');
      type('#disabled,'); check(count() === 1 && shown() === 'Combined', 'Reserved AND');
      remove('broken'); check(count() === 2 && shown() === 'Combined,Disabled', 'Disabled admission');
      remove('disabled'); check(count() === baseline, 'Last reserved removal');
      type('#script '); check(count() === 1 && shown() === 'Both', 'Script revealed hidden'); clear();
      type('#shell,#setup '); check(choices() === 'shell,setup' && input.value === '' && count() === 2, 'Pasted multi tokens');
      type('#SHELL '); check(choices() === 'shell,setup' && input.value === '' && doc.querySelector('#tag-notice').textContent === 'Tag already selected.', 'Duplicate toggled');
      clear(); type('#missing, #shell '); check(input.value === '#missing, ' && choices() === 'shell' && doc.querySelector('#tag-error').textContent === 'Tag not found' && count() === 0, 'Unknown retention/known elsewhere');
      type('#setup, '); check(input.value === ' ' && choices() === 'shell,setup' && doc.querySelector('#tag-error').hidden, 'Correction');
      type('#absent '); check(!doc.querySelector('#tag-error').hidden, 'Unknown missing error');
      type(''); check(doc.querySelector('#tag-error').hidden && choices() === 'shell,setup', 'Clear error lost selection');
      clear(); type('#absent'); enter(); check(!doc.querySelector('#tag-error').hidden && input.value === '#absent', 'Unknown Enter');
      type('#shell'); check(!doc.querySelector('#tag-error').hidden && !choices(), 'Pending correction cleared error');
      enter(); check(doc.querySelector('#tag-error').hidden && choices() === 'shell', 'Committed correction error');
      clear(); type('#missing, #setup'); type('#setup'); check(doc.querySelector('#tag-error').hidden && !choices(), 'Removed error retained by unrelated pending token');
      clear(); pick('shell'); pick('setup'); pick('script'); remove('setup'); check(doc.activeElement.dataset.tag === 'script', 'Middle removal next'); remove('script'); check(doc.activeElement.dataset.tag === 'shell', 'Last removal previous'); clear();
      clear(); type('setup #shell tail', 13); check(input.value === 'setup tail' && input.selectionStart === 6 && choices() === 'shell', 'Mid-input caret/prose');
      clear(); type('prefix#shell '); check(!choices() && input.value === 'prefix#shell ', 'Inside-word token');
      type('https://example.com/#shell '); check(!choices() && input.value === 'https://example.com/#shell ', 'URL fragment token');
      type('https://example.com/a,#shell '); enter(); check(!choices() && input.value === 'https://example.com/a,#shell ', 'Comma inside URL span');
      type('https://example.com/a,#shell #setup '); check(choices() === 'setup' && input.value === 'https://example.com/a,#shell ', 'URL retained alongside real token'); clear();
      type('prose #shell', 2); enter(); check(!choices() && input.value === 'prose #shell', 'Enter outside unfinished candidate');
      input.setSelectionRange(9, 9); enter(); check(choices() === 'shell' && input.value === 'prose ' && input.selectionStart === 6, 'Enter inside unfinished candidate'); clear();
      type('#'); check(count() === 0 && !choices(), 'Bare prefix');
      type('#shell'); check(count() === 4 && !choices(), 'Pending token uses broad recorded text');
      type('##literal '); check(choices() === '#literal' && input.value === '', 'Exactly one prefix'); clear();
      input.dispatchEvent(new win.CompositionEvent('compositionstart')); type('#shell '); enter(); check(!choices() && input.value === '#shell ', 'IME premature');
      input.dispatchEvent(new win.CompositionEvent('compositionend')); check(choices() === 'shell' && input.value === '', 'IME completion'); clear();
      type('#CAFÉ '); check(choices() === 'café', 'Uppercase Unicode input resolves lowercase source'); clear();
      // Every surface consumes the same generated theme pair and tinted treatment.
      toggle.click();
      check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth && input.getBoundingClientRect().width >= 150, 'Viewport/search collapse');
      for (const chip of picker.querySelectorAll('button')) {
        check(win.getComputedStyle(chip).whiteSpace === 'nowrap' && chip.scrollWidth <= chip.clientWidth, 'Wrapped/truncated chip');
        chip.focus(); check(win.getComputedStyle(chip).outlineWidth === '2px', 'Chip focus');
        const a = chip.getBoundingClientRect(), track = picker.getBoundingClientRect();
        if (a.width <= picker.clientWidth) check(a.right <= track.right + 1 && a.left >= track.left - 1, 'Focused chip not scrolled: ' + chip.textContent + '/' + JSON.stringify([a.left, a.right, track.left, track.right]));
        else {
          check(a.right > track.left && a.left < track.right, 'Oversized focused chip not revealed');
          const offset = picker.scrollLeft + a.left - track.left;
          picker.scrollLeft = offset;
          check(chip.getBoundingClientRect().left >= track.left - 1, 'Long label start unreachable');
          picker.scrollLeft = offset + a.width - picker.clientWidth;
          check(chip.getBoundingClientRect().right <= track.right + 1, 'Long label end unreachable');
        }
        for (const span of doc.querySelectorAll('.tag-label')) if (span.dataset.tag === chip.dataset.tag) check(span.getAttribute('style') === chip.getAttribute('style') && win.getComputedStyle(span).color === win.getComputedStyle(chip).color, 'Surface seed/color mismatch');
      }
      for (const button of [...picker.querySelectorAll('button')]) button.click();
      check(!doc.querySelector('#all-tags-selected').hidden && !toggle.disabled && !picker.hidden, 'All-selected state');
      check(selected.scrollWidth > selected.clientWidth && selected.getBoundingClientRect().width > 0, 'Selected scroll track');
      check(!!(selected.compareDocumentPosition(input) & win.Node.DOCUMENT_POSITION_FOLLOWING), 'Selected DOM order must precede search');
      if (width > 740) {
        check(Math.abs(selected.getBoundingClientRect().top - input.getBoundingClientRect().top) < 15, 'Selected not beside search');
        check(selected.getBoundingClientRect().right <= input.getBoundingClientRect().left, 'Selected not LEFT of search');
      } else check(selected.getBoundingClientRect().bottom <= input.getBoundingClientRect().top, 'Selected mobile track must be above search');
      check(picker.getBoundingClientRect().top >= input.getBoundingClientRect().bottom, 'Picker not below search'); clear();
      // Disclosure restoration, same-page retention, exactly one mount, stale listeners.
      const details = [...doc.querySelectorAll('details')].find(d => d.querySelector('summary').textContent === (page ? 'deeper' : 'tools')); if (details) {
        details.open = false; type('deeper'); check(details.open, 'Search did not expand'); type(''); check(!details.open, 'Disclosure restore');
        details.open = true; type('deeper'); type(''); check(details.open, 'Visitor disclosure lost');
      }
      toggle.click(); pick('shell'); type('setup');
      const navigate = async path => { const a = doc.createElement('a'); a.href = path; a.dataset.appLink = ''; doc.querySelector('main').append(a); a.click(); for (let i = 0; win.location.pathname + win.location.hash !== path && i < 100; i++) await wait(); };
      const oldMain = doc.querySelector('main');
      await navigate(prefix + page + '#link-count'); check(doc.querySelector('main') === oldMain && choices() === 'shell' && input.value === 'setup', 'Same-page reset');
      let mounts = 0; const original = win.initSearch; win.initSearch = () => { mounts++; return original(); };
      await navigate(prefix + 'guide/'); check(mounts === 1 && !doc.querySelector('#link-search'), 'Guide mount');
      const oldValue = input.value; type('#setup '); check(input.value === '#setup ' && choices() === 'shell', 'Outgoing input listener');
      picker.querySelector('button[data-tag="setup"]').click(); check(choices() === 'shell', 'Outgoing picker listener');
      win.history.back(); for (let i = 0; !doc.querySelector('#link-search') && i < 100; i++) await wait();
      check(mounts === 2 && doc.querySelector('#link-search').value === '' && doc.querySelector('#selected-tags').hidden && doc.querySelector('#available-tags').hidden, 'Back reset/mount');
      win.history.forward(); for (let i = 0; doc.querySelector('#link-search') && i < 100; i++) await wait(); check(mounts === 3, 'Forward mount');
    }
    await load('/noTags/'); check(frame.contentDocument.querySelector('#tag-toggle').disabled && !frame.contentDocument.querySelector('.search').hidden, 'Untagged search');
    await load('/onlyHidden/'); check(frame.contentDocument.querySelector('.count-number').textContent === '0' && !frame.contentDocument.querySelector('#empty-directory').hidden, 'All-hidden baseline');
    frame.contentDocument.querySelector('#tag-toggle').click(); frame.contentDocument.querySelector('#available-tags button').click(); check(frame.contentDocument.querySelector('.count-number').textContent === '1', 'All-hidden selection');
    document.body.dataset.filtersCheck = 'passed';
  } catch(error) { document.body.dataset.filtersCheck = error.message; } })();
  </script></body></html>`,
  );
  const html = runChrome(chrome, f.cwd, origin + "/filters-check.html");
  assert.match(html, /data-filters-check="passed"/, html);
});

const buildScript = fileURLToPath(new URL("../build.mjs", import.meta.url));

function availableChrome(t) {
  const chrome = process.env.CHROME_BIN || "google-chrome";
  if (spawnSync(chrome, ["--version"]).status === 0) return chrome;
  assert.notEqual(
    process.env.SHL_REQUIRE_BROWSER,
    "1",
    "SHL_REQUIRE_BROWSER=1 requires installed Chrome (set CHROME_BIN if needed)",
  );
  t.skip("Chrome is not installed");
}

function runChrome(chrome, cwd, url, flags = []) {
  // --dump-dom cannot dispatch native Enter/Space; .click() checks below are
  // click/default-action proof only, not browser keyboard activation coverage.
  const result = spawnSync(
    chrome,
    [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--allow-file-access-from-files",
      `--user-data-dir=${join(cwd, "chrome-profile")}`,
      "--virtual-time-budget=20000",
      "--dump-dom",
      ...flags,
      url,
    ],
    { encoding: "utf8", timeout: 25000 },
  );
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

async function browserServer(t, cwd) {
  const server = spawn(
    process.execPath,
    [
      "-e",
      `
    const server = Bun.serve({ port: 0, async fetch(request) {
      const url = new URL(request.url);
      const path = decodeURIComponent(url.pathname).replace(/^\\/project(?=\\/)/, '');
      if (path === '/download-payload.sh')
        return new Response(new Uint8Array([35, 33, 0, 255, 13, 10, 128]), {
          headers: url.searchParams.has('cors') ? { 'Access-Control-Allow-Origin': '*' } : {},
        });
      const file = Bun.file(${JSON.stringify(join(cwd, "dist"))} + path + (path.endsWith('/') ? 'index.html' : ''));
      const headers = url.searchParams.has('native') ? { 'Content-Security-Policy': "script-src 'none'" } : {};
      if (await file.exists()) {
        if (url.searchParams.has('fallback')) {
          const html = (await file.text()).replace(/<meta http-equiv="refresh"[^>]*>/, '').replace(/<script data-behavior="forward">[\\s\\S]*?<\\/script>/, '');
          return new Response(html, { headers: { ...headers, 'Content-Type': 'text/html' } });
        }
        return new Response(file, { headers });
      }
      return new Response(Bun.file(${JSON.stringify(join(cwd, "dist", "404.html"))}), { status: 404 });
    } });
    console.log(server.port);
  `,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  t.after(() => server.kill());
  const port = await new Promise((resolve, reject) => {
    server.stdout.once("data", (data) =>
      resolve(Number(data.toString().trim())),
    );
    server.once("error", reject);
    server.once("exit", (code) =>
      reject(new Error("Preview server exited: " + code)),
    );
  });
  return `http://localhost:${port}`;
}

async function browserControls(t, chrome, cwd) {
  const process = spawn(chrome, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=0",
    `--user-data-dir=${join(cwd, "keyboard-profile")}`,
    "about:blank",
  ]);
  t.after(() => process.kill());
  const endpoint = await new Promise((resolve, reject) => {
    let output = "";
    process.stderr.on("data", (data) => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) resolve(new URL(match[1]));
    });
    process.once("error", reject);
    process.once("exit", (code) => reject(Error("Chrome exited: " + code)));
  });
  const targets = await (
    await fetch(`http://${endpoint.host}/json/list`)
  ).json();
  const socket = new WebSocket(
    targets.find((target) => target.type === "page").webSocketDebuggerUrl,
  );
  t.after(() => socket.close());
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  const pending = new Map();
  const events = new Map();
  let id = 0;
  socket.onmessage = (event) => {
    const response = JSON.parse(event.data);
    if (events.has(response.method)) {
      events.get(response.method)(response.params);
      events.delete(response.method);
    }
    if (pending.has(response.id)) {
      const { resolve, reject } = pending.get(response.id);
      pending.delete(response.id);
      if (response.error) reject(Error(JSON.stringify(response.error)));
      else resolve(response.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    assert.equal(
      result.exceptionDetails,
      undefined,
      JSON.stringify(result.exceptionDetails),
    );
    return result.result.value;
  };
  const key = async (key, code, virtualKey, modifiers = 0) => {
    for (const type of ["keyDown", "keyUp"])
      await send("Input.dispatchKeyEvent", {
        type,
        key,
        code,
        windowsVirtualKeyCode: virtualKey,
        nativeVirtualKeyCode: virtualKey,
        modifiers,
        ...(type === "keyDown" && ["Enter", " "].includes(key)
          ? {
              text: key === "Enter" ? "\r" : " ",
              unmodifiedText: key === "Enter" ? "\r" : " ",
            }
          : {}),
      });
  };
  await send("Page.enable");
  const navigate = async (url) => {
    const loaded = new Promise((resolve) =>
      events.set("Page.loadEventFired", resolve),
    );
    await send("Page.navigate", { url });
    await loaded;
    await send("Page.bringToFront");
  };
  return { send, evaluate, key, navigate };
}

test("native Enter/Space chip and popover activation, typed delimiters, touch and scrolling execute in Chrome", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const f = await fixture(t, {
    tools: {
      code: {
        url: "https://example.com/",
        tags: [
          "shell",
          "setup",
          "a-long-label-that-scrolls-without-truncation",
        ],
      },
    },
  });
  assert.equal(f.build().status, 0);
  const origin = await browserServer(t, f.cwd);
  const { send, evaluate, key, navigate } = await browserControls(
    t,
    chrome,
    f.cwd,
  );
  for (const width of [320, 1440])
    for (const theme of ["light", "dark"])
      for (const path of ["/", "/tools/"]) {
        await send("Emulation.setDeviceMetricsOverride", {
          width,
          height: 900,
          deviceScaleFactor: 1,
          mobile: width === 320,
        });
        await navigate(origin + path);
        for (
          let i = 0;
          i < 100 &&
          !(await evaluate(
            "!!document.querySelector('#link-search') && !document.querySelector('.search').hidden",
          ));
          i++
        )
          await new Promise((resolve) => setTimeout(resolve, 20));
        await evaluate(
          `document.documentElement.dataset.theme = ${JSON.stringify(theme)}; document.querySelector('#tag-toggle').focus()`,
        );
        await key("Enter", "Enter", 13);
        assert.equal(
          await evaluate("document.querySelector('#available-tags').hidden"),
          false,
          `${width}/${theme}/${path}: native Enter opens picker`,
        );
        await evaluate(
          "document.querySelector('#available-tags button[data-tag=shell]').focus()",
        );
        await key(" ", "Space", 32);
        assert.equal(
          await evaluate("document.activeElement.getAttribute('aria-label')"),
          "Remove #shell filter",
        );
        await key("Enter", "Enter", 13);
        assert.equal(
          await evaluate("document.activeElement.id"),
          "link-search",
        );
        await send("Input.insertText", { text: "#setup" });
        await key("Enter", "Enter", 13);
        assert.equal(
          await evaluate(
            "document.querySelector('#selected-tags button').dataset.tag",
          ),
          "setup",
        );
        await evaluate(
          "document.querySelector('#selected-tags button').focus()",
        );
        await key(" ", "Space", 32);
        await send("Input.insertText", { text: "#shell " });
        assert.equal(
          await evaluate(
            "document.querySelector('#selected-tags button').dataset.tag",
          ),
          "shell",
        );
        await evaluate(
          "document.querySelector('#selected-tags button').focus()",
        );
        await key("Enter", "Enter", 13);
        await send("Input.insertText", { text: "#setup," });
        assert.equal(
          await evaluate(
            "document.querySelector('#selected-tags button').dataset.tag",
          ),
          "setup",
        );
        await evaluate(
          "document.querySelector('#selected-tags button').focus()",
        );
        await key("Enter", "Enter", 13);
        await evaluate(
          "for (const d of document.querySelectorAll('details')) d.open = true; document.querySelector('.tags').focus()",
        );
        await key("Enter", "Enter", 13);
        assert.equal(
          await evaluate("!!document.querySelector('.tag-panel:popover-open')"),
          true,
        );
        await key("Escape", "Escape", 27);
        assert.equal(
          await evaluate("!!document.querySelector('.tag-panel:popover-open')"),
          false,
        );
        await send("Emulation.setTouchEmulationEnabled", { enabled: true });
        const point = await evaluate(
          "(() => { const b = document.querySelector('#available-tags button[data-tag=shell]'); b.scrollIntoView({block:'nearest', inline:'nearest'}); const r = b.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()",
        );
        await send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ ...point, id: 1 }],
        });
        await send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        assert.equal(
          await evaluate(
            "document.querySelector('#selected-tags button').dataset.tag",
          ),
          "shell",
        );
        assert.equal(
          await evaluate(
            "getComputedStyle(document.querySelector('.destination')).opacity",
          ),
          "1",
        );
        await send("Emulation.setTouchEmulationEnabled", { enabled: false });
      }
});

async function fixture(t, links, source = "links.json") {
  const cwd = await mkdtemp(join(tmpdir(), "shortlink-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(
    join(cwd, source),
    source === "links.json" ? JSON.stringify(links) : links,
  );
  return {
    cwd,
    build: () =>
      spawnSync(process.execPath, [buildScript], { cwd, encoding: "utf8" }),
    read: (path) => readFile(join(cwd, "dist", path), "utf8"),
  };
}

test("legacy migration guidance requires explicit maintainer renaming before publication", async (t) => {
  for (const property of ["script", "hidden"]) {
    const f = await fixture(t, {
      code: {
        url: "https://example.com/",
        [property]: true,
        tags: [" SHELL ", "a,b", "Valid"],
      },
    });
    const result = f.build();
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /Explicitly rename existing tags containing whitespace, commas, Unicode uppercase\/titlecase characters or emoji to maintainer-chosen valid names; preserve all other valid raw values\. No automatic renaming is performed\./,
    );
  }
});

test("native track scrolling uses Tab focus and horizontal touch gestures without truncating oversized labels", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const long = "a-long-label-that-remains-completely-readable-".repeat(3);
  const f = await fixture(t, {
    tools: {
      code: { url: "https://example.com/", tags: [long, "shell", "setup"] },
    },
  });
  assert.equal(f.build().status, 0);
  const origin = await browserServer(t, f.cwd);
  const { send, evaluate, key, navigate } = await browserControls(
    t,
    chrome,
    f.cwd,
  );
  const visible = async () =>
    assert.equal(
      await evaluate(`(() => {
    const b = document.activeElement, track = b.parentElement, r = b.getBoundingClientRect(), t = track.getBoundingClientRect();
    return b.matches(':focus-visible') && getComputedStyle(b).whiteSpace === 'nowrap' && b.scrollWidth <= b.clientWidth &&
      (r.width > track.clientWidth ? r.left < t.right && r.right > t.left : r.left >= t.left-1 && r.right <= t.right+1);
  })()`),
      true,
    );
  for (const width of [320, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width === 320,
    });
    await navigate(origin + "/tools/");
    await evaluate("document.querySelector('#tag-toggle').focus()");
    await key("Enter", "Enter", 13);
    await key("Tab", "Tab", 9);
    await visible();
    assert.equal(
      await evaluate("document.activeElement.textContent"),
      "#" + long,
    );
    await key("Tab", "Tab", 9);
    await visible();
    assert.equal(await evaluate("document.activeElement.dataset.tag"), "setup");
    assert.ok(
      await evaluate(
        "document.querySelector('#available-tags').scrollLeft > 0",
      ),
    );
    await key("Tab", "Tab", 9, 8);
    await visible();
    // Set up both tracks with the same oversized first label; activation itself
    // has independent native Enter/Space/touch coverage above.
    await evaluate(
      `for(const b of [...document.querySelectorAll('#available-tags button')]) b.click(); const h=document.querySelector('h1'); h.tabIndex=-1; h.focus();`,
    );
    await key("Tab", "Tab", 9);
    await visible();
    assert.equal(
      await evaluate("document.activeElement.textContent"),
      "#" + long,
    );
    await key("Tab", "Tab", 9);
    await visible();
    assert.ok(
      await evaluate("document.querySelector('#selected-tags').scrollLeft > 0"),
    );
    assert.equal(
      await evaluate("document.activeElement.dataset.tag"),
      "setup",
      "Native second selected focus",
    );
    await key("Tab", "Tab", 9, 8);
    await visible();
    assert.equal(
      await evaluate("document.activeElement.textContent"),
      "#" + long,
      "Reverse Tab returns to first selected chip",
    );
    await key("Tab", "Tab", 9);
    assert.equal(
      await evaluate("document.activeElement.dataset.tag"),
      "setup",
      "First selected chip tabs to second",
    );
    await key("Tab", "Tab", 9);
    assert.equal(
      await evaluate("document.activeElement.dataset.tag"),
      "shell",
      "Second selected chip tabs to third",
    );
    await key("Tab", "Tab", 9);
    assert.equal(
      await evaluate("document.activeElement.id"),
      "link-search",
      "Tab follows selected chips into search",
    );
    await key("Tab", "Tab", 9, 8);
    await visible();
    assert.equal(await evaluate("document.activeElement.dataset.tag"), "shell");
    await evaluate(
      "for(const b of [...document.querySelectorAll('#selected-tags button')]) b.click()",
    );
    await send("Emulation.setTouchEmulationEnabled", { enabled: true });
    for (const id of ["available-tags", "selected-tags"]) {
      if (id === "selected-tags")
        await evaluate(
          "for(const b of [...document.querySelectorAll('#available-tags button')]) b.click()",
        );
      await evaluate(
        `{const track = document.getElementById(${JSON.stringify(id)}); track.querySelector('button').focus(); track.scrollIntoView({block:'nearest'});}`,
      );
      const gesture = async (direction) => {
        const point = await evaluate(
          `(() => {const r=document.getElementById(${JSON.stringify(id)}).getBoundingClientRect(); return {x:r.left+(r.width*( ${direction} < 0 ? .8 : .2)), y:r.top+r.height/2, distance:r.width*.6};})()`,
        );
        await send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: point.x, y: point.y, id: 1 }],
        });
        for (let step = 1; step <= 6; step++) {
          await send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              {
                x: point.x + (direction * point.distance * step) / 6,
                y: point.y,
                id: 1,
              },
            ],
          });
          await new Promise((resolve) => setTimeout(resolve, 12));
        }
        await send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await new Promise((resolve) => setTimeout(resolve, 80));
      };
      const geometry = () =>
        evaluate(
          `(() => {const t=document.getElementById(${JSON.stringify(id)}), b=t.querySelector('button'), r=b.getBoundingClientRect(), v=t.getBoundingClientRect(); return {scroll:t.scrollLeft,max:t.scrollWidth-t.clientWidth,left:r.left,right:r.right,trackLeft:v.left,trackRight:v.right,width:r.width,client:t.clientWidth,label:b.textContent,whole:b.scrollWidth<=b.clientWidth};})()`,
        );
      let start = await geometry();
      assert.equal(start.label, "#" + long);
      assert.ok(start.whole && start.width > start.client);
      for (
        let i = 0;
        i < 12 && (await geometry()).scroll < (await geometry()).max - 1;
        i++
      )
        await gesture(-1);
      const end = await geometry();
      assert.ok(
        end.scroll > start.scroll &&
          end.right <= end.trackRight + 1 &&
          end.right > end.trackLeft,
        "Touch reaches oversized label's end: " + JSON.stringify(end),
      );
      for (let i = 0; i < 12 && (await geometry()).scroll > 1; i++)
        await gesture(1);
      start = await geometry();
      assert.ok(
        start.left >= start.trackLeft - 1 && start.left < start.trackRight,
        "Touch returns to oversized label's start: " + JSON.stringify(start),
      );
    }
    await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  }
});

test("native tag edit ranges, multiline clipboard paste and lossless NUL identities regressions", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const links = {
    nul: {
      url: "https://example.com/nul",
      tags: ["a\u0000b", "shell", "setup"],
    },
    replacement: { url: "https://example.com/replacement", tags: ["a\ufffdb"] },
  };
  for (const source of ["links.json", "links.yaml", "links.yml"]) {
    const f = await fixture(
      t,
      source === "links.json" ? links : stringify(links),
      source,
    );
    assert.equal(f.build().status, 0);
    assert.deepEqual(JSON.parse(await f.read("links.json")), links);
  }
  const f = await fixture(t, links);
  assert.equal(f.build().status, 0);
  const origin = await browserServer(t, f.cwd);
  const { send, evaluate, key, navigate } = await browserControls(
    t,
    chrome,
    f.cwd,
  );
  await navigate(origin + "/");
  await evaluate(`
    window.input = document.querySelector('#link-search');
    window.identity = b => JSON.parse(String.fromCharCode(34) + b.dataset.tag + String.fromCharCode(34));
    window.selected = () => [...document.querySelectorAll('#selected-tags button')].map(identity);
    window.setText = (value, start = value.length, end = start) => { input.value = value; input.setSelectionRange(start,end); input.dispatchEvent(new Event('input')); input.focus(); };
    window.clear = () => { for(const b of document.querySelectorAll('#selected-tags button')) b.click(); setText(''); };
  `);
  const set = (text, start = text.length, end = start) =>
    evaluate(`setText(${JSON.stringify(text)},${start},${end})`);
  const invalid = () =>
    evaluate("!document.querySelector('#tag-error').hidden");
  await set("#missing");
  await key("Enter", "Enter", 13);
  assert.equal(await invalid(), true);
  await evaluate("input.setSelectionRange(0,0)");
  await send("Input.insertText", { text: "#shell " });
  assert.deepEqual(
    await evaluate("[input.value,selected(),input.selectionStart]"),
    ["#missing", ["shell"], 0],
  );
  assert.equal(
    await invalid(),
    true,
    "prepend known syntax retains the same attempted occurrence",
  );
  await evaluate("clear()");
  await set("#missing #missing", 0, 9);
  await key("Backspace", "Backspace", 8);
  assert.equal(await evaluate("input.value"), "#missing");
  assert.equal(
    await invalid(),
    false,
    "deleting attempted occurrence must not transfer its error",
  );
  await key("Enter", "Enter", 13); // caret is before the remaining candidate: inside its range
  assert.equal(await invalid(), true);
  await evaluate("input.setSelectionRange(1,8)");
  await send("Input.insertText", { text: "shell" });
  assert.equal(await evaluate("input.value"), "#shell");
  assert.equal(
    await invalid(),
    true,
    "pending corrected candidate remains attempted",
  );
  await key("Enter", "Enter", 13);
  assert.equal(await invalid(), false);
  assert.deepEqual(await evaluate("selected()"), ["shell"]);
  await evaluate("clear()");
  await set("#missing");
  await key("Enter", "Enter", 13);
  await evaluate("input.setSelectionRange(0,input.value.length)");
  await key("Backspace", "Backspace", 8);
  assert.deepEqual(
    await evaluate(
      "[input.value, document.querySelector('#tag-error').hidden]",
    ),
    ["", true],
  );

  // Ordinary native edits should never invoke the JS value setter or selection API.
  await evaluate(`
    window.writes = 0; window.ranges = 0;
    const value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    Object.defineProperty(input,'value',{configurable:true,get(){return value.get.call(this)},set(v){writes++;value.set.call(this,v)}});
    const range = input.setSelectionRange;
    input.setSelectionRange = function(...args){ranges++;return range.apply(this,args)};
  `);
  await send("Input.insertText", { text: "ordinary" });
  await key("Backspace", "Backspace", 8);
  assert.deepEqual(await evaluate("[writes,ranges,input.value]"), [
    0,
    0,
    "ordinar",
  ]);
  for (const type of ["keyDown", "keyUp"])
    await send("Input.dispatchKeyEvent", {
      type,
      modifiers: 2,
      key: "z",
      code: "KeyZ",
      windowsVirtualKeyCode: 90,
    });
  assert.equal(
    await evaluate("input.value"),
    "ordinary",
    "ordinary native deletion remains undoable",
  );
  assert.deepEqual(await evaluate("[writes,ranges]"), [0, 0]);
  await evaluate("delete input.value; delete input.setSelectionRange; clear()");

  // Native paste must expose the unsanitized multiline clipboard event.
  await send("Browser.grantPermissions", {
    origin,
    permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
  });
  await evaluate(
    "input.addEventListener('paste',e => {window.pasteProof = [e.isTrusted,e.clipboardData.getData('text/plain')];})",
  );
  await set("left REPLACE right", 5, 12);
  const clipboard = "#shell\n#setup\nextra\nwords";
  await evaluate(`navigator.clipboard.writeText(${JSON.stringify(clipboard)})`);
  for (const type of ["keyDown", "keyUp"])
    await send("Input.dispatchKeyEvent", {
      type,
      modifiers: 2,
      key: "v",
      code: "KeyV",
      windowsVirtualKeyCode: 86,
    });
  assert.deepEqual(await evaluate("pasteProof"), [true, clipboard]);
  assert.deepEqual(
    await evaluate(
      "[input.value,input.selectionStart,input.selectionEnd,selected()]",
    ),
    ["left extra words right", 16, 16, ["shell", "setup"]],
  );
  await evaluate(
    "clear(); input.dispatchEvent(new CompositionEvent('compositionstart'))",
  );
  await evaluate(
    `{ const data = new DataTransfer(); data.setData('text/plain', ${JSON.stringify("#shell\n#setup\n")}); input.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,cancelable:true})); }`,
  );
  assert.deepEqual(await evaluate("[input.value,selected()]"), [
    "#shell #setup ",
    [],
  ]);
  await evaluate("input.dispatchEvent(new CompositionEvent('compositionend'))");
  assert.deepEqual(await evaluate("[input.value,selected()]"), [
    "",
    ["shell", "setup"],
  ]);
  await evaluate("clear(); document.querySelector('#tag-toggle').click()");
  for (const [tag, code] of [
    ["a\u0000b", "nul"],
    ["a\ufffdb", "replacement"],
  ]) {
    await evaluate(
      `{ const button = [...document.querySelectorAll('#available-tags button')].find(b => identity(b) === ${JSON.stringify(tag)}); button.click(); }`,
    );
    assert.deepEqual(await evaluate("selected()"), [tag]);
    assert.deepEqual(
      await evaluate(
        "[...document.querySelectorAll('.link-row')].filter(r => !r.closest('li').hidden).map(r => r.querySelector('.code').textContent)",
      ),
      [code],
    );
    assert.equal(
      await evaluate(
        `identity(document.querySelector('li:not([hidden]) .tag-label'))`,
      ),
      tag,
    );
    await evaluate("clear()");
  }
});

const behaviorScript = (html, name) => {
  const matches = [
    ...html.matchAll(
      new RegExp(
        `<script data-behavior="${name}">([\\s\\S]*?)<\\/script>`,
        "g",
      ),
    ),
  ];
  assert.equal(matches.length, 1, `one ${name} script`);
  return matches[0][1];
};

test("native assets are copied module-relatively and embedded documents preserve source content", async (t) => {
  // Fixtures run the builder from an unrelated cwd without a src/assets folder.
  const f = await fixture(t, {
    safe: "https://example.com/?q=</script>&quote='\"",
  });
  assert.equal(f.build().status, 0);
  for (const name of [
    "site.css",
    "theme.js",
    "search.js",
    "copy.js",
    "download.js",
    "navigation.js",
  ]) {
    const source = await readFile(
      new URL(`../src/assets/${name}`, import.meta.url),
      "utf8",
    );
    assert.equal(
      await f.read(`assets/${name}`),
      source,
      name + " is copied verbatim",
    );
    if (name === "site.css" || name === "theme.js") {
      for (const path of [
        "404.html",
        "safe/index.html",
        "about/index.html",
        "how-it-works/index.html",
      ]) {
        const html = await f.read(path);
        if (name === "site.css")
          assert.ok(html.includes(`<style>${source}</style>`), path);
        else assert.equal(behaviorScript(html, "theme"), source, path);
      }
    }
  }
  let destination;
  runInNewContext(behaviorScript(await f.read("safe/index.html"), "forward"), {
    location: {
      replace: (value) => {
        destination = value;
      },
    },
  });
  assert.equal(destination, "https://example.com/?q=</script>&quote='\"");
});

test("build produces a minimal site, copies the map and CNAME, and cleans stale output", async (t) => {
  const links = {
    Mixed: { url: "https://example.com/path", title: "Example" },
    plain: "http://example.org/",
  };
  const f = await fixture(t, links);
  await writeFile(join(f.cwd, "CNAME"), "go.example.com\n");
  await mkdir(join(f.cwd, "dist"));
  await writeFile(join(f.cwd, "dist", "stale.html"), "old");
  const result = f.build();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(await f.read("links.json")), links);
  assert.equal(await f.read("CNAME"), "go.example.com\n");
  assert.equal(await f.read(".nojekyll"), "");
  await assert.rejects(f.read("stale.html"), { code: "ENOENT" });
  assert.match(
    await f.read("index.html"),
    /href="\.\/Mixed\/" title="Example">Mixed<\/a>/,
  );
  assert.match(await f.read("index.html"), /data-title="Example"/);
  assert.match(await f.read("Mixed/index.html"), /http-equiv="refresh"/);
  assert.match(await f.read("plain/index.html"), /http:\/\/example.org\//);
});

test("YAML sources generate the same site and public JSON map as JSON", async (t) => {
  const links = {
    gh: "https://github.com/",
    Run: {
      url: "https://example.com/setup.sh",
      title: "Setup #1",
      tags: ["setup", "shell", "hidden", "script"],
    },
  };
  const yaml = `gh: https://github.com/
Run:
  url: https://example.com/setup.sh
  title: 'Setup #1'
  tags: [setup, shell, hidden, script]
`;
  const json = await fixture(t, links);
  assert.equal(json.build().status, 0);
  for (const source of ["links.yaml", "links.yml"]) {
    const f = await fixture(t, yaml, source);
    const result = f.build();
    assert.equal(result.status, 0, result.stderr);
    for (const path of [
      "links.json",
      "404.html",
      "Run/index.html",
      "Run.sh",
      "index.html",
    ]) {
      assert.equal(
        await f.read(path),
        await json.read(path),
        `${source}: ${path}`,
      );
    }
    assert.doesNotMatch(
      await f.read("index.html"),
      /Simple by design|Good links/,
    );
    assert.match(
      await f.read("guide/index.html"),
      new RegExp(`<code>${source.replace(".", "\\.")}<\\/code>`),
    );
    assert.deepEqual(JSON.parse(await f.read("links.json")), links);
  }
});

test("missing, conflicting, malformed, or invalid YAML input preserves the prior build", async (t) => {
  const f = await fixture(
    t,
    "Run:\n  url: https://example.com/setup.sh\n",
    "links.yaml",
  );
  await mkdir(join(f.cwd, "dist"));
  await writeFile(join(f.cwd, "dist", "marker"), "preserved");
  const fails = (pattern) => {
    const result = f.build();
    assert.equal(result.status, 1);
    assert.match(result.stderr, pattern);
  };
  await writeFile(join(f.cwd, "links.json"), "{}");
  fails(/expected exactly one.*links\.json, links\.yaml/);
  await unlink(join(f.cwd, "links.json"));
  await writeFile(join(f.cwd, "links.yml"), "{}");
  fails(/expected exactly one.*links\.yaml, links\.yml/);
  await unlink(join(f.cwd, "links.yml"));
  for (const [value, pattern] of [
    ["Run: [", /Fix links\.yaml/],
    [
      "Run: https://example.com/\nRun: https://example.org/\n",
      /unique|duplicate/i,
    ],
    [
      "Run:\n  url: https://example.com/\n  script: yes\n",
      /script property is no longer supported; remove it\. Only for script: true, append script to tags unless a trimmed case-insensitive equivalent already exists; preserve all other tags, fields and order\. False must not remove an independently configured script tag\./,
    ],
    [
      "Run:\n  url: https://example.com/\n  hidden: yes\n",
      /hidden property is no longer supported; remove it\. Only for hidden: true, append hidden to tags unless already present \(case-insensitive\); preserve all existing tags\./,
    ],
    [
      'Run:\n  url: https://example.com/\n  tags: [ok, " "]\n',
      /tags must be an array of nonblank strings/,
    ],
    ["- https://example.com/\n", /expected an object mapping/],
    ["!!set {Run: null}\n", /expected an object mapping/],
    ["tools: &tools\n  again: *tools\n", /directory cannot contain itself/],
  ]) {
    await writeFile(join(f.cwd, "links.yaml"), value);
    fails(pattern);
    assert.equal(await f.read("marker"), "preserved");
  }
  await unlink(join(f.cwd, "links.yaml"));
  fails(/expected exactly one.*none/);
  assert.equal(await f.read("marker"), "preserved");
});

test("homepage lists sorted links safely with project-relative URLs and handles an empty map", async (t) => {
  const url = 'https://example.com/?q=<img>&x="quoted"';
  const f = await fixture(t, {
    zebra: url,
    Alpha: { url, title: "<script>title</script>" },
    beta: { url, title: "" },
  });
  assert.equal(f.build().status, 0);
  const html = await f.read("index.html");
  const codes = [
    ...html.matchAll(
      /class="code" href="([^"]+)"(?: title="[^"]*")?>([^<]+)<\/a>/g,
    ),
  ];
  assert.deepEqual(
    codes.map((match) => match[2]),
    ["Alpha", "beta", "zebra"],
  );
  for (const [, href, code] of codes) {
    for (const prefix of ["/", "/project/"]) {
      assert.equal(
        new URL(href, `https://example.org${prefix}`).pathname,
        `${prefix}${code}/`,
      );
    }
  }
  assert.match(html, /&lt;script&gt;title&lt;\/script&gt;/);
  assert.match(
    html,
    /https:\/\/example\.com\/\?q=&lt;img&gt;&amp;x=&quot;quoted&quot;/,
  );
  assert.doesNotMatch(html, /<script>title|<img|undefined/);
  assert.match(
    html,
    /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">\s*<span class="count-number">3<\/span\s*><span class="count-label"> links<\/span>\s*<\/h1>/,
  );
  const liveHeading = html.match(
    /<h1\b[^>]*aria-live="polite"[^>]*>[\s\S]*?<\/h1>/,
  )[0];
  assert.doesNotMatch(
    liveHeading,
    /aria-hidden="true"/,
    "the single live heading exposes both its number and label",
  );
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.doesNotMatch(
    html,
    /<h[1-6]>Links<\/h[1-6]>|data-visible=|data-total=/,
  );
  assert.match(html, /<ul class="links">[\s\S]*href="\.\/Alpha\/"/); // Browsable before scripts run.
  const empty = await fixture(t, {});
  assert.equal(empty.build().status, 0);
  const emptyHtml = await empty.read("index.html");
  assert.match(
    emptyHtml,
    /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">\s*<span class="count-number">0<\/span\s*><span class="count-label"> links<\/span>\s*<\/h1>/,
  );
  assert.equal([...emptyHtml.matchAll(/<h1\b/g)].length, 1);
  assert.match(emptyHtml, /id="tag-toggle"[^>]*disabled\s*>\s*Show tags/);
  assert.match(emptyHtml, /No links available yet\./);
});

test("nested JSON and YAML build themed directory pages and redirects", async (t) => {
  const links = {
    tools: {
      git: "https://git-scm.com/",
      editors: {
        Code: { url: 'https://example.org/?x=<img>&q="', title: "<Editor>" },
      },
    },
    gh: "https://github.com/",
  };
  const f = await fixture(t, links);
  assert.equal(f.build().status, 0);
  const home = await f.read("index.html");
  assert.match(
    home,
    /<details><summary><a href="\.\/tools\/" data-app-link>tools<\/a><\/summary>/,
  );
  assert.match(
    home,
    /href="\.\/tools\/editors\/Code\/" title="&lt;Editor&gt;">Code<\/a>/,
  );
  assert.match(home, /data-title="&lt;Editor&gt;"/);
  assert.match(home, /class="link-row" title="&lt;Editor&gt;"/);
  assert.doesNotMatch(home, /<img>/);
  const tools = await f.read("tools/index.html");
  assert.match(tools, /href="\.\.\/assets\/site\.css"/);
  for (const page of [home, tools])
    assert.match(
      page,
      /<div class="directory-toggles">\s*<button\s+id="tag-toggle"[^>]*disabled\s*>\s*Show tags\s*<\/button>\s*<\/div>/,
    );
  assert.match(
    home,
    /<nav class="breadcrumbs" aria-label="Breadcrumb">Home<\/nav>/,
  );
  assert.match(
    tools,
    /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">\s*<span class="count-number">2<\/span\s*><span class="count-label"> links<\/span>\s*<\/h1>/,
  );
  assert.equal([...tools.matchAll(/<h1\b/g)].length, 1);
  assert.doesNotMatch(tools, /<h1>tools<\/h1>/);
  assert.match(
    tools,
    /<nav class="breadcrumbs" aria-label="Breadcrumb">.*Home<\/a> \/ tools<\/nav>/,
  );
  assert.match(tools, /href="\.\/git\/">git<\/a>/);
  assert.match(
    tools,
    /<summary><a href="\.\/editors\/" data-app-link>editors<\/a><\/summary>/,
  );
  assert.ok(
    tools.indexOf('class="directory-tools"') <
      tools.indexOf('class="breadcrumbs"'),
  );
  const editors = await f.read("tools/editors/index.html");
  assert.match(editors, /href="\.\.\/\.\.\/assets\/site\.css"/);
  assert.match(
    editors,
    /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">\s*<span class="count-number">1<\/span\s*><span class="count-label"> link<\/span>\s*<\/h1>/,
  );
  assert.equal([...editors.matchAll(/<h1\b/g)].length, 1);
  assert.match(editors, /href="\.\.\/\.\.\/" data-app-link>Home<\/a>/);
  assert.match(editors, /href="\.\.\/" data-app-link>tools<\/a>/);
  assert.match(editors, /href="\.\/Code\/" title="&lt;Editor&gt;">Code<\/a>/);
  assert.match(editors, /class="link-row" title="&lt;Editor&gt;"/);
  for (const prefix of ["/", "/project/"]) {
    assert.equal(
      new URL("./tools/editors/Code/", `https://example.org${prefix}`).pathname,
      `${prefix}tools/editors/Code/`,
    );
  }
  assert.match(
    await f.read("tools/git/index.html"),
    /https:\/\/git-scm\.com\//,
  );
  assert.match(await f.read("tools/editors/Code/index.html"), /&lt;img&gt;/);
  const css = await f.read("assets/site.css");
  assert.doesNotMatch(
    css,
    /\.links li\s*\{[^}]*border-bottom|\.links \.links\s*\{[^}]*border-left/,
  );
  assert.doesNotMatch(
    css,
    /directory-page|\.site-head\s*\{[^}]*border|\.footer\s*\{[^}]*border/,
  );
  assert.match(
    css,
    /\.prose section\s*\{\s*border-top:\s*1px solid var\(--line\)/,
  );
  assert.match(css, /\.code\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /\.destination-start\s*\{[^}]*text-overflow:\s*ellipsis/);
  assert.deepEqual(JSON.parse(await f.read("links.json")), links);
  const yaml = await fixture(
    t,
    'tools:\n  git: https://git-scm.com/\n  editors:\n    Code:\n      url: https://example.org/?x=<img>&q="\n      title: <Editor>\ngh: https://github.com/\n',
    "links.yaml",
  );
  assert.equal(yaml.build().status, 0);
  for (const path of ["links.json", "tools/editors/Code/index.html"]) {
    assert.equal(await yaml.read(path), await f.read(path), path);
  }
  assert.match(
    await yaml.read("tools/editors/index.html"),
    /href="\.\/Code\/" title="&lt;Editor&gt;">Code<\/a>/,
  );
});

for (const prefix of ["/", "/project/"])
  test(`app navigation swaps pages, handles sections/history, mounts controls, and preserves native actions at ${prefix}`, async (t) => {
    const f = await fixture(t, {
      tools: {
        git: "https://git-scm.com/",
        editors: { Code: "https://example.org/" },
      },
      hidden: {
        secret: { url: "https://example.org/private", tags: ["hidden"] },
      },
    });
    assert.equal(f.build().status, 0);
    const emptySite = await fixture(t, {});
    assert.equal(emptySite.build().status, 0);
    const base = `https://short.example${prefix}`;
    const pages = new Map(
      await Promise.all(
        ["", "guide/", "tools/", "tools/editors/", "hidden/", "tools/git/"].map(
          async (path) => [`${base}${path}`, await f.read(`${path}index.html`)],
        ),
      ),
    );
    assert.match(pages.get(base), /src="\.\/assets\/navigation\.js"/);
    assert.match(
      pages.get(base + "tools/"),
      /src="\.\.\/assets\/navigation\.js"/,
    );
    assert.match(await f.read("guide/index.html"), /navigation\.js/);

    const location = {
      href: base + "guide/#about",
      get pathname() {
        return new URL(this.href).pathname;
      },
      get origin() {
        return new URL(this.href).origin;
      },
      assign(url) {
        this.assigned = url;
      },
    };
    const makeLink = (href, base, app = true) => ({
      app,
      dataset: {},
      raw: href,
      get href() {
        return new URL(this.raw, base || location.href).href;
      },
      set href(value) {
        this.raw = value;
      },
      get pathname() {
        return new URL(this.href).pathname;
      },
      get origin() {
        return new URL(this.href).origin;
      },
      getAttribute() {
        return this.raw;
      },
      hasAttribute(name) {
        return name === "download" && !!this.download;
      },
      setAttribute(name, value) {
        this[name] = value;
      },
      removeAttribute(name) {
        delete this[name];
      },
    });
    const anchors = (html, url) =>
      [...html.matchAll(/<a\b([^>]*)>/g)].map((match) => {
        const attributes = Object.fromEntries(
          [...match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(
            (attribute) => [attribute[1], attribute[2] ?? ""],
          ),
        );
        const link = makeLink(
          attributes.href,
          url,
          "data-app-link" in attributes,
        );
        link.dataset = Object.fromEntries(
          Object.entries(attributes)
            .filter(([name]) => name.startsWith("data-"))
            .map(([name, value]) => [name.slice(5), value]),
        );
        link.hasAttribute = (name) => name in attributes;
        for (const name of ["class", "target", "aria-current"])
          if (name in attributes) link[name] = attributes[name];
        return link;
      });
    const main = (html, url) => {
      const content = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] || "";
      const links = anchors(content, url);
      const heading = content.includes("<h1")
        ? {
            focus(options) {
              this.focused = options.preventScroll;
            },
          }
        : null;
      const ids = [...content.matchAll(/id="([^"]+)"/g)].map((match) => ({
        id: match[1],
        focus(options) {
          this.focused = options.preventScroll;
        },
        scrollIntoView() {
          this.scrolled = true;
          window.scrollY = 400;
        },
      }));
      const control = (extra = {}) => ({
        handlers: new Map(),
        ...extra,
        addEventListener(name, callback) {
          const handlers = this.handlers.get(name) || [];
          handlers.push(callback);
          this.handlers.set(name, handlers);
        },
        removeEventListener(name, callback) {
          this.handlers.set(
            name,
            this.handlers.get(name).filter((handler) => handler !== callback),
          );
        },
        setAttribute(name, value) {
          this[name] = value;
        },
      });
      const elements = {};
      if (content.includes('id="link-search"')) {
        elements["#link-search"] = control({
          value: "",
          parentElement: { hidden: true },
        });
        elements["#search-status"] = { textContent: "", hidden: true };
        elements["#copy-status"] = { textContent: "" };
        elements["#download-status"] = { textContent: "" };
        elements["#link-count"] = { textContent: "" };
        if (content.includes('id="empty-directory"'))
          elements["#empty-directory"] = { hidden: false };
        const children = [
          ...content.matchAll(/<li([^>]*)><div class="link-row/g),
        ].map((match) => ({
          dataset: {
            search: match[1].match(/data-search="([^"]*)"/)?.[1],
            ...(match[1].includes("data-hidden") ? { hidden: "true" } : {}),
          },
          firstElementChild: { tagName: "DIV" },
        }));
        elements[".links"] = control({
          children,
          parentElement: { hidden: !!elements["#empty-directory"] },
        });
      }
      return {
        links,
        heading,
        ids,
        elements,
        dataset: { appPage: html.match(/data-app-page="([^"]+)"/)?.[1] },
        querySelectorAll(selector) {
          if (selector === "script")
            return [
              {
                remove() {
                  document.scriptsRemoved++;
                },
              },
            ];
          if (selector === "[id]") return ids;
          return links;
        },
        querySelector(selector) {
          return selector === "h1" ? heading : elements[selector] || null;
        },
        replaceWith(next) {
          document.currentMain = next;
        },
      };
    };
    const entryHtml = pages.get(base + "guide/");
    const headerHtml = entryHtml.match(/<header\b[^>]*>[\s\S]*?<\/header>/)[0];
    const footerHtml = entryHtml.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)[0];
    const headerLinks = anchors(headerHtml, location.href);
    const footerLinks = anchors(footerHtml, location.href);
    const shellLinks = [...headerLinks, ...footerLinks];
    const hasClass = (html, name) =>
      html
        .match(/^<\w+\b[^>]*class="([^"]*)"/)?.[1]
        .split(/\s+/)
        .includes(name);
    const persistentLinks = [
      ...(hasClass(headerHtml, "site-head") ? headerLinks : []),
      ...(hasClass(footerHtml, "footer") ? footerLinks : []),
    ];
    const brand = headerLinks.find((link) => link.class === "brand");
    const guide = headerLinks.find((link) => link.dataset.nav === "guide");
    const linksNav = headerLinks.find((link) => link.dataset.nav === "links");
    const footerGuide = footerLinks.find((link) => link.app);
    assert.ok(
      brand?.app && guide?.app && linksNav?.app && footerGuide?.app,
      "generated shell links carry app markers and navigation keys",
    );
    const themeButton = {
      addEventListener(name, callback) {
        this[name] = callback;
      },
    };
    const listeners = {};
    const document = {
      title: entryHtml.match(/<title>([^<]+)<\/title>/)[1],
      scriptsRemoved: 0,
      documentElement: { dataset: {} },
      currentMain: main(pages.get(base + "guide/"), location.href),
      querySelector(selector) {
        return selector === "[data-theme-control]"
          ? themeButton
          : selector === ".brand"
            ? brand
            : selector === "main"
              ? this.currentMain
              : this.currentMain.querySelector(selector);
      },
      querySelectorAll(selector) {
        return selector === "[data-nav]"
          ? shellLinks.filter((link) => link.hasAttribute("data-nav"))
          : selector === ".site-head a, .footer a"
            ? persistentLinks
            : [];
      },
      addEventListener(name, callback) {
        listeners[name] = callback;
      },
    };
    const history = {
      pushState(_state, _unused, url) {
        location.href = url;
        this.pushed = (this.pushed || 0) + 1;
      },
    };
    const window = {
      scrollY: 0,
      addEventListener(name, callback) {
        listeners[name] = callback;
      },
      scrollTo(options) {
        this.scrollY = options.top;
        this.scrollBehavior = options.behavior;
      },
    };
    let heldUrl, release;
    const fetched = [];
    const fetchOverrides = new Map();
    const fetch = async (url, options) => {
      fetched.push(url);
      assert.ok(options.signal instanceof AbortSignal);
      if (fetchOverrides.has(url))
        return fetchOverrides.get(url)(options.signal);
      if (url === heldUrl)
        await new Promise((resolve) => {
          release = resolve;
        });
      return { ok: pages.has(url), text: async () => pages.get(url) };
    };
    class DOMParser {
      parseFromString(html) {
        const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
        const url = [...pages].find(([, page]) => page === html)?.[0];
        return {
          querySelector: (selector) =>
            selector === "title"
              ? title && { textContent: title }
              : selector === "main[data-app-page]" &&
                  html.includes("data-app-page=")
                ? main(html, url)
                : null,
        };
      }
    }
    const copied = [];
    const timers = new Map();
    let timer = 0;
    let shortTimeout = false;
    const context = createContext({
      document,
      location,
      history,
      window,
      fetch,
      DOMParser,
      URL,
      AbortSignal: {
        timeout(ms) {
          assert.equal(ms, 10000);
          return AbortSignal.timeout(shortTimeout ? 10 : ms);
        },
      },
      localStorage: { getItem: () => "dark" },
      navigator: {
        clipboard: { writeText: async (text) => copied.push(text) },
      },
      clearTimeout: (id) => timers.delete(id),
      setTimeout: (callback) => {
        timers.set(++timer, callback);
        return timer;
      },
    });
    const assetOrder = [];
    for (const tag of entryHtml.matchAll(/<script\b([^>]*)><\/script>/g)) {
      assert.match(tag[1], /\bdefer\b/);
      const src = tag[1].match(/src="([^"]+)"/)[1];
      const asset = new URL(src, location.href).href.slice(base.length);
      assetOrder.push(asset);
      runInContext(await f.read(asset), context);
      // This VM isolates navigation's mount ownership; real search integration
      // (including outgoing listener cleanup) executes in the browser matrix.
      if (asset === "assets/search.js")
        context.initSearch = () => {
          const input = document.querySelector("#link-search");
          if (input) input.addEventListener("input", () => {});
        };
    }
    assert.deepEqual(assetOrder, [
      "assets/theme.js",
      "assets/search.js",
      "assets/copy.js",
      "assets/download.js",
      "assets/navigation.js",
    ]);
    assert.equal(themeButton.textContent, "Theme: dark");
    assert.equal(typeof themeButton.click, "function");
    assert.equal(brand.href, base);
    assert.equal(guide.href, base + "guide/");
    assert.equal(history.scrollRestoration, "manual");
    assert.equal(
      document.currentMain.ids.find((id) => id.id === "about").focused,
      true,
    );
    assert.equal(fetched.length, 0);

    const click = async (link, options = {}) => {
      let prevented = false;
      listeners.click({
        button: 0,
        defaultPrevented: false,
        target: {
          closest: (selector) =>
            selector === "a[data-app-link]" && link?.app ? link : null,
        },
        preventDefault() {
          prevented = true;
        },
        ...options,
      });
      await new Promise((resolve) => setImmediate(resolve));
      return prevented;
    };
    const folder = (suffix) =>
      document.currentMain.links.find((link) => link.href.endsWith(suffix));
    assert.equal(await click(brand), true);
    assert.equal(document.title, "Links · shl");
    history.pushed = 0;
    assert.equal(await click(null), false); // Redirect and destination links remain native.
    assert.equal(await click(folder("/tools/"), { ctrlKey: true }), false);
    assert.equal(await click(folder("/tools/")), true);
    assert.equal(location.pathname, prefix + "tools/");
    assert.equal(document.title, "tools · shl");
    assert.equal(document.currentMain.heading.focused, true);
    assert.equal(folder("/tools/git/").href, base + "tools/git/");
    assert.equal(guide.href, base + "guide/");
    assert.equal(
      document.currentMain.elements["#link-search"].handlers.get("input")
        .length,
      1,
    );
    assert.equal(
      document.currentMain.elements[".links"].handlers.get("click").length,
      2,
    );
    window.scrollY = 250;
    assert.equal(await click(folder("/tools/editors/")), true);
    assert.equal(history.pushed, 2);
    assert.equal(location.pathname, prefix + "tools/editors/");
    assert.equal(window.scrollY, 0);
    heldUrl = base + "tools/";
    location.href = heldUrl;
    listeners.popstate();
    location.href = base + "tools/editors/";
    listeners.popstate();
    release();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(document.title, "editors · shl"); // A late Back response cannot replace the Forward page.
    heldUrl = null;
    location.href = base + "tools/";
    listeners.popstate();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(document.title, "tools · shl");
    assert.equal(window.scrollY, 250);
    assert.equal(window.scrollBehavior, "instant");
    location.href = base;
    listeners.popstate();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(document.title, "Links · shl");
    assert.equal(await click(folder("/hidden/")), true);
    const controls = document.currentMain.elements;
    assert.equal(controls["#link-search"].handlers.get("input").length, 1);
    assert.equal(controls[".links"].handlers.get("click").length, 2);
    controls["#link-search"].value = "missing";
    controls["#link-search"].handlers.get("input")[0]();
    const copyLink = {
      href: base + "hidden/secret/",
      hasAttribute: () => false,
      classList: { contains: () => true },
    };
    await controls[".links"].handlers.get("click")[0]({
      button: 0,
      target: { closest: () => copyLink },
      preventDefault() {},
    });
    assert.equal(copied.length, 1);
    assert.equal(timers.size, 1);
    assert.equal(await click(footerGuide), true);
    assert.equal(timers.size, 0);
    assert.equal(controls["#copy-status"].textContent, "");
    assert.equal(controls[".links"].handlers.get("click").length, 0);
    assert.equal(document.title, "Guide · shl");
    assert.equal(guide["aria-current"], "page");
    assert.equal(linksNav["aria-current"], undefined);
    assert.equal(document.documentElement.dataset.theme, "dark");
    assert.equal(footerGuide.href, base + "guide/");
    const guideMain = document.currentMain;
    const beforeSections = fetched.length;
    assert.equal(await click(folder("#how-to-use")), true);
    assert.equal(location.href, base + "guide/#how-to-use");
    assert.equal(
      guideMain.ids.find((id) => id.id === "how-to-use").focused,
      true,
    );
    window.scrollY = 550;
    assert.equal(await click(folder("#about")), true);
    location.href = base + "guide/#how-to-use";
    listeners.popstate();
    assert.equal(window.scrollY, 550);
    assert.equal(window.scrollBehavior, "instant");
    assert.equal(document.currentMain, guideMain);
    assert.equal(fetched.length, beforeSections);
    assert.equal(await click(makeLink(base + "guide/#missing")), true);
    assert.equal(guideMain.heading.focused, true);
    assert.equal(await click(guide), true); // Current route without fragment returns to top.
    assert.equal(window.scrollY, 0);
    heldUrl = base + "tools/";
    const pending = click(makeLink(heldUrl));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(await click(guide), true); // Same-route click invalidates the fetch.
    release();
    await pending;
    assert.equal(document.currentMain, guideMain);
    heldUrl = null;
    assert.equal(await click(makeLink(base + "hidden/")), true);
    assert.equal(linksNav["aria-current"], "page");
    assert.equal(document.currentMain.elements["#link-search"].value, "");
    assert.equal(
      document.currentMain.elements["#empty-directory"].hidden,
      false,
    );
    assert.equal(await click(makeLink(base + "guide/#how-it-works")), true);
    assert.equal(
      document.currentMain.ids.find((id) => id.id === "how-it-works").scrolled,
      true,
    );
    const beforeNative = fetched.length;
    for (const options of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
      { defaultPrevented: true },
    ])
      assert.equal(await click(brand, options), false);
    for (const attrs of [{ target: "_blank" }, { download: true }])
      assert.equal(await click(Object.assign(makeLink(base), attrs)), false);
    for (const link of [
      makeLink(base + "tools/git/", undefined, false),
      makeLink("https://example.org/", undefined, false),
      makeLink(base + "tools/git.sh", undefined, false),
    ])
      assert.equal(await click(link), false);
    assert.equal(fetched.length, beforeNative);
    assert.ok(document.scriptsRemoved > 0);
    assert.equal(await click(makeLink(base + "tools/git/")), true);
    assert.equal(location.assigned, base + "tools/git/"); // A redirect page is never injected.
    pages.delete(base + "tools/");
    assert.equal(await click(makeLink(base + "tools/")), true);
    assert.equal(location.assigned, base + "tools/");
    assert.equal(await click(makeLink("https://other.example/tools/")), false);
    pages.set(base, await emptySite.read("index.html"));
    assert.equal(await click(brand), true);
    assert.equal(document.title, "Links · shl");
    assert.equal(document.currentMain.elements["#link-search"], undefined);
    assert.equal(await click(makeLink(base + "hidden/")), true);
    assert.equal(
      document.currentMain.elements["#link-search"].handlers.get("input")
        .length,
      1,
    );
    assert.equal(await click(brand), true);
    assert.equal(await click(guide), true);
    assert.equal(await click(makeLink(base + "hidden/")), true);
    assert.equal(
      document.currentMain.elements[".links"].handlers.get("click").length,
      2,
    );

    const tick = () => new Promise((resolve) => setImmediate(resolve));
    pages.set(base + "tools/", await f.read("tools/index.html"));
    const response = (path) => ({
      ok: true,
      text: async () => pages.get(base + path),
    });
    const deferFetch = (url) => {
      let resolve, reject;
      fetchOverrides.set(
        url,
        () =>
          new Promise((yes, no) => {
            resolve = yes;
            reject = no;
          }),
      );
      return {
        resolve: (value) => resolve(value),
        reject: (error) => reject(error),
      };
    };
    // Two distinct clicks complete in reverse order; only the newest may commit.
    const first = deferFetch(base + "tools/");
    const second = deferFetch(base + "guide/");
    await click(makeLink(base + "tools/"));
    await click(guide);
    second.resolve(response("guide/"));
    await tick();
    const winner = document.currentMain;
    const pushed = history.pushed;
    location.assigned = undefined;
    first.resolve(response("tools/"));
    await tick();
    assert.equal(document.currentMain, winner);
    assert.equal(location.href, base + "guide/");
    assert.equal(history.pushed, pushed);
    assert.equal(location.assigned, undefined);
    fetchOverrides.delete(base + "guide/");
    // A superseded request rejecting must not perform a native fallback either.
    const stale = deferFetch(base + "tools/");
    await click(makeLink(base + "tools/"));
    await click(makeLink(base + "hidden/"));
    const newer = document.currentMain;
    const newerPushed = history.pushed;
    stale.reject(new Error("stale fetch failed"));
    await tick();
    assert.equal(document.currentMain, newer);
    assert.equal(location.href, base + "hidden/");
    assert.equal(history.pushed, newerPushed);
    assert.equal(location.assigned, undefined);
    fetchOverrides.delete(base + "tools/");

    // Save scrolling done while the fetch was in flight, just before replacement.
    await click(guide);
    const slow = deferFetch(base + "tools/");
    window.scrollY = 180;
    await click(makeLink(base + "tools/"));
    window.scrollY = 360;
    slow.resolve(response("tools/"));
    await tick();
    location.href = base + "guide/";
    listeners.popstate();
    await tick();
    assert.equal(window.scrollY, 360);
    assert.equal(window.scrollBehavior, "instant");
    fetchOverrides.delete(base + "tools/");

    const valid = pages.get(base + "hidden/");
    for (const [name, html] of [
      ["missing-title", valid.replace(/<title>[\s\S]*?<\/title>/, "")],
      ["missing-heading", valid.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, "")],
      [
        "unsupported-marker",
        valid.replace('data-app-page="links"', 'data-app-page="redirect"'),
      ],
    ]) {
      const url = base + name + "/";
      pages.set(url, html);
      const before = document.currentMain;
      const beforePushed = history.pushed;
      await click(makeLink(url));
      assert.equal(location.assigned, url);
      assert.equal(document.currentMain, before);
      assert.equal(history.pushed, beforePushed);
    }
    const aborted = (signal) =>
      new Promise((_, reject) =>
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        }),
      );
    for (const [name, handler, timed] of [
      ["fetch-timeout", (signal) => aborted(signal), true],
      [
        "body-timeout",
        (signal) => ({ ok: true, text: () => aborted(signal) }),
        true,
      ],
      [
        "fetch-rejection",
        () => {
          throw new Error("network rejected");
        },
        false,
      ],
      [
        "body-rejection",
        () => ({
          ok: true,
          text: async () => {
            throw new Error("body rejected");
          },
        }),
        false,
      ],
    ]) {
      const url = base + name + "/";
      fetchOverrides.set(url, handler);
      shortTimeout = timed;
      location.assigned = undefined;
      const before = document.currentMain;
      const beforePushed = history.pushed;
      await click(makeLink(url));
      if (timed) await new Promise((resolve) => setTimeout(resolve, 30));
      assert.equal(location.assigned, url, name + " uses native navigation");
      assert.equal(document.currentMain, before);
      assert.equal(history.pushed, beforePushed);
    }
  });

test("hidden links and hidden-only folders are hidden by default but keep their resources", async (t) => {
  const links = {
    visible: "https://example.com/visible",
    shown: { url: "https://example.com/shown" },
    secret: {
      url: "https://example.com/secret",
      tags: ["hidden", "script"],
    },
    tools: {
      public: "https://example.com/public",
      private: {
        deep: {
          SecretCode: { url: "https://example.com/deep", tags: ["hidden"] },
        },
      },
      nested: {
        hiddenOnly: {
          HiddenDeep: {
            url: "https://example.com/hidden-deep",
            tags: ["hidden"],
          },
        },
        branch: {
          further: { VisibleDeep: "https://example.com/visible-deep" },
        },
      },
    },
    onlyHidden: {
      nested: {
        OtherSecret: { url: "https://example.com/other", tags: ["hidden"] },
      },
    },
  };
  const f = await fixture(t, links);
  assert.equal(f.build().status, 0);
  for (const page of ["index.html", "tools/index.html"]) {
    const html = await f.read(page);
    assert.match(
      html,
      /<div class="directory-toggles">\s*<button\s+id="tag-toggle"/,
    );
    assert.match(
      html,
      /id="tag-toggle"[^>]*aria-expanded="false"[^>]*hidden\s*>\s*Show tags/,
    );
    assert.doesNotMatch(html, /data-visible=|data-total=/);
    assert.match(
      html,
      /<li data-hidden="true" hidden><details><summary><a href="\.\/.*(?:private|hiddenOnly|onlyHidden)\/" data-app-link>/,
    );
    assert.match(
      html,
      /<li data-hidden="true" hidden data-tags="[^"]*" data-search="[^"]+"><div class="link-row"[^>]*><a class="code[^>]* href="\.\/.*(?:secret|SecretCode|HiddenDeep)\/"/,
    );
  }
  const home = await f.read("index.html");
  assert.match(
    home,
    /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">\s*<span class="count-number">4<\/span\s*><span class="count-label"> links<\/span>\s*<\/h1>/,
  );
  assert.match(home, /href="\.\/tools\/nested\/" data-app-link>nested<\/a>/);
  assert.match(
    home,
    /href="\.\/tools\/nested\/branch\/further\/VisibleDeep\/">VisibleDeep<\/a>/,
  );
  assert.match(home, /href="\.\/shown\/">shown<\/a>/);
  assert.match(home, /href="\.\/visible\/">visible<\/a>/);
  assert.match(home, /href="\.\/tools\/public\/">public<\/a>/);
  assert.match(
    await f.read("tools/index.html"),
    /href="\.\/public\/">public<\/a>/,
  );
  assert.match(
    await f.read("tools/index.html"),
    /href="\.\/nested\/" data-app-link>nested<\/a>/,
  );
  assert.match(
    await f.read("tools/nested/index.html"),
    /href="\.\/branch\/" data-app-link>branch<\/a>/,
  );
  assert.match(
    await f.read("tools/nested/index.html"),
    /<li data-hidden="true" hidden><details><summary><a href="\.\/hiddenOnly\/" data-app-link>hiddenOnly/,
  );
  assert.match(
    await f.read("tools/nested/branch/index.html"),
    /href="\.\/further\/" data-app-link>further<\/a>/,
  );
  assert.match(
    await f.read("tools/nested/branch/further/index.html"),
    /href="\.\/VisibleDeep\/">VisibleDeep<\/a>/,
  );
  for (const page of [
    "onlyHidden/index.html",
    "onlyHidden/nested/index.html",
    "tools/private/index.html",
    "tools/private/deep/index.html",
  ]) {
    const html = await f.read(page);
    assert.match(
      html,
      /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">\s*<span class="count-number">0<\/span\s*><span class="count-label"> links<\/span>\s*<\/h1>/,
    );
    assert.match(html, /<p id="empty-directory">No links listed here\.<\/p>/);
    assert.match(html, /<div hidden><ul class="links">/);
    assert.match(html, /id="tag-toggle"[^>]*hidden\s*>\s*Show tags/);
    assert.match(html, /id="link-search"/);
  }
  assert.match(
    await f.read("secret/index.html"),
    /https:\/\/example\.com\/secret/,
  );
  assert.match(
    await f.read("tools/private/deep/SecretCode/index.html"),
    /https:\/\/example\.com\/deep/,
  );
  assert.match(await f.read("secret.sh"), /curl -fsSL/);
  assert.deepEqual(JSON.parse(await f.read("links.json")), links);

  const allHidden = await fixture(t, {
    private: {
      nested: { code: { url: "https://example.com/", tags: ["hidden"] } },
    },
  });
  assert.equal(allHidden.build().status, 0);
  assert.match(await allHidden.read("index.html"), /No links listed here\./);
  assert.match(
    await allHidden.read("index.html"),
    /<h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">\s*<span class="count-number">0<\/span\s*><span class="count-label"> links<\/span>\s*<\/h1>/,
  );
  assert.match(
    await allHidden.read("index.html"),
    /<li data-hidden="true" hidden><details><summary><a href="\.\/private\/" data-app-link>/,
  );
  assert.match(
    await allHidden.read("private/nested/index.html"),
    /No links listed here\./,
  );
  assert.match(
    await allHidden.read("private/nested/code/index.html"),
    /https:\/\/example\.com/,
  );
});

test("long destinations keep their trailing path beside single-line short codes", async (t) => {
  const url =
    "https://raw.githubusercontent.com/ratrat64/homelab-public/refs/heads/main/scripts/ubuntu/oh-my-posh/setup.sh";
  const f = await fixture(t, {
    setup: { url, title: "Install shell prompt" },
    plain: url,
  });
  assert.equal(f.build().status, 0);
  const html = await f.read("index.html");
  assert.match(html, /class="link-row" title="Install shell prompt"/);
  assert.match(
    html,
    /class="destination" href="https:\/\/raw\.githubusercontent\.com\/ratrat64/,
  );
  assert.match(
    html,
    /class="destination"[^>]* title="https:\/\/raw\.githubusercontent\.com\/ratrat64/,
  );
  assert.match(
    html,
    /<span class="sr-only">https:\/\/raw\.githubusercontent\.com\/ratrat64/,
  );
  assert.match(
    html,
    /class="destination-start" aria-hidden="true">https:\/\/raw\.githubusercontent\.com\/.*\/ubuntu\//,
  );
  assert.match(
    html,
    /class="destination-end" aria-hidden="true">oh-my-posh\/setup\.sh<\/span><\/a><a class="visit" href="https:\/\/raw\.githubusercontent\.com\/ratrat64[^>]*>Open<\/a>/,
  );
  assert.doesNotMatch(html, /class="link-title"/);
});

test("directory clicks copy full short or long URLs while Open follows the destination", async (t) => {
  const url = "https://example.com/a/b/setup.sh?q=<tag>&x='\"";
  const f = await fixture(t, { tools: { Setup: { url, tags: ["hidden"] } } });
  assert.equal(f.build().status, 0);
  const script = await f.read("assets/copy.js");
  for (const [page, prefix, shortHref] of [
    ["index.html", "/project/", "./tools/Setup/"],
    ["tools/index.html", "/project/tools/", "./Setup/"],
  ]) {
    const html = await f.read(page);
    assert.match(html, /id="copy-status"[^>]*role="status"/);
    assert.match(
      html,
      new RegExp(
        `src="${page === "index.html" ? "./" : "../"}assets/copy\\.js"`,
      ),
    );
    assert.ok(html.includes(`class="code" href="${shortHref}"`));
    assert.match(
      html,
      /class="destination" href="https:\/\/example\.com\/a\/b\/setup\.sh\?q=&lt;tag&gt;&amp;x=&#39;&quot;"/,
    );
    assert.match(
      html,
      /class="visit" href="https:\/\/example\.com\/a\/b\/setup\.sh\?q=&lt;tag&gt;&amp;x=&#39;&quot;"[^>]*>Open<\/a>/,
    );

    const copied = [];
    const status = { textContent: "" };
    const list = {
      addEventListener: (_, listener) => {
        list.click = listener;
      },
    };
    const timers = new Map();
    let nextTimer = 0;
    runInNewContext(script + "\ninitCopy();", {
      document: {
        querySelector: (selector) =>
          ({ ".links": list, "#copy-status": status })[selector],
      },
      navigator: {
        clipboard: {
          writeText: async (text) => {
            copied.push(text);
          },
        },
      },
      setTimeout: (callback, delay) => {
        assert.equal(delay, 5000);
        timers.set(++nextTimer, callback);
        return nextTimer;
      },
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
      await list.click({
        button: 0,
        target: {
          closest: () => (target.classList.contains("visit") ? null : target),
        },
        preventDefault: () => {
          prevented = true;
        },
        ...options,
      });
      return prevented;
    };
    assert.equal(await click(anchor("code", shortHref)), true);
    assert.equal(copied.at(-1), "https://short.example/project/tools/Setup/");
    assert.equal(status.textContent, "Short link copied.");
    assert.equal(await click(anchor("destination", url)), true);
    assert.equal(copied.at(-1), url);
    assert.equal(status.textContent, "Destination copied.");
    assert.equal(timers.size, 1);
    timers.values().next().value();
    assert.equal(status.textContent, "");
    assert.equal(await click(anchor("visit", url)), false);
    assert.equal(
      await click(anchor("code", shortHref), { ctrlKey: true }),
      false,
    );
    assert.equal(copied.length, 2);
  }

  const status = { textContent: "" };
  const list = {
    addEventListener: (_, listener) => {
      list.click = listener;
    },
  };
  let dismiss;
  runInNewContext(script + "\ninitCopy();", {
    document: {
      querySelector: (selector) =>
        ({ ".links": list, "#copy-status": status })[selector],
    },
    navigator: {
      clipboard: {
        writeText: async () => {
          throw new Error("permission denied");
        },
      },
    },
    setTimeout: (callback) => {
      dismiss = callback;
    },
    clearTimeout: () => {},
  });
  let prevented = false;
  await list.click({
    button: 0,
    target: {
      closest: () => ({
        href: "https://short.example/project/tools/Setup/",
        classList: { contains: () => true },
        hasAttribute: () => false,
      }),
    },
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.equal(
    status.textContent,
    "Could not copy the link. Try your browser’s copy-link action.",
  );
  dismiss();
  assert.equal(status.textContent, "");

  // A clipboard promise settling after a swap must not resurrect outgoing feedback.
  const pendingStatus = { textContent: "" };
  const pendingList = {
    addEventListener(_, callback) {
      this.click = callback;
    },
    removeEventListener(_, callback) {
      assert.equal(callback, this.click);
      this.click = null;
    },
  };
  let resolveCopy,
    timerCount = 0;
  const context = {
    document: {
      querySelector: (selector) =>
        ({ ".links": pendingList, "#copy-status": pendingStatus })[selector],
    },
    navigator: {
      clipboard: {
        writeText: () =>
          new Promise((resolve) => {
            resolveCopy = resolve;
          }),
      },
    },
    setTimeout: () => {
      timerCount++;
    },
    clearTimeout() {},
  };
  runInNewContext(script + "\ninitCopy();", context);
  const pendingCopy = pendingList.click({
    button: 0,
    target: {
      closest: () => ({
        href: "https://short.example/code/",
        classList: { contains: () => true },
        hasAttribute: () => false,
      }),
    },
    preventDefault() {},
  });
  context.cleanupCopy();
  resolveCopy();
  await pendingCopy;
  assert.equal(pendingStatus.textContent, "");
  assert.equal(timerCount, 0);
  assert.equal(pendingList.click, null);
  runInNewContext(script + "\ninitCopy();", {
    document: { querySelector: () => null },
  });
});

test("destination downloads preserve bytes, handle failures, and cancel outgoing work and resources", async (t) => {
  const f = await fixture(t, {
    tools: {
      Run: {
        url: "https://scripts.example/setup%20script.sh?version=2",
        tags: ["script"],
      },
    },
  });
  assert.equal(f.build().status, 0);
  const script = await f.read("assets/download.js");
  const bytes = new Uint8Array([0, 255, 13, 10, 128, 35, 33]);
  const blob = new Blob([bytes]);
  const timers = new Map(),
    objects = new Map(),
    saved = [],
    requests = [];
  let next = 0,
    respond = async () => ({ ok: true, blob: async () => blob });
  const status = { textContent: "" };
  const list = {
    addEventListener(_, callback) {
      this.click = callback;
    },
    removeEventListener(_, callback) {
      assert.equal(callback, this.click);
      this.click = null;
    },
  };
  let attached = 0;
  const context = {
    document: {
      querySelector: (selector) =>
        ({ ".links": list, "#download-status": status })[selector],
      body: {
        append() {
          attached++;
        },
      },
      createElement(name) {
        assert.equal(name, "a");
        return {
          click() {
            saved.push({
              filename: this.download,
              blob: objects.get(this.href),
            });
          },
          remove() {
            attached--;
          },
        };
      },
    },
    AbortController,
    URL: {
      createObjectURL(value) {
        const url = `blob:${++next}`;
        objects.set(url, value);
        return url;
      },
      revokeObjectURL(url) {
        assert.ok(objects.delete(url), "URL released once");
      },
    },
    fetch: (url, options) => {
      requests.push({ url, signal: options.signal });
      return respond(options.signal);
    },
    setTimeout(callback, delay) {
      const id = ++next;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  runInNewContext(script + "\ninitDownload();", context);
  const button = {
    dataset: {
      downloadUrl: "https://scripts.example/setup%20script.sh?version=2",
      downloadName: "setup script.sh",
    },
    disabled: false,
  };
  const click = (target = button) =>
    list.click({
      button: 0,
      target: { closest: () => target },
      preventDefault() {},
    });
  const feedbackTimer = () => {
    const feedback = [...timers].filter(([, timer]) => timer.delay === 5000);
    assert.equal(feedback.length, 1, "one feedback deadline");
    return feedback[0];
  };
  const expireFeedback = () => {
    const [id, timer] = feedbackTimer();
    timers.delete(id);
    timer.callback();
    assert.equal(status.textContent, "");
  };
  await click();
  assert.equal(requests[0].url, button.dataset.downloadUrl);
  assert.deepEqual(new Uint8Array(await saved[0].blob.arrayBuffer()), bytes);
  assert.equal(saved[0].filename, "setup script.sh");
  assert.equal(attached, 0);
  assert.equal(button.disabled, false);
  assert.equal(status.textContent, "Script download started.");
  expireFeedback();
  for (const [id, timer] of timers)
    if (timer.delay === 1000) {
      timers.delete(id);
      timer.callback();
    }
  assert.equal(objects.size, 0);
  await click({ disabled: true });
  await click(null); // Open and copy targets do not match the download hook.
  assert.equal(requests.length, 1);
  let partialBodyReads = 0;
  for (const fail of [
    async () => {
      throw new TypeError("CORS blocked");
    },
    async () => ({
      ok: false,
      blob() {
        assert.fail("HTTP failure body must not be saved");
      },
    }),
    async () => ({
      ok: true,
      status: 206,
      blob() {
        partialBodyReads++;
        return blob;
      },
    }),
    async () => ({
      ok: true,
      type: "opaque",
      blob() {
        assert.fail("Opaque body must not be saved");
      },
    }),
    async () => ({
      ok: true,
      blob: async () => {
        throw new Error("partial body");
      },
    }),
  ]) {
    respond = fail;
    await click();
    assert.match(status.textContent, /Could not download.*CORS/);
    assert.equal(saved.length, 1);
    assert.equal(objects.size, 0);
    assert.equal(button.disabled, false);
    assert.equal(
      partialBodyReads,
      0,
      "partial response rejected before body read",
    );
    const [previousDeadline] = feedbackTimer();
    const subsequent = click();
    assert.equal(
      timers.has(previousDeadline),
      false,
      "next download cancels feedback deadline",
    );
    assert.equal(status.textContent, "");
    await subsequent;
    assert.notEqual(feedbackTimer()[0], previousDeadline);
    assert.match(status.textContent, /Could not download.*CORS/);
    assert.equal(saved.length, 1);
    expireFeedback();
  }
  for (const stage of ["fetch", "body", "failure"]) {
    let settle;
    const held = new Promise((resolve, reject) => {
      settle = stage === "failure" ? reject : resolve;
    });
    respond = () => (stage === "body" ? { ok: true, blob: () => held } : held);
    const work = click();
    await Promise.resolve();
    assert.equal(button.disabled, true);
    context.cleanupDownload();
    assert.equal(requests.at(-1).signal.aborted, true);
    settle(
      stage === "failure"
        ? new Error("late failure")
        : stage === "body"
          ? blob
          : { ok: true, blob: async () => blob },
    );
    await work;
    assert.equal(saved.length, 1);
    assert.equal(status.textContent, "");
    assert.equal(timers.size, 0);
    assert.equal(list.click, null);
    context.initDownload();
  }
  respond = async () => ({ ok: true, blob: async () => blob });
  await click();
  assert.equal(objects.size, 1);
  context.cleanupDownload();
  assert.equal(objects.size, 0);
  assert.equal(timers.size, 0);
});

test("Chrome destination downloads save readable CORS bytes and report blocked responses across directory navigation", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const f = await fixture(t, {});
  const origin = await browserServer(t, f.cwd);
  const destination =
    origin.replace("localhost", "127.0.0.1") + "/download-payload.sh";
  await writeFile(
    join(f.cwd, "links.json"),
    JSON.stringify({
      tools: {
        Run: { url: destination + "?cors=1", tags: ["script"] },
        Blocked: { url: destination, tags: ["script"] },
        Off: { url: destination + "?cors=1", tags: ["script", "disabled"] },
      },
    }),
  );
  assert.equal(f.build().status, 0);
  await writeFile(
    join(f.cwd, "dist", "download-check.html"),
    `<!doctype html><html><body><script>
    (async () => {
      const check = (value, message) => { if (!value) throw new Error(message); };
      const wait = async (predicate) => {
        for (let i = 0; i < 200; i++) { if (predicate()) return; await new Promise(r => setTimeout(r, 10)); }
        throw new Error('Timed out');
      };
      for (const prefix of ['/', '/project/']) {
        const frame = document.createElement('iframe'); document.body.append(frame);
        frame.src = prefix;
        await new Promise(resolve => frame.onload = resolve);
        const win = frame.contentWindow, doc = frame.contentDocument;
        const saved = [], copied = [];
        Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: async text => copied.push(text) } });
        const nativeClick = win.HTMLAnchorElement.prototype.click;
        const captureDownload = function () {
          if (!this.href.startsWith('blob:')) return nativeClick.call(this);
          saved.push({ name: this.download, bytes: win.fetch(this.href).then(r => r.arrayBuffer()) });
        };
        win.HTMLAnchorElement.prototype.click = captureDownload;
        for (const mode of ['expanded', 'navigated', 'native']) {
          if (mode === 'navigated') {
            doc.querySelector('summary a').click();
            await wait(() => win.location.pathname === prefix + 'tools/');
          }
          if (mode === 'native') {
            frame.src = prefix + 'tools/';
            await new Promise(resolve => frame.onload = resolve);
            const nativeWin = frame.contentWindow;
            nativeWin.HTMLAnchorElement.prototype.click = captureDownload;
            Object.defineProperty(nativeWin.navigator, 'clipboard', { configurable: true, value: { writeText: async text => copied.push(text) } });
          }
          const currentDoc = frame.contentDocument;
          const row = code => [...currentDoc.querySelectorAll('.link-row')].find(r => r.querySelector('.code').textContent === code);
          const off = row('Off').querySelector('.download');
          check(off.disabled && !off.hasAttribute('href') && !off.hasAttribute('data-download-url'), 'Disabled download actionable');
          off.click();
          const before = saved.length;
          row('Run').querySelector('.download').click();
          await wait(() => saved.length > before);
          check(saved.at(-1).name === 'download-payload.sh', 'Wrong filename');
          const bytes = new Uint8Array(await saved.at(-1).bytes);
          check(JSON.stringify([...bytes]) === '[35,33,0,255,13,10,128]', 'Destination bytes changed');
          check(currentDoc.querySelector('#download-status').textContent === 'Script download started.', 'Success feedback missing');
          row('Run').querySelector('.destination').click();
          await wait(() => currentDoc.querySelector('#copy-status').textContent === 'Destination copied.');
          const copyBox = currentDoc.querySelector('#copy-status').getBoundingClientRect();
          const downloadBox = currentDoc.querySelector('#download-status').getBoundingClientRect();
          check(copyBox.bottom <= downloadBox.top, 'Copy and download feedback overlap');
          check(copied.at(-1) === ${JSON.stringify(destination + "?cors=1")}, 'Copy altered by Download');
          check(row('Run').querySelector('.visit').href === ${JSON.stringify(destination + "?cors=1")}, 'Open target altered');
          row('Blocked').querySelector('.download').click();
          await wait(() => currentDoc.querySelector('#download-status').textContent.includes('Could not download'));
          check(saved.length === before + 1, 'Blocked response saved a payload');
          check(!currentDoc.querySelector('a[href^="blob:"]'), 'Temporary anchor retained');
        }
        frame.remove();
      }
      document.body.dataset.downloadCheck = 'passed';
    })().catch(error => { document.body.dataset.downloadCheck = error.message; });
  </script></body></html>`,
  );
  const html = runChrome(chrome, f.cwd, origin + "/download-check.html");
  assert.match(html, /data-download-check="passed"/, html);
});

test("destination download filenames are safe and shared by nested listings", async (t) => {
  const names = [
    [
      "https://example.com/setup%20script.sh?q=other.sh#fragment",
      "setup script.sh",
    ],
    ["https://example.com/", "Run.sh"],
    ["https://example.com/folder/", "Run.sh"],
    ["https://example.com/%E0%A4", "Run.sh"],
    ["https://example.com/%2E%2E%20", "Run.sh"],
    ["https://example.com/CON.sh", "Run.sh"],
    ["https://example.com/" + "a".repeat(300), "Run.sh"],
    ["https://example.com/" + "😀".repeat(70), "Run.sh"],
    ["https://example.com/a%2Fb%5Cc%00%3F.sh", "a_b_c__.sh"],
  ];
  for (const [url, filename] of names) {
    const f = await fixture(t, {
      tools: {
        Run: { url, tags: ["script"] },
        Off: { url, tags: ["script", "disabled"] },
      },
    });
    assert.equal(f.build().status, 0);
    for (const page of ["index.html", "tools/index.html"]) {
      const html = await f.read(page);
      assert.ok(html.includes(`data-download-name="${filename}"`), url);
      assert.match(html, /class="download" disabled/);
      assert.doesNotMatch(html, /class="download" href=/);
      assert.match(html, /download-status[^>]*role="status"/);
    }
  }
});

test("search filters nested links on the homepage and directory pages", async (t) => {
  const f = await fixture(t, {
    gh: "https://github.com/",
    tools: {
      git: "https://git-scm.com/",
      editors: { Code: { url: "https://example.org/", title: "VS Code" } },
    },
  });
  assert.equal(f.build().status, 0);
  for (const [page, depth] of [
    ["index.html", "./"],
    ["tools/index.html", "../"],
    ["tools/editors/index.html", "../../"],
  ]) {
    const html = await f.read(page);
    assert.match(
      html,
      /<div class="search" hidden>\s*<label class="sr-only" for="link-search">Search links<\/label>\s*<input\s+id="link-search"\s+type="search"[^>]*placeholder="Search link, title or tag"/,
    );
    assert.match(
      html,
      /id="link-count" class="count" aria-live="polite" aria-atomic="true"/,
    );
    assert.match(
      html,
      new RegExp(`src="${depth.replaceAll(".", "\\.")}assets/search\\.js"`),
    );
    assert.match(html, /id="search-status"[^>]*role="status" hidden/);
    assert.match(html, /id="tag-toggle"[^>]*disabled\s*>\s*Show tags/);
  }

  runInNewContext((await f.read("assets/search.js")) + "\ninitSearch();", {
    document: { querySelector: () => null },
  });
  runInNewContext((await f.read("assets/search.js")) + "\ninitSearch();", {
    document: {
      querySelector: (selector) => (selector === "#link-search" ? {} : null),
    },
  });
});

test("directory highlights match, full tags stay inline, and destinations reveal accessibly", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const f = await fixture(t, {
    example: {
      url: "https://example.com/setup.sh",
      tags: ["documentation", "a-very-long-tag-for-disclosure", "script"],
    },
    "long-script-code": {
      url: "https://example.com/setup.sh",
      tags: ["shell", "script"],
    },
    plain: { url: "https://example.com/plain", tags: ["reference"] },
    folder: {
      nested: { url: "https://example.com/a/very/long/path/setup.sh" },
      second: "https://example.com/second",
    },
    ["long-folder-".repeat(12)]: { plain: "https://example.com/folder" },
    ["long-code-".repeat(12)]: "https://example.com/plain",
    ["long-script-".repeat(12)]: {
      url: "https://example.com/setup.sh",
      tags: ["script"],
    },
  });
  assert.equal(f.build().status, 0);
  await writeFile(
    join(f.cwd, "dist", "layout-check.html"),
    `<!doctype html><html><body><iframe src="index.html" style="width:390px;height:700px;border:0"></iframe><script>
    document.querySelector('iframe').addEventListener('load', async (event) => {
      try {
        const frame = event.target;
        const doc = frame.contentDocument;
        doc.documentElement.style.scrollBehavior = 'auto';
        const win = frame.contentWindow;
        for (const details of doc.querySelectorAll('details')) details.open = true;
        const rules = [...doc.styleSheets].flatMap(sheet => [...sheet.cssRules]);
        const pointerRule = rules.find(rule => rule.conditionText === '(hover: hover) and (pointer: fine)');
        const coarseRule = rules.find(rule => rule.conditionText === '(any-pointer: coarse)');
        if (!pointerRule || !coarseRule) throw new Error('Missing pointer visibility rules');
        const hover = doc.createElement('style');
        hover.textContent = [...pointerRule.cssRules].filter(rule => rule.selectorText?.includes(':hover') || rule.selectorText?.includes(':focus-within')).map(rule => rule.selectorText.replaceAll(':hover', '.verify-hover').replaceAll(':focus-within', '.verify-focus') + '{' + rule.style.cssText + '}').join('');
        doc.head.append(hover);
        for (const folder of doc.querySelectorAll('summary')) {
          if (folder.getBoundingClientRect().height !== 50 || win.getComputedStyle(folder).whiteSpace !== 'nowrap') throw new Error('Folder summary geometry failed');
          folder.focus();
          if (win.getComputedStyle(folder).outlineWidth !== '2px') throw new Error('Folder keyboard focus missing');
          folder.blur();
        }
        for (const width of [320, 390, 1440]) {
          frame.style.width = width + 'px';
          await new Promise(resolve => setTimeout(resolve, 30));
          for (const theme of ['light', 'dark']) {
            doc.documentElement.dataset.theme = theme;
            if (doc.documentElement.scrollWidth > doc.documentElement.clientWidth) throw new Error('Directory overflows the viewport');
            for (const list of doc.querySelectorAll('.links')) {
              const items = [...list.children].filter(item => !item.hidden);
              for (const item of items) {
                if (item.getBoundingClientRect().right > list.getBoundingClientRect().right + 1) throw new Error('Directory entry overflows its list');
              }
              for (let i = 1; i < items.length; i++) {
                const gap = items[i].getBoundingClientRect().top - items[i - 1].getBoundingClientRect().bottom;
                if (gap !== 4) throw new Error('Adjacent directory highlights need a 4px gap: ' + gap);
              }
            }
            const summary = doc.querySelector('summary');
            for (const row of doc.querySelectorAll('.link-row')) {
              const style = win.getComputedStyle(row);
              const summaryStyle = win.getComputedStyle(summary);
              if (row.getBoundingClientRect().height !== 50 || row.getBoundingClientRect().height !== summary.getBoundingClientRect().height) throw new Error('Link/folder highlights differ');
              if (style.padding !== summaryStyle.padding || style.paddingTop !== '10px' || style.paddingLeft !== '12px' || style.borderRadius !== '4px') throw new Error('Highlight padding/radius mismatch');
              const destination = row.querySelector('.destination');
              pointerRule.media.mediaText = 'all';
              coarseRule.media.mediaText = 'not all';
              if (win.getComputedStyle(destination).opacity !== '0') throw new Error('Desktop destination visible before hover');
              row.classList.add('verify-hover');
              if (win.getComputedStyle(destination).opacity !== '1') throw new Error('Hover did not reveal destination');
              row.classList.remove('verify-hover');
              row.classList.add('verify-focus');
              if (win.getComputedStyle(destination).opacity !== '1') throw new Error('Focus did not reveal destination');
              row.classList.remove('verify-focus');
              pointerRule.media.mediaText = 'not all';
              if (win.getComputedStyle(destination).opacity !== '1') throw new Error('Non-hover destination hidden');
              pointerRule.media.mediaText = 'all';
              coarseRule.media.mediaText = 'all';
              if (win.getComputedStyle(destination).opacity !== '1') throw new Error('Hybrid touch destination hidden');
              coarseRule.media.mediaText = 'not all';
              if (win.getComputedStyle(destination).whiteSpace !== 'nowrap' || destination.getBoundingClientRect().width < 48) throw new Error('Destination wraps or collapses');
              if (row.scrollWidth > row.clientWidth) {
                row.scrollLeft = row.scrollWidth;
                if (row.querySelector('.visit').getBoundingClientRect().right > row.getBoundingClientRect().right) throw new Error('Open action unreachable by scrolling');
                row.scrollLeft = 0;
              }
            }
            for (const button of doc.querySelectorAll('.tags')) {
              const row = button.closest('li');
              const destination = row.querySelector('.destination');
              if (button.getBoundingClientRect().width < 40 || destination.getBoundingClientRect().width < 40) throw new Error('Collapsed target at ' + width + ' for ' + button.textContent + ': ' + button.getBoundingClientRect().width + '/' + destination.getBoundingClientRect().width);
              if (win.getComputedStyle(button).maxWidth !== 'none' || button.scrollWidth > button.clientWidth) throw new Error('Tag label is capped or truncated');
              const before = row.getBoundingClientRect().height;
              const next = button.nextSibling;
              button.remove();
              const withoutTags = row.getBoundingClientRect().height;
              next.parentNode.insertBefore(button, next);
              if (before !== withoutTags) throw new Error('Tags increased height at ' + width);
              button.click();
              const panel = doc.getElementById(button.getAttribute('popovertarget'));
              if (!panel.matches(':popover-open') || panel.textContent !== button.textContent) throw new Error('Disclosure failed');
              if (row.getBoundingClientRect().height !== before) throw new Error('Popover increased height');
              panel.hidePopover();
            }
          }
        }
        document.body.dataset.layoutCheck = 'passed';
      } catch (error) { document.body.dataset.layoutCheck = error.message; }
    });
  </script></body></html>`,
  );
  const base = await browserServer(t, f.cwd);
  const html = runChrome(chrome, f.cwd, base + "/layout-check.html");
  assert.match(html, /<body data-layout-check="passed">/, html);
});

test("inline tag disclosures target the correct link when codes repeat in different folders", async (t) => {
  const f = await fixture(t, {
    docs: { url: "https://example.com/root", tags: ["root"] },
    tools: { docs: { url: "https://example.com/tools", tags: ["tools"] } },
    guides: {
      docs: {
        url: "https://example.com/guides",
        tags: ["guides", "script"],
      },
    },
    untagged: "https://example.com/plain",
  });
  assert.equal(f.build().status, 0);
  for (const path of ["index.html", "tools/index.html", "guides/index.html"]) {
    const html = await f.read(path);
    const buttons = [
      ...html.matchAll(
        /<button class="tags"[^>]*popovertarget="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g,
      ),
    ];
    const panels = [
      ...html.matchAll(
        /<div class="tag-panel" id="([^"]+)"[^>]*>([\s\S]*?)<\/div>/g,
      ),
    ];
    assert.equal(buttons.length, path === "index.html" ? 3 : 1);
    assert.equal(new Set(panels.map(([, id]) => id)).size, panels.length);
    for (const [, target, label] of buttons) {
      assert.equal(panels.find(([, id]) => id === target)?.[2], label);
    }
    assert.doesNotMatch(html, /Show all tags for untagged/);
  }
});

test("information pages use relative navigation and shared theme assets", async (t) => {
  const f = await fixture(t, { aboutme: "https://example.org/" });
  assert.equal(f.build().status, 0);
  const home = await f.read("index.html");
  assert.match(home, /<title>Links · shl<\/title>/);
  assert.match(
    home,
    /class="brand" href="\.\/" data-app-link\s*><span class="brand-slash">\/<\/span>shl<span class="brand-slash"\s*>\/<\/span\s*><\/a\s*>/,
  );
  assert.match(home, /<footer class="footer">[\s\S]*?<p>shl<\/p>/);
  assert.match(home, /href="\.\/assets\/site\.css"/);
  assert.match(home, /href="\.\/guide\/"/);
  assert.doesNotMatch(home, /href="\.\/about\/"|Simple by design|Good links/);
  for (const page of ["about", "guide", "how-it-works"]) {
    const html = await f.read(`${page}/index.html`);
    if (page === "guide") {
      assert.match(html, /<title>Guide · shl<\/title>/);
      assert.match(html, /<h2>Features<\/h2>/);
      assert.match(html, /href="\.\.\/assets\/site\.css"/);
      assert.match(html, /src="\.\.\/assets\/theme\.js"/);
      assert.match(html, /href="\.\.\/"/);
      for (const section of ["about", "how-to-use", "how-it-works"])
        assert.match(html, new RegExp(`id="${section}"`));
    } else {
      assert.match(html, /<title>Guide · shl<\/title>/);
      assert.match(html, new RegExp(`url=\\.\\.\\/guide\\/#${page}`));
    }
  }
  assert.match(await f.read("assets/site.css"), /data-theme="dark"/);
  assert.match(await f.read("assets/site.css"), /--bg:\s*#000/);
  const theme = await f.read("assets/theme.js");
  assert.match(theme, /shortlink-theme/);
  const button = { addEventListener() {} };
  const root = { dataset: {} };
  runInNewContext(theme, {
    document: { documentElement: root, querySelector: () => button },
    localStorage: {
      getItem: (key) => {
        assert.equal(key, "shortlink-theme");
        return "dark";
      },
    },
  });
  assert.equal(root.dataset.theme, "dark");
  assert.equal(button.textContent, "Theme: dark");
  assert.match(
    await f.read("guide/index.html"),
    /github\.com\/ratrat64\/shl#readme/,
  );
  assert.match(
    await f.read("guide/index.html"),
    /&quot;tags&quot;: \[\s*&quot;documentation&quot;\s*\]/,
  );
  for (const source of ["links.json", "links.yaml", "links.yml"]) {
    const formatFixture =
      source === "links.json"
        ? f
        : await fixture(t, "gh: https://github.com/", source);
    if (formatFixture !== f) assert.equal(formatFixture.build().status, 0);
    const guide = await formatFixture.read("guide/index.html");
    assert.ok(guide.includes(`<code>${source}</code>`));
    const sample = guide
      .match(/<pre><code>([\s\S]*?)<\/code><\/pre>/)[1]
      .replaceAll("&quot;", '"');
    const sampleFixture = await fixture(
      t,
      source === "links.json" ? JSON.parse(sample) : sample,
      source,
    );
    assert.equal(sampleFixture.build().status, 0, source + " example builds");
    const map = JSON.parse(await sampleFixture.read("links.json"));
    assert.equal(map.gh, "https://github.com/");
    assert.deepEqual(map.docs.tags, ["documentation"]);
  }
  assert.match(
    await f.read("aboutme/index.html"),
    /<title>Redirecting · shl<\/title>/,
  );
  assert.match(
    await f.read("404.html"),
    /<title>Link not found · shl<\/title>/,
  );
});

test("redirect script safely preserves destinations containing HTML and quotes", async (t) => {
  const url =
    "https://example.com/?q=</script><script>alert(\"x\")</script>&a='quoted'";
  const f = await fixture(t, {
    safe: { url, title: "<img src=x onerror=alert(1)>" },
  });
  assert.equal(f.build().status, 0);
  const html = await f.read("safe/index.html");
  const script = behaviorScript(html, "forward");
  assert.doesNotMatch(html, /<img|<script>alert/);
  let destination;
  runInNewContext(script, {
    location: {
      replace: (value) => {
        destination = value;
      },
    },
  });
  assert.equal(destination, url);
  assert.match(html, /&lt;img/);
});

test("every document shares theme foundations, including minimal forwards and asset-independent 404", async (t) => {
  const f = await fixture(t, {
    tools: { deep: { code: "https://example.com/" } },
  });
  assert.equal(f.build().status, 0);
  const theme = await f.read("assets/theme.js");
  const css = await f.read("assets/site.css");
  for (const path of [
    "tools/deep/code/index.html",
    "about/index.html",
    "how-it-works/index.html",
    "404.html",
  ]) {
    const html = await f.read(path);
    assert.match(
      html,
      /<meta name="color-scheme" content="light dark"\s*\/?\s*>/,
    );
    assert.ok(
      html.includes(`<style>${css}</style>`),
      path + " embeds the shared styles",
    );
    assert.equal(behaviorScript(html, "theme"), theme);
    assert.doesNotMatch(html, /(?:href|src)="[^" ]*assets\//);
    if (path !== "404.html") {
      assert.doesNotMatch(
        html,
        /<header|<footer|<button[^>]*data-theme-control/,
      );
      const decode = (text) =>
        text.replace(
          /&(?:amp|quot|#39|lt|gt);/g,
          (entity) =>
            ({
              "&amp;": "&",
              "&quot;": '"',
              "&#39;": "'",
              "&lt;": "<",
              "&gt;": ">",
            })[entity],
        );
      const refresh = decode(
        html.match(/<meta http-equiv="refresh" content="0; url=([^"]+)"/)[1],
      );
      const canonical = decode(
        html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)[1],
      );
      for (const prefix of ["/", "/project/"]) {
        const base = `https://short.example${prefix}${path}`;
        const expected = path.startsWith("tools/")
          ? "https://example.com/"
          : `https://short.example${prefix}guide/#${path.split("/")[0]}`;
        assert.equal(new URL(refresh, base).href, expected);
        assert.equal(new URL(canonical, base).href, expected);
      }
      let destination;
      runInNewContext(behaviorScript(html, "forward"), {
        location: {
          replace: (url) => {
            destination = url;
          },
        },
      });
      assert.equal(
        destination,
        path.startsWith("tools/")
          ? "https://example.com/"
          : `../guide/#${path.split("/")[0]}`,
      );
    } else {
      assert.match(html, /<header class="site-head">/);
      assert.match(html, /<footer class="footer">/);
      assert.match(html, /data-theme-control/);
    }
  }
  for (const saved of ["light", "dark", "invalid", null, "blocked"]) {
    for (const control of [false, true]) {
      const root = { dataset: {} };
      const button = {
        addEventListener(name, handler) {
          this[name] = handler;
        },
      };
      runInNewContext(theme, {
        document: {
          documentElement: root,
          querySelector(selector) {
            assert.equal(selector, "[data-theme-control]");
            return control ? button : null;
          },
        },
        localStorage: {
          getItem() {
            if (saved === "blocked") throw new Error("storage blocked");
            return saved;
          },
          setItem() {
            throw new Error("storage blocked");
          },
        },
        matchMedia: () => ({ matches: true }),
      });
      assert.equal(
        root.dataset.theme,
        ["light", "dark"].includes(saved) ? saved : undefined,
      );
      if (control) {
        assert.equal(
          button.textContent,
          "Theme: " + (root.dataset.theme || "system"),
        );
        button.click();
        assert.equal(root.dataset.theme, saved === "light" ? "dark" : "light");
        assert.equal(button.textContent, "Theme: " + root.dataset.theme);
      }
    }
  }
});

test("shared shell renders consistently across direct/native loads and app navigation in both themes and viewport sizes", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const f = await fixture(t, {});
  const origin = await browserServer(t, f.cwd);
  await writeFile(
    join(f.cwd, "links.json"),
    JSON.stringify({
      tools: {
        git: "https://git-scm.com/",
        private: { url: "https://example.com/private", tags: ["hidden"] },
      },
      local: origin + "/guide/#about",
      localProject: origin + "/project/guide/#about",
    }),
  );
  assert.equal(f.build().status, 0);
  await writeFile(
    join(f.cwd, "dist", "shell-check.html"),
    `<!doctype html><html><body><iframe style="height:900px;border:0"></iframe><script>
    (async () => {
      try {
        const frame = document.querySelector('iframe');
        const wait = () => new Promise(resolve => setTimeout(resolve, 30));
        const load = path => new Promise(resolve => { frame.onload = resolve; frame.src = path; });
        const system = new URL(location.href).searchParams.get('system');
        const palette = { light: ['rgb(246, 247, 245)', 'rgb(37, 43, 41)'], dark: ['rgb(0, 0, 0)', 'rgb(198, 208, 202)'] };
        const checkPalette = (doc, theme) => {
          const style = frame.contentWindow.getComputedStyle(doc.body);
          if (JSON.stringify([style.backgroundColor, style.color]) !== JSON.stringify(palette[theme])) throw new Error('Wrong palette: ' + theme);
        };
        localStorage.removeItem('shortlink-theme');
        if (matchMedia('(prefers-color-scheme: dark)').matches !== (system === 'dark')) throw new Error('System preference flag did not apply');
        for (const native of [false, true]) {
          frame.setAttribute('sandbox', native ? 'allow-same-origin' : 'allow-same-origin allow-scripts');
          for (const path of ['/', '/tools/', '/guide/', '/tools/unknown/', '/local/?fallback=1']) {
            await load(path);
            const doc = frame.contentDocument;
            if (doc.documentElement.hasAttribute('data-theme')) throw new Error('System case used an override');
            checkPalette(doc, system);
          }
        }
        document.body.dataset.systemCheck = system;
        // The system-dark run independently exercises the media-query palette; run the override matrix once.
        if (system === 'light') {
        const snapshot = doc => ['header', 'footer'].map(selector => {
          const element = doc.querySelector(selector);
          if (!element) throw new Error('Missing ' + selector);
          return [element, ...element.querySelectorAll('*')].map(node => {
            const active = node.matches('.nav a[aria-current=page]');
            const style = frame.contentWindow.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            const props = ['display', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding', 'margin', 'gap', 'borderWidth', 'borderStyle', 'borderRadius', 'backgroundColor', 'alignItems', 'justifyContent', 'flexWrap'];
            props.push('color', 'borderColor', 'textDecoration', 'outlineWidth', 'outlineStyle', 'outlineColor', 'outlineOffset');
            const result = { tag: node.tagName, x: rect.x, width: rect.width, height: rect.height, style: props.map(prop => style[prop]) };
            if (active) {
              node.removeAttribute('aria-current');
              for (const prop of ['color', 'borderColor', 'textDecoration', ...(style.outlineStyle === 'none' ? ['outlineColor'] : [])]) result.style[props.indexOf(prop)] = style[prop];
              node.setAttribute('aria-current', 'page');
            }
            return result;
          });
        });
        const equal = (actual, expected, label) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            const a = actual.flat(), b = expected.flat();
            const index = a.findIndex((value, i) => JSON.stringify(value) !== JSON.stringify(b[i]));
            throw new Error('Chrome mismatch: ' + label + ' node ' + index + ': ' + JSON.stringify(a[index]) + ' expected ' + JSON.stringify(b[index]));
          }
        };
        const shellGeometry = doc => {
          const win = frame.contentWindow;
          const header = doc.querySelector('header'), footer = doc.querySelector('footer'), main = doc.querySelector('main');
          const h = header.getBoundingClientRect(), f = footer.getBoundingClientRect(), m = main.getBoundingClientRect();
          if (win.getComputedStyle(header).borderBottomWidth !== '0px' || win.getComputedStyle(footer).borderTopWidth !== '0px') throw new Error('Chrome is not borderless');
          if (h.top + win.scrollY !== 0 || m.top < h.bottom || f.top < m.bottom || ['fixed', 'absolute'].includes(win.getComputedStyle(footer).position)) throw new Error('Shell overlaps or leaves normal flow');
          if (!doc.querySelector('.prose section') && Math.abs(f.bottom + win.scrollY - win.innerHeight) > 1) throw new Error('Short-page footer is not at bottom');
          const dark = win.getComputedStyle(doc.documentElement).colorScheme === 'dark';
          for (const link of doc.querySelectorAll('.nav a:not([aria-current])')) {
            const style = win.getComputedStyle(link);
            if (style.color !== (dark ? 'rgb(150, 165, 157)' : 'rgb(89, 100, 95)') || style.textDecorationLine !== 'none') throw new Error('Inactive navigation styling broken');
          }
        };
        const controlStates = doc => {
          const win = frame.contentWindow, button = doc.querySelector('[data-theme-control]');
          const state = () => { const s = win.getComputedStyle(button); return [s.color, s.backgroundColor, s.borderColor, s.outlineWidth, s.outlineStyle, s.outlineColor, s.outlineOffset]; };
          const normal = state();
          button.focus();
          if (!button.matches(':focus-visible') || win.getComputedStyle(button).outlineWidth !== '2px' || win.getComputedStyle(button).outlineStyle !== 'solid') throw new Error('Theme focus outline missing');
          const focused = state();
          button.blur();
          // Alias the real hover selectors to force their state in the dump-DOM harness.
          const hover = doc.createElement('style');
          hover.textContent = [...doc.styleSheets].flatMap(sheet => [...sheet.cssRules]).filter(rule => rule.selectorText?.includes(':hover')).map(rule => rule.selectorText.replaceAll(':hover', '.verify-hover') + '{' + rule.style.cssText + '}').join('');
          doc.head.append(hover);
          button.classList.add('verify-hover');
          const hovered = state();
          if (hovered[1] === normal[1]) throw new Error('Theme hover fill missing');
          button.classList.remove('verify-hover');
          for (const link of doc.querySelectorAll('.nav a')) {
            link.classList.add('verify-hover');
            if (win.getComputedStyle(link).color !== focused[5]) throw new Error('Navigation hover color missing');
            link.classList.remove('verify-hover');
          }
          hover.remove();
          const outlines = [...doc.querySelectorAll('.site-head a, .footer a')].map(link => {
            link.focus();
            const style = win.getComputedStyle(link);
            if (!link.matches(':focus-visible') || style.outlineWidth !== '2px' || style.outlineStyle !== 'solid') throw new Error('Shared link focus outline missing');
            const outline = [style.outlineWidth, style.outlineStyle, style.outlineColor, style.outlineOffset];
            link.blur();
            return outline;
          });
          return [normal, focused, hovered, outlines];
        };
        for (const prefix of ['/', '/project/']) {
          for (const width of [390, 1440]) {
            frame.style.width = width + 'px';
            for (const theme of ['light', 'dark']) {
              localStorage.setItem('shortlink-theme', theme);
              let baseline;
              let controls;
              for (const native of [false, true]) {
                let directBaseline;
                frame.setAttribute('sandbox', native ? 'allow-same-origin' : 'allow-same-origin allow-scripts');
                for (const path of ['', 'tools/', 'guide/', 'tools/unknown/']) {
                  await load(prefix + path);
                  const doc = frame.contentDocument;
                  if (native) doc.documentElement.dataset.theme = theme;
                  else {
                    for (let tries = 0; path.includes('unknown') && doc.getElementById('head').textContent !== 'Link not found' && tries < 50; tries++) await wait();
                    if (doc.documentElement.dataset.theme !== theme) throw new Error('Theme was not restored');
                  }
                  await wait();
                  checkPalette(doc, theme);
                  shellGeometry(doc);
                  if (!native) {
                    const states = controlStates(doc);
                    if (!controls) controls = states;
                    equal(states, controls, 'shared theme control states');
                  }
                  const appearance = snapshot(doc);
                  if (!directBaseline) directBaseline = appearance;
                  if (!native && !baseline) baseline = appearance;
                  equal(appearance, directBaseline, prefix + path + '/' + width + '/' + theme + '/native=' + native);
                  if (!native && path.includes('unknown')) {
                    equal([...doc.querySelectorAll('.site-head a, .footer a[data-app-link]')].map(link => new URL(link.href).pathname), [prefix, prefix, prefix + 'guide/', prefix + 'guide/'], '404 shell rebase');
                  }
                  if (path === 'guide/' && frame.contentWindow.getComputedStyle(doc.querySelector('.prose section')).borderTopWidth !== '1px') throw new Error('Guide content separator lost');
                }
              }
              frame.setAttribute('sandbox', 'allow-same-origin allow-scripts');
              await load(prefix);
              const header = frame.contentDocument.querySelector('header');
              const footer = frame.contentDocument.querySelector('footer');
              const themeControl = frame.contentDocument.querySelector('[data-theme-control]');
               const hiddenToggle = frame.contentDocument.querySelector('#tag-toggle');
              hiddenToggle.click();
               const hiddenState = [hiddenToggle.textContent, hiddenToggle.getAttribute('aria-expanded'), frame.contentDocument.querySelector('#link-count').textContent];
              if (hiddenState[1] !== 'true') throw new Error('Hidden toggle did not activate');
              themeControl.click();
              const toggled = theme === 'light' ? 'dark' : 'light';
              if (frame.contentDocument.documentElement.dataset.theme !== toggled || themeControl.textContent !== 'Theme: ' + toggled || localStorage.getItem('shortlink-theme') !== toggled) throw new Error('Theme button did not change theme');
              checkPalette(frame.contentDocument, toggled);
               equal([hiddenToggle.textContent, hiddenToggle.getAttribute('aria-expanded'), frame.contentDocument.querySelector('#link-count').textContent], hiddenState, 'theme does not change picker state');
              themeControl.click();
              themeControl.blur();
              for (const path of ['guide/', 'tools/', '']) {
                const doc = frame.contentDocument;
                const link = doc.createElement('a');
                link.href = prefix + path;
                link.dataset.appLink = '';
                doc.querySelector('main').append(link);
                link.click();
                const expected = path === 'guide/' ? 'guide' : 'links';
                for (let tries = 0; (frame.contentWindow.location.pathname !== prefix + path || doc.querySelector('main').dataset.appPage !== expected) && tries < 100; tries++) await wait();
                if (frame.contentWindow.location.pathname !== prefix + path || doc.querySelector('main').dataset.appPage !== expected) throw new Error('App transition failed: ' + path);
                if (doc.querySelector('header') !== header || doc.querySelector('footer') !== footer || doc.querySelector('[data-theme-control]') !== themeControl) throw new Error('Shell replaced');
                if (doc.documentElement.dataset.theme !== theme) throw new Error('Theme lost on transition');
                await wait();
                shellGeometry(doc);
                equal(controlStates(doc), controls, 'app control states');
                equal(snapshot(doc), baseline, 'app ' + path + '/' + width + '/' + theme);
              }
            }
          }
        }
        for (const prefix of ['/', '/project/']) {
          frame.removeAttribute('sandbox');
          for (const [path, target] of [[prefix === '/' ? 'local/' : 'localProject/', '#about'], ['about/', '#about'], ['how-it-works/', '#how-it-works']]) {
            await load(prefix + path + '?native=1');
            for (let tries = 0; (frame.contentWindow.location.pathname !== prefix + 'guide/' || frame.contentWindow.location.hash !== target) && tries < 100; tries++) await wait();
            if (frame.contentWindow.location.pathname !== prefix + 'guide/' || frame.contentWindow.location.hash !== target) throw new Error('Native forwarding failed: ' + prefix + path);
            await load(prefix + path + '?fallback=1&native=1');
            const doc = frame.contentDocument;
            if (doc.querySelector('header, footer')) throw new Error('Minimal fallback has chrome');
            const main = doc.querySelector('main'), link = main.querySelector('a');
            const rect = main.getBoundingClientRect(), text = link.getBoundingClientRect();
            if (rect.width <= 0 || text.width <= 0 || text.left < rect.left || text.right > rect.right || frame.contentWindow.getComputedStyle(main).paddingTop !== '32px') throw new Error('Minimal fallback layout broken');
            if (new URL(link.href).pathname !== prefix + 'guide/' || new URL(link.href).hash !== target) throw new Error('Minimal fallback target broken');
          }
        }
        }
        document.body.dataset.shellCheck = 'passed';
      } catch (error) { document.body.dataset.shellCheck = error.message; }
    })();
  </script></body></html>`,
  );
  for (const system of ["light", "dark"]) {
    const html = runChrome(
      chrome,
      f.cwd,
      origin + "/shell-check.html?system=" + system,
      system === "dark" ? ["--force-dark-mode"] : [],
    );
    assert.match(html, /data-shell-check="passed"/, html);
    assert.ok(
      html.includes(`data-system-check="${system}"`),
      "system " + system + " actually executed",
    );
  }
});

test("script launchers are opt-in, quote URLs, forward arguments and statuses, and clean up", async (t) => {
  const url =
    "https://example.com/setup.sh?q='\";printf injected;#$(printf expanded)&x=`printf backticks`\\path\nnext";
  const f = await fixture(t, {
    Run: { url, tags: ["shell", "hidden", "script"] },
    tools: { Nested: { url, tags: ["script"] } },
    disabled: { url, tags: ["disabled"] },
    plain: url,
  });
  const build = f.build();
  assert.equal(build.status, 0, build.stderr);
  const launcher = await f.read("Run.sh");
  assert.equal(await f.read("tools/Nested.sh"), launcher);
  const home = await f.read("index.html");
  assert.match(
    home,
    /<li data-hidden="true" hidden data-tags="[^"]*" data-search="Run script [^"]+"><div class="link-row script-row"><a class="code script-link" href="\.\/Run\/">Run<\/a>/,
  );
  assert.doesNotMatch(home, /class="script-label"/);
  assert.match(
    home,
    /class="download" data-download-url="https:\/\/example\.com\/setup\.sh[^>]*data-download-name="setup.sh"[^>]*>Download<\/button><a class="visit" href="https:\/\/example\.com\/setup\.sh/,
  );
  assert.match(home, /data-search="[^"]*#shell #hidden #script"/);
  assert.match(
    home,
    /<button class="tags"[^>]*>[\s\S]*?#shell<\/span> · <span[^>]*>#hidden<\/span> · <span[^>]*>#script<\/span><\/button><a class="destination"/,
  );
  assert.match(
    home,
    /class="download" data-download-url="[^"]+" data-download-name="setup.sh" aria-label="Download script for Nested">Download<\/button><a class="visit"/,
  );
  assert.match(
    await f.read("tools/index.html"),
    /class="download" data-download-url="[^"]+" data-download-name="setup.sh" aria-label="Download script for Nested">Download<\/button><a class="visit"/,
  );
  assert.doesNotMatch(home, /class="download" href="\.\/disabled\.sh"/);
  assert.match(
    home,
    /<span class="count-number">3<\/span\s*><span class="count-label"> links<\/span>/,
  );
  assert.match(home, /class="code" href="\.\/disabled\/">disabled<\/a>/);
  assert.match(await f.read("assets/site.css"), /--script:\s*#c6a36a/);
  assert.match(await f.read("assets/site.css"), /\.download\s*\{/);
  assert.match(
    await f.read("assets/site.css"),
    /\.link-row\.script-row\s*\{\s*grid-template-columns:\s*max-content minmax\(4rem,\s*1fr\) max-content max-content;?\s*\}/,
  );
  assert.match(await f.read("tools/Nested/index.html"), /http-equiv="refresh"/);
  assert.match(await f.read("Run/index.html"), /http-equiv="refresh"/);
  await assert.rejects(f.read("disabled.sh"), { code: "ENOENT" });
  await assert.rejects(f.read("plain.sh"), { code: "ENOENT" });

  const log = join(f.cwd, "curl.json");
  const payload = 'printf \'%s\\n\' "$@"\nexit "$SCRIPT_STATUS"\n';
  await writeFile(
    join(f.cwd, "curl"),
    `#!/usr/bin/env bun
const { writeFileSync } = require('node:fs');
const args = process.argv.slice(2);
writeFileSync(process.env.CURL_LOG, JSON.stringify(args));
writeFileSync(args[args.indexOf('-o') + 1], ${JSON.stringify(payload)});
process.exit(Number(process.env.CURL_STATUS));
`,
    { mode: 0o755 },
  );

  const args = ["--verbose", "two words", "", "$HOME; $(printf injected)"];
  // Even failed/partial downloads leave executable content: it must never run.
  for (const [curlStatus, scriptStatus] of [
    [0, 0],
    [0, 7],
    [22, 0],
    [18, 0],
  ]) {
    const result = spawnSync("bash", ["-s", "--", ...args], {
      cwd: f.cwd,
      input: launcher,
      encoding: "utf8",
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
    assert.equal(result.stdout, curlStatus ? "" : args.join("\n") + "\n");
    const request = JSON.parse(await readFile(log, "utf8"));
    assert.equal(request.at(-1), url);
    await assert.rejects(readFile(request[request.indexOf("-o") + 1]), {
      code: "ENOENT",
    });
  }
});

test("invalid input fails before replacing an existing build", async (t) => {
  const legacyScriptCases = [true, false, null, "true", 1, [], {}].map(
    (script) => ({
      code: { url: "https://example.com", script },
    }),
  );
  const legacyHiddenCases = [true, false, null, "true", 1, [], {}].map(
    (hidden) => ({
      code: { url: "https://example.com", hidden },
    }),
  );
  const invalidTagCases = [null, "tag", 1, {}, [null], [1], [""], ["  "]].map(
    (tags) => ({
      code: { url: "https://example.com", tags },
    }),
  );
  const collisionCases = [
    {
      code: { url: "https://example.com", hidden: true },
      CODE: "https://example.org",
    },
    {
      code: { url: "https://example.com", hidden: true, tags: ["script"] },
      "CODE.SH": "https://example.org",
    },
    {
      code: { url: "https://example.com", tags: ["script"] },
      "code.sh": "https://example.org",
    },
    {
      "CODE.SH": "https://example.org",
      code: { url: "https://example.com", tags: ["script"] },
    },
    {
      tools: {
        run: { url: "https://example.com", tags: ["script"] },
        "RUN.SH": { git: "https://example.org" },
      },
    },
  ];
  const cases = [
    null,
    [],
    "https://example.com",
    { code: null },
    { code: [] },
    { code: 42 },
    { code: {} },
    { code: { url: 123 } },
    { code: { url: "https://example.com", title: null } },
    { code: "https://" },
    { code: "https://bad host/" },
    { code: "javascript:alert(1)" },
    { code: "/relative" },
    { ".hidden": "https://example.com" },
    { "../escape": "https://example.com" },
    { INDEX: "https://example.com" },
    ...["about", "GUIDE", "how-it-works"].map((code) => ({
      [code]: "https://example.com",
    })),
    { gh: "https://example.com", GH: "https://example.org" },
    { tools: { Git: "https://example.com", git: "https://example.org" } },
    { tools: { "index.html": "https://example.com" } },
    { tools: { git: "https://example.com", "GIT.SH": {} } },
    { tools: {} },
    { tools: { git: { title: "missing URL" } } },
    ...legacyScriptCases,
    ...legacyHiddenCases,
    ...invalidTagCases,
    ...collisionCases,
  ];
  const f = await fixture(t, {});
  await mkdir(join(f.cwd, "dist"));
  await writeFile(join(f.cwd, "dist", "marker"), "preserved");
  for (const value of cases) {
    await writeFile(join(f.cwd, "links.json"), JSON.stringify(value));
    const result = f.build();
    assert.equal(result.status, 1, JSON.stringify(value));
    assert.match(result.stderr, /Build stopped/);
    if (value?.code && typeof value.code === "object" && "script" in value.code)
      assert.match(
        result.stderr,
        /"code" — The script property is no longer supported; remove it\. Only for script: true, append script to tags unless a trimmed case-insensitive equivalent already exists; preserve all other tags, fields and order\. False must not remove an independently configured script tag\./,
      );
    if (value?.code && typeof value.code === "object" && "hidden" in value.code)
      assert.match(
        result.stderr,
        /"code" — The hidden property is no longer supported; remove it\. Only for hidden: true, append hidden to tags unless already present \(case-insensitive\); preserve all existing tags\./,
      );
    assert.equal(await f.read("marker"), "preserved");
  }
  await writeFile(join(f.cwd, "links.json"), "{broken");
  assert.match(f.build().stderr, /Build stopped\. Fix links.json/);
});

test("404 resolves root and nested paths under user and project sites", async (t) => {
  const map = {
    tools: {
      Git: "https://git-scm.com/",
      editors: {
        Code: { url: "https://example.org/", tags: ["hidden", "broken"] },
      },
      hiddenOnly: {
        Secret: { url: "https://example.com/secret", tags: ["hidden"] },
      },
    },
    Mixed: { url: "https://example.com/", tags: ["hidden", "script"] },
    Stopped: {
      Deep: {
        url: "https://example.com/disabled",
        tags: ["hidden", "disabled", "broken", "script"],
      },
    },
    plain: "https://example.org/",
  };
  const f = await fixture(t, map);
  assert.equal(f.build().status, 0);
  const script = behaviorScript(await f.read("404.html"), "recovery");
  for (const prefix of ["/", "/project/"]) {
    const visit = async (path, offline = false) => {
      const elements = { home: {}, head: {}, msg: {} };
      const shellLinks = [
        { dataset: {}, classList: { contains: () => true } },
        ...["links", "guide"].map((nav) => ({ dataset: { nav } })),
        { dataset: {}, classList: { contains: () => false } },
      ];
      const requests = [];
      let destination;
      await runInNewContext(script, {
        location: {
          pathname: prefix + path,
          replace: (url) => {
            destination = url;
          },
        },
        document: {
          getElementById: (id) => elements[id],
          querySelectorAll: () => shellLinks,
        },
        fetch: async (url) => {
          requests.push(url);
          if (offline) throw new Error("offline");
          return url === prefix + "links.json"
            ? { ok: true, json: async () => map }
            : { ok: false };
        },
      });
      return { elements, requests, destination, shellLinks };
    };
    for (const [path, expected] of [
      ["TOOLS/git/", map.tools.Git],
      ["tools/EDITORS/code", map.tools.editors.Code.url],
      ["TOOLS/editors/", prefix + "tools/editors/"],
      ["TOOLS/HIDDENONLY/secret", map.tools.hiddenOnly.Secret.url],
      ["tools/HIDDENONLY/", prefix + "tools/hiddenOnly/"],
      ...["Mixed", "mixed", "MIXED/"].map((code) => [code, map.Mixed.url]),
      ["plain", map.plain],
      ["PLAIN/", map.plain],
      ["STOPPED/deep", prefix + "Stopped/Deep/"],
      ["stopped/DEEP/", prefix + "Stopped/Deep/"],
    ]) {
      const { elements, requests, destination, shellLinks } = await visit(path);
      assert.equal(destination, expected);
      assert.equal(elements.home.href, prefix);
      assert.equal(requests.at(-1), prefix + "links.json");
      assert.deepEqual(
        shellLinks.map((link) => link.href),
        [prefix, prefix, prefix + "guide/", prefix + "guide/"],
      );
    }
    for (const [path, offline] of [
      ["tools/missing/", false],
      ["unknown/", false],
      ["unknown/", true],
    ]) {
      const { elements, destination } = await visit(path, offline);
      assert.equal(destination, undefined);
      assert.equal(elements.head.textContent, "Link not found");
      assert.equal(elements.home.href, prefix);
    }
    const offline = await visit("tools/missing/", true);
    assert.equal(offline.elements.home.href, prefix + "tools/");
    assert.ok(
      offline.shellLinks.every((link) => link.href === undefined),
      "no invented base without a map",
    );
  }
});

test("404 stops at the first readable ancestor map, even when the entry is missing", async (t) => {
  const f = await fixture(t, { tools: { git: "https://example.com/" } });
  assert.equal(f.build().status, 0);
  const script = behaviorScript(await f.read("404.html"), "recovery");
  for (const prefix of ["/", "/project/"]) {
    const requests = [];
    const elements = { home: {}, head: {}, msg: {} };
    await runInNewContext(script, {
      location: {
        pathname: prefix + "tools/missing/",
        replace() {
          assert.fail("no matching entry");
        },
      },
      document: {
        getElementById: (id) => elements[id],
        querySelectorAll: () => [],
      },
      fetch: async (url) => {
        requests.push(url);
        return { ok: true, json: async () => ({}) };
      },
    });
    assert.deepEqual(requests, [prefix + "tools/links.json"]);
    assert.equal(elements.home.href, prefix + "tools/");
    assert.equal(elements.head.textContent, "Link not found");
  }
});

test("404 defensively interprets malformed and uppercase fetched tags without probing a parent map", async (t) => {
  const f = await fixture(t, {});
  assert.equal(f.build().status, 0);
  const script = behaviorScript(await f.read("404.html"), "recovery");
  for (const prefix of ["/", "/project/"]) {
    for (const [tags, disabled] of [
      ["invalid", false],
      [[null], false],
      [[42], false],
      [[" DISABLED ", "HiDdEn", "SCRIPT"], true],
      [["BROKEN"], false],
    ]) {
      const requests = [];
      const elements = { home: {}, head: {}, msg: {} };
      let destination;
      await runInNewContext(script, {
        location: {
          pathname: prefix + "tools/mixed/",
          replace(url) {
            destination = url;
          },
        },
        document: {
          getElementById: (id) => elements[id],
          querySelectorAll: () => [],
        },
        fetch: async (url) => {
          requests.push(url);
          return {
            ok: true,
            json: async () => ({
              Mixed: { url: "https://example.com/valid", tags },
            }),
          };
        },
      });
      assert.equal(
        destination,
        disabled ? prefix + "tools/Mixed/" : "https://example.com/valid",
      );
      assert.deepEqual(requests, [prefix + "tools/links.json"]);
      assert.equal(elements.home.href, prefix + "tools/");
    }
  }
});

const stateMap = (script = true, samples = representativeTags) =>
  Object.fromEntries(
    Array.from({ length: 8 }, (_, mask) => [
      `${script ? "" : "Plain"}State${mask}`,
      {
        url: `https://example.com/a/very/long/destination/path/that/requires/middle/truncation/state${mask}.sh?q=</script>&x='"`,
        title: `State ${mask}`,
        tags: [
          "docs",
          "release-notes",
          ...samples,
          ...(script ? ["script"] : []),
          ...["hidden", "broken", "disabled"].filter(
            (_, bit) => mask & (1 << bit),
          ),
        ],
      },
    ]),
  );

test("all eight states share interpretation, raw JSON/YAML publication, counts and action precedence", async (t) => {
  const links = {
    ...stateMap(),
    near: {
      url: "https://example.com/",
      tags: ["hiddenish", "#hidden", "disabled-ish", "brokenish"],
    },
    duplicate: {
      url: "https://example.com/",
      tags: ["hidden", "hidden", "hidden", "disabled"],
    },
    plain: "https://example.com/",
  };
  const snapshot = JSON.stringify(links);
  const nodes = entryTree(links);
  assert.equal(
    JSON.stringify(links),
    snapshot,
    "interpretation borrows readonly source",
  );
  assert.equal(
    nodes.reduce((n, node) => n + node.visible, 0),
    6,
  );
  assert.deepEqual(linkFields(links.near), {
    url: links.near.url,
    title: "",
    script: false,
    hidden: false,
    broken: false,
    disabled: false,
    tags: links.near.tags,
  });
  for (const source of ["links.json", "links.yaml", "links.yml"]) {
    const f = await fixture(
      t,
      source === "links.json" ? links : stringify(links),
      source,
    );
    assert.equal(f.build().status, 0);
    assert.deepEqual(JSON.parse(await f.read("links.json")), links);
    const home = await f.read("index.html");
    assert.match(home, /class="count-number">6</);
    for (let mask = 0; mask < 8; mask++) {
      const fields = linkFields(links[`State${mask}`]);
      assert.equal(fields.hidden, !!(mask & 1));
      assert.equal(fields.broken, !!(mask & 2));
      assert.equal(fields.disabled, !!(mask & 4));
      const row = home.match(
        new RegExp(
          `<li([^>]*)><div class="([^"]*)" title="State ${mask}">([\\s\\S]*?)</li>`,
        ),
      );
      assert.ok(row);
      assert.equal(row[1].includes('data-hidden="true"'), !!(mask & 1));
      assert.equal(row[2].includes("broken-row"), !!(mask & 2));
      assert.equal(row[2].includes("disabled-row"), !!(mask & 4));
      const html = await f.read(`State${mask}/index.html`);
      if (mask & 4) {
        assert.match(html, /<title>Link disabled · shl<\/title>/);
        assert.match(html, /<h1>Link disabled<\/h1>/);
        assert.match(
          html.replace(/\s+/g, " "),
          /This short link has been disabled\. shl will not forward you to its destination\./,
        );
        assert.match(
          html.replace(/\s+/g, " "),
          /The destination remains public\. Disabling this link does not prevent access outside shl\./,
        );
        assert.doesNotMatch(
          html,
          /http-equiv="refresh"|rel="canonical"|data-behavior="forward"|Continue|<a\b|<header|<footer|example\.com/,
        );
        assert.equal(
          behaviorScript(html, "theme"),
          await f.read("assets/theme.js"),
        );
        assert.ok(
          html.includes(`<style>${await f.read("assets/site.css")}</style>`),
        );
        assert.match(
          row[3],
          /<button type="button" class="destination" data-copy-url=/,
        );
        assert.match(row[3], /class="visit" disabled/);
        assert.match(row[3], /class="download" disabled/);
        assert.doesNotMatch(
          row[3],
          /<a class="(?:destination|visit|download)"/,
        );
      } else {
        assert.match(html, /http-equiv="refresh"/);
        assert.match(row[3], /<a class="visit" href=/);
        assert.match(
          row[3],
          /<button type="button" class="download" data-download-url=/,
        );
      }
    }
  }
});

test("legacy hidden is always rejected, disabled validation retains output, and rebuilds replace stale state artifacts", async (t) => {
  const f = await fixture(t, {
    Run: { url: "https://example.com/setup.sh", tags: ["script"] },
  });
  assert.equal(f.build().status, 0);
  const enabled = await f.read("Run/index.html"),
    launcher = await f.read("Run.sh");
  for (const source of ["links.json", "links.yaml"]) {
    if (source !== "links.json") await unlink(join(f.cwd, "links.json"));
    for (const hidden of [true, false, null, 0, "true", [], {}]) {
      const map = {
        folder: {
          Run: {
            url: "https://example.com/",
            hidden,
            tags: ["hidden", "disabled"],
          },
        },
      };
      await writeFile(
        join(f.cwd, source),
        source === "links.json" ? JSON.stringify(map) : stringify(map),
      );
      const result = f.build();
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /"folder\/Run" — The hidden property is no longer supported; remove it\. Only for hidden: true, append hidden to tags unless already present \(case-insensitive\); preserve all existing tags\./,
      );
      assert.equal(await f.read("Run/index.html"), enabled);
      assert.equal(await f.read("Run.sh"), launcher);
    }
    if (source !== "links.json") await unlink(join(f.cwd, source));
  }
  for (const map of [
    { Run: { url: "javascript:alert(1)", tags: ["disabled"] } },
    {
      Run: { url: "https://example.com/", tags: ["disabled", "script"] },
      "RUN.SH": "https://example.com/",
    },
  ]) {
    await writeFile(join(f.cwd, "links.json"), JSON.stringify(map));
    assert.equal(f.build().status, 1);
    assert.equal(await f.read("Run.sh"), launcher);
  }
  for (const tags of [["disabled", "script"], ["script"]]) {
    await writeFile(
      join(f.cwd, "links.json"),
      JSON.stringify({
        Run: { url: "https://example.com/setup.sh", tags },
      }),
    );
    assert.equal(f.build().status, 0);
    const html = await f.read("Run/index.html"),
      script = await f.read("Run.sh");
    const isDisabled = tags.includes("disabled");
    if (isDisabled) {
      assert.doesNotMatch(html, /http-equiv="refresh"|data-behavior="forward"/);
      assert.doesNotMatch(script, /curl|mktemp|trap|bash "\$script"/);
    } else {
      assert.equal(html, enabled);
      assert.equal(script, launcher);
    }
  }
  await writeFile(join(f.cwd, "links.json"), "{}");
  assert.equal(f.build().status, 0);
  await assert.rejects(f.read("Run.sh"), { code: "ENOENT" });
  await assert.rejects(f.read("Run/index.html"), { code: "ENOENT" });
});

test("disabled Bash launchers exit 1 with exact stderr and invoke no downloader, payload or temp creation", async (t) => {
  const f = await fixture(t, {
    folder: {
      Run: {
        url: "https://example.com/setup.sh",
        tags: ["hidden", "broken", "disabled", "script"],
      },
    },
  });
  assert.equal(f.build().status, 0);
  await mkdir(join(f.cwd, "bin"));
  for (const name of ["curl", "mktemp", "bash"]) {
    await writeFile(
      join(f.cwd, "bin", name),
      '#!/bin/sh\nprintf invoked > "$INVOCATION"\nexit 99\n',
      { mode: 0o755 },
    );
  }
  const result = spawnSync(
    "/bin/bash",
    ["-s", "--", "--verbose", "two words", "$(touch unwanted)"],
    {
      input: await f.read("folder/Run.sh"),
      cwd: f.cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: join(f.cwd, "bin"),
        TMPDIR: join(f.cwd, "missing"),
        INVOCATION: join(f.cwd, "invoked"),
      },
    },
  );
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(
    result.stderr,
    "This link is disabled. No script was downloaded or executed.\n",
  );
  await assert.rejects(readFile(join(f.cwd, "invoked")), { code: "ENOENT" });
  await assert.rejects(readFile(join(f.cwd, "unwanted")), { code: "ENOENT" });
});

test("disabled copy-only controls keep full values, rejection feedback, timer reset and stale-copy cleanup", async (t) => {
  const url = "https://example.com/setup.sh?x=</script>&quote='\"";
  const f = await fixture(t, {
    Run: { url, tags: ["hidden", "broken", "disabled", "script"] },
  });
  assert.equal(f.build().status, 0);
  const status = { textContent: "" },
    timers = new Map(),
    copied = [];
  let next = 0,
    reject = false,
    settle;
  const list = {
    addEventListener(_, handler) {
      this.click = handler;
    },
    removeEventListener(_, handler) {
      assert.equal(handler, this.click);
      this.click = null;
    },
  };
  const context = {
    document: {
      querySelector: (selector) =>
        ({ ".links": list, "#copy-status": status })[selector],
    },
    navigator: {
      clipboard: {
        writeText: async (value) => {
          copied.push(value);
          if (reject) throw Error("denied");
          if (settle === true)
            await new Promise((resolve) => {
              settle = resolve;
            });
        },
      },
    },
    clearTimeout: (id) => timers.delete(id),
    setTimeout: (callback, delay) => {
      assert.equal(delay, 5000);
      timers.set(++next, callback);
      return next;
    },
  };
  runInNewContext((await f.read("assets/copy.js")) + "\ninitCopy();", context);
  const destination = {
    classList: { contains: () => false },
    hasAttribute: (name) => name === "data-copy-url",
    getAttribute: (name) => (name === "data-copy-url" ? url : null),
  };
  const code = {
    href: "https://short.example/project/Run/",
    classList: { contains: (name) => name === "code" },
    hasAttribute: () => false,
  };
  const click = async (control, extra = {}) => {
    let prevented = false;
    await list.click({
      button: 0,
      target: {
        closest: (selector) => {
          assert.ok(selector.includes("button[data-copy-url]"));
          return control;
        },
      },
      preventDefault() {
        prevented = true;
      },
      ...extra,
    });
    return prevented;
  };
  assert.equal(await click(code), true);
  assert.equal(copied.at(-1), code.href);
  assert.equal(status.textContent, "Short link copied.");
  const first = [...timers.keys()][0];
  assert.equal(await click(destination), true);
  assert.equal(copied.at(-1), url);
  assert.equal(status.textContent, "Destination copied.");
  assert.equal(timers.has(first), false);
  assert.equal(timers.size, 1);
  timers.values().next().value();
  assert.equal(status.textContent, "");
  for (const extra of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])
    assert.equal(await click(destination, extra), false);
  assert.equal(copied.length, 2);
  reject = true;
  await click(destination);
  assert.equal(
    status.textContent,
    "Could not copy the link. Select and copy the destination text.",
  );
  reject = false;
  settle = true;
  const pending = click(destination);
  context.cleanupCopy();
  settle();
  await pending;
  assert.equal(status.textContent, "");
  assert.equal(timers.size, 0);
  assert.equal(list.click, null);
});

test("seeded colors cover the hue spectrum, current map and conservative bounds on real tinted state surfaces", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const collectTags = (nodes) =>
    nodes.flatMap((node) =>
      node.isDirectory ? collectTags(node.children) : node.tags,
    );
  const current = [
    ...new Set(
      collectTags(
        entryTree(
          parse(
            await readFile(new URL("../links.yaml", import.meta.url), "utf8"),
          ),
        ),
      ),
    ),
  ];
  const samples = [
    ...new Set([
      "docs",
      ...spectrumTags,
      ...current.filter(
        (tag) => !["hidden", "broken", "disabled", "script"].includes(tag),
      ),
    ]),
  ];
  const colors = Object.fromEntries(
    [...samples, "hidden", "broken", "disabled", "script"].map((tag) => [
      tag,
      tagColors(tag),
    ]),
  );
  assert.equal(hueSamples.size, 360);
  assert.ok(new Set(samples.map((tag) => colors[tag].light)).size > 16);
  const f = await fixture(t, { folder: stateMap(true, samples) });
  assert.equal(f.build().status, 0);
  const origin = await browserServer(t, f.cwd);
  await writeFile(
    join(f.cwd, "dist", "spectrum-check.html"),
    `<!doctype html><html><body><iframe style="height:900px;border:0"></iframe><script>
  (async () => {try {
    const frame = document.querySelector('iframe');
    const load = path => new Promise(resolve => {frame.onload = resolve; frame.src = path;});
    const check = (ok,message) => {if(!ok) throw Error(message)};
    const colors = ${scriptString(colors)}, current = ${scriptString(current)};
    const blend = (a,b,o) => a.map((v,i)=>v*o+b[i]*(1-o));
    const rgb = value => {const v=value.match(/[\\d.]+/g).slice(0,3).map(Number);return value.startsWith('color(srgb ') ? v.map(c=>c*255) : v;};
    const lum = a => a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const contrast = (a,b) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
    const identity = e => JSON.parse(String.fromCharCode(34)+e.dataset.tag+String.fromCharCode(34));
    let minimum = Infinity, generated = 0, boundary = 0;
    for(const width of [390,1440]) for(const path of ['/', '/folder/']) {
      frame.style.width = width+'px'; await load(path);
      const doc=frame.contentDocument, win=frame.contentWindow;
      const rules=[...doc.styleSheets].flatMap(s=>[...s.cssRules]);
      for(const rule of rules.filter(r=>r.selectorText?.includes(':hover'))) rule.selectorText=rule.selectorText.replaceAll(':hover',':is(:hover,.verify-hover)');
      for(const li of doc.querySelectorAll('li[hidden]')) li.hidden=false;
      for(const d of doc.querySelectorAll('details')) d.open=true;
      for(const theme of ['light','dark']) {
        doc.documentElement.dataset.theme=theme;
        const bg=rgb(win.getComputedStyle(doc.body).backgroundColor);
        const readable = (label,row,kind) => {
          const style=win.getComputedStyle(label), opacity=Number(win.getComputedStyle(row).opacity);
          const backdrop=row.classList.contains('disabled-row') ? rgb(win.getComputedStyle(row.parentElement).backgroundColor) : bg;
          const ratio=contrast(blend(rgb(style.color),backdrop,opacity),blend(rgb(style.backgroundColor),backdrop,opacity));
          minimum=Math.min(minimum,ratio); check(ratio>=4.5,kind+' contrast '+ratio+' '+theme+' '+label.getAttribute('style'));
        };
        const available = [...doc.querySelectorAll('#available-tags button')];
        check(current.every(tag=>available.some(e=>identity(e)===tag)),'Current-map tag coverage');
        const catalog=new Map(available.map(e=>[identity(e),e.getAttribute('style')]));
        for(const row of doc.querySelectorAll('.link-row')) {
          check(row.getBoundingClientRect().height===50,'Hue fixture row height');
          for(const hovered of [false,true]) {
            row.classList.toggle('verify-hover',hovered);
            for(const label of row.querySelectorAll('.tag-label')) {
              const tag=identity(label), expected=colors[tag];
              check(label.style.getPropertyValue('--tag-light')===expected.light && label.style.getPropertyValue('--tag-dark')===expected.dark,'Seed vector metadata');
              check(label.getAttribute('style')===catalog.get(tag),'Root/nested/catalog metadata stability');
              label.classList.toggle('verify-hover',hovered); readable(label,row,'Generated'); generated++;
            }
          }
          row.classList.remove('verify-hover');
        }
        // Verify the fixed HSL envelope's hue/saturation/lightness endpoints
        // through native CSS, not a competing JS HSL conversion.
        const row=doc.querySelector('.link-row.disabled-row').cloneNode(false);
        const li=doc.createElement('li'); li.dataset.hidden='true'; li.append(row); doc.querySelector('.links').append(li);
        const probe=doc.createElement('span'); probe.className='tag-label';probe.textContent='#bounds';row.append(probe);
        for(let hue=0;hue<360;hue++) for(const sat of [55,75]) for(const light of [20,22]) for(const dark of [80,84]) {
          probe.style.setProperty('--tag-light','hsl('+hue+' '+sat+'% '+light+'%)');probe.style.setProperty('--tag-dark','hsl('+hue+' '+sat+'% '+dark+'%)');
          for(const hover of [false,true]) {probe.classList.toggle('verify-hover',hover);readable(probe,row,'Bounds');boundary++;}
        }
        li.remove();
      }
    }
    document.body.dataset.minimum=minimum.toFixed(4); document.body.dataset.generated=generated;document.body.dataset.boundary=boundary;document.body.dataset.spectrumCheck='passed';
  } catch(error){document.body.dataset.spectrumCheck=error.message}})();
  </script></body></html>`,
  );
  const html = runChrome(chrome, f.cwd, origin + "/spectrum-check.html");
  assert.match(html, /data-spectrum-check="passed"/, html);
  const minimum = Number(html.match(/data-minimum="([^"]+)"/)[1]);
  assert.ok(minimum >= 4.5);
  console.info(
    `Seeded hue contrast: minimum ${minimum}:1; ${html.match(/data-generated="([^"]+)"/)[1]} generated and ${html.match(/data-boundary="([^"]+)"/)[1]} envelope surface checks`,
  );
});

test("state rows, selected filters, all-hidden traversal, disabled native actions and lifecycle render in both themes and sizes", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const f = await fixture(t, {
    ...stateMap(),
    ...stateMap(false),
    nativeFolder: {
      DisabledCode: {
        url: "https://example.com/native-disabled",
        tags: ["disabled"],
      },
    },
    onlyHidden: {
      deeper: {
        Broken: {
          url: "https://example.com/broken",
          tags: ["hidden", "broken"],
        },
        Disabled: {
          url: "https://example.com/disabled",
          tags: ["hidden", "disabled", "script"],
        },
        Unmatched: {
          url: "https://example.com/other",
          tags: ["hidden", "docs-api"],
        },
      },
    },
    docs: {
      Fragment: {
        url: "https://example.com/#docs",
        title: "docs broken disabled",
        tags: ["docs-api", "broken-#disabled"],
      },
      Literal: {
        url: "https://example.com/",
        title: "docs guide",
        tags: ["release-notes"],
      },
    },
  });
  assert.equal(f.build().status, 0);
  const origin = await browserServer(t, f.cwd);
  await writeFile(
    join(f.cwd, "dist", "state-check.html"),
    `<!doctype html><html><body><iframe style="height:900px;border:0"></iframe><script>
    (async () => { try {
      const frame = document.querySelector('iframe');
      const wait = () => new Promise(resolve => setTimeout(resolve, 30));
      const load = path => new Promise(resolve => { frame.onload = resolve; frame.src = path; });
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      const disabledUrl = ${scriptString(stateMap().State7.url)};
      const configured = ${scriptString({ ...stateMap(), ...stateMap(false) })};
      const rgb = color => { color = color.trim(); if (color.startsWith('#')) { let hex = color.slice(1); if (hex.length === 3) hex = [...hex].map(c => c+c).join(''); return hex.match(/../g).map(c => parseInt(c, 16)); } const values = color.match(/[\\d.]+/g).slice(0, 3).map(Number); return color.startsWith('color(srgb ') ? values.map(v => v * 255) : values; };
      const blend = (front, back, opacity) => front.map((v, i) => v * opacity + back[i] * (1-opacity));
      const grayscale = (win, element, pseudo) => {
        const style = win.getComputedStyle(element, pseudo);
        for (const property of ['color', 'backgroundColor', 'borderTopColor', 'outlineColor']) {
          const channels = rgb(style[property]);
          check(Math.abs(channels[0] - channels[1]) < .001 && Math.abs(channels[1] - channels[2]) < .001, 'Disabled color: ' + element.className + '/' + property + '/' + style[property]);
        }
      };
      const luminance = color => color.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
      const readable = (win, element, background, backdrop, opacity = 1, pseudo) => {
        const style = win.getComputedStyle(element, pseudo);
        const fill = style.backgroundColor === 'rgba(0, 0, 0, 0)' ? background : rgb(style.backgroundColor);
        check(contrast(blend(rgb(style.color), backdrop, opacity), blend(fill, backdrop, opacity)) >= 4.5, 'Disabled contrast: ' + element.className + '/' + (pseudo || 'text'));
      };
      const query = (doc, value) => { const input = doc.querySelector('#link-search'); input.value = value; input.dispatchEvent(new frame.contentWindow.Event('input')); };
      const count = doc => Number(doc.querySelector('.count-number').textContent);
      const row = (doc, code) => [...doc.querySelectorAll('.link-row')].find(row => row.querySelector('.code').textContent === code);
      const shown = doc => [...doc.querySelectorAll('.link-row')].filter(row => !row.closest('li').hidden && row.getClientRects().length).map(row => row.querySelector('.code').textContent).sort().join(',');
      for (const prefix of ['/', '/project/']) for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
        frame.style.width = width + 'px'; localStorage.setItem('shortlink-theme', theme);
        for (const native of [false, true]) {
          frame.setAttribute('sandbox', native ? 'allow-same-origin' : 'allow-same-origin allow-scripts');
          await load(prefix + (native ? '?native=1' : ''));
          let doc = frame.contentDocument, win = frame.contentWindow;
          if (native) doc.documentElement.dataset.theme = theme;
           const toggle = doc.querySelector('#tag-toggle');
          if (native) { check(toggle.hidden && doc.querySelector('.search').hidden, 'Native tools visible');
            for (const li of doc.querySelectorAll('li[data-hidden]')) check(li.hidden, 'Native hidden leaf revealed');
            // Inspect all variants without enabling scripts; this is a geometry/style projection only.
            for (const li of doc.querySelectorAll('li[hidden]')) li.hidden = false;
            for (const details of doc.querySelectorAll('details')) details.open = true;
           } else {
             toggle.click();
             doc.querySelector('#available-tags button[data-tag="hidden"]').click();
             // Project all variants for style inspection, then reset before predicates.
             for (const li of doc.querySelectorAll('li[hidden]')) li.hidden = false;
             for (const details of doc.querySelectorAll('details')) details.open = true;
           }
          const rules = [...doc.styleSheets].flatMap(sheet => [...sheet.cssRules]);
          const pointerRule = rules.find(rule => rule.conditionText === '(hover: hover) and (pointer: fine)');
          const coarseRule = rules.find(rule => rule.conditionText === '(any-pointer: coarse)');
          const pointerMedia = pointerRule.media.mediaText, coarseMedia = coarseRule.media.mediaText;
          const hoverRules = [...rules, ...pointerRule.cssRules].filter(rule => rule.selectorText?.includes(':hover')).map(rule => [rule, rule.selectorText]);
          for (const [rule, selector] of hoverRules) rule.selectorText = selector.replaceAll(':hover', ':is(:hover, .verify-hover)');
          const probe = doc.createElement('div'); probe.style.display = 'none';
          const paint = (value, scope) => { scope.append(probe); probe.style.background = value; const color = win.getComputedStyle(probe).backgroundColor; probe.remove(); return color; };
           const bg = rgb(win.getComputedStyle(doc.body).backgroundColor);
           const tagSurface = (element, backdrop = bg, opacity = 1) => {
             const tag = element.dataset.tag;
             for (const hovered of [false, true]) {
               element.classList.toggle('verify-hover', hovered);
               const s = win.getComputedStyle(element);
               check(s.color === paint('var(--tag-' + theme + ')', element), 'Generated tag ink mismatch: ' + tag);
               check(s.backgroundColor === paint('color-mix(in srgb, var(--tag-tone) ' + (hovered ? 8 : 5) + '%, var(--panel))', element), 'Tag tint mismatch: ' + tag);
               check(s.borderTopWidth === '1px' && s.borderTopStyle === 'solid' && s.borderTopColor === paint('color-mix(in srgb, var(--tag-tone) ' + (hovered ? 45 : 30) + '%, var(--panel))', element), 'Tag border mismatch: ' + tag);
               readable(win, element, backdrop, backdrop, opacity);
             }
             element.classList.remove('verify-hover');
           };
           const representatives = ${scriptString(representativeTags)};
           const covers = elements => representatives.every(tag => [...elements].some(e => e.dataset.tag === tag));
           if (!native) {
             check(covers(doc.querySelectorAll('#available-tags button')), 'Available fixture must cover broad generated hues');
             const selectedSeeds = new Set();
             for (const chip of doc.querySelectorAll('#available-tags button')) {
               tagSurface(chip);
               if (chip.hidden) continue;
               chip.click();
               const moved = [...doc.querySelectorAll('#selected-tags button')].find(b => b.dataset.tag === chip.dataset.tag);
               check(moved.getAttribute('style') === chip.getAttribute('style'), 'Selected metadata must clone catalog');
               tagSurface(moved); selectedSeeds.add(moved.dataset.tag); moved.click();
             }
             check(representatives.every(tag => selectedSeeds.has(tag)), 'Selected fixture must cover generated hues');
             for (const li of doc.querySelectorAll('li[hidden]')) li.hidden = false;
             for (const details of doc.querySelectorAll('details')) details.open = true;
           }
          for (const script of [true, false]) for (let mask = 0; mask < 8; mask++) {
            const r = row(doc, (script ? '' : 'Plain') + 'State' + mask), style = win.getComputedStyle(r), code = r.querySelector('.code');
            check(r.getBoundingClientRect().height === 50, 'State row changed height');
            check(Number(style.opacity) === (mask & 1 ? theme === 'dark' ? .8 : .94 : 1), 'State opacity');
            const expected = win.getComputedStyle(doc.documentElement).getPropertyValue(mask & 4 ? '--disabled' : mask & 2 ? '--broken' : script ? '--script' : '--accent');
            check(!!r.querySelector('.download') === script, 'Non-script Download control');
            check(JSON.stringify(rgb(win.getComputedStyle(code).color)) === JSON.stringify(rgb(expected)), 'State precedence');
            const brokenEnabled = (mask & 2) && !(mask & 4), visit = r.querySelector('.visit');
            const rowWash = brokenEnabled ? paint('color-mix(in srgb, var(--broken) 6%, var(--bg))', r) : paint('var(--wash)', r);
            const tone = brokenEnabled ? '--broken' : '--accent';
            check(JSON.stringify(rgb(win.getComputedStyle(visit).color)) === JSON.stringify(rgb(style.getPropertyValue(mask & 4 ? '--muted' : tone))), 'Open state palette');
            check(win.getComputedStyle(visit).borderTopColor === paint('color-mix(in srgb, var(' + tone + ') 25%, var(--bg))', r), 'Open border palette');
            check(win.getComputedStyle(visit).backgroundColor === paint(mask & 4 ? 'var(--wash)' : 'color-mix(in srgb, var(' + tone + ') 10%, var(--bg))', r), 'Open fill palette');
            r.classList.add('verify-hover'); visit.classList.add('verify-hover');
            check(win.getComputedStyle(r).backgroundColor === rowWash, 'Row hover palette');
            check(win.getComputedStyle(visit).backgroundColor === paint(mask & 4 ? 'var(--wash)' : 'color-mix(in srgb, var(' + tone + ') ' + (brokenEnabled ? 12 : 18) + '%, var(--bg))', r), 'Open hover palette');
            if (brokenEnabled) check(contrast(blend(rgb(win.getComputedStyle(visit).color), bg, Number(style.opacity)), blend(rgb(win.getComputedStyle(visit).backgroundColor), bg, Number(style.opacity))) >= 4.5, 'Dimmed broken Open hover contrast: ' + theme + '/' + mask);
            const hoveredDestination = r.querySelector('.destination'), restingColor = win.getComputedStyle(hoveredDestination).color;
            check(JSON.stringify(rgb(restingColor)) === JSON.stringify(rgb(style.getPropertyValue('--muted'))), 'Destination resting palette');
            hoveredDestination.classList.add('verify-hover');
            check(JSON.stringify(rgb(win.getComputedStyle(hoveredDestination).color)) === JSON.stringify(rgb(style.getPropertyValue(tone))), 'Destination hover palette');
            for (const fragment of hoveredDestination.querySelectorAll('.destination-start, .destination-end')) check(win.getComputedStyle(fragment).color === win.getComputedStyle(hoveredDestination).color, 'Visible destination hover palette');
            check(win.getComputedStyle(hoveredDestination).textDecorationLine === 'underline', 'Destination hover underline');
            if (brokenEnabled) check(contrast(blend(rgb(win.getComputedStyle(hoveredDestination).color), bg, Number(style.opacity)), blend(rgb(rowWash), bg, Number(style.opacity))) >= 4.5, 'Dimmed broken destination hover contrast');
            hoveredDestination.classList.remove('verify-hover');
            check(win.getComputedStyle(hoveredDestination).color === restingColor, 'Destination hover palette restoration');
            r.classList.remove('verify-hover'); visit.classList.remove('verify-hover');
              for (const element of [code, r.querySelector('.destination')]) {
              for (const background of [bg, rgb(rowWash)]) check(contrast(blend(rgb(win.getComputedStyle(element).color), bg, Number(style.opacity)), blend(background, bg, Number(style.opacity))) >= 4.5, 'Dimmed contrast failed: ' + theme + '/' + mask + '/' + element.className);
            }
            code.focus(); check(win.getComputedStyle(r).opacity === '1', 'Focus opacity');
            check(win.getComputedStyle(r).backgroundColor === rowWash, 'Row focus palette');
            check(contrast(rgb(win.getComputedStyle(visit).color), rgb(win.getComputedStyle(visit).backgroundColor)) >= 4.5, 'Open contrast');
            check(win.getComputedStyle(code).outlineWidth === '2px', 'Focus outline'); code.blur();
             const dest = r.querySelector('.destination');
             check(dest.getBoundingClientRect().width >= (width < 500 ? 48 : 64), 'Destination reserve');
             const labelBackdrop = mask & 4 ? rgb(win.getComputedStyle(r.parentElement).backgroundColor) : bg;
             check(covers(r.querySelectorAll('.tag-label')), 'Row fixture must cover generated hues');
             for (const hovered of [false, true]) {
               r.classList.toggle('verify-hover', hovered);
               for (const label of r.querySelectorAll('.tag-label')) tagSurface(label, labelBackdrop, Number(style.opacity));
             }
             r.classList.remove('verify-hover');
             const tagsPanel = r.nextElementSibling;
             tagsPanel.showPopover();
             check(covers(tagsPanel.querySelectorAll('.tag-label')), 'Popover fixture must cover generated hues');
             for (const label of tagsPanel.querySelectorAll('.tag-label')) tagSurface(label);
             tagsPanel.hidePopover();
            if (mask & 4) {
              const elements = [r, ...r.querySelectorAll('a, button')];
              const backdrop = rgb(win.getComputedStyle(r.parentElement).backgroundColor);
              check(backdrop[0] === backdrop[1] && backdrop[1] === backdrop[2], 'Disabled compositing backdrop colored');
              for (const hovered of [false, true]) {
                for (const element of elements) element.classList.toggle('verify-hover', hovered);
                for (const element of elements) grayscale(win, element);
                check(win.getComputedStyle(code).textDecorationLine === 'none', 'Disabled short code changed on hover');
                const background = rgb(win.getComputedStyle(r).backgroundColor);
                for (const element of elements.slice(1)) readable(win, element, background, backdrop, Number(style.opacity));
                for (const action of r.querySelectorAll('.visit, .download')) check(JSON.stringify(rgb(win.getComputedStyle(action).backgroundColor)) === JSON.stringify(rgb(win.getComputedStyle(r).getPropertyValue('--wash'))), 'Disabled hover changed action wash');
              }
              for (const element of elements) element.classList.remove('verify-hover');
              for (const element of [code, dest, r.querySelector('.tags')]) {
                element.focus(); grayscale(win, element); grayscale(win, r); grayscale(win, element, '::selection'); readable(win, element, backdrop, backdrop, 1, '::selection'); element.blur();
              }
              for (const span of dest.querySelectorAll('span')) { grayscale(win, span, '::selection'); readable(win, span, backdrop, backdrop, 1, '::selection'); }
              const panel = r.nextElementSibling;
               panel.showPopover(); grayscale(win, panel); readable(win, panel, backdrop, backdrop); grayscale(win, panel, '::selection'); readable(win, panel, backdrop, backdrop, 1, '::selection');
               for (const label of panel.querySelectorAll('.tag-label')) readable(win, label, backdrop, backdrop);
               panel.focus(); grayscale(win, panel); panel.hidePopover(); panel.blur();
              check(dest.tagName === 'BUTTON' && !dest.hasAttribute('href') && win.getComputedStyle(dest).userSelect === 'text', 'Disabled destination navigates or not selectable');
              check(dest.getAttribute('aria-label') === 'Copy destination: ' + configured[code.textContent].url, 'Disabled accessible full value');
              const height = r.getBoundingClientRect().height, destWidth = dest.getBoundingClientRect().width;
              pointerRule.media.mediaText = 'all'; coarseRule.media.mediaText = 'not all';
              check(win.getComputedStyle(dest).opacity === '0' && win.getComputedStyle(dest).pointerEvents === 'none', 'Button visible before hover');
              r.classList.add('verify-hover');
              check(win.getComputedStyle(dest).opacity === '1' && win.getComputedStyle(dest).pointerEvents === 'auto', 'Button hover reveal');
              r.classList.remove('verify-hover'); dest.focus();
              check(win.getComputedStyle(dest).opacity === '1' && win.getComputedStyle(dest).outlineWidth === '2px' && win.getComputedStyle(r).opacity === '1', 'Button focus reveal');
              dest.blur(); coarseRule.media.mediaText = 'all';
              check(win.getComputedStyle(dest).opacity === '1' && win.getComputedStyle(dest).pointerEvents === 'auto', 'Button hybrid/coarse visibility');
              pointerRule.media.mediaText = 'not all'; coarseRule.media.mediaText = 'not all';
              check(win.getComputedStyle(dest).opacity === '1', 'Button non-hover visibility');
              check(r.getBoundingClientRect().height === height && dest.getBoundingClientRect().width === destWidth, 'Button pointer states shift geometry');
              check(win.getComputedStyle(dest.querySelector('.destination-start')).textOverflow === 'ellipsis' && win.getComputedStyle(dest.querySelector('.destination-end')).textOverflow === 'ellipsis', 'Button middle truncation');
              const selection = win.getSelection(), range = doc.createRange();
              range.selectNodeContents(dest); selection.removeAllRanges(); selection.addRange(range);
              check(selection.toString() === configured[code.textContent].url, 'Disabled native selection duplicates or splits URL: ' + JSON.stringify(selection.toString()));
              selection.removeAllRanges();
              pointerRule.media.mediaText = pointerMedia; coarseRule.media.mediaText = coarseMedia;
              for (const action of r.querySelectorAll('.visit, .download')) {
                check(action.disabled && !action.hasAttribute('href'), 'Disabled action actionable');
                const before = win.location.href; action.click(); action.dispatchEvent(new win.MouseEvent('click', { ctrlKey: true, bubbles: true })); check(win.location.href === before, 'Disabled modified action navigated');
              }
            }
          }
          for (const [rule, selector] of hoverRules) rule.selectorText = selector;
          if (!native) {
             doc.querySelector('#selected-tags button').click();
             query(doc, '  #DOCS  '); check(count(doc) === 8, 'Selected docs excludes hidden');
             doc.querySelector('#selected-tags button').click();
             query(doc, '#release-notes '); check(count(doc) === 9, 'Selected renamed tag');
             doc.querySelector('#selected-tags button').click();
            query(doc, '#'); check(count(doc) === 0 && !doc.querySelector('#search-status').hidden, 'Bare tag');
            query(doc, 'docs guide'); check(count(doc) === 1 && shown(doc) === 'Literal', 'Plain substring split');
             query(doc, '#broken #disabled '); check(count(doc) === 4, 'Reserved AND');
             for (const chip of [...doc.querySelectorAll('#selected-tags button')]) chip.click();
             query(doc, '#disabled '); check(count(doc) === 10, 'State exception');
            // Actual clipboard success/failure through both disabled copy controls, including hidden combination.
            const copied = []; let fail = false;
            Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: async value => { if (fail) throw Error('denied'); copied.push(value); } } });
            const r = row(doc, 'State7');
            r.querySelector('.code').click(); await wait(); check(copied.at(-1) === new URL(prefix + 'State7/', location.href).href, 'Disabled short copy');
            const destination = r.querySelector('.destination'); destination.click(); await wait(); check(copied.at(-1) === disabledUrl, 'Disabled destination copy');
            check(doc.querySelector('#copy-status').textContent === 'Destination copied.', 'Copy feedback');
            fail = true; destination.click(); await wait(); check(doc.querySelector('#copy-status').textContent.includes('Select and copy'), 'Copy-only failure fallback');
            const header = doc.querySelector('header'), footer = doc.querySelector('footer');
            doc.querySelector('[data-nav="guide"]').click();
            for (let tries = 0; doc.querySelector('main').dataset.appPage !== 'guide' && tries < 100; tries++) await wait();
            check(doc.querySelector('header') === header && doc.querySelector('footer') === footer && doc.documentElement.dataset.theme === theme, 'State navigation shell lost');
            check(!doc.querySelector('#copy-status'), 'Outgoing feedback remained');
            doc.querySelector('[data-nav="links"]').click();
            for (let tries = 0; !doc.querySelector('#link-search') && tries < 100; tries++) await wait();
             check(doc.querySelector('#link-search').value === '' && doc.querySelector('#tag-toggle').getAttribute('aria-expanded') === 'false' && doc.querySelector('#selected-tags').hidden, 'State controls did not reset');
          }
          await load(prefix + 'onlyHidden/' + (native ? '?native=1' : ''));
          doc = frame.contentDocument;
          if (!native) {
            check(!doc.querySelector('.search').hidden && count(doc) === 0 && !doc.querySelector('#empty-directory').hidden, 'All-hidden search unreachable');
            const details = doc.querySelector('details'); check(!details.open, 'Initial hidden disclosure');
             query(doc, '#broken '); check(count(doc) === 1 && shown(doc) === 'Broken', 'Hidden ancestors/siblings');
            check(details.open, 'State search did not expand ancestor');
             const toggle = doc.querySelector('#tag-toggle'); check(toggle.getAttribute('aria-expanded') === 'false', 'Token mutated picker');
            toggle.click(); check(count(doc) === 1 && shown(doc) === 'Broken', 'Toggle changed state matches');
             query(doc, ''); check(count(doc) === 1, 'Clearing lost selection');
             check(details.open, 'Selection should retain auto-expanded ancestor');
             doc.querySelector('#selected-tags button').click();
             toggle.click(); check(count(doc) === 0 && !doc.querySelector('#empty-directory').hidden, 'Removing last reserved restores empty state');
            for (const value of ['broken', '#docs-api', '#missing']) { query(doc, value); check(count(doc) === 0 && !doc.querySelector('#search-status').hidden && doc.querySelector('#empty-directory').hidden && !doc.querySelector('.search').hidden, 'All-hidden zero results'); }
             query(doc, '#disabled '); check(count(doc) === 1 && shown(doc) === 'Disabled', 'Hidden disabled selection');
             doc.querySelector('#selected-tags button').click();
             query(doc, '#hidden '); check(count(doc) === 3, 'Hidden selection');
             doc.querySelector('#selected-tags button').click();
            query(doc, ''); check(count(doc) === 0 && !doc.querySelector('#empty-directory').hidden, 'Hidden clearing');
            check(!details.open, 'Hidden state clear retained auto-expanded ancestor');
             details.open = true; query(doc, '#broken '); query(doc, '#disabled ');
             for (const chip of [...doc.querySelectorAll('#selected-tags button')]) chip.click();
             query(doc, '');
            check(details.open, 'State-search switch/clear collapsed visitor-opened ancestor');
          }
          if (native) {
            await load(prefix + 'nativeFolder/?native=1');
            doc = frame.contentDocument;
            const code = row(doc, 'DisabledCode').querySelector('.code');
            check(new URL(code.href).pathname === prefix + 'nativeFolder/DisabledCode/', 'Nested native disabled code target');
            await new Promise(resolve => { frame.onload = resolve; code.click(); });
            check(frame.contentDocument.querySelector('h1')?.textContent === 'Link disabled' && frame.contentWindow.location.pathname === prefix + 'nativeFolder/DisabledCode/', 'Nested native disabled code forwarded');
          }
          // No fallback parameter: native meta refresh would still execute if disabling were faulty.
          await load(prefix + 'State7/' + (native ? '?native=1' : ''));
          doc = frame.contentDocument;
          check(doc.querySelector('h1')?.textContent === 'Link disabled' && !doc.querySelector('header, footer, a'), 'Direct disabled explanation');
          check(frame.contentWindow.location.pathname === prefix + 'State7/', 'Disabled forwarding');
          check(frame.contentWindow.getComputedStyle(doc.querySelector('main')).paddingTop === '32px', 'Minimal foundations');
        }
        frame.removeAttribute('sandbox');
        for (const path of ['state7', 'STATE7/', 'ONLYHIDDEN/DEEPER/disabled', 'onlyhidden/deeper/DISABLED/']) {
          await load(prefix + path);
          for (let tries = 0; frame.contentDocument.querySelector('h1')?.textContent !== 'Link disabled' && tries < 100; tries++) await wait();
          check(frame.contentDocument.querySelector('h1')?.textContent === 'Link disabled', 'Recovered disabled forwarded');
          check(frame.contentWindow.location.pathname === prefix + (path.toLowerCase().startsWith('state') ? 'State7/' : 'onlyHidden/deeper/Disabled/'), 'Canonical recovery');
        }
      }
      document.body.dataset.stateCheck = 'passed';
    } catch (error) { document.body.dataset.stateCheck = error.message; } })();
  </script></body></html>`,
  );
  const html = runChrome(chrome, f.cwd, origin + "/state-check.html");
  assert.match(html, /data-state-check="passed"/, html);
});
