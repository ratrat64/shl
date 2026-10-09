import { readFile } from "node:fs/promises";
import { parseDocument } from "yaml";

export const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
export const RESERVED_NAMES = new Set([
  "index",
  "404",
  "assets",
  "links",
  "about",
  "guide",
  "how-it-works",
  "index.html",
  "404.html",
  "links.json",
  "cname",
]);

export const isDirectory = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !("url" in value);
export const linkUrl = (value) =>
  typeof value === "string" ? value : value?.url;

// Pure and serialized into recovery; malformed fetched metadata adds no states.
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

// Consumers call this only after validating the original fields below.
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
        return { ...node, ...fields, total: 1, visible: fields.hidden ? 0 : 1 };
      }
      const children = entryTree(value, `${prefix}${code}/`);
      return { ...node, children, ...entryCounts(children) };
    });

export function validateCode(code, path, seen) {
  const problems = [];
  if (!CODE_RE.test(code))
    problems.push(
      `"${path.join("/")}" — codes must start with a letter or number and contain only letters, numbers, . _ -`,
    );
  if (RESERVED_NAMES.has(code.toLowerCase()))
    problems.push(`"${path.join("/")}" — reserved name`);
  const key = code.toLowerCase();
  if (seen.has(key))
    problems.push(
      `"${path.join("/")}" — collides with "${seen.get(key)}" (codes are matched case-insensitively)`,
    );
  seen.set(key, path.join("/"));
  return problems;
}

export function validateUrl(url, name) {
  try {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url))
      throw new Error();
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname)
      throw new Error();
    return null;
  } catch {
    return `"${name}" — destination must be a valid absolute HTTP or HTTPS URL`;
  }
}

export async function loadLinks() {
  let raw;
  let source = "link source";
  try {
    const files = [];
    for (const name of ["links.json", "links.yaml", "links.yml"]) {
      try {
        files.push([name, await readFile(name, "utf8")]);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    if (files.length !== 1)
      throw new Error(
        `expected exactly one of links.json, links.yaml, links.yml (found ${files.length ? files.map(([name]) => name).join(", ") : "none"})`,
      );
    const text = files[0][1];
    source = files[0][0];
    if (source === "links.json") {
      raw = JSON.parse(text);
    } else {
      const document = parseDocument(text, { uniqueKeys: true });
      if (document.errors.length) throw document.errors[0];
      raw = document.toJS();
    }
    if (!raw || Object.getPrototypeOf(raw) !== Object.prototype) {
      throw new Error("expected an object mapping short codes to destinations");
    }
  } catch (error) {
    throw new Error(`Build stopped. Fix ${source}: ${error.message}`);
  }
  const problems = [];
  const links = [];
  const directories = [];
  const active = new Set();

  function collect(entries, path = []) {
    const seen = new Map();
    const launchers = [];
    if (active.has(entries)) {
      problems.push(`"${path.join("/")}" — directory cannot contain itself`);
      return;
    }
    if (
      !entries ||
      Object.getPrototypeOf(entries) !== Object.prototype ||
      (path.length && !Object.keys(entries).length)
    ) {
      problems.push(
        `"${path.join("/") || "/"}" — directory must contain links or subdirectories`,
      );
      return;
    }
    active.add(entries);
    directories.push({ path, entries });
    for (const [code, value] of Object.entries(entries)) {
      const before = problems.length;
      const full = [...path, code];
      const name = full.join("/");
      problems.push(...validateCode(code, full, seen));

      if (isDirectory(value)) {
        collect(value, full);
        continue;
      }
      const url = linkUrl(value);
      if (
        typeof value !== "string" &&
        (!value || typeof value !== "object" || Array.isArray(value))
      ) {
        problems.push(
          `"${name}" — expected a URL string, an object with url, or a directory`,
        );
      }
      if (
        typeof value === "object" &&
        value &&
        "title" in value &&
        typeof value.title !== "string"
      ) {
        problems.push(`"${name}" — title must be a string`);
      }
      if (typeof value === "object" && value && "script" in value) {
        problems.push(
          `"${name}" — The script property is no longer supported; remove it. Only for script: true, append script to tags unless a trimmed case-insensitive equivalent already exists; preserve all other tags, fields and order. False must not remove an independently configured script tag. Explicitly rename existing padded, whitespace-containing or comma-containing tags to maintainer-chosen valid names; preserve all other valid raw values. No automatic renaming is performed.`,
        );
      }
      if (typeof value === "object" && value && "hidden" in value) {
        problems.push(
          `"${name}" — The hidden property is no longer supported; remove it. Only for hidden: true, append hidden to tags unless already present (case-insensitive); preserve all existing tags. Explicitly rename existing padded, whitespace-containing or comma-containing tags to maintainer-chosen valid names; preserve all other valid raw values. No automatic renaming is performed.`,
        );
      }
      if (
        typeof value === "object" &&
        value &&
        "tags" in value &&
        (!Array.isArray(value.tags) ||
          value.tags.some((tag) => typeof tag !== "string" || !tag.trim()))
      ) {
        problems.push(`"${name}" — tags must be an array of nonblank strings`);
      }
      const urlError = validateUrl(url, name);
      if (Array.isArray(value?.tags))
        for (const tag of value.tags)
          if (typeof tag === "string" && /[\s,]/.test(tag))
            problems.push(
              `"${name}" — ${JSON.stringify(tag)}: Tag names must not contain whitespace or commas; rename this tag explicitly. No automatic renaming is performed.`,
            );
      if (urlError) problems.push(urlError);
      if (linkStates(value).script) launchers.push(code);
      if (problems.length === before)
        links.push({ code: name, ...linkFields(value) });
    }
    for (const code of launchers) {
      const filename = `${code}.sh`;
      if (seen.has(filename.toLowerCase())) {
        problems.push(
          `"${[...path, code].join("/")}" — launcher "${filename}" collides with "${seen.get(filename.toLowerCase())}"`,
        );
      }
    }
    active.delete(entries);
  }
  collect(raw);

  if (problems.length) {
    throw new Error(
      `Build stopped. Fix these in ${source}:\n${problems.map((p) => "  - " + p).join("\n")}`,
    );
  }
  return { raw, source, links, directories };
}
