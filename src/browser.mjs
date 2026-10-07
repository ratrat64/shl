export const themeScript = `(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  try { const saved = localStorage.getItem('shortlink-theme'); if (saved === 'light' || saved === 'dark') root.dataset.theme = saved; } catch {}
  const update = () => { button.textContent = 'Theme: ' + (root.dataset.theme || 'system'); };
  update();
  button.addEventListener('click', () => {
    const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('shortlink-theme', root.dataset.theme); } catch {}
    update();
  });
})();`;

export const searchScript = `globalThis.initSearch = () => {
  const input = document.querySelector('#link-search');
  if (!input) return;
  const list = document.querySelector('.links');
  const status = document.querySelector('#search-status');
  const toggle = document.querySelector('#hidden-toggle');
  const countLabel = document.querySelector('#link-count');
  const empty = document.querySelector('#empty-directory');
  if (!list || !status || !countLabel) return;
  const opened = new Map();
  let showHidden = false;
  input.parentElement.hidden = !!empty;
  if (toggle && !toggle.disabled) toggle.hidden = false;

  function filter(list, query, path = '', all = false) {
    let count = 0;
    for (const item of list.children) {
      if (item.dataset.hidden === 'true' && !showHidden) { item.hidden = true; continue; }
      const details = item.firstElementChild;
      if (details.tagName === 'DETAILS') {
        const next = path + details.querySelector('summary').textContent + '/';
        const found = filter(details.querySelector('.links'), query, next, all || next.toLowerCase().includes(query));
        item.hidden = !found;
        if (query && found && !details.open) {
          opened.set(details, false);
          details.open = true;
        }
        count += found;
      } else {
        const found = all || (path + (item.dataset.search || item.textContent) + ' ' + (item.dataset.title || '')).toLowerCase().includes(query);
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
    const count = filter(list, query);
    status.hidden = !query || !!count || (!!empty && !showHidden);
    status.textContent = query && !count ? 'No links match your search.' : '';
    if (empty) {
      empty.hidden = showHidden;
      list.parentElement.hidden = !showHidden;
      input.parentElement.hidden = !showHidden;
    }
    if (countLabel.querySelector) {
      const numberEl = countLabel.querySelector('.count-number');
      const labelEl = countLabel.querySelector('.count-label');
      if (numberEl && labelEl) {
        numberEl.textContent = count;
        labelEl.textContent = count === 1 ? ' link' : ' links';
      } else {
        countLabel.textContent = count + ' link' + (count === 1 ? '' : 's');
      }
    } else {
      countLabel.textContent = count + ' link' + (count === 1 ? '' : 's');
    }
  }

  input.addEventListener('input', update);
  if (toggle && !toggle.disabled) toggle.addEventListener('click', () => {
    showHidden = !showHidden;
    toggle.textContent = showHidden ? 'Hide hidden links' : 'Show hidden links';
    toggle.setAttribute('aria-pressed', String(showHidden));
    update();
  });
};`;

export const copyScript = `globalThis.initCopy = () => {
  const list = document.querySelector('.links');
  const status = document.querySelector('#copy-status');
  if (!list || !status) return;
  let timeout, interaction = 0;
  const click = async (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a.code, a.destination');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self') return;
    event.preventDefault();
    const current = ++interaction;
    clearTimeout(timeout);
    status.textContent = '';
    let message;
    try {
      await navigator.clipboard.writeText(link.classList.contains('code') ? link.href : link.getAttribute('href'));
      message = link.classList.contains('code') ? 'Short link copied.' : 'Destination copied.';
    } catch {
      message = 'Could not copy the link. Try your browser\u2019s copy-link action.';
    }
    if (current !== interaction) return;
    status.textContent = message;
    timeout = setTimeout(() => { status.textContent = ''; }, 5000);
  };
  list.addEventListener('click', click);
  globalThis.cleanupCopy = () => {
    ++interaction;
    clearTimeout(timeout);
    status.textContent = '';
    list.removeEventListener('click', click);
    globalThis.cleanupCopy = undefined;
  };
};`;

export const navigationScript = `(() => {
  const rebase = (main, url) => {
    for (const link of main.querySelectorAll('a[href]')) {
      if (/^[.#]/.test(link.getAttribute('href'))) link.href = new URL(link.getAttribute('href'), url).href;
    }
  };
  // The header and footer survive page swaps, so their relative links must not drift.
  for (const link of document.querySelectorAll('.site-head a, .footer a')) link.href = link.href;
  const mount = () => { globalThis.initSearch(); globalThis.initCopy(); };
  rebase(document.querySelector('main'), location.href);
  mount();

  let request = 0;
  let displayed = location.href;
  // ponytail: one scroll position per URL; use history-entry state if per-visit restoration matters.
  const scroll = new Map();
  const samePage = (a, b) => a.pathname === b.pathname && a.search === b.search;
  const place = (url, restore) => {
    const main = document.querySelector('main');
    let fragment;
    try { fragment = decodeURIComponent(new URL(url).hash.slice(1)); } catch {}
    const section = fragment && [...main.querySelectorAll('[id]')].find((element) => element.id === fragment);
    if (restore && scroll.has(url)) window.scrollTo(0, scroll.get(url));
    else if (section) section.scrollIntoView();
    else window.scrollTo(0, 0);
    const focus = section || main.querySelector('h1');
    if (focus) { focus.tabIndex = -1; focus.focus({ preventScroll: true }); }
  };
  async function navigate(url, push) {
    const current = ++request;
    if (samePage(new URL(url), new URL(displayed))) {
      if (push && url !== location.href) history.pushState(null, '', url);
      displayed = url;
      place(url, !push);
      return;
    }
    try {
      const fetchUrl = new URL(url);
      fetchUrl.hash = '';
      const response = await fetch(fetchUrl.href);
      if (!response.ok) throw new Error('Page unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const main = page.querySelector('main[data-app-page]');
      const title = page.querySelector('title');
      if (!main || !['links', 'guide'].includes(main.dataset.appPage) || !title || !main.querySelector('h1')) throw new Error('Not an app page');
      if (current !== request) return;
      rebase(main, url);
      for (const script of main.querySelectorAll('script')) script.remove();
      globalThis.cleanupCopy?.();
      document.querySelector('main').replaceWith(main);
      document.title = title.textContent;
      document.body.classList.toggle('directory-page', main.dataset.appPage === 'links');
      for (const link of document.querySelectorAll('[data-nav]')) {
        if (link.dataset.nav === main.dataset.appPage) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
      if (push) history.pushState(null, '', url);
      displayed = url;
      mount();
      place(url, !push);
    } catch {
      if (current === request) location.assign(url);
    }
  }

  history.scrollRestoration = 'manual';
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[data-app-link]');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self' || link.origin !== location.origin) return;
    event.preventDefault();
    scroll.set(displayed, window.scrollY);
    navigate(link.href, true);
  });
  window.addEventListener('popstate', () => {
    scroll.set(displayed, window.scrollY);
    navigate(location.href, false);
  });
  if (new URL(displayed).hash) place(displayed, false);
})();`;
