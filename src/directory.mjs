import { esc, page } from "./layout.mjs";
import { entryTree, entryCounts } from "./links.mjs";

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
  const originLength = new URL(url).origin.length;
  const path = url.slice(originLength).split(/[?#]/, 1)[0];
  const split = path.lastIndexOf("/", path.lastIndexOf("/") - 1);
  const cut = split > 0 ? originLength + split + 1 : url.length;
  const labels = tags.map((tag) => `#${tag}`);
  const searchText =
    `${code} ${script ? "script " : ""}${url} ${tags.join(" ")} ${labels.join(" ")}`.trim();
  const tagText = labels.join(" · ");
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
  const action = (kind, label, target, accessible) =>
    disabled
      ? `<button type="button" class="${kind}" disabled aria-label="${esc(accessible)}">${label}</button>`
      : kind === "download"
        ? `<button type="button" class="download" data-download-url="${esc(url)}" data-download-name="${esc(filename)}" aria-label="${esc(accessible)}">${label}</button>`
        : `<a class="${kind}" href="${esc(target)}" aria-label="${esc(accessible)}">${label}</a>`;
  return /* HTML */ `
       <li${hidden ? ' data-hidden="true" hidden' : ""}${title ? ` data-title="${esc(title)}"` : ""} data-tags="${esc(JSON.stringify(tags.map((tag) => tag.toLowerCase())))}" data-search="${esc(searchText)}"><div class="link-row${script ? " script-row" : ""}${broken ? " broken-row" : ""}${disabled ? " disabled-row" : ""}"${title ? ` title="${esc(title)}"` : ""}><a class="code${script ? " script-link" : ""}" href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}>${esc(code)}</a>
              ${tags.length ? `<button class="tags" type="button" popovertarget="${esc(tagId)}" title="${esc(tagText)}" aria-label="${esc(tagText)}. Show all tags for ${esc(code)}">${esc(tagText)}</button>` : ""}${destination}${script ? action("download", "Download", url, `Download script for ${code}`) : ""}${action("visit", "Open", url, `Open destination for ${code}`)}</div>${tags.length ? `<div class="tag-panel" id="${esc(tagId)}" popover tabindex="0" role="region" aria-label="Tags for ${esc(code)}">${esc(tagText)}</div>` : ""}</li>`;
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
      placeholder="Search link, title or tag"
      autocomplete="off"
    />
  </div>`;

const directoryContents = (
  entries,
  breadcrumbs = "",
  emptyMessage = "No links listed here.",
) => {
  const nodes = entryTree(entries);
  const { visible, total } = entryCounts(nodes);
  return /* HTML */ `<section aria-label="Links">
    <div class="directory-tools">
      <h1 id="link-count" class="count" aria-live="polite" aria-atomic="true">
        <span class="count-number">${visible}</span
        ><span class="count-label">${visible === 1 ? " link" : " links"}</span>
      </h1>
      <div class="directory-actions">
        ${total ? searchableListing() : ""}
        <div class="directory-toggles">
          <button
            id="hidden-toggle"
            class="theme-toggle"
            type="button"
            aria-pressed="false"
            ${total > visible ? "hidden" : "disabled"}
          >
            Show hidden links
          </button>
        </div>
      </div>
    </div>
    ${breadcrumbs || '<div class="breadcrumbs" aria-hidden="true"></div>'}
    ${
      total
        ? `<p id="search-status" class="search-status" role="status" hidden></p><div class="search-status action-feedback"><p id="copy-status" role="status" aria-live="polite"></p><p id="download-status" role="status" aria-live="polite"></p></div>
     ${visible ? "" : '<p id="empty-directory">No links listed here.</p>'}
       <div${visible ? "" : " hidden"}>${listing(nodes)}</div>`
        : `<p>${emptyMessage}</p>`
    }
  </section>`;
};

export const indexPage = ({ raw, links, source }) =>
  page(
    "Links",
    "links",
    "./",
    `
    ${directoryContents(raw, "", links.length ? "No links listed here." : `No links available yet. Add your first entry to <code>${esc(source)}</code> and rebuild the site.`)}`,
  );

export const directoryPage = ({ path, entries }) => {
  const depth = "../".repeat(path.length);
  const breadcrumbs = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${depth}" data-app-link>Home</a>${path.map((code, i) => ` / ${i < path.length - 1 ? `<a href="${"../".repeat(path.length - i - 1)}" data-app-link>${esc(code)}</a>` : esc(code)}`).join("")}</nav>`;
  return page(
    path.at(-1),
    "links",
    depth,
    `
    ${directoryContents(entries, breadcrumbs)}`,
  );
};
