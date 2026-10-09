globalThis.initRecovery = async (navigate) => {
  const main = document.querySelector('main[data-app-page="not-found"]');
  if (!main) return;
  const controller = new AbortController();
  let active = true;
  globalThis.cleanupRecovery = () => {
    active = false;
    controller.abort();
    globalThis.cleanupRecovery = undefined;
  };
  const parts = location.pathname.split("/").filter(Boolean);
  const seg = parts.at(-1) || "";
  const home = main.querySelector("#home");
  for (let depth = parts.length - 1; depth >= 0; depth--) {
    const base = "/" + parts.slice(0, depth).join("/") + (depth ? "/" : "");
    let entry;
    try {
      const response = await fetch(base + "links.json", {
        cache: "no-cache",
        signal: controller.signal,
      });
      if (!active) return;
      if (!response.ok) continue;
      entry = await response.json();
      if (!active) return;
    } catch {
      if (!active) return;
      continue;
    }
    const canonical = [];
    for (const segment of parts.slice(depth)) {
      const hit = isDirectory(entry)
        ? Object.entries(entry).find(
            ([code]) => code.toLowerCase() === segment.toLowerCase(),
          )
        : null;
      if (!hit) {
        entry = null;
        break;
      }
      canonical.push(hit[0]);
      entry = hit[1];
    }
    home.href = base;
    for (const link of document.querySelectorAll("[data-site-path]"))
      link.href = base + link.dataset.sitePath;
    if (isDirectory(entry)) {
      const url = new URL(location.href);
      url.pathname = base + canonical.join("/") + "/";
      navigate(url.href, false, true);
      return;
    }
    if (entry) {
      location.replace(
        linkStates(entry).disabled
          ? base + canonical.join("/") + "/"
          : linkUrl(entry),
      );
      return;
    }
    break;
  }
  main.querySelector("#head").textContent = "Link not found";
  main.querySelector("#msg").textContent = seg
    ? '"' + seg + '" is not a short link here.'
    : "That address does not exist.";
};
