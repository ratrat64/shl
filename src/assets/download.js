globalThis.initDownload = () => {
  const list = document.querySelector(".links");
  const status = document.querySelector("#download-status");
  if (!list || !status) return;
  let active = true,
    timeout;
  const pending = new Map();
  const resources = new Map();
  const release = (url) => {
    clearTimeout(resources.get(url));
    URL.revokeObjectURL(url);
    resources.delete(url);
  };
  const click = async (event) => {
    const button = event.target.closest("button[data-download-url]");
    if (
      !button ||
      button.disabled ||
      event.defaultPrevented ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    const controller = new AbortController();
    pending.set(controller, button);
    button.disabled = true;
    clearTimeout(timeout);
    status.textContent = "";
    try {
      const response = await fetch(button.dataset.downloadUrl, {
        signal: controller.signal,
      });
      if (!response.ok || response.status === 206 || response.type === "opaque")
        throw new Error("Unreadable response");
      if (!active) return;
      const blob = await response.blob();
      if (!active) return;
      const url = URL.createObjectURL(blob);
      // Give the browser time to consume the URL; page cleanup also releases it.
      resources.set(
        url,
        setTimeout(() => release(url), 1000),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = button.dataset.downloadName;
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
      status.textContent = "Script download started.";
    } catch {
      if (active)
        status.textContent =
          "Could not download the script. Check the destination and whether its host allows CORS.";
    } finally {
      pending.delete(controller);
      if (active) {
        button.disabled = false;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          status.textContent = "";
        }, 5000);
      }
    }
  };
  list.addEventListener("click", click);
  globalThis.cleanupDownload = () => {
    active = false;
    for (const [controller, button] of pending) {
      controller.abort();
      button.disabled = false;
    }
    for (const url of resources.keys()) release(url);
    clearTimeout(timeout);
    status.textContent = "";
    list.removeEventListener("click", click);
    globalThis.cleanupDownload = undefined;
  };
};
