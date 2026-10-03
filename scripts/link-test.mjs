// Link test over the built site (dist/), all three locales.
// Every internal link (<a href>, plus canonical/alternate links) must resolve to an existing
// page or file, and every #fragment must match an element id on the target page.
// It also lists in-content links that point at another page without a #fragment, so a
// reviewer can confirm each one really refers to the whole page.
//   node scripts/link-test.mjs            run the test (exit 1 on any broken link)
//   node scripts/link-test.mjs --write    also write the results into docs/QA.md
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://xn--3ys368f86s.com';

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'og-src') continue;
      await walk(p, out);
    } else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = await walk(dist);
const pathOf = (file) => '/' + relative(dist, file).replace(/index\.html$/, '').replace(/\\/g, '/');
const localeOf = (p) => (p.startsWith('/zh-hant/') ? 'zh-hant' : p.startsWith('/en/') ? 'en' : 'zh-hans');

const idCache = new Map();
async function idsOf(file) {
  if (!idCache.has(file)) {
    const doc = parse(await readFile(file, 'utf8'));
    idCache.set(file, new Set([...doc.querySelectorAll('[id]').map((e) => e.getAttribute('id')), ...doc.querySelectorAll('a[name]').map((e) => e.getAttribute('name'))]));
  }
  return idCache.get(file);
}

function targetFile(pathname) {
  let p = decodeURIComponent(pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(dist, p);
  if (existsSync(f) && statSync(f).isFile()) return f;
  if (!/\.[a-z0-9]+$/i.test(p) && existsSync(join(f, 'index.html'))) return join(f, 'index.html');
  return null;
}

const stats = { 'zh-hans': { links: 0, anchors: 0, broken: 0, pages: 0 }, 'zh-hant': { links: 0, anchors: 0, broken: 0, pages: 0 }, en: { links: 0, anchors: 0, broken: 0, pages: 0 } };
const broken = [];
const pageLevel = new Map();

for (const file of files) {
  const page = pathOf(file);
  const loc = localeOf(page);
  stats[loc].pages++;
  const doc = parse(await readFile(file, 'utf8'));
  const contentRoots = doc.querySelectorAll('[data-content]');
  const inContent = new Set(contentRoots.flatMap((r) => r.querySelectorAll('a[href]')));
  const links = [
    ...doc.querySelectorAll('a[href]').map((a) => ({ href: a.getAttribute('href'), el: a, kind: 'a' })),
    ...doc.querySelectorAll('link[rel="canonical"], link[rel="alternate"]').map((l) => ({ href: l.getAttribute('href'), el: l, kind: 'link' })),
  ];
  for (const { href, el, kind } of links) {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    let url;
    try {
      url = new URL(href, SITE + page);
    } catch {
      broken.push({ page, href, why: 'unparsable URL' });
      stats[loc].broken++;
      continue;
    }
    if (url.origin !== SITE) continue; // external links are checked by the sources workflow
    stats[loc].links++;
    const file2 = targetFile(url.pathname);
    if (!file2) {
      broken.push({ page, href, why: 'page or file not found' });
      stats[loc].broken++;
      continue;
    }
    if (url.hash && url.hash.length > 1) {
      stats[loc].anchors++;
      const id = decodeURIComponent(url.hash.slice(1));
      if (file2.endsWith('.html') && !(await idsOf(file2)).has(id)) {
        broken.push({ page, href, why: `no element with id "${id}" on ${url.pathname}` });
        stats[loc].broken++;
      }
    } else if (kind === 'a' && inContent.has(el) && url.pathname !== page && file2.endsWith('.html')) {
      const key = `${url.pathname}`;
      if (!pageLevel.has(key)) pageLevel.set(key, new Set());
      pageLevel.get(key).add(`${page} ("${el.text.trim().slice(0, 40)}")`);
    }
  }
}

const total = Object.values(stats).reduce((a, s) => ({ links: a.links + s.links, anchors: a.anchors + s.anchors, broken: a.broken + s.broken, pages: a.pages + s.pages }), { links: 0, anchors: 0, broken: 0, pages: 0 });
const lines = [];
lines.push(`Link test run ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC over dist/ (${total.pages} HTML pages).`);
lines.push('');
lines.push('| Locale | Pages | Internal links | With #anchor | Broken |');
lines.push('|---|---|---|---|---|');
for (const [l, s] of Object.entries(stats)) lines.push(`| ${l} | ${s.pages} | ${s.links} | ${s.anchors} | ${s.broken} |`);
lines.push(`| all | ${total.pages} | ${total.links} | ${total.anchors} | ${total.broken} |`);
lines.push('');
if (broken.length) {
  lines.push('Broken links:');
  for (const b of broken.slice(0, 200)) lines.push(`- ${b.page} -> ${b.href}: ${b.why}`);
  lines.push('');
}
lines.push(`In-content links to a whole page (no #anchor), for review: ${pageLevel.size} target page(s).`);
for (const [target, from] of [...pageLevel].slice(0, 60)) lines.push(`- ${target} <- ${[...from].slice(0, 3).join('; ')}${from.size > 3 ? `; +${from.size - 3} more` : ''}`);

console.log(lines.join('\n'));

if (process.argv.includes('--write')) {
  const qa = join(root, 'docs', 'QA.md');
  const text = await readFile(qa, 'utf8');
  const block = `<!-- link-test:start -->\n${lines.join('\n')}\n<!-- link-test:end -->`;
  const next = text.includes('<!-- link-test:start -->') ? text.replace(/<!-- link-test:start -->[\s\S]*?<!-- link-test:end -->/, block) : `${text.trimEnd()}\n\n${block}\n`;
  await writeFile(qa, next);
  console.log('Wrote results to docs/QA.md');
}
process.exit(total.broken ? 1 : 0);
