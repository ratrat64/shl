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
    .addEventListener?.("change", () => {
      globalThis.finishThemeTransition?.();
      settleTheme();
    });
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
  const commitTheme = (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem("shortlink-theme", theme);
    } catch {}
    update();
  };
  let transition;
  let pendingTheme;
  const finishThemeTransition = () => {
    const active = transition;
    transition = undefined;
    active?.skipTransition();
    if (pendingTheme) {
      commitTheme(pendingTheme);
      pendingTheme = undefined;
    }
    delete root.dataset.themeFading;
  };
  globalThis.finishThemeTransition = finishThemeTransition;
  // Retire the old image before an interaction can change live content geometry.
  for (const name of ["pointerdown", "keydown", "input", "toggle", "scroll"])
    document.addEventListener?.(name, finishThemeTransition, true);
  globalThis.addEventListener?.("pagehide", finishThemeTransition);
  globalThis
    .matchMedia?.("(prefers-reduced-motion: reduce)")
    .addEventListener?.("change", finishThemeTransition);
  button.addEventListener("click", () => {
    const current =
      pendingTheme ||
      root.dataset.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    finishThemeTransition();
    if (
      !document.startViewTransition ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      commitTheme(next);
      return;
    }
    pendingTheme = next;
    root.dataset.themeFading = "";
    try {
      const active = document.startViewTransition(() => {
        // Skipped transitions still invoke their update; ignore superseded work.
        if (transition !== active) return;
        pendingTheme = undefined;
        commitTheme(next);
        root.dataset.themeFading = "updated";
      });
      transition = active;
      active.ready.catch(() => {});
      const settled = () => {
        if (transition === active) finishThemeTransition();
      };
      active.finished.then(settled, settled);
    } catch {
      finishThemeTransition();
    }
  });
})();
