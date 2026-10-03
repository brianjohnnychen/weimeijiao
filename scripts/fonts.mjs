// Builds the self-hosted web fonts from the @fontsource packages (runs before every build).
// Output (generated, gitignored):
//   src/styles/fonts/latin.css   Lora + DM Sans, bundled into the global stylesheet
//   public/fonts/sc.css          Noto Serif SC + Noto Sans SC, linked on zh-Hans pages
//   public/fonts/tc.css          Noto Serif TC + Noto Sans TC, linked on zh-Hant pages
//   public/fonts/files/*.woff2   only the font slices those stylesheets reference
// CJK faces keep Google's unicode-range slicing, so a page downloads only the slices it needs.
// Each CJK unicode-range is trimmed to the characters the site actually uses (scanned from
// src/ and content/), which shrinks the stylesheets from ~300 KB to a few KB.
// No third-party font requests: the site must work where Google is blocked (mainland China).
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = (name) => join(root, 'node_modules', '@fontsource', name);
const outFiles = join(root, 'public', 'fonts', 'files');
const outPublic = join(root, 'public', 'fonts');
const outLatin = join(root, 'src', 'styles', 'fonts');

const LATIN = [
  ['lora', ['latin-500.css', 'latin-ext-500.css', 'latin-600.css', 'latin-ext-600.css', 'latin-400-italic.css', 'latin-ext-400-italic.css']],
  ['dm-sans', ['latin-400.css', 'latin-ext-400.css', 'latin-500.css', 'latin-ext-500.css', 'latin-700.css', 'latin-ext-700.css']],
];
const SC = [['noto-serif-sc', ['600.css']], ['noto-sans-sc', ['400.css', '700.css']]];
const TC = [['noto-serif-tc', ['600.css']], ['noto-sans-tc', ['400.css', '700.css']]];

// Curly quotes, ellipsis and middle dot live in the General Punctuation block, which the Latin
// fonts (first in the stack) also cover. These small families send them to the CJK font instead.
const PUNCT = [0xb7, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026];

const isCjk = (cp) =>
  (cp >= 0x2e80 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) ||
  (cp >= 0xff00 && cp <= 0xffef) || (cp >= 0x20000 && cp <= 0x2fa1f);

async function walk(dir, exts, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'fonts' || entry.name === 'node_modules') continue;
      await walk(p, exts, acc);
    } else if (exts.includes(extname(entry.name))) acc.push(p);
  }
  return acc;
}

async function usedCodepoints() {
  const exts = ['.mdx', '.md', '.astro', '.ts', '.js', '.mjs', '.json', '.yml', '.yaml'];
  const files = [...(await walk(join(root, 'src'), exts)), ...(await walk(join(root, 'content'), exts))];
  const set = new Set(PUNCT);
  for (const f of files) {
    for (const ch of await readFile(f, 'utf8')) {
      const cp = ch.codePointAt(0);
      if (isCjk(cp)) set.add(cp);
    }
  }
  return set;
}

function parseFaces(css) {
  const faces = [];
  const re = /(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*{([^}]*)}/g;
  let m;
  while ((m = re.exec(css))) {
    const body = m[2];
    const get = (prop) => {
      const r = new RegExp(`${prop}\\s*:\\s*([^;]+);`).exec(body);
      return r ? r[1].trim() : undefined;
    };
    const woff2 = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(get('src') ?? '');
    if (!woff2) continue;
    const slice = /\[(\d+)\]/.exec(m[1] ?? '');
    faces.push({
      family: get('font-family'),
      style: get('font-style') ?? 'normal',
      weight: get('font-weight') ?? '400',
      unicodeRange: get('unicode-range'),
      file: woff2[1],
      slice: slice ? Number(slice[1]) : -1,
    });
  }
  return faces;
}

function parseRange(unicodeRange) {
  return unicodeRange.split(',').map((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, '').split('-');
    const lo = parseInt(a, 16);
    return [lo, b ? parseInt(b, 16) : lo];
  });
}

function toRange(cps) {
  const sorted = [...cps].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    const hex = (n) => n.toString(16);
    out.push(i === j ? `U+${hex(sorted[i])}` : `U+${hex(sorted[i])}-${hex(sorted[j])}`);
    i = j;
  }
  return out.join(',');
}

function trim(unicodeRange, used) {
  const keep = [];
  for (const [lo, hi] of parseRange(unicodeRange)) {
    if (hi - lo > 4096) {
      for (const cp of used) if (cp >= lo && cp <= hi) keep.push(cp);
    } else {
      for (let cp = lo; cp <= hi; cp++) if (used.has(cp)) keep.push(cp);
    }
  }
  return keep;
}

function faceCss({ family, style, weight, unicodeRange, file }) {
  return [
    '@font-face{',
    `font-family:${family};`,
    `font-style:${style};`,
    `font-weight:${weight};`,
    'font-display:swap;',
    `src:url(/fonts/files/${file}) format('woff2');`,
    unicodeRange ? `unicode-range:${unicodeRange};` : '',
    '}',
  ].join('');
}

async function loadFaces(groups) {
  const faces = [];
  for (const [pkg, cssFiles] of groups) {
    const dir = pkgDir(pkg);
    if (!existsSync(dir)) throw new Error(`Missing font package @fontsource/${pkg}. Run npm install.`);
    for (const cssFile of cssFiles) {
      const parsed = parseFaces(await readFile(join(dir, cssFile), 'utf8'));
      if (!parsed.length) throw new Error(`No faces parsed from @fontsource/${pkg}/${cssFile}`);
      faces.push(...parsed.map((f) => ({ ...f, dir })));
    }
  }
  return faces;
}

async function buildLatin() {
  const faces = await loadFaces(LATIN);
  for (const f of faces) await copyFile(join(f.dir, 'files', f.file), join(outFiles, f.file));
  return faces.map(faceCss).join('\n') + '\n';
}

async function buildCjk(groups, punctFamily, used) {
  const faces = await loadFaces(groups);
  const rules = [];
  const files = new Set();
  // Punctuation families: the slice holding U+201C, limited to the punctuation code points.
  for (const f of faces) {
    if (!parseRange(f.unicodeRange).some(([lo, hi]) => 0x201c >= lo && 0x201c <= hi)) continue;
    const serif = f.family.includes('Serif');
    rules.push(faceCss({ ...f, family: `'${punctFamily} ${serif ? 'Serif' : 'Sans'}'`, unicodeRange: toRange(PUNCT) }));
    files.add(f);
  }
  // Interleave faces by slice index so identical unicode-ranges sit next to each other (gzip-friendly).
  const sorted = [...faces].sort((a, b) => a.slice - b.slice || a.family.localeCompare(b.family) || Number(a.weight) - Number(b.weight));
  for (const f of sorted) {
    const keep = trim(f.unicodeRange, used);
    if (!keep.length) continue;
    rules.push(faceCss({ ...f, unicodeRange: toRange(keep) }));
    files.add(f);
  }
  for (const f of files) await copyFile(join(f.dir, 'files', f.file), join(outFiles, f.file));
  return { css: rules.join('\n') + '\n', count: files.size };
}

await rm(outPublic, { recursive: true, force: true });
await mkdir(outFiles, { recursive: true });
await mkdir(outLatin, { recursive: true });

const header = '/* Generated by scripts/fonts.mjs from @fontsource packages. Do not edit. */\n';
const used = await usedCodepoints();
await writeFile(join(outLatin, 'latin.css'), header + (await buildLatin()));
const sc = await buildCjk(SC, 'WMJ Punct SC', used);
const tc = await buildCjk(TC, 'WMJ Punct TC', used);
await writeFile(join(outPublic, 'sc.css'), header + sc.css);
await writeFile(join(outPublic, 'tc.css'), header + tc.css);
console.log(`fonts: ${used.size} CJK code points in use; sc.css ${sc.count} files, tc.css ${tc.count} files`);
