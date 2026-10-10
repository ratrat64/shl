import { esc, iconSvgAttrs, page, pageTitle } from "./layout.mjs";
import { entryTree, entryCounts } from "./links.mjs";

const fixed = {
  broken: "var(--broken)",
  script: "var(--tag-script)",
  disabled: "var(--disabled)",
  hidden: "var(--tag-hidden)",
};
export const tagColors = (identity) => {
  if (Object.hasOwn(fixed, identity))
    return { light: fixed[identity], dark: fixed[identity] };
  let hash = 2166136261;
  for (let i = 0; i < identity.length; i++)
    hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619) >>> 0;
  const hue = (hash % 3600) / 10;
  const saturation = 55 + ((hash >>> 16) % 21);
  return {
    light: `hsl(${hue} ${saturation}% ${20 + ((hash >>> 24) % 3)}%)`,
    dark: `hsl(${hue} ${saturation}% ${80 + ((hash >>> 24) % 5)}%)`,
  };
};
const tagStyle = (identity) => {
  const { light, dark } = tagColors(identity);
  return `style="--tag-light:${light};--tag-dark:${dark}"`;
};
// JSON string contents survive HTML's NUL replacement and preserve UTF-16.
const tagIdentity = (identity) => esc(JSON.stringify(identity).slice(1, -1));
const tagToggleLabels = { collapsed: "Show tags", expanded: "Hide tags" };
const iconOpen = `<svg ${iconSvgAttrs}><path d="M6.5 3.5H3.5v9h9V9.5M9 3h4v4M13 3 7.5 8.5"/></svg>`;
const iconDownload = `<svg ${iconSvgAttrs}><path d="M8 2.5v8m0 0 3-3m-3 3-3-3M2.5 13.5h11"/></svg>`;
const iconTag = `<svg ${iconSvgAttrs}><path d="M2.5 2.5H8l5.5 5.5-5.5 5.5-5.5-5.5zM5.5 5.5h.01"/></svg>`;
const iconChevron = `<svg class="chev" ${iconSvgAttrs}><path d="m4.5 6 3.5 3.5L11.5 6"/></svg>`;
const tagLabel = (label) =>
  `<span class="tag-label" data-tag="${tagIdentity(label.toLowerCase())}" ${tagStyle(label.toLowerCase())}>#${esc(label)}</span>`;
const tagCatalog = (nodes, catalog = new Map()) => {
  for (const node of nodes) {
    if (node.isDirectory) tagCatalog(node.children, catalog);
    else
      for (const label of node.tags) {
        const identity = label.toLowerCase();
        if (!catalog.has(identity) || label < catalog.get(identity))
          catalog.set(identity, label);
      }
  }
  return catalog;
};
const tagChip = ([identity, label]) =>
  `<button type="button" class="tag-chip" data-tag="${tagIdentity(identity)}" ${tagStyle(identity)} aria-label="Filter by #${esc(label)}">#${esc(label)}</button>`;

const renderDirectoryNode = ({ code, children, href, visible }) => /* HTML */ `
  <li${visible ? "" : ' data-hidden="true" hidden'}><details><summary><a href="${esc(href)}" data-app-link>${esc(code)}</a></summary>
    ${listing(children)}
  </details></li>`;

const renderLinkRow = ({
  code,
  url,
  title,
  script,
  tags,
  hidden,
  broken,
  disabled,
  prefix,
  href,
}) => {
  tags = tags.filter(
    (tag, i) =>
      tags.findIndex((other) => other.toLowerCase() === tag.toLowerCase()) ===
      i,
  );
  const originLength = new URL(url).origin.length;
  const path = url.slice(originLength).split(/[?#]/, 1)[0];
  const split = path.lastIndexOf("/", path.lastIndexOf("/") - 1);
  const cut = split > 0 ? originLength + split + 1 : url.length;
  const labels = tags.map((tag) => `#${tag}`);
  const searchText =
    `${code} ${script ? "script " : ""}${url} ${tags.join(" ")} ${labels.join(" ")}`.trim();
  const tagText = labels.join(" · ");
  const coloredTags = tags.map(tagLabel).join(" · ");
  const tagId = `tags-${prefix}${code}`;
  const destinationContent = `<span class="sr-only">${esc(url)}</span><span class="destination-start" aria-hidden="true">${esc(url.slice(0, cut))}</span><span class="destination-end" aria-hidden="true">${esc(url.slice(cut))}</span>`;
  const destination = disabled
    ? `<button type="button" class="destination" data-copy-url="${esc(url)}" aria-label="Copy destination: ${esc(url)}" title="${esc(url)}"><span class="destination-start" aria-hidden="true">${esc(url.slice(0, cut))}</span><span class="destination-end" aria-hidden="true">${esc(url.slice(cut))}</span></button>`
    : `<a class="destination" href="${esc(url)}" aria-label="Copy destination: ${esc(url)}"${title ? "" : ` title="${esc(url)}"`}>${destinationContent}</a>`;
  let filename;
  try {
    filename = decodeURIComponent(new URL(url).pathname.split("/").at(-1))
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_")
      .trim()
      .replace(/[. ]+$/, "");
  } catch {}
  if (
    !filename ||
    Buffer.byteLength(filename, "utf8") > 240 ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)
  )
    filename = `${code}.sh`;
  const action = (kind, label, target, accessible) => {
    const content = `${kind === "download" ? iconDownload : iconOpen}<span class="btn-label">${esc(label)}</span>`;
    return disabled
      ? `<button type="button" class="${kind}" disabled aria-label="${esc(accessible)}">${content}</button>`
      : kind === "download"
        ? `<button type="button" class="download" data-download-url="${esc(url)}" data-download-name="${esc(filename)}" aria-label="${esc(accessible)}">${content}</button>`
        : `<a class="${kind}" href="${esc(target)}" aria-label="${esc(accessible)}">${content}</a>`;
  };
  return /* HTML */ `
       <li${hidden ? ' data-hidden="true" hidden' : ""}${title ? ` data-title="${esc(title)}"` : ""} data-tags="${esc(JSON.stringify(tags.map((tag) => tag.toLowerCase())))}" data-search="${esc(searchText)}"><div class="link-row${script ? " script-row" : ""}${broken ? " broken-row" : ""}${disabled ? " disabled-row" : ""}"${title ? ` title="${esc(title)}"` : ""}><div class="link-main"><a class="code${script ? " script-link" : ""}" href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}>${esc(code)}</a>
              ${tags.length ? `<button class="tags" type="button" popovertarget="${esc(tagId)}" title="${esc(tagText)}" aria-label="${esc(tagText)}. Show all tags for ${esc(code)}">${coloredTags}</button>` : ""}${destination}</div><span class="link-actions">${script ? action("download", "Download", url, `Download script for ${code}`) : ""}${action("visit", "Open", url, `Open destination for ${code}`)}</span></div>${tags.length ? `<div class="tag-panel" id="${esc(tagId)}" popover tabindex="0" role="region" aria-label="Tags for ${esc(code)}">${coloredTags}</div>` : ""}</li>`;
};

const listing = (nodes) =>
  /* HTML */ `<ul class="links">
    ${nodes.map((node) => (node.isDirectory ? renderDirectoryNode(node) : renderLinkRow(node))).join("")}
  </ul>`;

const searchableListing = () =>
  /* HTML */ `<div class="search" hidden>
    <label class="sr-only" for="link-search">Search links</label>
    <input
      id="link-search"
      type="search"
      inputmode="search"
      aria-describedby="tag-error"
      placeholder="Search link, title or tag"
      autocomplete="off"
    />
  </div>`;

const directoryContents = (
  entries,
  breadcrumbs = "",
  emptyMessage = "No links listed here.",
  siteEntries = entries,
) => {
  const nodes = entryTree(entries);
  const { visible, total } = entryCounts(nodes);
  const catalog = [...tagCatalog(nodes)].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return /* HTML */ `<section aria-label="Links">
    <div class="directory-tools">
      ${pageTitle(undefined, visible)}
      <div class="directory-actions">
        <div
          id="selected-tags"
          class="tag-track"
          role="region"
          aria-label="Selected tags"
          hidden
        ></div>
        ${total ? searchableListing() : ""}
        <div class="directory-toggles">
          <button
            id="tag-toggle"
            class="theme-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="available-tags"
            aria-label="${esc(tagToggleLabels.collapsed)}"
            data-label-collapsed="${esc(tagToggleLabels.collapsed)}"
            data-label-expanded="${esc(tagToggleLabels.expanded)}"
            ${catalog.length ? "hidden" : "disabled"}
          >
            ${iconTag}<span class="btn-label">tags</span>${iconChevron}
          </button>
        </div>
        <div
          id="available-tags"
          class="tag-track"
          role="region"
          aria-label="Available tags"
          hidden
        >
          ${catalog.map(tagChip).join("")}<span id="all-tags-selected" hidden
            >All tags selected.</span
          >
        </div>
        ${total ? '<p id="tag-error" class="search-status" role="status" aria-live="polite" hidden></p><p id="tag-notice" class="sr-only" role="status" aria-live="polite"></p>' : ""}
      </div>
    </div>
    <div data-directory-content>
      ${breadcrumbs || '<div class="breadcrumbs" aria-hidden="true"></div>'}
      ${
        total
          ? `<p id="search-status" class="search-status" role="status" hidden></p>
     ${visible ? "" : '<p id="empty-directory">No links listed here.</p>'}
       <div${visible ? "" : " hidden"}>${listing(nodes)}</div>`
          : `<p>${emptyMessage}</p>`
      }
      ${total ? `<template id="restoration-tags">${[...tagCatalog(entryTree(siteEntries))].map(tagChip).join("")}</template>` : ""}
    </div>
    ${total ? '<div class="search-status action-feedback"><p id="copy-status" role="status" aria-live="polite"></p><p id="download-status" role="status" aria-live="polite"></p></div>' : ""}
  </section>`;
};

export const indexPage = ({ raw, links, source }) =>
  page(
    "Links",
    "links",
    "./",
    `
    ${directoryContents(raw, '<nav class="breadcrumbs" aria-label="Breadcrumb">Home</nav>', links.length ? "No links listed here." : `No links available yet. Add your first entry to <code>${esc(source)}</code> and rebuild the site.`)}`,
  );

export const directoryPage = ({ path, entries, raw }) => {
  const depth = "../".repeat(path.length);
  const breadcrumbs = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${depth}" data-app-link>Home</a>${path.map((code, i) => ` / ${i < path.length - 1 ? `<a href="${"../".repeat(path.length - i - 1)}" data-app-link>${esc(code)}</a>` : esc(code)}`).join("")}</nav>`;
  return page(
    path.at(-1),
    "links",
    depth,
    `
    ${directoryContents(entries, breadcrumbs, undefined, raw)}`,
  );
};
