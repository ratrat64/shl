import { styles } from "./styles.mjs";
import { themeScript, APP_ASSETS, appScripts } from "./browser.mjs";

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
export const GUIDE_NAV = NAV_ITEMS.find(({ key }) => key === "guide");

const countLabels = { singular: "Link", plural: "Links" };
const themeLabels = {
  system: "system",
  light: "light",
  dark: "dark",
};
export const iconSvgAttrs =
  'viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const themeIcons = {
  system: `<svg ${iconSvgAttrs}><rect x="2.5" y="3" width="11" height="7.5" rx="1"/><path d="M6.5 13.5h3M8 10.5v3"/></svg>`,
  light: `<svg ${iconSvgAttrs}><circle cx="8" cy="8" r="2.8"/><path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M12.4 3.6l-1 1M4.6 11.4l-1 1"/></svg>`,
  dark: `<svg ${iconSvgAttrs}><path d="M12.5 9.5A4.8 4.8 0 0 1 6.5 3.5a5 5 0 0 0 6 6z"/></svg>`,
};

export const pageTitle = (title, count) => /* HTML */ `
  <h1${count === undefined ? "" : ' id="link-count"'} class="page-title"${count === undefined ? "" : ` aria-live="polite" aria-atomic="true" data-label-singular="${esc(countLabels.singular)}" data-label-plural="${esc(countLabels.plural)}"`}>
    <span class="count-number"${count === undefined ? ' aria-hidden="true"' : ""}>${count === undefined ? "" : esc(count)}</span
    ><span class="count-label">${count === undefined ? esc(title) : " " + esc(count === 1 ? countLabels.singular : countLabels.plural)}</span>
  </h1>`;

const header = (active, depth) =>
  /* HTML */ `<header class="site-head">
    <div class="wrap head-inner">
      <a class="brand" href="${depth}" data-app-link data-site-path=""
        ><span class="brand-slash">/</span>shl<span class="brand-slash"
          >/</span
        ></a
      >
      <nav class="nav" aria-label="Main navigation">
        ${NAV_ITEMS.map(({ label, path, key }) => `<a href="${depth}${path}" data-app-link data-site-path="${esc(path)}" data-nav="${key}"${active === key ? ' aria-current="page"' : ""}>${esc(label)}</a>`).join("")}
      </nav>
      <button
        class="theme-toggle"
        data-theme-control
        ${Object.entries(themeLabels)
          .map(([state, label]) => `data-label-${state}="${esc(label)}"`)
          .join(" ")}
        type="button"
        aria-label="Theme: ${esc(themeLabels.system)}"
      >
        ${Object.entries(themeIcons)
          .map(
            ([state, icon]) =>
              `<span data-theme-icon="${state}"${state === "system" ? "" : " hidden"}>${icon}</span>`,
          )
          .join("")}<span class="btn-label">${esc(themeLabels.system)}</span>
      </button>
    </div>
  </header>`;

const footer = (depth) =>
  /* HTML */ `<footer class="footer">
    <div class="wrap">
      <p>shl</p>
      <p>
        <a
          href="${depth}${GUIDE_NAV.path}"
          data-app-link
          data-site-path="${esc(GUIDE_NAV.path)}"
          >${esc(GUIDE_NAV.label)}</a
        >
        ·
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
      : APP_ASSETS.map(
          (name) =>
            `<script src="${esc(depth)}assets/${name}.js" defer></script>`,
        ).join(""),
    body: /* HTML */ `${header(active, depth)}
      <main
        class="wrap"
        data-app-page="${active}"
        ${active === "not-found" ? "" : ` data-site-base="${esc(depth)}"`}
      >
        ${content}
      </main>
      ${footer(depth)}`,
    scripts:
      (embedded
        ? appScripts
            .map(
              ([name, code]) =>
                `<script data-behavior="${name}">${code}</script>`,
            )
            .join("")
        : "") + scripts,
  });
