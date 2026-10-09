(() => {
  const rebase = (main, url) => {
    for (const link of main.querySelectorAll("a[href]")) {
      if (/^[.#]/.test(link.getAttribute("href")))
        link.href = new URL(link.getAttribute("href"), url).href;
    }
  };
  // The header and footer survive page swaps, so their relative links must not drift.
  for (const link of document.querySelectorAll(".site-head a, .footer a"))
    link.href = link.href;
  const mount = () => {
    globalThis.initSearch();
    globalThis.initCopy();
    globalThis.initDownload();
  };
  rebase(document.querySelector("main"), location.href);
  mount();

  let request = 0;
  let displayed = location.href;
  // ponytail: one scroll position per URL; use history-entry state if per-visit restoration matters.
  const scroll = new Map();
  const samePage = (a, b) => a.pathname === b.pathname && a.search === b.search;
  const place = (url, restore) => {
    const main = document.querySelector("main");
    let fragment;
    try {
      fragment = decodeURIComponent(new URL(url).hash.slice(1));
    } catch {}
    const section =
      fragment &&
      [...main.querySelectorAll("[id]")].find(
        (element) => element.id === fragment,
      );
    if (restore && scroll.has(url))
      window.scrollTo({ left: 0, top: scroll.get(url), behavior: "instant" });
    else if (section)
      section.scrollIntoView({ behavior: restore ? "instant" : "auto" });
    else
      window.scrollTo({
        left: 0,
        top: 0,
        behavior: restore ? "instant" : "auto",
      });
    const focus = section || main.querySelector("h1");
    if (focus) {
      focus.tabIndex = -1;
      focus.focus({ preventScroll: true });
    }
  };
  async function navigate(url, push) {
    const current = ++request;
    if (samePage(new URL(url), new URL(displayed))) {
      if (push && url !== location.href) history.pushState(null, "", url);
      displayed = url;
      place(url, !push);
      return;
    }
    try {
      const fetchUrl = new URL(url);
      fetchUrl.hash = "";
      const response = await fetch(fetchUrl.href, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Page unavailable");
      const page = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const main = page.querySelector("main[data-app-page]");
      const title = page.querySelector("title");
      if (
        !main ||
        !["links", "guide"].includes(main.dataset.appPage) ||
        !title ||
        !main.querySelector("h1")
      )
        throw new Error("Not an app page");
      if (current !== request) return;
      rebase(main, url);
      for (const script of main.querySelectorAll("script")) script.remove();
      scroll.set(displayed, window.scrollY);
      globalThis.cleanupCopy?.();
      globalThis.cleanupSearch?.();
      globalThis.cleanupDownload?.();
      document.querySelector("main").replaceWith(main);
      document.title = title.textContent;
      for (const link of document.querySelectorAll("[data-nav]")) {
        if (link.dataset.nav === main.dataset.appPage)
          link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
      if (push) history.pushState(null, "", url);
      displayed = url;
      mount();
      place(url, !push);
    } catch {
      if (current === request) location.assign(url);
    }
  }

  history.scrollRestoration = "manual";
  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = event.target.closest("a[data-app-link]");
    if (
      !link ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self") ||
      link.origin !== location.origin
    )
      return;
    event.preventDefault();
    scroll.set(displayed, window.scrollY);
    navigate(link.href, true);
  });
  window.addEventListener("popstate", () => {
    scroll.set(displayed, window.scrollY);
    navigate(location.href, false);
  });
  if (new URL(displayed).hash) place(displayed, false);
})();
