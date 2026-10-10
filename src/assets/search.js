(() => {
  const records = new Map();
  const unsaved = new Map();
  const trackPositions = new WeakMap();
  globalThis.initSearch = (refreshStorage = false, directoryTools = null) => {
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
    const base = document.querySelector("main[data-site-base]")?.dataset
      .siteBase;
    if (!base) return;
    const trackScroll = [selected, available].map((track) => {
      if (!track.hidden) trackPositions.set(track, track.scrollLeft);
      return trackPositions.get(track) || 0;
    });
    if (directoryTools) {
      available.replaceChildren(
        ...directoryTools.querySelector("#available-tags").childNodes,
      );
      const incomingToggle = directoryTools.querySelector("#tag-toggle");
      toggle.dataset.labelCollapsed = incomingToggle.dataset.labelCollapsed;
      toggle.dataset.labelExpanded = incomingToggle.dataset.labelExpanded;
      const incomingCount = directoryTools.querySelector("#link-count");
      countLabel.dataset.labelSingular = incomingCount.dataset.labelSingular;
      countLabel.dataset.labelPlural = incomingCount.dataset.labelPlural;
    }
    const key = "shl:filters:v1:" + new URL(base, location.href).pathname;
    const identity = (button) => JSON.parse(`"${button.dataset.tag}"`);
    const metadata = new Map(
      [
        ...document
          .querySelector("#restoration-tags")
          .content.querySelectorAll("button"),
      ].map((button) => [identity(button), button]),
    );
    const catalog = new Map(
      [...available.querySelectorAll("button")].map((button) => [
        identity(button),
        button,
      ]),
    );
    const selections = new Map();
    const valid = (record) =>
      record?.version === 1 &&
      typeof record.text === "string" &&
      typeof record.picker === "boolean" &&
      Array.isArray(record.tags) &&
      new Set(record.tags).size === record.tags.length &&
      record.tags.every((tag) => typeof tag === "string" && metadata.has(tag));
    let restored = records.get(key);
    try {
      if (!restored || refreshStorage) {
        const stored = sessionStorage.getItem(key);
        if (
          unsaved.has(key) &&
          (unsaved.get(key) === undefined || unsaved.get(key) === stored)
        ) {
          // Keep edits whose failed write left storage unchanged, even if empty.
        } else if (stored === null) {
          restored = undefined;
          unsaved.delete(key);
        } else {
          const record = JSON.parse(stored);
          restored = valid(record) ? record : undefined;
          unsaved.delete(key);
        }
      }
    } catch {}
    if (!valid(restored))
      restored = { version: 1, text: "", tags: [], picker: false };
    records.set(key, restored);
    let pickerOpen = restored.picker;
    let active = true;
    globalThis.pauseSearch = () => {
      active = false;
      input.readOnly = true;
    };
    globalThis.resumeSearch = () => {
      if (input.value !== previousInput) input.value = previousInput;
      input.readOnly = false;
      active = true;
    };
    const save = () => {
      if (!active) return;
      const record = {
        version: 1,
        text: input.value,
        tags: [...selections.keys()],
        picker: pickerOpen,
      };
      records.set(key, record);
      try {
        sessionStorage.setItem(key, JSON.stringify(record));
        unsaved.delete(key);
      } catch {
        try {
          unsaved.set(key, sessionStorage.getItem(key));
        } catch {
          if (!unsaved.has(key)) unsaved.set(key, undefined);
        }
      }
    };
    if (directoryTools) {
      for (const button of selected.querySelectorAll("button")) {
        const tag = identity(button);
        if (restored.tags.includes(tag)) selections.set(tag, button);
        else button.remove();
      }
    } else selected.replaceChildren();
    for (const button of catalog.values()) button.hidden = false;
    if (input.value !== restored.text) input.value = restored.text;
    input.readOnly = false;
    let unknown = [];
    let previousInput = input.value;
    let edit;
    const opened = new Map();
    const listeners = [];
    let composing = false;
    const listen = (target, name, callback) => {
      const handle = (event) => {
        if (active) callback(event);
      };
      target.addEventListener(name, handle);
      listeners.push(() => target.removeEventListener(name, handle));
    };
    let pickerMotion = [];
    const cancelPickerMotion = () => {
      for (const animation of pickerMotion) {
        try {
          animation.cancel();
        } catch {}
      }
      pickerMotion = [];
    };
    globalThis.cleanupSearch = () => {
      active = false;
      cancelPickerMotion();
      for (const remove of listeners) remove();
      globalThis.cleanupSearch = null;
      globalThis.pauseSearch = globalThis.resumeSearch = null;
    };
    input.parentElement.hidden = false;
    toggle.disabled = !catalog.size;
    toggle.hidden = false;
    countLabel
      .querySelector(".count-number")
      .classList.remove("count-changing");
    for (const name of ["animationend", "animationcancel"])
      listen(countLabel, name, (event) => {
        if (
          event.animationName === "count-change" &&
          !event.target.getAnimations().length
        )
          event.target.classList.remove("count-changing");
      });

    function filter(group, query, revealHidden, active, path = "") {
      let count = 0;
      for (const item of group.children) {
        const details = item.firstElementChild;
        if (details.tagName === "DETAILS") {
          const next =
            path + details.querySelector("summary").textContent + "/";
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
      status.textContent =
        active && !count ? "No links match your search." : "";
      if (empty) empty.hidden = active || !!count;
      list.parentElement.hidden = !count;
      const number = countLabel.querySelector(".count-number");
      const label = countLabel.querySelector(".count-label");
      const changed = number.textContent !== String(count);
      number.textContent = count;
      label.textContent =
        " " +
        (count === 1
          ? countLabel.dataset.labelSingular
          : countLabel.dataset.labelPlural);
      if (changed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        number.classList.remove("count-changing");
        // Commit the resting style so rapid edits restart the CSS-owned animation.
        void getComputedStyle(number).animationName;
        number.classList.add("count-changing");
      }
    }
    function chips() {
      selected.hidden = !selections.size;
      document.querySelector("#all-tags-selected").hidden = [
        ...catalog.values(),
      ].some((button) => !button.hidden);
    }
    function select(identity) {
      if (selections.has(identity)) {
        notice.textContent = "Tag already selected.";
        return;
      }
      const original = catalog.get(identity) || metadata.get(identity);
      if (catalog.has(identity)) catalog.get(identity).hidden = true;
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
      save();
      focusChip(selections.get(identity(button)));
    });
    listen(selected, "click", (event) => {
      const button = event.target.closest("button[data-tag]");
      if (!button) return;
      const next = button.nextElementSibling || button.previousElementSibling;
      selections.delete(identity(button));
      if (catalog.has(identity(button)))
        catalog.get(identity(button)).hidden = false;
      button.remove();
      chips();
      update();
      save();
      if (next) focusChip(next);
      else input.focus();
    });
    for (const track of [available, selected])
      listen(track, "focusin", (event) => {
        if (event.target.matches("button"))
          event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    function picker(open) {
      pickerOpen = open;
      available.hidden = !open || !catalog.size;
      if (!available.hidden)
        available.scrollLeft = trackPositions.get(available) || 0;
      toggle.setAttribute("aria-expanded", String(!available.hidden));
      toggle.setAttribute(
        "aria-label",
        available.hidden
          ? toggle.dataset.labelCollapsed
          : toggle.dataset.labelExpanded,
      );
    }
    listen(toggle, "click", () => {
      if (!available.hidden)
        trackPositions.set(available, available.scrollLeft);
      // Slide content below the toolbar with the picker: record positions,
      // toggle synchronously (state/AT/tests observe hidden immediately),
      // then play a FLIP transform so the list glides to its new spot.
      // Movers ignore pointer input in flight so taps land on the controls
      // visible beneath them instead of on passing rows.
      const section = toggle.closest?.("section");
      const tools = toggle.closest?.(".directory-tools");
      const below =
        section && tools
          ? [...section.children].filter(
              (element) =>
                element !== tools &&
                element.tagName !== "TEMPLATE" &&
                !element.hidden &&
                element.getClientRects?.().length,
            )
          : [];
      const before = below.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      });
      cancelPickerMotion();
      picker(available.hidden);
      save();
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Timing stays owned by shared CSS; WAAPI just consumes the tokens.
      const tokens = getComputedStyle(document.documentElement);
      const duration =
        Number.parseFloat(tokens.getPropertyValue("--motion-duration")) || 240;
      const easing =
        tokens.getPropertyValue("--motion-easing").trim() || "ease-out";
      try {
        below.forEach((element, index) => {
          if (typeof element.animate !== "function") return;
          const after = element.getBoundingClientRect();
          const dx = before[index].x - after.left;
          const dy = before[index].y - after.top;
          if (!dx && !dy) return;
          let animation;
          try {
            animation = element.animate(
              [
                { transform: `translate(${dx}px, ${dy}px)` },
                { transform: "none" },
              ],
              { duration, easing, id: "picker-slide" },
            );
          } catch {
            return;
          }
          element.style.pointerEvents = "none";
          // A newer flight re-suppresses first; only the last one restores.
          const release = () => {
            if (
              element
                .getAnimations()
                .some(
                  (other) =>
                    other.id === "picker-slide" &&
                    other.playState !== "finished" &&
                    other.playState !== "idle",
                )
            )
              return;
            element.style.pointerEvents = "";
          };
          animation.finished.then(release, release);
          pickerMotion.push(animation);
        });
        if (pickerMotion.length)
          Promise.allSettled(
            pickerMotion.map((animation) => animation.finished),
          ).then(() => {
            pickerMotion = pickerMotion.filter(
              (animation) =>
                animation.playState !== "finished" &&
                animation.playState !== "idle",
            );
          });
      } catch {}
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
              match.index >= url.index &&
              match.index < url.index + url[0].length,
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
        if (!catalog.has(identity) && !selections.has(identity)) {
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
      save();
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
    for (const tag of restored.tags) {
      if (!selections.has(tag)) select(tag);
      if (catalog.has(tag)) catalog.get(tag).hidden = true;
    }
    picker(restored.picker);
    error.hidden = true;
    error.textContent = "";
    notice.textContent = "";
    input.setAttribute("aria-invalid", "false");
    chips();
    update();
    if (directoryTools) {
      selected.scrollLeft = trackScroll[0];
      available.scrollLeft = trackScroll[1];
    }
  };
})();
