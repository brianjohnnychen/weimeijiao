// After `astro build`: render printable PDFs and Open Graph images with headless Chrome, then
// remove the OG source pages from the output. Chrome comes from CHROME_PATH (CI uses the
// runner's google-chrome) or the local Playwright Chromium.
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const PRINTABLES = ['age-finder', 'summary-0-12-months', 'summary-1-3-years', 'summary-3-5-years', 'summary-5-7-years', 'summary-7-10-years', 'learning-0-12-months', 'learning-1-3-years', 'learning-3-5-years', 'learning-5-7-years', 'learning-7-10-years', 'routine-chart', 'calm-down-plan', 'family-rules'];
const PREFIXES = ['', '/zh-hant', '/en'];

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
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
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
