// Browser-safe entry interpretation and directory view metadata.
export const isDirectory = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !("url" in value);
export const linkUrl = (value) =>
  typeof value === "string" ? value : value?.url;
export const linkStates = (value) => {
  const tags = Array.isArray(value?.tags)
    ? value.tags
        .filter((tag) => typeof tag === "string")
        .map((tag) => tag.trim().toLowerCase())
    : [];
  return {
    script: tags.includes("script"),
    hidden: tags.includes("hidden"),
    broken: tags.includes("broken"),
    disabled: tags.includes("disabled"),
  };
};
export const linkFields = (value) => ({
  url: linkUrl(value),
  title: typeof value === "string" ? "" : (value.title ?? ""),
  ...linkStates(value),
  tags: value?.tags ?? [],
});
export const entryCounts = (nodes) => ({
  total: nodes.reduce((n, node) => n + node.total, 0),
  visible: nodes.reduce((n, node) => n + node.visible, 0),
});
export const entryTree = (entries, prefix = "") =>
  Object.entries(entries)
    .sort(([a], [b]) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
    .map(([code, value]) => {
      const node = {
        code,
        prefix,
        href: `./${prefix}${code}/`,
        isDirectory: isDirectory(value),
      };
      if (!node.isDirectory) {
        const fields = linkFields(value);
        return {
          ...node,
          ...fields,
          tagMetadata: fields.tags
            .filter(
              (tag, i, tags) =>
                tags.findIndex(
                  (other) => other.toLowerCase() === tag.toLowerCase(),
                ) === i,
            )
            .map(tagMetadata),
          total: 1,
          visible: fields.hidden ? 0 : 1,
        };
      }
      const children = entryTree(value, `${prefix}${code}/`);
      return { ...node, children, ...entryCounts(children) };
    });
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
  const hue = (hash % 3600) / 10,
    saturation = 55 + ((hash >>> 16) % 21);
  return {
    light: `hsl(${hue} ${saturation}% ${20 + ((hash >>> 24) % 3)}%)`,
    dark: `hsl(${hue} ${saturation}% ${80 + ((hash >>> 24) % 5)}%)`,
  };
};
export const tagMetadata = (label) => {
  const identity = label.toLowerCase(),
    { light, dark } = tagColors(identity);
  return {
    identity,
    label,
    encoded: JSON.stringify(identity).slice(1, -1),
    style: `--tag-light:${light};--tag-dark:${dark}`,
  };
};
export const tagCatalog = (nodes, catalog = new Map()) => {
  for (const node of nodes) {
    if (node.isDirectory) tagCatalog(node.children, catalog);
    else
      for (const label of node.tags) {
        const identity = label.toLowerCase();
        if (!catalog.has(identity) || label < catalog.get(identity).label)
          catalog.set(identity, tagMetadata(label));
      }
  }
  return catalog;
};
export const directoryModel = (
  entries,
  breadcrumbs,
  emptyMessage,
  siteEntries = entries,
) => {
  const nodes = entryTree(entries);
  return {
    nodes,
    ...entryCounts(nodes),
    catalog: [...tagCatalog(nodes).values()].sort((a, b) =>
      a.identity < b.identity ? -1 : 1,
    ),
    metadata: [...tagCatalog(entryTree(siteEntries)).values()],
    breadcrumbs,
    emptyMessage,
    labels: {
      singular: "Link",
      plural: "Links",
      collapsed: "Show tags",
      expanded: "Hide tags",
    },
  };
};
export const downloadName = (url, code) => {
  let filename;
  try {
    filename = decodeURIComponent(new URL(url).pathname.split("/").at(-1))
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_")
      .trim()
      .replace(/[. ]+$/, "");
  } catch {}
  return !filename ||
    new TextEncoder().encode(filename).length > 240 ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)
    ? `${code}.sh`
    : filename;
};

export const linkSearch = (node) => {
  const labels = node.tagMetadata.map((tag) => tag.label);
  return `${node.code} ${node.script ? "script " : ""}${node.url} ${labels.join(" ")} ${labels.map((label) => "#" + label).join(" ")}`.trim();
};

export const filterDirectory = (nodes, text, tags, path = "") => {
  const query = text.trim().toLowerCase(),
    active = !!query || !!tags.length;
  const reveal = ["hidden", "broken", "disabled"].some((tag) =>
    tags.includes(tag),
  );
  let count = 0;
  const items = nodes.map((node) => {
    if (node.isDirectory) {
      const result = filterDirectory(
        node.children,
        text,
        tags,
        path + node.code + "/",
      );
      count += result.count;
      return {
        ...node,
        children: result.items,
        shown: !!result.count,
        expanded: active && !!result.count,
      };
    }
    const search = `${path}${linkSearch(node)} ${node.title}`;
    const shown =
      (!node.hidden || reveal) &&
      tags.every((tag) => node.tags.some((raw) => raw.toLowerCase() === tag)) &&
      query !== "#" &&
      search.toLowerCase().includes(query);
    count += Number(shown);
    return { ...node, shown };
  });
  return { items, count, active };
};
