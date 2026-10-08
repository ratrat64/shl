globalThis.initSearch = () => {
  const input = document.querySelector("#link-search");
  if (!input) return;
  const list = document.querySelector(".links");
  const status = document.querySelector("#search-status");
  const toggle = document.querySelector("#hidden-toggle");
  const countLabel = document.querySelector("#link-count");
  const empty = document.querySelector("#empty-directory");
  if (!list || !status || !countLabel) return;
  const opened = new Map();
  let showHidden = false;
  input.parentElement.hidden = false;
  if (toggle && !toggle.disabled) toggle.hidden = false;

  function filter(list, query, tag, revealHidden, path = "", all = false) {
    let count = 0;
    for (const item of list.children) {
      if (item.dataset.hidden === "true" && !showHidden && !revealHidden) {
        item.hidden = true;
        continue;
      }
      const details = item.firstElementChild;
      if (details.tagName === "DETAILS") {
        const next = path + details.querySelector("summary").textContent + "/";
        const found = filter(
          details.querySelector(".links"),
          query,
          tag,
          revealHidden,
          next,
          tag === null && (all || next.toLowerCase().includes(query)),
        );
        item.hidden = !found;
        if (query && found && !details.open) {
          opened.set(details, false);
          details.open = true;
        }
        count += found;
      } else {
        const found =
          tag !== null
            ? !!tag && JSON.parse(item.dataset.tags || "[]").includes(tag)
            : all ||
              (
                path +
                (item.dataset.search || item.textContent) +
                " " +
                (item.dataset.title || "")
              )
                .toLowerCase()
                .includes(query);
        item.hidden = !found;
        count += Number(found);
      }
    }
    return count;
  }

  function update() {
    for (const [details, wasOpen] of opened) details.open = wasOpen;
    opened.clear();
    const query = input.value.trim().toLowerCase();
    const tag = query.startsWith("#") ? query.slice(1) : null;
    const revealHidden = ["hidden", "broken", "disabled"].includes(tag);
    const count = filter(list, query, tag, revealHidden);
    status.hidden = !query || !!count;
    status.textContent = query && !count ? "No links match your search." : "";
    if (empty) {
      empty.hidden = !!query || showHidden;
      list.parentElement.hidden = !count;
    }
    if (countLabel.querySelector) {
      const numberEl = countLabel.querySelector(".count-number");
      const labelEl = countLabel.querySelector(".count-label");
      if (numberEl && labelEl) {
        numberEl.textContent = count;
        labelEl.textContent = count === 1 ? " link" : " links";
      } else {
        countLabel.textContent = count + " link" + (count === 1 ? "" : "s");
      }
    } else {
      countLabel.textContent = count + " link" + (count === 1 ? "" : "s");
    }
  }

  input.addEventListener("input", update);
  if (toggle && !toggle.disabled)
    toggle.addEventListener("click", () => {
      showHidden = !showHidden;
      toggle.textContent = showHidden
        ? "Hide hidden links"
        : "Show hidden links";
      toggle.setAttribute("aria-pressed", String(showHidden));
      update();
    });
};
