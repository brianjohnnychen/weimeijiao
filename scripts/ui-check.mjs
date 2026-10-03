// UI check over the built site (dist/) in headless Chrome, all three locales:
//   - screenshots of the first screen at 375px and 1280px (light) and 375px (dark) to docs/screenshots/
//   - every listed page, full height: no horizontal overflow, no console errors, no broken images
//   - keyboard: the first Tab lands on a visible skip link; Tab moves through header controls
//     with a visible focus indicator; Enter on the skip link moves focus to <main>
//   - dark mode: the page background really is dark when the system prefers dark
//   node scripts/ui-check.mjs            (writes docs/screenshots/*.jpg and docs/screenshots/ui-check.md)
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'screenshots');
const chromePath = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
if (!chromePath) throw new Error('No Chrome found; set CHROME_PATH');

const PAGES = [
  ['home', '/'],
  ['by-age', '/by-age/'],
  ['phase-1-3', '/by-age/1-3-years/'],
  ['approach', '/approach/'],
  ['toolbox', '/toolbox/'],
  ['situations', '/situations/'],
  ['little-time', '/little-time/'],
  ['physical', '/physical-discipline/'],
  ['learning', '/learning/'],
  ['learning-5-7', '/learning/5-7-years/'],
  ['research', '/research/'],
  ['printables', '/printables/'],
  ['age-finder', '/printables/age-finder/'],
  ['about', '/about/'],
];
const LOCALES = [
  ['zh-hans', ''],
  ['zh-hant', '/zh-hant'],
  ['en', '/en'],
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const { server, url } = await serve(join(root, 'dist'));
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const rows = [];
const problems = [];

async function check(locale, name, path, width, scheme) {
  // Browser language matches the page, as for a typical reader (so the "also available in" banner stays hidden).
  const browserLocale = { 'zh-hans': 'zh-CN', 'zh-hant': 'zh-TW', en: 'en-US' }[locale];
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: 'reduce', locale: browserLocale });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  const external = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(url) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
  });
  await page.goto(url + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = `${locale}-${name}-${width}${scheme === 'dark' ? '-dark' : ''}.jpg`;
  await page.screenshot({ path: join(outDir, file), type: 'jpeg', quality: 70 });
  const info = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed';
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].join('.')}`);
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.closest('dialog')).map((i) => i.currentSrc || i.src);
    const bg = getComputedStyle(document.body).backgroundColor;
    return { overflow, wide, broken, bg };
  });
  const lum = (() => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(info.bg);
    if (!m) return null;
    return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
  })();
  const issues = [];
  if (info.overflow > 0) issues.push(`horizontal overflow ${info.overflow}px (${info.wide.join(', ')})`);
  if (errors.length) issues.push(`console: ${errors.slice(0, 3).join(' | ')}`);
  if (info.broken.length) issues.push(`broken images: ${info.broken.slice(0, 3).join(', ')}`);
  if (external.length) issues.push(`third-party requests: ${external.slice(0, 3).join(', ')}`);
  if (scheme === 'dark' && lum !== null && lum > 0.3) issues.push(`dark mode background is light (${info.bg})`);
  if (scheme === 'light' && lum !== null && lum < 0.7) issues.push(`light mode background is dark (${info.bg})`);

  // Keyboard, once per page at desktop width in light mode.
  let keys = '';
  if (width === 1280 && scheme === 'light') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    const first = await page.evaluate(() => {
      const a = document.activeElement;
      const r = a.getBoundingClientRect();
      return { cls: a.className, href: a.getAttribute('href'), visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight };
    });
    if (!(first.href === '#main' && first.visible)) issues.push(`first Tab is not a visible skip link (${JSON.stringify(first)})`);
    let noRing = 0;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(150);
      const ring = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return true;
        const s = getComputedStyle(a);
        return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
      });
      if (!ring) noRing++;
    }
    if (noRing) issues.push(`${noRing} of 6 header controls had no visible focus indicator`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.focus('a.skip-link');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const onMain = await page.evaluate(() => document.activeElement?.id === 'main');
    if (!onMain) issues.push('skip link does not move focus to main');
    keys = issues.some((s) => /Tab|focus|skip/.test(s)) ? 'issues' : 'ok';
  }
  await ctx.close();
  rows.push({ locale, name, width, scheme, file, keys, issues });
  if (issues.length) problems.push(`${locale} ${name} ${width}${scheme === 'dark' ? ' dark' : ''}: ${issues.join('; ')}`);
}

for (const [locale, prefix] of LOCALES) {
  for (const [name, path] of PAGES) {
    await check(locale, name, prefix + path, 375, 'light');
    await check(locale, name, prefix + path, 1280, 'light');
    await check(locale, name, prefix + path, 375, 'dark');
  }
}
await browser.close();
server.close();

const when = new Date().toISOString().replace('T', ' ').slice(0, 16);
const md = [
  `# UI check (${when} UTC)`,
  '',
  `${rows.length} page views: ${PAGES.length} pages x 3 locales x (375px light, 1280px light, 375px dark). Screenshots show the first screen; overflow, console, image and request checks cover the whole page.`,
  '',
  problems.length ? `## Problems (${problems.length})\n\n${problems.map((p) => `- ${p}`).join('\n')}` : '## Problems\n\nNone.',
  '',
  '## Views',
  '',
  '| Locale | Page | Width | Scheme | Keyboard | Result | Screenshot |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.locale} | ${r.name} | ${r.width} | ${r.scheme} | ${r.keys || '-'} | ${r.issues.length ? 'issues' : 'ok'} | [${r.file}](${r.file}) |`),
  '',
];
await writeFile(join(outDir, 'ui-check.md'), md.join('\n'));
console.log(problems.length ? problems.join('\n') : 'UI check: no problems');
console.log(`Wrote ${rows.length} screenshots and docs/screenshots/ui-check.md`);
process.exit(problems.length ? 1 : 0);
