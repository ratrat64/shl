(() => {
  const rebase = (main, url) => {
    if (main.dataset.siteBase)
      main.dataset.siteBase = new URL(main.dataset.siteBase, url).href;
    for (const link of main.querySelectorAll("a[href]")) {
      if (/^[.#]/.test(link.getAttribute("href")))
        link.href = new URL(link.getAttribute("href"), url).href;
    }
  };
  // The header and footer survive page swaps, so their relative links must not drift.
  for (const link of document.querySelectorAll(".site-head a, .footer a"))
    link.href = link.href;
  const mount = (refreshStorage = false) => {
    globalThis.initSearch(refreshStorage);
    globalThis.initCopy();
    globalThis.initDownload();
    globalThis.initRecovery(navigate);
  };

  const cleanup = () => {
    globalThis.cleanupCopy?.();
    globalThis.cleanupSearch?.();
    globalThis.cleanupDownload?.();
    globalThis.cleanupRecovery?.();
  };

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
  let pending;
  async function navigate(url, push, replace = false) {
    const current = ++request;
    pending?.abort();
    globalThis.cleanupRecovery?.();
    globalThis.cleanupCopy?.();
    globalThis.cleanupDownload?.();
    globalThis.initCopy();
    globalThis.initDownload();
    if (samePage(new URL(url), new URL(displayed))) {
      if (replace) {
        cleanup();
        location.replace(url);
        return;
      }
      if (push && url !== location.href) history.pushState(null, "", url);
      displayed = url;
      globalThis.resumeSearch?.();
      place(url, !push);
      globalThis.initRecovery(navigate);
      return;
    }
    globalThis.pauseSearch?.();
    try {
      const controller = new AbortController();
      pending = controller;
      const fetchUrl = new URL(url);
      fetchUrl.hash = "";
      const response = await fetch(fetchUrl.href, {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(10000),
        ]),
      });
      if (!response.ok && response.status !== 404)
        throw new Error("Page unavailable");
      const page = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const main = page.querySelector("main[data-app-page]");
      const title = page.querySelector("title");
      if (
        !main ||
        !(
          main.dataset.appPage === "not-found" ||
          [...document.querySelectorAll("[data-nav]")].some(
            (link) => link.dataset.nav === main.dataset.appPage,
          )
        ) ||
        (response.status === 404 && main.dataset.appPage !== "not-found") ||
        (main.dataset.appPage === "not-found" &&
          (!main.querySelector("#head") ||
            !main.querySelector("#msg") ||
            !main.querySelector("#home[data-app-link]"))) ||
        !title ||
        !main.querySelector("h1")
      )
        throw new Error("Not an app page");
      if (current !== request) return;
      rebase(main, url);
      for (const script of main.querySelectorAll("script")) script.remove();
      scroll.set(displayed, window.scrollY);
      cleanup();
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        main.dataset.entering = "";
      document.querySelector("main").replaceWith(main);
      document.title = title.textContent;
      for (const link of document.querySelectorAll("[data-nav]")) {
        if (link.dataset.nav === main.dataset.appPage)
          link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
      if (push) history.pushState(null, "", url);
      else if (replace) history.replaceState(null, "", url);
      displayed = url;
      mount();
      place(url, !push);
    } catch {
      if (current === request) {
        cleanup();
        if (replace) location.replace(url);
        else location.assign(url);
      }
    }
  }

  history.scrollRestoration = "manual";
  for (const name of ["animationend", "animationcancel"])
    document.addEventListener(name, (event) => {
      if (event.target.matches("main[data-entering]"))
        delete event.target.dataset.entering;
    });
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
    const link = event.target.closest("a[href]");
    if (
      !link ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    )
      return;
    if (
      !link.hasAttribute("data-app-link") ||
      link.origin !== location.origin
    ) {
      const url = new URL(link.href);
      if (
        url.origin === location.origin &&
        url.hash &&
        samePage(url, new URL(displayed))
      )
        return;
      ++request;
      pending?.abort();
      cleanup();
      return;
    }
    event.preventDefault();
    scroll.set(displayed, window.scrollY);
    navigate(link.href, true);
  });
  window.addEventListener("popstate", () => {
    scroll.set(displayed, window.scrollY);
    navigate(location.href, false);
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    const focusedTag = document.activeElement.closest("#selected-tags button")
      ?.dataset.tag;
    const position = {
      left: window.scrollX,
      top: window.scrollY,
      behavior: "instant",
    };
    ++request;
    pending?.abort();
    cleanup();
    for (const details of document.querySelectorAll("main details"))
      details.open = false;
    displayed = location.href;
    mount(true);
    if (focusedTag !== undefined) {
      const chip = [...document.querySelectorAll("#selected-tags button")].find(
        (button) => button.dataset.tag === focusedTag,
      );
      (chip || document.querySelector("#link-search"))?.focus({
        preventScroll: true,
      });
      window.scrollTo(position);
    }
  });
  rebase(document.querySelector("main"), location.href);
  mount();
  if (new URL(displayed).hash) place(displayed, false);
})();
