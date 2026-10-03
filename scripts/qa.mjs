// QA over the built site (dist/). Runs in CI after the build; any error fails the build.
//   - every page exists in all three locales
//   - html lang, one h1, title, description, canonical, hreflang, OG image file
//   - every h1-h3 in <main> and every card / list entry has an anchor id
//   - no third-party assets (scripts, styles, fonts, images, frames) anywhere
//   - no em or en dashes, no draft markers in visible text or alt/title/aria/meta text
//   - no unrendered markup (**bold**, [text](/link), [[cite:id]]); no straight quotes in English text,
//     alt and label text, titles, descriptions or share-card text
//   - zh-Hant pages: no mainland vocabulary or non-Taiwan character forms (OpenCC t->twp + list)
//   - zh-Hans pages: no Traditional characters (OpenCC t->cn) and no Taiwan-only vocabulary
// Text inside elements marked with another lang (e.g. a citation title) is checked for that language only.
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import * as OpenCC from 'opencc-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://xn--3ys368f86s.com';
const LOCALES = [
  { key: 'zh-hans', prefix: '', lang: 'zh-Hans' },
  { key: 'zh-hant', prefix: 'zh-hant/', lang: 'zh-Hant' },
  { key: 'en', prefix: 'en/', lang: 'en' },
];
const allow = JSON.parse(await readFile(join(root, 'scripts', 'qa-allowlist.json'), 'utf8').catch(() => '{}'));

const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = await walk(dist);
const pages = files.map((f) => '/' + relative(dist, f).replace(/index\.html$/, '').replace(/\\/g, '/'));
const localeOf = (p) => (p.startsWith('/zh-hant/') ? LOCALES[1] : p.startsWith('/en/') ? LOCALES[2] : LOCALES[0]);
const neutral = (p) => p.replace(/^\/(zh-hant|en)\//, '/');

// 1. Parity
const contentPages = pages.filter((p) => p !== '/404.html' && !p.startsWith('/og-src/'));
const byNeutral = new Map();
for (const p of contentPages) {
  const n = neutral(p);
  if (!byNeutral.has(n)) byNeutral.set(n, new Set());
  byNeutral.get(n).add(localeOf(p).key);
}
for (const [n, set] of byNeutral) {
  for (const l of LOCALES) if (!set.has(l.key)) err(n, `missing in ${l.key}`);
}

// Vocabulary lists (beyond what OpenCC catches)
const MAINLAND_IN_HANT = ['質量', '視頻', '屏幕', '數據', '互聯網', '信息', '短信', '打印', '默認', '軟件', '網絡', '鼠標', '博客', '激活', '優化', '程序員', '早教', '點擊', '登錄', '賬號', '用戶', '視屏', '幼兒園大班', '課外班', '學前班', '小學生', '寶媽', '奶爸'];
const TAIWAN_IN_HANS = ['软体', '网路', '列印', '萤幕', '国小', '安亲班', '资讯', '品质', '影片', '幼稚园', '冷气', '计程车', '点选', '登入', '帐号', '使用者', '阿嬷', '阿公', '亲职'];
const banned = [
  { re: /[—―⸺⸻]/, label: 'em dash' },
  { re: /–/, label: 'en dash' },
  { re: /WMJ-DRAFT/, label: 'draft marker' },
  { re: /\b(TODO|TBD|FIXME|lorem ipsum)\b/i, label: 'placeholder text' },
  { re: /\*\*|\*[^\s*][^*]*\*(?!\w)/, label: 'unrendered markdown emphasis' },
  { re: /\]\((?:\/|#|https?:)/, label: 'unrendered markdown link' },
  { re: /\[\[cite:/, label: 'unrendered citation' },
];

// Character forms only: OpenCC's phrase table (twp) also rewrites normal Taiwan usage such as
// 聲明, 社區, 支持 and 查看 into software terms, so vocabulary is checked with curated lists instead.
const toTw = OpenCC.Converter({ from: 't', to: 'tw' });
const toCn = OpenCC.Converter({ from: 't', to: 'cn' });

function textByLang(node, inherited, acc) {
  // Collect visible text per effective language, skipping script/style/template.
  const tag = node.rawTagName?.toLowerCase();
  if (tag && ['script', 'style', 'template', 'svg'].includes(tag)) return;
  const lang = node.getAttribute?.('lang') || inherited;
  if (node.nodeType === 3) {
    acc[lang] = (acc[lang] ?? '') + node.rawText + ' ';
    return;
  }
  for (const c of node.childNodes ?? []) textByLang(c, lang, acc);
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

function diffWords(a, b) {
  // Return the changed segments between original a and converted b (same length mostly).
  const out = new Set();
  if (a === b) return [];
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) out.add(a.slice(Math.max(0, i - 2), i + 3).trim());
  }
  if (a.length !== b.length) out.add(`(length ${a.length} vs ${b.length})`);
  return [...out];
}

function checkVocab(page, lang, text) {
  const t = decode(text).replace(/\s+/g, ' ');
  if (lang === 'zh-Hant') {
    for (const seg of diffWords(t, toTw(t))) if (!(allow.zhHant ?? []).some((a) => seg.includes(a))) err(page, `zh-Hant wording or character form: "${seg}"`);
    for (const w of MAINLAND_IN_HANT) if (t.includes(w) && !(allow.zhHant ?? []).includes(w)) err(page, `zh-Hant page uses mainland term "${w}"`);
  } else if (lang === 'zh-Hans') {
    for (const seg of diffWords(t, toCn(t))) if (!(allow.zhHans ?? []).some((a) => seg.includes(a))) err(page, `zh-Hans page has Traditional characters: "${seg}"`);
    for (const w of TAIWAN_IN_HANS) if (t.includes(w) && !(allow.zhHans ?? []).includes(w)) warn(page, `zh-Hans page uses Taiwan-leaning term "${w}"`);
  }
}

const isExternal = (u) => /^(https?:)?\/\//i.test(u) && !u.startsWith(SITE);

for (let i = 0; i < files.length; i++) {
  const page = pages[i];
  if (page.startsWith('/og-src/')) continue;
  const html = await readFile(files[i], 'utf8');
  const doc = parse(html, { comment: false, blockTextElements: { script: true, style: true, noscript: true } });
  const loc = localeOf(page);
  const htmlLang = doc.querySelector('html')?.getAttribute('lang');
  if (htmlLang !== loc.lang) err(page, `html lang is ${htmlLang}, expected ${loc.lang}`);

  const main = doc.querySelector('main');
  const h1s = doc.querySelectorAll('h1');
  if (h1s.length !== 1) err(page, `${h1s.length} h1 elements (expected 1)`);
  if (!doc.querySelector('title')?.text.trim()) err(page, 'missing <title>');
  const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  if (desc.length < 20) err(page, 'missing or very short meta description');

  if (page !== '/404.html') {
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canonical !== SITE + page) err(page, `canonical ${canonical} should be ${SITE + page}`);
    const langs = doc.querySelectorAll('link[rel="alternate"][hreflang]').map((l) => l.getAttribute('hreflang'));
    for (const l of ['zh-Hans', 'zh-Hant', 'en', 'x-default']) if (!langs.includes(l)) err(page, `missing hreflang ${l}`);
    const og = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';
    const ogFile = join(dist, og.replace(SITE, ''));
    if (!og.startsWith(SITE) || !existsSync(ogFile)) err(page, `OG image missing: ${og}`);
  }

  // Anchors on headings and cards
  if (main) {
    for (const h of main.querySelectorAll('h1, h2, h3')) {
      if (!h.getAttribute('id')) err(page, `heading without id: "${h.text.trim().slice(0, 50)}"`);
    }
    for (const li of main.querySelectorAll('.card-grid > li, .entry-grid > li, .phase-strip > li, .printable-list > li, .bib-list > li, .gallery-grid > li')) {
      if (!li.getAttribute('id') && !li.querySelector('[id]')) err(page, `card or entry without an anchor id: "${li.text.trim().slice(0, 40)}"`);
    }
  }

  // Third-party assets
  const assetAttrs = [
    ['script[src]', 'src'], ['link[href]', 'href'], ['img[src]', 'src'], ['img[srcset]', 'srcset'], ['source[srcset]', 'srcset'],
    ['iframe[src]', 'src'], ['video[src]', 'src'], ['audio[src]', 'src'], ['embed[src]', 'src'], ['object[data]', 'data'],
  ];
  for (const [sel, attr] of assetAttrs) {
    for (const el of doc.querySelectorAll(sel)) {
      const rel = el.getAttribute('rel') ?? '';
      if (sel === 'link[href]' && /\b(canonical|alternate)\b/.test(rel)) continue;
      const values = (el.getAttribute(attr) ?? '').split(',').map((v) => v.trim().split(/\s+/)[0]);
      for (const v of values) if (v && isExternal(v)) err(page, `third-party asset ${sel} ${v}`);
    }
  }
  for (const el of doc.querySelectorAll('[style]')) {
    const m = /url\(\s*['"]?((?:https?:)?\/\/[^'")]+)/i.exec(el.getAttribute('style'));
    if (m && isExternal(m[1])) err(page, `third-party asset in style: ${m[1]}`);
  }

  // Visible text and attribute text
  const acc = {};
  textByLang(doc.querySelector('body') ?? doc, htmlLang, acc);
  const attrText = doc
    .querySelectorAll('[alt], [title], [aria-label], meta[name="description"], meta[property="og:title"], meta[property="og:description"]')
    .map((el) => [el.getAttribute('alt'), el.getAttribute('title'), el.getAttribute('aria-label'), el.getAttribute('content')].filter(Boolean).join(' '))
    .join(' ');
  const allText = decode(Object.values(acc).join(' ') + ' ' + attrText + ' ' + (doc.querySelector('title')?.text ?? ''));
  for (const b of banned) {
    const m = b.re.exec(allText);
    if (m) err(page, `${b.label}: "...${allText.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ')}..."`);
  }
  for (const [lang, text] of Object.entries(acc)) checkVocab(page, lang, text);
  for (const [lang, text] of Object.entries(acc)) {
    if (!lang.toLowerCase().startsWith('en')) continue;
    const t = decode(text);
    const m = /["']/.exec(t);
    if (m) err(page, `straight quote in English text: "...${t.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ')}..."`);
  }
  // Text the reader meets outside the page body too: alt and label text, the title, and the
  // description and share-card text that search results and chat apps show.
  if (htmlLang === 'en') {
    const shown = decode(
      [
        ...doc.querySelectorAll('[alt], [title], [aria-label]').map((el) => [el.getAttribute('alt'), el.getAttribute('title'), el.getAttribute('aria-label')].filter(Boolean).join(' | ')),
        ...doc.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[property="og:image:alt"]').map((el) => el.getAttribute('content') ?? ''),
        doc.querySelector('title')?.text ?? '',
      ].join(' | '),
    );
    const m = /["']/.exec(shown);
    if (m) err(page, `straight quote in English attribute or meta text: "...${shown.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ')}..."`);
  }
}

// CSS files: no external url()
async function walkExt(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walkExt(p, ext, out);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}
for (const css of [...(await walkExt(join(dist, '_astro'), '.css')), ...(await walkExt(join(dist, 'fonts'), '.css'))]) {
  const text = await readFile(css, 'utf8');
  for (const m of text.matchAll(/url\(\s*['"]?((?:https?:)?\/\/[^'")]+)/gi)) if (isExternal(m[1])) err(relative(dist, css), `third-party url() ${m[1]}`);
  if (/@import\s+url\(\s*['"]?https?:/i.test(text)) err(relative(dist, css), 'third-party @import');
}

// Sitemap, robots, CNAME
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8').catch(() => '');
for (const p of contentPages) if (!sitemap.includes(`<loc>${SITE}${p}</loc>`)) err(p, 'not in sitemap.xml');
if (!existsSync(join(dist, 'robots.txt'))) err('/robots.txt', 'missing');
const cname = await readFile(join(dist, 'CNAME'), 'utf8').catch(() => '');
if (cname.trim() !== 'xn--3ys368f86s.com') err('/CNAME', `content is "${cname.trim()}"`);
// Every printable page has its PDF next to it.
for (const p of contentPages) {
  const m = /^\/(?:(zh-hant|en)\/)?printables\/([^/]+)\/$/.exec(p);
  if (!m) continue;
  const pdf = join(dist, m[1] ?? '', 'printables', `${m[2]}.pdf`);
  if (!existsSync(pdf) || (await stat(pdf)).size < 1000) err(p, 'PDF missing');
}

for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`ERROR: ${e}`);
console.log(`QA: ${contentPages.length} pages checked, ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
