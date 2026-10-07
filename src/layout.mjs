import { styles } from "./styles.mjs";
import { themeScript } from "./browser.mjs";

export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// HTML's script parser recognizes </script> even inside a JavaScript string.
export const scriptString = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

export const NAV_ITEMS = [
  { label: "Links", path: "", key: "links" },
  { label: "Guide", path: "guide/", key: "guide" },
];

const header = (active, depth) =>
  /* HTML */ `<header class="site-head">
    <div class="wrap head-inner">
      <a class="brand" href="${depth}" data-app-link
        ><span class="brand-slash">/</span>shl<span class="brand-slash"
          >/</span
        ></a
      >
      <nav class="nav" aria-label="Main navigation">
        ${NAV_ITEMS.map(({ label, path, key }) => `<a href="${depth}${path}" data-app-link data-nav="${key}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
      <button
        class="theme-toggle"
        data-theme-control
        type="button"
        aria-label="Change color theme"
      >
        Theme: system
      </button>
    </div>
  </header>`;

const footer = (depth) =>
  /* HTML */ `<footer class="footer">
    <div class="wrap">
      <p>shl</p>
      <p>
        <a href="${depth}guide/" data-app-link>Guide</a> ·
        <a href="https://github.com/ratrat64/shortlink#readme">Repository</a>
      </p>
    </div>
  </footer>`;

export const documentPage = ({
  title,
  depth = "./",
  embedded = false,
  head = "",
  body,
  scripts = "",
}) =>
  /* HTML */ `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>${esc(title)} · shl</title>
        ${embedded ? `<style>${styles}</style>` : `<link rel="stylesheet" href="${esc(depth)}assets/site.css"><script src="${esc(depth)}assets/theme.js" defer></script>`}${head}
      </head>
      <body>
        ${body}
        ${embedded ? `<script data-behavior="theme">${themeScript}</script>` : ""}${scripts}
      </body>
    </html>`;

export const page = (
  title,
  active,
  depth,
  content,
  { embedded = false, scripts = "" } = {},
) =>
  documentPage({
    title,
    depth,
    embedded,
    head: embedded
      ? ""
      : ["search", "copy", "navigation"]
          .map(
            (name) =>
              `<script src="${esc(depth)}assets/${name}.js" defer></script>`,
          )
          .join(""),
    body: /* HTML */ `${header(active, depth)}
      <main class="wrap" data-app-page="${active}">${content}</main>
      ${footer(depth)}`,
    scripts,
  });
