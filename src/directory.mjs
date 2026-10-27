import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { esc, page, scriptString } from "./layout.mjs";
import { directoryModel, entryTree } from "./directory-model.mjs";
import { Directory, Listing } from "./directory-components.mjs";
import { createDirectoryState } from "./directory-state.mjs";
export { tagColors } from "./directory-model.mjs";

export const guideExampleListing = () =>
  renderToString(
    createSSRApp({
      render: () =>
        h(Listing, {
          guide: true,
          nodes: entryTree({
            "hidden-demo": {
              url: "https://example.com/hidden-demo",
              tags: ["hidden"],
            },
            "broken-demo": {
              url: "https://example.com/broken-demo",
              tags: ["broken"],
            },
            "disabled-demo": {
              url: "https://example.com/disabled-demo",
              tags: ["disabled"],
            },
            "script-demo": {
              url: "https://example.com/setup.sh",
              title: "Setup script",
              tags: ["script"],
            },
          }).map((node) => ({ ...node, shown: true })),
        }),
    }),
  );

const directoryContents = async (
  entries,
  breadcrumbs,
  emptyMessage = "No links listed here.",
  siteEntries = entries,
) => {
  const model = directoryModel(entries, breadcrumbs, emptyMessage, siteEntries);
  const controller = createDirectoryState(model);
  return `<div data-directory-island>${(await renderToString(createSSRApp({ render: () => h(Directory, { controller }) }))).replaceAll("\r", "&#13;")}</div><script type="application/json" data-directory-model>${scriptString(model)}</script>`;
};
export const indexPage = async ({ raw, links, source }) =>
  page(
    "Links",
    "links",
    "./",
    await directoryContents(
      raw,
      '<nav class="breadcrumbs" aria-label="Breadcrumb">Home</nav>',
      links.length
        ? undefined
        : `No links available yet. Add your first entry to <code>${esc(source)}</code> and rebuild the site.`,
    ),
  );
export const directoryPage = async ({ path, entries, raw }) => {
  const depth = "../".repeat(path.length);
  const breadcrumbs = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${depth}" data-app-link>Home</a>${path.map((code, i) => ` / ${i < path.length - 1 ? `<a href="${"../".repeat(path.length - i - 1)}" data-app-link>${esc(code)}</a>` : esc(code)}`).join("")}</nav>`;
  return page(
    path.at(-1),
    "links",
    depth,
    await directoryContents(entries, breadcrumbs, undefined, raw),
  );
};
