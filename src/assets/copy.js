globalThis.initCopy = () => {
  const list = document.querySelector(".links");
  const status = document.querySelector("#copy-status");
  if (!list || !status) return;
  let timeout,
    interaction = 0;
  const click = async (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = event.target.closest(
      "a.code, a.destination, button[data-copy-url]",
    );
    if (
      !link ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    )
      return;
    event.preventDefault();
    const current = ++interaction;
    clearTimeout(timeout);
    status.textContent = "";
    let message;
    try {
      await navigator.clipboard.writeText(
        link.classList.contains("code")
          ? link.href
          : link.getAttribute("data-copy-url") || link.getAttribute("href"),
      );
      message = link.classList.contains("code")
        ? "Short link copied."
        : "Destination copied.";
    } catch {
      message = link.hasAttribute("data-copy-url")
        ? "Could not copy the link. Select and copy the destination text."
        : "Could not copy the link. Try your browser’s copy-link action.";
    }
    if (current !== interaction) return;
    status.textContent = message;
    timeout = setTimeout(() => {
      status.textContent = "";
    }, 5000);
  };
  list.addEventListener("click", click);
  globalThis.cleanupCopy = () => {
    ++interaction;
    clearTimeout(timeout);
    status.textContent = "";
    list.removeEventListener("click", click);
    globalThis.cleanupCopy = undefined;
  };
};
