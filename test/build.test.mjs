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
import { stringify } from "yaml";
import { linkFields, entryTree } from "../src/links.mjs";
import { scriptString } from "../src/layout.mjs";

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
      script: true,
      tags: ["setup", "shell", "hidden"],
    },
  };
  const yaml = `gh: https://github.com/
Run:
  url: https://example.com/setup.sh
  title: 'Setup #1'
  script: true
  tags: [setup, shell, hidden]
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
      /script must be a boolean/,
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
  assert.match(
    emptyHtml,
    /id="hidden-toggle"[^>]*disabled\s*>\s*Show hidden links/,
  );
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
      /<div class="directory-toggles">\s*<button\s+id="hidden-toggle"[^>]*disabled\s*>\s*Show hidden links\s*<\/button>\s*<\/div>/,
    );
  assert.match(home, /<div class="breadcrumbs" aria-hidden="true"><\/div>/);
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
        elements["#link-count"] = { textContent: "" };
        elements["#hidden-toggle"] = control({
          disabled: /id="hidden-toggle"[^>]*disabled/.test(content),
          hidden: true,
        });
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
    }
    assert.deepEqual(assetOrder, [
      "assets/theme.js",
      "assets/search.js",
      "assets/copy.js",
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
      1,
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
    assert.equal(controls["#hidden-toggle"].handlers.get("click").length, 1);
    assert.equal(controls[".links"].handlers.get("click").length, 1);
    controls["#hidden-toggle"].handlers.get("click")[0]();
    assert.equal(controls["#hidden-toggle"]["aria-pressed"], "true");
    assert.equal(controls["#link-count"].textContent, "1 link");
    controls["#link-search"].value = "missing";
    controls["#link-search"].handlers.get("input")[0]();
    assert.equal(controls["#link-count"].textContent, "0 links");
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
      document.currentMain.elements["#hidden-toggle"].handlers.get("click")
        .length,
      1,
    );
    assert.equal(await click(brand), true);
    assert.equal(await click(guide), true);
    assert.equal(await click(makeLink(base + "hidden/")), true);
    assert.equal(
      document.currentMain.elements[".links"].handlers.get("click").length,
      1,
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
      tags: ["hidden"],
      script: true,
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
      /<div class="directory-toggles">\s*<button\s+id="hidden-toggle"/,
    );
    assert.match(
      html,
      /id="hidden-toggle"[^>]*aria-pressed="false"\s+hidden\s*>\s*Show hidden links/,
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
    assert.match(html, /id="hidden-toggle"[^>]*hidden\s*>\s*Show hidden links/);
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
      /<div class="search" hidden>\s*<label class="sr-only" for="link-search">Search links<\/label>\s*<input\s+id="link-search"\s+type="search"\s+placeholder="Search link, title or tag"/,
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
    assert.match(
      html,
      /id="hidden-toggle"[^>]*disabled\s*>\s*Show hidden links/,
    );
  }

  const leaf = (text, title = "") => ({
    firstElementChild: { tagName: "DIV" },
    textContent: text,
    dataset: { title },
    hidden: false,
  });
  const group = (name, ...children) => {
    const details = {
      tagName: "DETAILS",
      open: false,
      querySelector: (selector) =>
        selector === "summary" ? { textContent: name } : { children },
    };
    return { firstElementChild: details, dataset: {}, hidden: false };
  };
  const gh = leaf("gh https://github.com/ Open");
  gh.dataset.search = "gh https://github.com/";
  const git = leaf("git https://git-scm.com/");
  const code = leaf("Code https://example.org/", "VS Code");
  const editors = group("editors", code);
  const tools = group("tools", git, editors);
  const list = { children: [gh, tools] };
  const search = { hidden: true };
  const input = {
    value: "",
    parentElement: search,
    addEventListener: (_, listener) => {
      input.update = listener;
    },
  };
  const status = { hidden: true, textContent: "" };
  const count = { textContent: "3 links" };
  const disabledToggle = {
    disabled: true,
    hidden: false,
    addEventListener() {
      throw new Error("disabled toggle should not activate");
    },
  };
  const elements = {
    "#link-search": input,
    ".links": list,
    "#search-status": status,
    "#link-count": count,
    "#hidden-toggle": disabledToggle,
  };
  runInNewContext((await f.read("assets/search.js")) + "\ninitSearch();", {
    document: { querySelector: () => null },
  });
  runInNewContext((await f.read("assets/search.js")) + "\ninitSearch();", {
    document: {
      querySelector: (selector) => (selector === "#link-search" ? {} : null),
    },
  });
  runInNewContext((await f.read("assets/search.js")) + "\ninitSearch();", {
    document: { querySelector: (selector) => elements[selector] },
  });
  assert.equal(search.hidden, false);
  assert.equal(disabledToggle.hidden, false);

  tools.firstElementChild.open = true; // Preserve directories opened by the visitor.
  input.value = "vs code";
  input.update();
  assert.equal(status.textContent, "");
  assert.equal(status.hidden, true);
  assert.equal(count.textContent, "1 link");
  assert.equal(code.hidden, false);
  assert.equal(git.hidden, true);
  assert.equal(gh.hidden, true);
  assert.equal(editors.firstElementChild.open, true);

  input.value = "TOOLS/GIT";
  input.update();
  assert.equal(count.textContent, "1 link");
  assert.equal(git.hidden, false);
  assert.equal(code.hidden, true);
  assert.equal(editors.hidden, true);

  input.value = "tools";
  input.update();
  assert.equal(status.textContent, "");
  assert.equal(count.textContent, "2 links");
  assert.equal(git.hidden, false);
  assert.equal(code.hidden, false);

  input.value = "missing";
  input.update();
  assert.equal(status.textContent, "No links match your search.");
  assert.equal(status.hidden, false);
  assert.equal(count.textContent, "0 links");
  assert.equal(tools.hidden, true);

  input.value = "open";
  input.update();
  assert.equal(gh.hidden, true);
  assert.equal(count.textContent, "0 links");

  input.value = "";
  input.update();
  assert.equal(status.hidden, true);
  assert.equal(status.textContent, "");
  assert.equal(count.textContent, "3 links");
  assert.equal(gh.hidden, false);
  assert.equal(editors.firstElementChild.open, false);
  assert.equal(tools.firstElementChild.open, true);
});

test("directory highlights match, full tags stay inline, and destinations reveal accessibly", async (t) => {
  const chrome = availableChrome(t);
  if (!chrome) return;
  const f = await fixture(t, {
    example: {
      url: "https://example.com/setup.sh",
      script: true,
      tags: ["documentation", "a-very-long-tag-for-disclosure"],
    },
    "long-script-code": {
      url: "https://example.com/setup.sh",
      script: true,
      tags: ["shell"],
    },
    plain: { url: "https://example.com/plain", tags: ["reference"] },
    folder: {
      nested: { url: "https://example.com/a/very/long/path/setup.sh" },
    },
    ["long-folder-".repeat(12)]: { plain: "https://example.com/folder" },
    ["long-code-".repeat(12)]: "https://example.com/plain",
    ["long-script-".repeat(12)]: {
      url: "https://example.com/setup.sh",
      script: true,
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
        tags: ["guides"],
        script: true,
      },
    },
    untagged: "https://example.com/plain",
  });
  assert.equal(f.build().status, 0);
  for (const path of ["index.html", "tools/index.html", "guides/index.html"]) {
    const html = await f.read(path);
    const buttons = [
      ...html.matchAll(
        /<button class="tags"[^>]*popovertarget="([^"]+)"[^>]*>([^<]+)<\/button>/g,
      ),
    ];
    const panels = [
      ...html.matchAll(
        /<div class="tag-panel" id="([^"]+)"[^>]*>([^<]+)<\/div>/g,
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

test("tags are displayed safely and searchable on home and nested pages without revealing hidden links", async (t) => {
  const links = {
    tools: {
      manual: {
        url: "https://example.com/guide",
        tags: ["How To", "<img src=x onerror=alert(1)>"],
      },
      editor: { url: "https://example.com/editor", tags: [" editor "] },
      private: {
        url: "https://example.com/private",
        tags: ["How To", "hidden"],
      },
    },
    other: "https://example.com/other",
  };
  const f = await fixture(t, links);
  const build = f.build();
  assert.equal(build.status, 0, build.stderr);
  assert.deepEqual(JSON.parse(await f.read("links.json")), links);
  for (const page of ["index.html", "tools/index.html"]) {
    const html = await f.read(page);
    assert.match(
      html,
      /data-search="manual https:\/\/example\.com\/guide How To &lt;img src=x onerror=alert\(1\)&gt; #How To #&lt;img src=x onerror=alert\(1\)&gt;"/,
    );
    assert.match(
      html,
      /<button class="tags"[^>]*aria-label="#How To · #&lt;img src=x onerror=alert\(1\)&gt;\. Show all tags for manual">#How To · #&lt;img src=x onerror=alert\(1\)&gt;<\/button><a class="destination"/,
    );
    assert.match(html, /<button class="tags"[^>]*>#editor<\/button>/);
    assert.match(
      html,
      /<div class="tag-panel"[^>]*popover tabindex="0" role="region" aria-label="Tags for manual">#How To · #&lt;img src=x onerror=alert\(1\)&gt;<\/div>/,
    );
    assert.doesNotMatch(html, /<img/);
    const rows = [
      ...html.matchAll(
        /<li([^>]*)><div class="link-row"[^>]*>[\s\S]*?<\/div>(?:<div class="tag-panel"[^>]*>[\s\S]*?<\/div>)?<\/li>/g,
      ),
    ];
    const leaf = (code) => {
      const [, attributes] =
        rows.find(([, attributes]) =>
          attributes.includes(`data-search="${code} `),
        ) || [];
      assert.ok(attributes, `missing ${code} on ${page}`);
      const searchValue = attributes
        .match(/data-search="([^"]*)"/)[1]
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");
      return {
        firstElementChild: { tagName: "DIV" },
        dataset: {
          search: searchValue,
          tags: attributes
            .match(/data-tags="([^"]*)"/)[1]
            .replaceAll("&quot;", '"')
            .replaceAll("&lt;", "<")
            .replaceAll("&gt;", ">"),
          ...(attributes.includes('data-hidden="true"')
            ? { hidden: "true" }
            : {}),
        },
        hidden: attributes.includes(" hidden"),
      };
    };
    const guide = leaf("manual");
    const editor = leaf("editor");
    const privateLink = leaf("private");
    const group = {
      firstElementChild: {
        tagName: "DETAILS",
        open: false,
        querySelector: (selector) =>
          selector === "summary"
            ? { textContent: "tools" }
            : { children: [guide, editor, privateLink] },
      },
      dataset: {},
      hidden: false,
    };
    const list = {
      children: page === "index.html" ? [group] : [guide, editor, privateLink],
    };
    const search = { hidden: true };
    const input = {
      value: "",
      parentElement: search,
      addEventListener: (_, callback) => {
        input.update = callback;
      },
    };
    const status = { hidden: true, textContent: "" };
    const count = {
      textContent: page === "index.html" ? "3 links" : "2 links",
    };
    const toggle = {
      hidden: true,
      textContent: "Show hidden links",
      setAttribute(name, value) {
        this[name] = value;
      },
      addEventListener: (_, callback) => {
        toggle.click = callback;
      },
    };
    runInNewContext((await f.read("assets/search.js")) + "\ninitSearch();", {
      document: {
        querySelector: (selector) =>
          ({
            "#link-search": input,
            ".links": list,
            "#search-status": status,
            "#hidden-toggle": toggle,
            "#link-count": count,
          })[selector] ?? null,
      },
    });
    input.value = "#HOW TO";
    input.update();
    assert.equal(status.textContent, "");
    assert.equal(count.textContent, "1 link");
    assert.equal(guide.hidden, false);
    assert.equal(editor.hidden, true);
    assert.equal(privateLink.hidden, true);
    if (page === "index.html") assert.equal(group.firstElementChild.open, true);
    toggle.click();
    assert.equal(toggle["aria-pressed"], "true");
    assert.equal(count.textContent, "2 links");
    assert.equal(status.textContent, "");
    assert.equal(privateLink.hidden, false);
    input.value = "<img src=x onerror=alert(1)>";
    input.update();
    assert.equal(count.textContent, "1 link");
    assert.equal(status.textContent, "");
    input.value = "#editor";
    input.update();
    assert.equal(count.textContent, "1 link");
    assert.equal(status.textContent, "");
    assert.equal(editor.hidden, false);
  }
});

test("toggle updates hidden rows, nested search, counts, and hidden-only empty state", async (t) => {
  const f = await fixture(t, {
    public: "https://example.com/public",
    secret: {
      url: "https://example.com/private",
      title: "Private notes",
      tags: ["hidden"],
    },
    folder: {
      visible: "https://example.com/visible",
      private: { deep: { url: "https://example.com/deep", tags: ["hidden"] } },
    },
    onlyHidden: {
      nested: { code: { url: "https://example.com/code", tags: ["hidden"] } },
    },
  });
  assert.equal(f.build().status, 0);
  const script = await f.read("assets/search.js");
  const leaf = (name, hidden = false) => ({
    firstElementChild: { tagName: "DIV" },
    textContent: name,
    dataset: hidden ? { hidden: "true" } : {},
    hidden,
  });
  const group = (name, children, hidden = false) => ({
    firstElementChild: {
      tagName: "DETAILS",
      open: false,
      querySelector: (selector) =>
        selector === "summary" ? { textContent: name } : { children },
    },
    dataset: hidden ? { hidden: "true" } : {},
    hidden,
  });
  const exercise = async (page, children, visible, site = f) => {
    const html = await site.read(page);
    assert.match(
      html,
      /id="hidden-toggle"[^>]*aria-pressed="false"\s+hidden\s*>\s*Show hidden links/,
    );
    assert.doesNotMatch(html, /data-visible=|data-total=/);
    assert.match(
      html,
      new RegExp(
        `id="link-count" class="count" aria-live="polite" aria-atomic="true">\\s*<span class="count-number">${visible}</span\\s*><span class="count-label">${visible === 1 ? " link" : " links"}</span>\\s*</`,
      ),
    );
    const wrapper = { hidden: !visible };
    const list = { children, parentElement: wrapper };
    const search = { hidden: true };
    const input = {
      value: "",
      parentElement: search,
      addEventListener: (_, callback) => {
        input.update = callback;
      },
    };
    const status = { hidden: true, textContent: "" };
    const toggle = {
      hidden: true,
      textContent: "Show hidden links",
      setAttribute(name, value) {
        this[name] = value;
      },
      addEventListener: (_, callback) => {
        toggle.click = callback;
      },
    };
    const numberEl = { textContent: visible };
    const labelEl = { textContent: visible === 1 ? " link" : " links" };
    const count = {
      get textContent() {
        return `${numberEl.textContent}${labelEl.textContent}`;
      },
      querySelector: (sel) =>
        sel === ".count-number"
          ? numberEl
          : sel === ".count-label"
            ? labelEl
            : null,
    };
    const empty = visible ? null : { hidden: false };
    const elements = {
      "#link-search": input,
      ".links": list,
      "#search-status": status,
      "#hidden-toggle": toggle,
      "#link-count": count,
      "#empty-directory": empty,
    };
    runInNewContext(script + "\ninitSearch();", {
      document: { querySelector: (selector) => elements[selector] },
    });
    assert.equal(toggle.hidden, false);
    assert.equal(search.hidden, false);
    return { html, input, status, toggle, count, empty, wrapper };
  };

  const homeMarkup = await f.read("index.html");
  const titled = homeMarkup.match(
    /<li([^>]*)><div class="link-row" title="Private notes"><a class="code" href="([^"]+)" title="Private notes">secret<\/a>/,
  );
  assert.ok(titled, "generated hidden titled link is present");
  const [, attributes, secretHref] = titled;
  assert.match(
    attributes,
    /data-hidden="true" hidden data-title="Private notes"/,
  );
  const secret = leaf("secret https://example.com/private");
  secret.dataset = {
    hidden: attributes.match(/data-hidden="([^"]+)"/)?.[1],
    title: attributes.match(/data-title="([^"]+)"/)?.[1],
  };
  secret.hidden = attributes.includes(" hidden");
  const deep = leaf("deep https://example.com/deep", true);
  const privateGroup = group("private", [deep], true);
  const visibleLeaf = leaf("visible https://example.com/visible");
  const folder = group("folder", [visibleLeaf, privateGroup]);
  const nestedCode = leaf("code https://example.com/code", true);
  const hiddenGroup = group(
    "onlyHidden",
    [group("nested", [nestedCode], true)],
    true,
  );
  const home = await exercise(
    "index.html",
    [folder, hiddenGroup, leaf("public https://example.com/public"), secret],
    2,
  );
  assert.match(
    home.html,
    /<li data-hidden="true" hidden><details><summary><a href="\.\/onlyHidden\/" data-app-link>/,
  );
  const deepHref = home.html.match(/href="(\.\/folder\/private\/deep\/)"/)?.[1];
  assert.ok(deepHref, "nested short link was generated");
  for (const prefix of ["/", "/project/"]) {
    assert.equal(
      new URL(secretHref, `https://example.org${prefix}`).pathname,
      `${prefix}secret/`,
    );
    assert.equal(
      new URL(deepHref, `https://example.org${prefix}`).pathname,
      `${prefix}folder/private/deep/`,
    );
  }
  home.input.value = "private notes";
  home.input.update();
  assert.equal(home.status.textContent, "No links match your search.");
  assert.equal(home.count.textContent, "0 links");
  assert.equal(privateGroup.hidden, true);
  assert.equal(secret.hidden, true);
  home.toggle.click();
  assert.equal(home.toggle.textContent, "Hide hidden links");
  assert.equal(home.toggle["aria-pressed"], "true");
  assert.equal(home.count.textContent, "1 link");
  assert.equal(home.status.textContent, "");
  assert.equal(secret.hidden, false);
  home.input.value = "private";
  home.input.update();
  assert.equal(home.count.textContent, "2 links");
  assert.equal(home.status.textContent, "");
  assert.equal(secret.hidden, false);
  assert.equal(privateGroup.hidden, false);
  assert.equal(deep.hidden, false);
  home.input.value = "";
  home.input.update();
  assert.equal(home.count.textContent, "5 links");
  assert.equal(hiddenGroup.hidden, false);
  assert.equal(nestedCode.hidden, false);
  home.input.value = "private notes";
  home.input.update();
  home.toggle.click();
  assert.equal(home.toggle.textContent, "Show hidden links");
  assert.equal(home.toggle["aria-pressed"], "false");
  assert.equal(home.count.textContent, "0 links");
  assert.equal(home.status.textContent, "No links match your search.");
  assert.equal(secret.hidden, true);
  assert.equal(hiddenGroup.hidden, true);
  assert.equal(privateGroup.hidden, true);

  const nested = group(
    "private",
    [leaf("deep https://example.com/deep", true)],
    true,
  );
  const directory = await exercise(
    "folder/index.html",
    [nested, leaf("visible https://example.com/visible")],
    1,
  );
  assert.match(directory.html, /href="\.\/private\/"/);
  directory.toggle.click();
  assert.equal(directory.count.textContent, "2 links");
  assert.equal(nested.hidden, false);
  directory.toggle.click();
  assert.equal(directory.count.textContent, "1 link");
  assert.equal(nested.hidden, true);

  const only = group(
    "nested",
    [leaf("code https://example.com/code", true)],
    true,
  );
  const hiddenPage = await exercise("onlyHidden/index.html", [only], 0);
  assert.match(hiddenPage.html, /<div hidden><ul class="links">/);
  assert.equal(hiddenPage.empty.hidden, false);
  hiddenPage.toggle.click();
  assert.equal(hiddenPage.count.textContent, "1 link");
  assert.equal(hiddenPage.empty.hidden, true);
  assert.equal(hiddenPage.wrapper.hidden, false);
  assert.equal(hiddenPage.input.parentElement.hidden, false);
  assert.equal(only.hidden, false);
  hiddenPage.input.value = "code";
  hiddenPage.input.update();
  assert.equal(hiddenPage.count.textContent, "1 link");
  assert.equal(hiddenPage.status.textContent, "");
  hiddenPage.toggle.click();
  assert.equal(hiddenPage.count.textContent, "0 links");
  assert.equal(hiddenPage.empty.hidden, true);
  assert.equal(hiddenPage.wrapper.hidden, true);
  assert.equal(hiddenPage.input.parentElement.hidden, false);
  assert.equal(hiddenPage.status.hidden, false);
  assert.equal(hiddenPage.status.textContent, "No links match your search.");

  const allHidden = await fixture(t, {
    secret: { url: "https://example.com/", tags: ["hidden"] },
  });
  assert.equal(allHidden.build().status, 0);
  const root = await exercise(
    "index.html",
    [leaf("secret https://example.com/", true)],
    0,
    allHidden,
  );
  assert.equal(root.count.textContent, "0 links");
  root.toggle.click();
  assert.equal(root.count.textContent, "1 link");
  root.toggle.click();
  assert.equal(root.count.textContent, "0 links");
  assert.equal(root.empty.hidden, false);
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
              const hiddenToggle = frame.contentDocument.querySelector('#hidden-toggle');
              hiddenToggle.click();
              const hiddenState = [hiddenToggle.textContent, hiddenToggle.getAttribute('aria-pressed'), frame.contentDocument.querySelector('#link-count').textContent];
              if (hiddenState[1] !== 'true') throw new Error('Hidden toggle did not activate');
              themeControl.click();
              const toggled = theme === 'light' ? 'dark' : 'light';
              if (frame.contentDocument.documentElement.dataset.theme !== toggled || themeControl.textContent !== 'Theme: ' + toggled || localStorage.getItem('shortlink-theme') !== toggled) throw new Error('Theme button did not change theme');
              checkPalette(frame.contentDocument, toggled);
              equal([hiddenToggle.textContent, hiddenToggle.getAttribute('aria-pressed'), frame.contentDocument.querySelector('#link-count').textContent], hiddenState, 'theme does not change hidden state');
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
    Run: { url, script: true, tags: ["shell", "hidden"] },
    tools: { Nested: { url, script: true } },
    disabled: { url, script: false },
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
    /class="download" href="\.\/Run\.sh"[^>]* download>Download<\/a><a class="visit" href="https:\/\/example\.com\/setup\.sh/,
  );
  assert.match(home, /#shell #hidden"[^>]*><div class="link-row script-row">/);
  assert.match(
    home,
    /<button class="tags"[^>]*>#shell · #hidden<\/button><a class="destination"/,
  );
  assert.match(
    home,
    /class="download" href="\.\/tools\/Nested\.sh"[^>]* download>Download<\/a><a class="visit"/,
  );
  assert.match(
    await f.read("tools/index.html"),
    /class="download" href="\.\/Nested\.sh"[^>]* download>Download<\/a><a class="visit"/,
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
    ...[null, "true", 1, [], {}].map((script) => ({
      code: { url: "https://example.com", script },
    })),
    ...[true, false, null, "true", 1, [], {}].map((hidden) => ({
      code: { url: "https://example.com", hidden },
    })),
    ...[null, "tag", 1, {}, [null], [1], [""], ["  "]].map((tags) => ({
      code: { url: "https://example.com", tags },
    })),
    {
      code: { url: "https://example.com", hidden: true },
      CODE: "https://example.org",
    },
    {
      code: { url: "https://example.com", hidden: true, script: true },
      "CODE.SH": "https://example.org",
    },
    {
      code: { url: "https://example.com", script: true },
      "code.sh": "https://example.org",
    },
    {
      "CODE.SH": "https://example.org",
      code: { url: "https://example.com", script: true },
    },
    {
      tools: {
        run: { url: "https://example.com", script: true },
        "RUN.SH": { git: "https://example.org" },
      },
    },
  ];
  const f = await fixture(t, {});
  await mkdir(join(f.cwd, "dist"));
  await writeFile(join(f.cwd, "dist", "marker"), "preserved");
  for (const value of cases) {
    await writeFile(join(f.cwd, "links.json"), JSON.stringify(value));
    const result = f.build();
    assert.equal(result.status, 1, JSON.stringify(value));
    assert.match(result.stderr, /Build stopped/);
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
    Mixed: { url: "https://example.com/", script: true, tags: ["hidden"] },
    Stopped: {
      Deep: {
        url: "https://example.com/disabled",
        tags: [" Hidden ", " DISABLED ", "broken"],
        script: true,
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

test("404 forwards matching URLs despite malformed tags without probing a parent map", async (t) => {
  const f = await fixture(t, {});
  assert.equal(f.build().status, 0);
  const script = behaviorScript(await f.read("404.html"), "recovery");
  for (const prefix of ["/", "/project/"]) {
    for (const tags of ["invalid", [null], [42]]) {
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
      assert.equal(destination, "https://example.com/valid");
      assert.deepEqual(requests, [prefix + "tools/links.json"]);
      assert.equal(elements.home.href, prefix + "tools/");
    }
  }
});

const stateMap = (script = true) =>
  Object.fromEntries(
    Array.from({ length: 8 }, (_, mask) => [
      `${script ? "" : "Plain"}State${mask}`,
      {
        url: `https://example.com/a/very/long/destination/path/that/requires/middle/truncation/state${mask}.sh?q=</script>&x='"`,
        title: `State ${mask}`,
        script,
        tags: [
          "docs",
          "release notes",
          ...[" Hidden ", " BROKEN ", " Disabled "].filter(
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
      tags: [" Hidden ", "hidden", "HIDDEN", " DISABLED "],
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
        assert.match(row[3], /<a class="download" href=/);
      }
    }
  }
});

test("legacy hidden is always rejected, disabled validation retains output, and rebuilds replace stale state artifacts", async (t) => {
  const f = await fixture(t, {
    Run: { url: "https://example.com/setup.sh", script: true },
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
      Run: { url: "https://example.com/", tags: ["disabled"], script: true },
      "RUN.SH": "https://example.com/",
    },
  ]) {
    await writeFile(join(f.cwd, "links.json"), JSON.stringify(map));
    assert.equal(f.build().status, 1);
    assert.equal(await f.read("Run.sh"), launcher);
  }
  for (const tags of [["disabled"], []]) {
    await writeFile(
      join(f.cwd, "links.json"),
      JSON.stringify({
        Run: { url: "https://example.com/setup.sh", script: true, tags },
      }),
    );
    assert.equal(f.build().status, 0);
    const html = await f.read("Run/index.html"),
      script = await f.read("Run.sh");
    if (tags.length) {
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
        script: true,
        tags: ["hidden", "broken", "DISABLED"],
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
    Run: { url, tags: ["hidden", "broken", "disabled"], script: true },
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

test("state rows, exact search, all-hidden traversal, disabled native actions and lifecycle render in both themes and sizes", async (t) => {
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
          script: true,
          tags: ["hidden", "disabled"],
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
        tags: ["docs-api", "broken #disabled"],
      },
      Literal: {
        url: "https://example.com/",
        title: "docs guide",
        tags: ["release notes"],
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
      const rgb = color => { color = color.trim(); if (color.startsWith('#')) { let hex = color.slice(1); if (hex.length === 3) hex = [...hex].map(c => c+c).join(''); return hex.match(/../g).map(c => parseInt(c, 16)); } return color.match(/[\\d.]+/g).slice(0, 3).map(Number); };
      const blend = (front, back, opacity) => front.map((v, i) => v * opacity + back[i] * (1-opacity));
      const luminance = color => color.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
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
          const toggle = doc.querySelector('#hidden-toggle');
          if (native) { check(toggle.hidden && doc.querySelector('.search').hidden, 'Native tools visible');
            for (const li of doc.querySelectorAll('li[data-hidden]')) check(li.hidden, 'Native hidden leaf revealed');
            // Inspect all variants without enabling scripts; this is a geometry/style projection only.
            for (const li of doc.querySelectorAll('li[hidden]')) li.hidden = false;
            for (const details of doc.querySelectorAll('details')) details.open = true;
          } else toggle.click();
          const rules = [...doc.styleSheets].flatMap(sheet => [...sheet.cssRules]);
          const pointerRule = rules.find(rule => rule.conditionText === '(hover: hover) and (pointer: fine)');
          const coarseRule = rules.find(rule => rule.conditionText === '(any-pointer: coarse)');
          const pointerMedia = pointerRule.media.mediaText, coarseMedia = coarseRule.media.mediaText;
          const hover = doc.createElement('style');
          hover.textContent = [...pointerRule.cssRules].filter(rule => rule.selectorText?.includes(':hover')).map(rule => rule.selectorText.replaceAll(':hover', '.verify-hover') + '{' + rule.style.cssText + '}').join('');
          doc.head.append(hover);
          const bg = rgb(win.getComputedStyle(doc.body).backgroundColor), wash = rgb(win.getComputedStyle(doc.documentElement).getPropertyValue('--wash'));
          for (const script of [true, false]) for (let mask = 0; mask < 8; mask++) {
            const r = row(doc, (script ? '' : 'Plain') + 'State' + mask), style = win.getComputedStyle(r), code = r.querySelector('.code');
            check(r.getBoundingClientRect().height === 50, 'State row changed height');
            check(Number(style.opacity) === (mask & 1 ? theme === 'dark' ? .8 : .94 : 1), 'State opacity');
            const expected = win.getComputedStyle(doc.documentElement).getPropertyValue(mask & 4 ? '--disabled' : mask & 2 ? '--broken' : script ? '--script' : '--accent');
            check(!!r.querySelector('.download') === script, 'Non-script Download control');
            check(JSON.stringify(rgb(win.getComputedStyle(code).color)) === JSON.stringify(rgb(expected)), 'State precedence');
            for (const element of [code, r.querySelector('.tags'), r.querySelector('.destination')]) {
              for (const background of [bg, wash]) check(contrast(blend(rgb(win.getComputedStyle(element).color), background, Number(style.opacity)), background) >= 4.5, 'Dimmed contrast failed: ' + theme + '/' + mask + '/' + element.className);
            }
            code.focus(); check(win.getComputedStyle(r).opacity === '1', 'Focus opacity');
            check(win.getComputedStyle(code).outlineWidth === '2px', 'Focus outline'); code.blur();
            const dest = r.querySelector('.destination');
            check(dest.getBoundingClientRect().width >= (width < 500 ? 48 : 64), 'Destination reserve');
            if (mask & 4) {
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
          hover.remove();
          if (!native) {
            query(doc, '  #DOCS  '); check(count(doc) === 16, 'Exact docs');
            query(doc, '#release notes'); check(count(doc) === 17, 'Spaced tag');
            query(doc, '#'); check(count(doc) === 0 && !doc.querySelector('#search-status').hidden, 'Bare tag');
            query(doc, 'docs guide'); check(count(doc) === 1 && shown(doc) === 'Literal', 'Plain substring split');
            query(doc, '#broken #disabled'); check(count(doc) === 1 && shown(doc) === 'Fragment', 'Literal tag grammar');
            toggle.click(); query(doc, '#docs'); check(count(doc) === 8, 'Ordinary tags bypass toggle');
            query(doc, '#disabled'); check(count(doc) === 10, 'State exception');
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
            check(doc.querySelector('#link-search').value === '' && doc.querySelector('#hidden-toggle').getAttribute('aria-pressed') === 'false', 'State controls did not reset');
          }
          await load(prefix + 'onlyHidden/' + (native ? '?native=1' : ''));
          doc = frame.contentDocument;
          if (!native) {
            check(!doc.querySelector('.search').hidden && count(doc) === 0 && !doc.querySelector('#empty-directory').hidden, 'All-hidden search unreachable');
            const details = doc.querySelector('details'); check(!details.open, 'Initial hidden disclosure');
            query(doc, '#broken'); check(count(doc) === 1 && shown(doc) === 'Broken', 'Hidden ancestors/siblings');
            check(details.open, 'State search did not expand ancestor');
            const toggle = doc.querySelector('#hidden-toggle'); check(toggle.getAttribute('aria-pressed') === 'false', 'State query mutated toggle');
            toggle.click(); check(count(doc) === 1 && shown(doc) === 'Broken', 'Toggle changed state matches');
            query(doc, ''); check(count(doc) === 3, 'Clearing lost selected pool');
            check(!details.open, 'State-search disclosure not restored on clear');
            toggle.click(); check(count(doc) === 0 && !doc.querySelector('#empty-directory').hidden, 'Clearing empty state');
            for (const value of ['broken', '#docs-api', '#missing']) { query(doc, value); check(count(doc) === 0 && !doc.querySelector('#search-status').hidden && doc.querySelector('#empty-directory').hidden && !doc.querySelector('.search').hidden, 'All-hidden zero results'); }
            query(doc, '#disabled'); check(count(doc) === 1 && shown(doc) === 'Disabled', 'Hidden disabled search');
            query(doc, '#hidden'); check(count(doc) === 3, 'Hidden exact state');
            query(doc, ''); check(count(doc) === 0 && !doc.querySelector('#empty-directory').hidden, 'Hidden clearing');
            check(!details.open, 'Hidden state clear retained auto-expanded ancestor');
            details.open = true; query(doc, '#broken'); query(doc, '#disabled'); query(doc, '');
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
