(() => {
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("shortlink-theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch {}
  const button = document.querySelector("[data-theme-control]");
  if (!button) return;
  const update = () => {
    const state = root.dataset.theme || "system";
    button.textContent = button.getAttribute("data-label-" + state);
  };
  update();
  button.addEventListener("click", () => {
    const current =
      root.dataset.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.dataset.theme = current === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("shortlink-theme", root.dataset.theme);
    } catch {}
    update();
  });
})();
