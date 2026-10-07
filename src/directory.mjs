import { esc, page } from './layout.mjs';

const visibleCount = (entries, includeHidden = false) =>
  [...walkEntries(entries)].filter(e => !e.isDirectory && (includeHidden || !e.hidden)).length;

export const walkEntries = function* (entries, prefix = '') {
  for (const [code, value] of Object.entries(entries).sort(([a], [b]) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)) {
    const href = `./${prefix}${code}/`;
    if (typeof value === 'object' && !('url' in value)) {
      yield { code, value, prefix, href, isDirectory: true, path: [...(prefix ? prefix.split('/').filter(Boolean) : []), code] };
      yield* walkEntries(value, `${prefix}${code}/`);
    } else {
      const url = typeof value === 'string' ? value : value.url;
      const title = typeof value === 'string' ? '' : value.title;
      const tags = Array.isArray(value?.tags) ? value.tags.map((tag) => tag.trim()) : [];
      yield { code, value, url, title, tags, script: value?.script === true, hidden: value?.hidden === true, prefix, href, isDirectory: false };
    }
  }
};

const renderDirectoryNode = ({ code, entries, prefix, visible }) => `
  <li${visible ? '' : ' data-hidden="true" hidden'}><details><summary><a href="${esc(`./${prefix}${code}/`)}" data-app-link>${esc(code)}</a></summary>
    ${listing(entries, `${prefix}${code}/`)}
  </details></li>`;

const renderLinkRow = ({ code, url, title, script, tags, hidden, prefix, href }) => {
  const originLength = new URL(url).origin.length;
  const path = url.slice(originLength).split(/[?#]/, 1)[0];
  const split = path.lastIndexOf('/', path.lastIndexOf('/') - 1);
  const cut = split > 0 ? originLength + split + 1 : url.length;
  const searchText = `${code} ${script ? 'script ' : ''}${url} ${tags.join(' ')} ${tags.map((tag) => `#${tag}`).join(' ')}`.trim();
  return `
       <li${hidden ? ' data-hidden="true" hidden' : ''}${title ? ` data-title="${esc(title)}"` : ''} data-search="${esc(searchText)}"><div class="link-row${script ? ' script-row' : ''}"${title ? ` title="${esc(title)}"` : ''}><a class="code${script ? ' script-link' : ''}" href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}>${esc(code)}${script ? '<span class="script-label">script</span>' : ''}</a>
            <a class="destination" href="${esc(url)}" aria-label="Copy destination: ${esc(url)}"${title ? '' : ` title="${esc(url)}"`}><span class="sr-only">${esc(url)}</span><span class="destination-start" aria-hidden="true">${esc(url.slice(0, cut))}</span><span class="destination-end" aria-hidden="true">${esc(url.slice(cut))}</span></a>${script ? `<a class="download" href="${esc(`./${prefix}${code}.sh`)}" aria-label="Download script for ${esc(code)}" download>Download</a>` : ''}<a class="visit" href="${esc(url)}" aria-label="Open destination for ${esc(code)}">Open</a></div>${tags.length ? `<span class="tags">${tags.map((tag) => `#${esc(tag)}`).join(' · ')}</span>` : ''}</li>`;
};

const listing = (entries, prefix = '') => `<ul class="links">${Object.entries(entries)
  .sort(([a], [b]) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
  .map(([code, value]) => {
    const href = `./${prefix}${code}/`;
    if (typeof value === 'object' && !('url' in value)) {
      const visible = visibleCount(value);
      return renderDirectoryNode({ code, entries: value, prefix, visible });
    }
    const url = typeof value === 'string' ? value : value.url;
    const title = typeof value === 'string' ? '' : value.title;
    const tags = Array.isArray(value?.tags) ? value.tags.map((tag) => tag.trim()) : [];
    return renderLinkRow({ code, url, title, script: value?.script === true, tags, hidden: value?.hidden === true, prefix, href });
  }).join('')}</ul>`;

const searchableListing = () => `<div class="search" hidden>
      <label class="sr-only" for="link-search">Search links</label>
      <input id="link-search" type="search" placeholder="Search link, title or tag" autocomplete="off">
    </div>`;

const directoryContents = (entries, breadcrumbs = '', emptyMessage = 'No links listed here.') => {
  const visible = visibleCount(entries);
  const total = visibleCount(entries, true);
  return `<section aria-label="Links">
    <div class="directory-tools"><h1 id="link-count" class="count" aria-live="polite" aria-atomic="true"><span class="count-number" aria-hidden="true">${visible}</span><span class="count-label">${visible === 1 ? ' link' : ' links'}</span></h1>
    <div class="directory-actions">${total ? searchableListing() : ''}<div class="directory-toggles"><button id="hidden-toggle" class="theme-toggle" type="button" aria-pressed="false" ${total > visible ? 'hidden' : 'disabled'}>Show hidden links</button></div></div></div>
    ${breadcrumbs || '<div class="breadcrumbs" aria-hidden="true"></div>'}
    ${total ? `<p id="search-status" class="search-status" role="status" hidden></p><p id="copy-status" class="search-status" role="status" aria-live="polite"></p>
     ${visible ? '' : '<p id="empty-directory">No links listed here.</p>'}
      <div${visible ? '' : ' hidden'}>${listing(entries)}</div>` : `<p>${emptyMessage}</p>`}</section>`;
};

export const indexPage = ({ raw, links, source }) => page('Links', 'links', './', `
    ${directoryContents(raw, '', links.length ? 'No links listed here.' : `No links available yet. Add your first entry to <code>${esc(source)}</code> and rebuild the site.`)}`);

export const directoryPage = ({ path, entries }) => {
  const depth = '../'.repeat(path.length);
  const breadcrumbs = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${depth}" data-app-link>Home</a>${path.map((code, i) => ` / ${i < path.length - 1 ? `<a href="${'../'.repeat(path.length - i - 1)}" data-app-link>${esc(code)}</a>` : esc(code)}`).join('')}</nav>`;
  return page(path.at(-1), 'links', depth, `
    ${directoryContents(entries, breadcrumbs)}`);
};
