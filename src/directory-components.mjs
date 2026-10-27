import { h as vnode, Fragment, watch } from "vue";
import { downloadName, linkSearch } from "./directory-model.mjs";

// HTML replaces literal NUL. Keep the model lossless and its DOM projection stable.
const domText = (value) =>
  typeof value === "string" ? value.replaceAll("\0", "\ufffd") : value;
const h = (type, props, children) =>
  vnode(
    type,
    props &&
      Object.fromEntries(
        Object.entries(props).map(([key, value]) => [key, domText(value)]),
      ),
    Array.isArray(children) ? children.map(domText) : domText(children),
  );

const icon = (paths, cls) =>
  h(
    "svg",
    {
      class: cls,
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    paths.map((d) => h("path", { d })),
  );
const openIcon = () => icon(["M6.5 3.5H3.5v9h9V9.5M9 3h4v4M13 3 7.5 8.5"]);
const downloadIcon = () => icon(["M8 2.5v8m0 0 3-3m-3 3-3-3M2.5 13.5h11"]);
const tagAttrs = (tag) => ({ "data-tag": tag.encoded, style: tag.style });
const tagLabel = (tag) =>
  h("span", { class: "tag-label", ...tagAttrs(tag) }, "#" + tag.label);
const labels = (tags) =>
  tags.flatMap((tag, i) => (i ? [" · ", tagLabel(tag)] : [tagLabel(tag)]));
export const TagChip = (tag, selected = false, hidden = false) =>
  h(
    "button",
    {
      key: tag.identity,
      type: "button",
      class: "tag-chip",
      ...tagAttrs(tag),
      "aria-label": selected
        ? `Remove #${tag.label} filter`
        : `Filter by #${tag.label}`,
      "aria-pressed": selected ? "true" : undefined,
      hidden,
    },
    "#" + tag.label,
  );

const LinkRow = ({ node }) => {
  const { code, url, title, script, hidden, broken, disabled, prefix, href } =
    node;
  const tags = node.tagMetadata.map((tag) => tag.label);
  const originLength = new URL(url).origin.length,
    path = url.slice(originLength).split(/[?#]/, 1)[0];
  const split = path.lastIndexOf("/", path.lastIndexOf("/") - 1),
    cut = split > 0 ? originLength + split + 1 : url.length;
  const destination = [
    h(
      "span",
      { class: "destination-start", "aria-hidden": "true" },
      url.slice(0, cut),
    ),
    h(
      "span",
      { class: "destination-end", "aria-hidden": "true" },
      url.slice(cut),
    ),
  ];
  const tagText = tags.map((tag) => "#" + tag).join(" · "),
    tagId = `tags-${prefix}${code}`;
  const action = (kind, label) =>
    h(
      disabled || kind === "download" ? "button" : "a",
      {
        type: disabled || kind === "download" ? "button" : undefined,
        class: kind,
        disabled: disabled || undefined,
        href: !disabled && kind === "visit" ? url : undefined,
        "data-download-url": !disabled && kind === "download" ? url : undefined,
        "data-download-name":
          !disabled && kind === "download"
            ? downloadName(url, code)
            : undefined,
        "aria-label": `${kind === "download" ? "Download script" : "Open destination"} for ${code}`,
      },
      [
        kind === "download" ? downloadIcon() : openIcon(),
        h("span", { class: "btn-label" }, label),
      ],
    );
  return h(
    "li",
    {
      "data-hidden": hidden ? "true" : undefined,
      hidden: !node.shown,
      "data-title": title || undefined,
      "data-tags": JSON.stringify(tags.map((tag) => tag.toLowerCase())),
      "data-search": linkSearch(node),
    },
    [
      h(
        "div",
        {
          class: [
            "link-row",
            {
              "script-row": script,
              "broken-row": broken,
              "disabled-row": disabled,
            },
          ],
          title: title || undefined,
        },
        [
          h("div", { class: "link-main" }, [
            h(
              "a",
              {
                class: ["code", { "script-link": script }],
                href,
                title: title || undefined,
              },
              code,
            ),
            tags.length
              ? h(
                  "button",
                  {
                    class: "tags",
                    type: "button",
                    popovertarget: tagId,
                    title: tagText,
                    "aria-label": `${tagText}. Show all tags for ${code}`,
                  },
                  labels(node.tagMetadata),
                )
              : null,
            h(
              disabled ? "button" : "a",
              {
                type: disabled ? "button" : undefined,
                class: "destination",
                href: disabled ? undefined : url,
                "data-copy-url": disabled ? url : undefined,
                "aria-label": `Copy destination: ${url}`,
                title: disabled || !title ? url : undefined,
              },
              disabled
                ? destination
                : [h("span", { class: "sr-only" }, url), ...destination],
            ),
          ]),
          h("span", { class: "link-actions" }, [
            ...(script ? [action("download", "Download")] : []),
            action("visit", "Open"),
          ]),
        ],
      ),
      tags.length
        ? h(
            "div",
            {
              class: "tag-panel",
              id: tagId,
              popover: "",
              tabindex: "0",
              role: "region",
              "aria-label": `Tags for ${code}`,
            },
            labels(node.tagMetadata),
          )
        : null,
    ],
  );
};
const DirectoryNode = {
  props: ["node"],
  setup(props) {
    // Native disclosure is local view state; filtering temporarily forces it open.
    let details;
    let nativeOpen = false;
    watch(
      () => props.node.expanded,
      (expanded) => {
        if (expanded) nativeOpen = details?.open || false;
      },
      { flush: "sync" },
    );
    return () =>
      h(
        "li",
        {
          "data-hidden": props.node.visible ? undefined : "true",
          hidden: !props.node.shown,
        },
        [
          h(
            "details",
            {
              ref: (el) => {
                details = el;
              },
              open: props.node.expanded || nativeOpen,
            },
            [
              h("summary", null, [
                h(
                  "a",
                  { href: props.node.href, "data-app-link": "" },
                  props.node.code,
                ),
              ]),
              h(Listing, { nodes: props.node.children }),
            ],
          ),
        ],
      );
  },
};
export const Listing = ({ nodes, guide = false }) =>
  h(
    "ul",
    { class: guide ? "links guide-examples" : "links" },
    nodes.map((node) =>
      h(node.isDirectory ? DirectoryNode : LinkRow, {
        key: node.prefix + node.code,
        node,
      }),
    ),
  );

export const Directory = {
  props: ["controller"],
  setup({ controller }) {
    return () => {
      const { state: s, results } = controller,
        m = s.model,
        r = results.value,
        selected = [...s.selections.values()],
        picker = s.picker && !!m.catalog.length;
      return h("section", { "aria-label": "Links" }, [
        h("div", { class: "directory-tools" }, [
          h(
            "h1",
            {
              id: "link-count",
              class: "page-title",
              "aria-live": "polite",
              "aria-atomic": "true",
              "data-label-singular": m.labels.singular,
              "data-label-plural": m.labels.plural,
            },
            [
              h("span", { class: "count-number" }, String(r.count)),
              h(
                "span",
                { class: "count-label" },
                " " + (r.count === 1 ? m.labels.singular : m.labels.plural),
              ),
            ],
          ),
          h("div", { class: "directory-actions" }, [
            h(
              "div",
              {
                id: "selected-tags",
                class: "tag-track",
                role: "region",
                "aria-label": "Selected tags",
                hidden: !selected.length,
              },
              selected.map((tag) => {
                const chip = TagChip(tag, true);
                chip.key = `${s.selectionEpoch || 0}:${tag.identity}`;
                return chip;
              }),
            ),
            m.total
              ? h("div", { class: "search", hidden: !s.enhanced }, [
                  h(
                    "label",
                    { class: "sr-only", for: "link-search" },
                    "Search links",
                  ),
                  h("input", {
                    id: "link-search",
                    type: "search",
                    inputmode: "search",
                    "aria-describedby": "tag-error",
                    placeholder: "Search link, title or tag",
                    autocomplete: "off",
                    "aria-invalid": s.enhanced ? String(!!s.error) : undefined,
                  }),
                ])
              : null,
            h("div", { class: "directory-toggles" }, [
              h(
                "button",
                {
                  id: "tag-toggle",
                  class: "theme-toggle",
                  type: "button",
                  "aria-expanded": String(picker),
                  "aria-controls": "available-tags",
                  "aria-label": picker ? m.labels.expanded : m.labels.collapsed,
                  "data-label-collapsed": m.labels.collapsed,
                  "data-label-expanded": m.labels.expanded,
                  hidden: !s.enhanced && !!m.catalog.length,
                  disabled: !m.catalog.length,
                },
                [
                  icon(["M2.5 2.5H8l5.5 5.5-5.5 5.5-5.5-5.5zM5.5 5.5h.01"]),
                  h("span", { class: "btn-label" }, "tags"),
                  icon(["m4.5 6 3.5 3.5L11.5 6"], "chev"),
                ],
              ),
            ]),
            h(
              "div",
              {
                id: "available-tags",
                class: "tag-track",
                role: "region",
                "aria-label": "Available tags",
                hidden: !picker,
              },
              [
                ...m.catalog.map((tag) =>
                  TagChip(tag, false, s.selections.has(tag.identity)),
                ),
                h(
                  "span",
                  {
                    id: "all-tags-selected",
                    hidden: m.catalog.some(
                      (tag) => !s.selections.has(tag.identity),
                    ),
                  },
                  "All tags selected.",
                ),
              ],
            ),
            m.total
              ? h(Fragment, null, [
                  h(
                    "p",
                    {
                      id: "tag-error",
                      class: "search-status",
                      role: "status",
                      "aria-live": "polite",
                      hidden: !s.error,
                    },
                    s.error,
                  ),
                  h(
                    "p",
                    {
                      id: "tag-notice",
                      class: "sr-only",
                      role: "status",
                      "aria-live": "polite",
                    },
                    s.notice,
                  ),
                ])
              : null,
          ]),
        ]),
        h("div", { "data-directory-content": "", key: s.contentKey || 0 }, [
          h("div", { innerHTML: m.breadcrumbs }),
          ...(m.total
            ? [
                h(
                  "p",
                  {
                    id: "search-status",
                    class: "search-status",
                    role: "status",
                    hidden: !r.active || !!r.count,
                  },
                  r.active && !r.count ? "No links match your search." : "",
                ),
                m.visible
                  ? null
                  : h(
                      "p",
                      { id: "empty-directory", hidden: r.active || !!r.count },
                      "No links listed here.",
                    ),
                h("div", { hidden: !r.count }, [
                  h(Listing, { nodes: r.items }),
                ]),
              ]
            : [h("p", { innerHTML: m.emptyMessage })]),
        ]),
        m.total
          ? h("div", { class: "search-status action-feedback" }, [
              h("p", {
                id: "copy-status",
                role: "status",
                "aria-live": "polite",
              }),
              h("p", {
                id: "download-status",
                role: "status",
                "aria-live": "polite",
              }),
            ])
          : null,
      ]);
    };
  },
};
