import { readFile } from 'node:fs/promises';
import { parseDocument } from 'yaml';

const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RESERVED = new Set(['index', '404', 'assets', 'links', 'about', 'guide', 'how-it-works', 'index.html', '404.html', 'links.json', 'cname']);

export async function loadLinks() {
  let raw;
  let source = 'link source';
  try {
    const files = [];
    for (const name of ['links.json', 'links.yaml', 'links.yml']) {
      try {
        files.push([name, await readFile(name, 'utf8')]);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (files.length !== 1) throw new Error(`expected exactly one of links.json, links.yaml, links.yml (found ${files.length ? files.map(([name]) => name).join(', ') : 'none'})`);
    const text = files[0][1];
    source = files[0][0];
    if (source === 'links.json') {
      raw = JSON.parse(text);
    } else {
      const document = parseDocument(text, { uniqueKeys: true });
      if (document.errors.length) throw document.errors[0];
      raw = document.toJS();
    }
    if (!raw || Object.getPrototypeOf(raw) !== Object.prototype) {
      throw new Error('expected an object mapping short codes to destinations');
    }
  } catch (error) {
    throw new Error(`Build stopped. Fix ${source}: ${error.message}`);
  }
  const problems = [];
  const links = [];
  const directories = [];
  const active = new Set();

  function collect(entries, path = []) {
    const seen = new Map();
    const launchers = [];
    if (active.has(entries)) {
      problems.push(`"${path.join('/')}" — directory cannot contain itself`);
      return;
    }
    if (!entries || Object.getPrototypeOf(entries) !== Object.prototype || (path.length && !Object.keys(entries).length)) {
      problems.push(`"${path.join('/') || '/'}" — directory must contain links or subdirectories`);
      return;
    }
    active.add(entries);
    directories.push({ path, entries });
    for (const [code, value] of Object.entries(entries)) {
      const full = [...path, code];
      const name = full.join('/');
      if (!CODE_RE.test(code)) problems.push(`"${name}" — codes must start with a letter or number and contain only letters, numbers, . _ -`);
      if (RESERVED.has(code.toLowerCase())) problems.push(`"${name}" — reserved name`);
      const key = code.toLowerCase();
      if (seen.has(key)) problems.push(`"${name}" — collides with "${seen.get(key)}" (codes are matched case-insensitively)`);
      seen.set(key, name);

      if (value && typeof value === 'object' && !Array.isArray(value) && !('url' in value)) {
        collect(value, full);
        continue;
      }
      const url = typeof value === 'string' ? value : value?.url;
      const title = typeof value === 'object' ? value?.title ?? '' : '';
      if (typeof value !== 'string' && (!value || typeof value !== 'object' || Array.isArray(value))) {
        problems.push(`"${name}" — expected a URL string, an object with url, or a directory`);
      }
      if (typeof value === 'object' && value && 'title' in value && typeof value.title !== 'string') {
        problems.push(`"${name}" — title must be a string`);
      }
      if (typeof value === 'object' && value && 'script' in value && typeof value.script !== 'boolean') {
        problems.push(`"${name}" — script must be a boolean`);
      }
      if (typeof value === 'object' && value && 'hidden' in value && typeof value.hidden !== 'boolean') {
        problems.push(`"${name}" — hidden must be a boolean`);
      }
      if (typeof value === 'object' && value && 'tags' in value &&
          (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== 'string' || !tag.trim()))) {
        problems.push(`"${name}" — tags must be an array of nonblank strings`);
      }
      try {
        if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error();
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error();
      } catch {
        problems.push(`"${name}" — destination must be a valid absolute HTTP or HTTPS URL`);
      }
      links.push({ code: name, url, title, script: value?.script === true, hidden: value?.hidden === true });
      if (value?.script === true) launchers.push(code);
    }
    for (const code of launchers) {
      const filename = `${code}.sh`;
      if (seen.has(filename.toLowerCase())) {
        problems.push(`"${[...path, code].join('/')}" — launcher "${filename}" collides with "${seen.get(filename.toLowerCase())}"`);
      }
    }
    active.delete(entries);
  }
  collect(raw);

  if (problems.length) {
    throw new Error(`Build stopped. Fix these in ${source}:\n${problems.map((p) => '  - ' + p).join('\n')}`);
  }
  return { raw, source, links, directories };
}
