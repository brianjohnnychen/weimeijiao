// Locale parity (SPEC §6, Three locales in one pull request; §10). Every change ships in Simplified
// Chinese, Traditional Chinese and English together, so this fails CI when:
//   - a page, situation, tool, phase or learning page exists in one locale folder but not the others;
//   - a frontmatter list (ages, tools, related, now, say, prevent, help, start, summary lists, age finder
//     questions and options) has a different length across locales;
//   - an image in content/images.yml lacks alt text in a locale.
// Usage: node scripts/parity-test.mjs
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['zh-hans', 'zh-hant', 'en'];
const COLLECTIONS = ['phases', 'learning', 'tools', 'situations', 'pages'];
const problems = [];

function frontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  return m ? YAML.parse(m[1]) : {};
}
function shape(value, path = '') {
  // Lengths of every array in the frontmatter, keyed by path (nested objects included, scalars ignored).
  const out = {};
  if (Array.isArray(value)) {
    out[path || '(root)'] = value.length;
    value.forEach((v, i) => Object.assign(out, shape(v, `${path}[${i}]`)));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) Object.assign(out, shape(v, path ? `${path}.${k}` : k));
  }
  return out;
}

for (const collection of COLLECTIONS) {
  const slugs = new Map(LOCALES.map((l) => [l, new Set()]));
  for (const l of LOCALES) {
    const dir = join(root, 'src', 'content', l, collection);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.mdx')) slugs.get(l).add(f.slice(0, -4));
  }
  const union = new Set([...slugs.values()].flatMap((s) => [...s]));
  for (const slug of [...union].sort()) {
    const missing = LOCALES.filter((l) => !slugs.get(l).has(slug));
    if (missing.length) {
      problems.push(`${collection}/${slug}: missing in ${missing.join(', ')}`);
      continue;
    }
    const shapes = LOCALES.map((l) => shape(frontmatter(join(root, 'src', 'content', l, collection, `${slug}.mdx`))));
    const keys = new Set(shapes.flatMap((s) => Object.keys(s)));
    for (const k of keys) {
      const vals = shapes.map((s) => s[k]);
      if (new Set(vals.map((v) => String(v))).size > 1) problems.push(`${collection}/${slug}: list "${k}" has ${LOCALES.map((l, i) => `${l} ${vals[i] ?? 'none'}`).join(', ')}`);
    }
  }
}

const images = YAML.parse(readFileSync(join(root, 'content', 'images.yml'), 'utf8'));
for (const img of images.images ?? []) {
  const missing = LOCALES.filter((l) => !String(img.alt?.[l] ?? '').trim());
  if (missing.length) problems.push(`images.yml ${img.id}: alt text missing in ${missing.join(', ')}`);
}

const files = COLLECTIONS.reduce((n, c) => n + (existsSync(join(root, 'src', 'content', 'en', c)) ? readdirSync(join(root, 'src', 'content', 'en', c)).filter((f) => f.endsWith('.mdx')).length : 0), 0);
if (problems.length) {
  for (const p of problems) console.log(`FAIL ${p}`);
  console.log(`Locale parity: ${problems.length} problem(s) across ${files} entries per locale`);
  process.exit(1);
}
console.log(`Locale parity: ${files} entries per locale, every page, situation, tool, phase and learning page present in all three locales with lists of the same length; alt text in every locale for ${images.images.length} images.`);
