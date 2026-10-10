(() => {
  const root = document.documentElement;
  const settleTheme = () => {
    // Switch inks and surfaces together; hover transitions must not cross themes.
    for (const animation of document.getAnimations?.() || [])
      if (animation instanceof CSSTransition) animation.cancel();
  };
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    settleTheme();
  };
  try {
    const saved = localStorage.getItem("shortlink-theme");
    if (saved === "light" || saved === "dark") applyTheme(saved);
  } catch {}
  globalThis
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener?.("change", settleTheme);
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
    applyTheme(current === "dark" ? "light" : "dark");
    try {
      localStorage.setItem("shortlink-theme", root.dataset.theme);
    } catch {}
    update();
  });
})();
