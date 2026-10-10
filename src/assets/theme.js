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
    const label = button.querySelector(".btn-label");
    if (label) label.textContent = button.getAttribute("data-label-" + state);
    button.setAttribute("aria-label", "Theme: " + state);
    for (const icon of button.querySelectorAll("[data-theme-icon]"))
      icon.hidden = icon.getAttribute("data-theme-icon") !== state;
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
