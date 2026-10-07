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
  return /* HTML */ `
       <li${hidden ? ' data-hidden="true" hidden' : ""}${title ? ` data-title="${esc(title)}"` : ""} data-search="${esc(searchText)}"><div class="link-row${script ? " script-row" : ""}"${title ? ` title="${esc(title)}"` : ""}><a class="code${script ? " script-link" : ""}" href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}>${esc(code)}</a>
             ${tags.length ? `<button class="tags" type="button" popovertarget="${esc(tagId)}" title="${esc(tagText)}" aria-label="${esc(tagText)}. Show all tags for ${esc(code)}">${esc(tagText)}</button>` : ""}<a class="destination" href="${esc(url)}" aria-label="Copy destination: ${esc(url)}"${title ? "" : ` title="${esc(url)}"`}><span class="sr-only">${esc(url)}</span><span class="destination-start" aria-hidden="true">${esc(url.slice(0, cut))}</span><span class="destination-end" aria-hidden="true">${esc(url.slice(cut))}</span></a>${script ? `<a class="download" href="${esc(`./${prefix}${code}.sh`)}" aria-label="Download script for ${esc(code)}" download>Download</a>` : ""}<a class="visit" href="${esc(url)}" aria-label="Open destination for ${esc(code)}">Open</a></div>${tags.length ? `<div class="tag-panel" id="${esc(tagId)}" popover tabindex="0" role="region" aria-label="Tags for ${esc(code)}">${esc(tagText)}</div>` : ""}</li>`;
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
        ? `<p id="search-status" class="search-status" role="status" hidden></p><p id="copy-status" class="search-status" role="status" aria-live="polite"></p>
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
