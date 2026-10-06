// Turns a JSON or YAML link map into a static site: one folder per short path,
// each with an instant redirect and optional Bash launcher. No server.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { loadLinks } from './links.mjs';
import { styles, themeScript, searchScript, copyScript, redirectPage, scriptLauncher, indexPage, directoryPage, guidePage, oldInfoPage, notFoundPage } from './pages.mjs';

const OUT = 'dist';
let raw, source, links, directories;
try {
  ({ raw, source, links, directories } = await loadLinks());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

let cname;
try {
  cname = await readFile('CNAME', 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await mkdir(join(OUT, 'assets'), { recursive: true });
await writeFile(join(OUT, 'assets', 'site.css'), styles);
await writeFile(join(OUT, 'assets', 'theme.js'), themeScript);
await writeFile(join(OUT, 'assets', 'search.js'), searchScript);
await writeFile(join(OUT, 'assets', 'copy.js'), copyScript);

for (const link of links) {
  await mkdir(join(OUT, link.code), { recursive: true });
  await writeFile(join(OUT, link.code, 'index.html'), redirectPage(link));
  if (link.script) await writeFile(join(OUT, `${link.code}.sh`), scriptLauncher(link));
}

await writeFile(join(OUT, 'index.html'), indexPage({ raw, links, source }));
for (const directory of directories.slice(1)) {
  await mkdir(join(OUT, ...directory.path), { recursive: true });
  await writeFile(join(OUT, ...directory.path, 'index.html'), directoryPage(directory));
}
for (const [name, page] of [['about', () => oldInfoPage('about')], ['guide', () => guidePage(source)], ['how-it-works', () => oldInfoPage('how-it-works')]]) {
  await mkdir(join(OUT, name), { recursive: true });
  await writeFile(join(OUT, name, 'index.html'), page());
}
await writeFile(join(OUT, '404.html'), notFoundPage());
await writeFile(join(OUT, 'links.json'), JSON.stringify(raw, null, 2));
await writeFile(join(OUT, '.nojekyll'), '');
if (cname !== undefined) await writeFile(join(OUT, 'CNAME'), cname);

console.log(`Built ${links.length} short link${links.length === 1 ? '' : 's'} into ${OUT}/`);
