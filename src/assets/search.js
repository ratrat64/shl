globalThis.initSearch = () => {
  globalThis.cleanupSearch?.();
  const input = document.querySelector("#link-search");
  if (!input) return;
  const list = document.querySelector(".links");
  const status = document.querySelector("#search-status");
  const toggle = document.querySelector("#tag-toggle");
  const countLabel = document.querySelector("#link-count");
  const empty = document.querySelector("#empty-directory");
  const available = document.querySelector("#available-tags");
  const selected = document.querySelector("#selected-tags");
  const error = document.querySelector("#tag-error");
  const notice = document.querySelector("#tag-notice");
  if (!list || !status || !countLabel || !available || !selected) return;
  const identity = (button) => JSON.parse(`"${button.dataset.tag}"`);
  const catalog = new Map(
    [...available.querySelectorAll("button")].map((button) => [
      identity(button),
      button,
    ]),
  );
  const selections = new Map();
  let unknown = [];
  let previousInput = "";
  let edit;
  const opened = new Map();
  const listeners = [];
  let composing = false;
  const listen = (target, name, callback) => {
    target.addEventListener(name, callback);
    listeners.push(() => target.removeEventListener(name, callback));
  };
  globalThis.cleanupSearch = () => {
    for (const remove of listeners) remove();
    globalThis.cleanupSearch = null;
  };
  input.parentElement.hidden = false;
  if (!toggle.disabled) toggle.hidden = false;

  function filter(group, query, revealHidden, active, path = "") {
    let count = 0;
    for (const item of group.children) {
      const details = item.firstElementChild;
      if (details.tagName === "DETAILS") {
        const next = path + details.querySelector("summary").textContent + "/";
        const found = filter(
          details.querySelector(".links"),
          query,
          revealHidden,
          active,
          next,
        );
        item.hidden = !found;
        if (active && found && !details.open) {
          opened.set(details, false);
          details.open = true;
        }
        count += found;
      } else {
        const tags = JSON.parse(item.dataset.tags || "[]");
        const found =
          (item.dataset.hidden !== "true" || revealHidden) &&
          [...selections.keys()].every((tag) => tags.includes(tag)) &&
          query !== "#" &&
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
    const active = !!query || !!selections.size;
    const revealHidden = ["hidden", "broken", "disabled"].some((tag) =>
      selections.has(tag),
    );
    const count = filter(list, query, revealHidden, active);
    status.hidden = !active || !!count;
    status.textContent = active && !count ? "No links match your search." : "";
    if (empty) empty.hidden = active || !!count;
    list.parentElement.hidden = !count;
    const number = countLabel.querySelector(".count-number");
    const label = countLabel.querySelector(".count-label");
    number.textContent = count;
    label.textContent = count === 1 ? " Link" : " Links";
  }
  function chips() {
    selected.hidden = !selections.size;
    document.querySelector("#all-tags-selected").hidden =
      selections.size !== catalog.size;
  }
  function select(identity) {
    if (selections.has(identity)) {
      notice.textContent = "Tag already selected.";
      return;
    }
    const original = catalog.get(identity);
    original.hidden = true;
    const button = original.cloneNode(true);
    button.hidden = false;
    button.setAttribute("aria-label", `Remove ${button.textContent} filter`);
    button.setAttribute("aria-pressed", "true");
    selected.append(button);
    selections.set(identity, button);
    chips();
  }
  function focusChip(button) {
    button.focus({ preventScroll: true });
    button.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  listen(available, "click", (event) => {
    const button = event.target.closest("button[data-tag]");
    if (!button) return;
    select(identity(button));
    update();
    focusChip(selections.get(identity(button)));
  });
  listen(selected, "click", (event) => {
    const button = event.target.closest("button[data-tag]");
    if (!button) return;
    const next = button.nextElementSibling || button.previousElementSibling;
    selections.delete(identity(button));
    catalog.get(identity(button)).hidden = false;
    button.remove();
    chips();
    update();
    if (next) focusChip(next);
    else input.focus();
  });
  for (const track of [available, selected])
    listen(track, "focusin", (event) => {
      if (event.target.matches("button"))
        event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  listen(toggle, "click", () => {
    available.hidden = !available.hidden;
    toggle.setAttribute("aria-expanded", String(!available.hidden));
    toggle.textContent = available.hidden ? "Show tags" : "Hide tags";
  });

  function tokens(enter = false, defer = composing) {
    const value = input.value;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;
    const removals = [];
    notice.textContent = "";
    const urls = [...value.matchAll(/https?:\/\/[^\s]+/gi)];
    const candidates = [
      ...value.matchAll(/(?<![^\s,])#([^\s,]+)([\s,]|$)/g),
    ].filter(
      (match) =>
        !urls.some(
          (url) =>
            match.index >= url.index && match.index < url.index + url[0].length,
        ),
    );
    // Synthetic inputs/history without edit ranges retain string-diff fallback.
    let prefix = 0,
      suffix = 0;
    while (
      prefix < previousInput.length &&
      prefix < value.length &&
      previousInput[prefix] === value[prefix]
    )
      prefix++;
    while (
      suffix < previousInput.length - prefix &&
      suffix < value.length - prefix &&
      previousInput.at(-1 - suffix) === value.at(-1 - suffix)
    )
      suffix++;
    let from = prefix,
      oldEnd = previousInput.length - suffix;
    const delta = value.length - previousInput.length;
    const nativeEdit = edit?.value === previousInput;
    if (nativeEdit) {
      from = edit.start;
      oldEnd = edit.end;
      if (from === oldEnd && delta < 0) {
        if (edit.type.endsWith("Backward")) from += delta;
        else if (edit.type.endsWith("Forward")) oldEnd -= delta;
        else {
          from = prefix;
          oldEnd = previousInput.length - suffix;
        }
      }
    }
    edit = null;
    const inserted = value.length - previousInput.length + oldEnd - from;
    const attempted = new Set();
    for (const [a, b] of unknown) {
      if (from <= a && oldEnd >= b && inserted === 0) continue;
      const start = a >= oldEnd ? a + delta : a < from ? a : from;
      const candidate = candidates.find((match) => match.index === start);
      if (
        candidate &&
        (nativeEdit ||
          !(a + 1 < oldEnd && candidate.index + 1 >= value.length - suffix))
      )
        attempted.add(candidate.index);
    }
    for (const match of candidates) {
      if (defer) continue;
      const identity = match[1].toLowerCase();
      const tokenEnd = match.index + 1 + match[1].length;
      const atCaret = enter && start >= match.index && start <= tokenEnd;
      if (!match[2] && !atCaret) continue;
      if (!catalog.has(identity)) {
        attempted.add(match.index);
        continue;
      }
      select(identity);
      attempted.delete(match.index);
      removals.push([match.index, tokenEnd + (match[2] ? 1 : 0)]);
    }
    const position = (caret) =>
      caret -
      removals.reduce(
        (n, [a, b]) => n + Math.max(0, Math.min(caret, b) - a),
        0,
      );
    let remaining = value;
    for (const [a, b] of removals.reverse())
      remaining = remaining.slice(0, a) + remaining.slice(b);
    if (removals.length) {
      input.value = remaining;
      input.setSelectionRange(position(start), position(end));
    }
    unknown = candidates
      .filter((match) => attempted.has(match.index))
      .map((match) => [
        position(match.index),
        position(match.index + 1 + match[1].length),
      ]);
    previousInput = remaining;
    error.hidden = !unknown.length;
    error.textContent = unknown.length ? "Tag not found" : "";
    input.setAttribute("aria-invalid", String(!!unknown.length));
    update();
  }
  listen(input, "beforeinput", (event) => {
    edit = /^(insert|delete)/.test(event.inputType)
      ? {
          value: input.value,
          start: input.selectionStart,
          end: input.selectionEnd,
          type: event.inputType,
        }
      : null;
  });
  listen(input, "paste", (event) => {
    const text = event.clipboardData?.getData("text/plain");
    if (!text || !/[\r\n]/.test(text)) return;
    event.preventDefault();
    edit = {
      value: input.value,
      start: input.selectionStart,
      end: input.selectionEnd,
      type: "insertFromPaste",
    };
    // Keep whitespace boundaries before type=search strips line breaks.
    input.setRangeText(
      text.replace(/[\r\n]/g, " "),
      edit.start,
      edit.end,
      "end",
    );
    tokens();
  });
  listen(input, "input", (event) =>
    tokens(false, composing || event.isComposing),
  );
  listen(input, "keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing && !composing) {
      event.preventDefault();
      tokens(true);
    }
  });
  listen(input, "compositionstart", () => {
    composing = true;
  });
  listen(input, "compositionend", () => {
    composing = false;
    tokens();
  });
  update();
};
