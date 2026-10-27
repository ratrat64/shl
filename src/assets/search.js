import { createSSRApp, h, nextTick } from "vue";
import { Directory } from "../directory-components.mjs";
import { createDirectoryState } from "../directory-state.mjs";

(() => {
  globalThis.directoryTick = nextTick;
  let island;
  globalThis.readDirectoryModel = (main, url) => {
    const script = main.querySelector("[data-directory-model]");
    if (!script) return null;
    const model = JSON.parse(script.textContent);
    const resolve = (nodes) => {
      for (const node of nodes) {
        node.href = new URL(node.href, url).href;
        if (node.children) resolve(node.children);
      }
    };
    // Initial hydration uses exactly the SSR attributes; fetched data is rebased.
    if (url) {
      resolve(model.nodes);
      const template = document.createElement("template");
      template.innerHTML = model.breadcrumbs;
      for (const a of template.content.querySelectorAll("a[href]"))
        a.href = new URL(a.getAttribute("href"), url).href;
      model.breadcrumbs = template.innerHTML;
    }
    const count = main.querySelector("#link-count"),
      toggle = main.querySelector("#tag-toggle");
    if (count) {
      model.labels.singular = count.dataset.labelSingular;
      model.labels.plural = count.dataset.labelPlural;
    }
    if (toggle) {
      model.labels.collapsed = toggle.dataset.labelCollapsed;
      model.labels.expanded = toggle.dataset.labelExpanded;
    }
    return model;
  };
  globalThis.unmountDirectory = () => {
    globalThis.cleanupSearch?.();
    island?.app.unmount();
    island = null;
  };
  const records = new Map();
  const unsaved = new Map();
  const trackPositions = new WeakMap();
  const rememberTrack = (track) => {
    const position = trackPositions.get(track);
    if (!track.hidden && track.scrollLeft !== position?.applied)
      trackPositions.set(track, {
        requested: track.scrollLeft,
        applied: track.scrollLeft,
      });
    return trackPositions.get(track)?.requested || 0;
  };
  const restoreTrack = (track, requested) => {
    track.scrollLeft = requested;
    // Keep the requested offset when a smaller catalog clamps the applied one.
    trackPositions.set(track, { requested, applied: track.scrollLeft });
  };
  globalThis.initSearch = (refreshStorage = false, incoming = null) => {
    globalThis.cleanupSearch?.();
    const root = document.querySelector("[data-directory-island]");
    if (!root) return;
    if (!island || island.root !== root) {
      island?.app.unmount();
      const controller = createDirectoryState(
        incoming ||
          globalThis.readDirectoryModel(document.querySelector("main")),
      );
      const app = createSSRApp({ render: () => h(Directory, { controller }) });
      app.mount(root);
      island = { app, root, controller };
    }
    const { state } = island.controller;
    if (refreshStorage) {
      state.selectionEpoch = (state.selectionEpoch || 0) + 1;
    }
    const retained = !!incoming;
    const selectedTrack = document.querySelector("#selected-tags"),
      availableTrack = document.querySelector("#available-tags");
    const trackScroll = [selectedTrack, availableTrack].map(rememberTrack);
    if (incoming) {
      state.model = incoming;
      state.contentKey = (state.contentKey || 0) + 1;
    }
    const model = state.model;
    const input = document.querySelector("#link-search");
    if (!input) return;
    const toggle = document.querySelector("#tag-toggle");
    const countLabel = document.querySelector("#link-count");
    const available = document.querySelector("#available-tags");
    const selected = document.querySelector("#selected-tags");
    const base = document.querySelector("main[data-site-base]")?.dataset
      .siteBase;
    if (!base) return;
    const key = "shl:filters:v1:" + new URL(base, location.href).pathname;
    const identity = (button) => JSON.parse(`"${button.dataset.tag}"`);
    const metadata = new Map(model.metadata.map((tag) => [tag.identity, tag]));
    const catalog = new Map(model.catalog.map((tag) => [tag.identity, tag]));
    const selections = state.selections;
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
    state.picker = restored.picker;
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
        picker: state.picker,
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
    for (const tag of selections.keys())
      if (!restored.tags.includes(tag)) selections.delete(tag);
    if (input.value !== restored.text) input.value = restored.text;
    input.readOnly = false;
    let unknown = [];
    let previousInput = input.value;
    let edit;
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
    state.enhanced = true;
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

    function update(published = true) {
      if (published) {
        state.model.labels.singular = countLabel.dataset.labelSingular;
        state.model.labels.plural = countLabel.dataset.labelPlural;
      }
      state.text = input.value;
      const count = island.controller.results.value.count;
      const number = countLabel.querySelector(".count-number");
      const changed = number.textContent !== String(count);
      nextTick(() => {
        if (
          active &&
          changed &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          number.classList.remove("count-changing");
          // Commit the resting style so rapid edits restart the CSS-owned animation.
          void getComputedStyle(number).animationName;
          number.classList.add("count-changing");
        }
      });
    }
    function select(identity) {
      if (selections.has(identity)) {
        state.notice = "Tag already selected.";
        return;
      }
      const published = [...available.querySelectorAll("button")].find(
        (button) => JSON.parse(`"${button.dataset.tag}"`) === identity,
      );
      const original = {
        ...(catalog.get(identity) || metadata.get(identity)),
        ...(published ? { style: published.getAttribute("style") } : {}),
      };
      selections.set(identity, original);
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
      nextTick(() => {
        if (active)
          focusChip(
            [...selected.querySelectorAll("button")].find(
              (chip) => identity(chip) === identity(button),
            ),
          );
      });
    });
    listen(selected, "click", (event) => {
      const button = event.target.closest("button[data-tag]");
      if (!button) return;
      const next = button.nextElementSibling || button.previousElementSibling;
      selections.delete(identity(button));
      update();
      save();
      nextTick(() => {
        if (!active) return;
        if (next) focusChip(next);
        else input.focus();
      });
    });
    for (const track of [available, selected])
      listen(track, "focusin", (event) => {
        if (event.target.matches("button"))
          event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    function picker(open, published = true) {
      if (published) {
        state.model.labels.collapsed = toggle.dataset.labelCollapsed;
        state.model.labels.expanded = toggle.dataset.labelExpanded;
      }
      state.picker = open;
      nextTick(() => {
        if (active && !available.hidden)
          restoreTrack(
            available,
            trackPositions.get(available)?.requested || 0,
          );
      });
    }
    listen(toggle, "click", () => {
      rememberTrack(available);
      // Slide content below the toolbar with the picker: record positions,
      // toggle synchronously (state/AT/tests observe hidden immediately),
      // then play a FLIP transform so the list glides to its new spot.
      // Movers ignore pointer input in flight so taps land on the controls
      // visible beneath them instead of on passing rows.
      const content = toggle
        .closest?.("section")
        ?.querySelector("[data-directory-content]");
      const below =
        content && !content.hidden && content.getClientRects?.().length
          ? [content]
          : [];
      const before = below.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      });
      cancelPickerMotion();
      picker(!state.picker);
      save();
      nextTick(() => {
        if (!active) return;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        // Timing stays owned by shared CSS; WAAPI just consumes the tokens.
        const tokens = getComputedStyle(document.documentElement);
        const duration =
          Number.parseFloat(tokens.getPropertyValue("--motion-duration")) ||
          240;
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
    });

    function tokens(enter = false, defer = composing) {
      const value = input.value;
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? start;
      const removals = [];
      state.notice = "";
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
      state.error = unknown.length ? "Tag not found" : "";
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
      if (!composing) return;
      composing = false;
      tokens();
    });
    for (const tag of restored.tags) {
      if (!selections.has(tag)) select(tag);
    }
    picker(restored.picker, false);
    state.error = state.notice = "";
    update(false);
    nextTick(() => {
      if (!active) return;
      if (retained) {
        restoreTrack(selected, trackScroll[0]);
        restoreTrack(available, trackScroll[1]);
      }
    });
  };
})();
