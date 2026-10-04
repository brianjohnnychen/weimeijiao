// After `astro build`: render printable PDFs and Open Graph images with headless Chrome, then
// remove the OG source pages from the output and any built asset no page uses any more. Chrome
// comes from CHROME_PATH (CI uses the runner's google-chrome) or the local Playwright Chromium.
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const PRINTABLES = ['age-finder', 'summary-0-12-months', 'summary-1-3-years', 'summary-3-5-years', 'summary-5-7-years', 'summary-7-10-years', 'summary-10-12-years', 'learning-0-12-months', 'learning-1-3-years', 'learning-3-5-years', 'learning-5-7-years', 'learning-7-10-years', 'learning-10-12-years', 'routine-chart', 'calm-down-plan', 'family-rules'];
const PREFIXES = ['', '/zh-hant', '/en'];
// Page limits: every printable is a one-page sheet except the age finder (one sheet, both sides).
const MAX_PAGES = { 'age-finder': 2 };
// Chrome's PDFs keep the page tree uncompressed: the root /Pages node carries the page count.
const pageCount = (pdf) => Math.max(0, ...[...pdf.toString('latin1').matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g)].map((m) => Number(m[1] ?? m[2])));

function chromePath() {
  const candidates = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

async function pool(items, size, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

const { server, url } = await serve(dist);
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const ctx = await browser.newContext({ colorScheme: 'light', locale: 'zh-CN' });
let failures = 0;

// Open Graph images
const ogDir = join(dist, 'og-src');
if (existsSync(ogDir)) {
  const pages = await walk(ogDir);
  await mkdir(join(dist, 'og'), { recursive: true });
  await pool(pages, 4, async (file) => {
    const key = relative(ogDir, dirname(file));
    const page = await ctx.newPage();
    try {
      await page.setViewportSize({ width: 1200, height: 630 });
      await page.goto(`${url}/og-src/${key}/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: 'png' });
      const out = await sharp(png).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
      await writeFile(join(dist, 'og', `${key}.png`), out);
    } catch (err) {
      failures++;
      console.error(`OG ${key}: ${err.message}`);
    } finally {
      await page.close();
    }
  });
  await rm(ogDir, { recursive: true, force: true });
  console.log(`postbuild: ${pages.length} OG images`);
}

// Printable PDFs
const jobs = PREFIXES.flatMap((prefix) => PRINTABLES.map((slug) => ({ prefix, slug })));
await pool(jobs, 4, async ({ prefix, slug }) => {
  const page = await ctx.newPage();
  try {
    await page.goto(`${url}${prefix}/printables/${slug}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    // If a sheet runs over its page limit, shrink it slightly (never below 86%) until it fits.
    const max = MAX_PAGES[slug] ?? 1;
    let scale = 1;
    let pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, scale });
    while (pageCount(pdf) > max && scale > 0.87) {
      scale = Math.round((scale - 0.02) * 100) / 100;
      pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, scale });
    }
    const pages = pageCount(pdf);
    if (pages > max) throw new Error(`${pages} pages at ${Math.round(scale * 100)}% (limit ${max}); shorten the sheet`);
    if (scale < 1) console.log(`postbuild: ${prefix || '/'} ${slug} scaled to ${Math.round(scale * 100)}% to fit ${max} page(s)`);
    const outDir = join(dist, prefix.replace(/^\//, ''), 'printables');
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, `${slug}.pdf`), pdf);
  } catch (err) {
    failures++;
    console.error(`PDF ${prefix}/${slug}: ${err.message}`);
  } finally {
    await page.close();
  }
});
console.log(`postbuild: ${jobs.length} PDFs`);

await browser.close();
server.close();
if (failures) {
  console.error(`postbuild: ${failures} failure(s)`);
  process.exit(1);
}

// Built assets nothing links to: originals Astro copies alongside the resized images, variants
// only the (now removed) OG source pages used, images imported but not shown. A file stays if a
// page, stylesheet or script in the site refers to it, directly or through another kept file.
async function files(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await files(p, out);
    else out.push(p);
  }
  return out;
}
const astroDir = join(dist, '_astro');
if (existsSync(astroDir)) {
  const TEXT = /\.(html|css|js|mjs|json|xml|txt|svg|webmanifest)$/;
  const assets = new Map((await files(astroDir)).map((f) => [relative(astroDir, f).split('\\').join('/'), f]));
  const kept = new Set();
  let queue = [];
  for (const f of await files(dist)) if (!f.startsWith(astroDir) && TEXT.test(f)) queue.push(await readFile(f, 'utf8'));
  while (queue.length) {
    const text = queue.join('\n');
    queue = [];
    for (const [name, file] of assets) {
      if (kept.has(name) || !text.includes(name)) continue;
      kept.add(name);
      if (TEXT.test(name)) queue.push(await readFile(file, 'utf8'));
    }
  }
  let bytes = 0;
  const unused = [...assets].filter(([name]) => !kept.has(name));
  for (const [, file] of unused) {
    bytes += (await readFile(file)).length;
    await rm(file);
  }
  console.log(`postbuild: removed ${unused.length} unused built asset(s), ${(bytes / 1048576).toFixed(2)} MiB`);
}
