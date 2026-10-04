// Keyboard navigation on the phone layout (375px) in all three locales, against the built site:
// the first Tab is the visible skip link and Enter on it focuses <main>; every header control
// (brand, language switcher, theme button, menu button) is reachable with a visible focus ring,
// with and without the language banner; the mobile menu opens with Enter, Tab moves into it,
// Escape closes it and returns focus; the theme button switches to dark and back; a table of
// contents link lands on its section; the photo lightbox opens with Enter, moves with the arrow
// keys, closes with Escape and returns focus; the age finder's radio groups work with arrow keys.
// (The UI check covers the same header checks at 1280px.)
//   node scripts/keyboard-test.mjs        (exit 1 if any check fails)
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chromePath = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
if (!chromePath) throw new Error('No Chrome found; set CHROME_PATH');
const { server, url } = await serve(join(root, 'dist'));
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const out = [];
const check = (cond, msg, extra = '') => out.push(`${cond ? 'ok  ' : 'FAIL'} ${msg}${extra ? ' :: ' + extra : ''}`);
// Reduced motion is deliberately not emulated here: the site's reduced-motion rule turns every
// transition into a 0.01 ms one, and a computed style read in that instant can miss the ring.
const describe = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return { name: '', visible: false, ring: false };
    const r = a.getBoundingClientRect();
    const s = getComputedStyle(a);
    const text = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 20);
    return {
      name: `${a.tagName.toLowerCase()}${a.className ? '.' + String(a.className).split(' ')[0] : ''}${text ? ` "${text}"` : ''}`,
      visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
      ring: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none',
    };
  });
const dark = (color) => (color.match(/\d+/g) ?? []).slice(0, 3).map(Number).reduce((s, n) => s + n, 0) < 200;
const LOCALES = [
  ['', 'zh-CN', 'en-US'],
  ['/zh-hant', 'zh-TW', 'en-US'],
  ['/en', 'en-US', 'zh-CN'],
];
for (const [pre, own, other] of LOCALES) {
  const name = pre || '/';
  // Header controls and the menu, with the browser in the page's language (no banner) and in another (banner shown first).
  for (const [label, locale] of [['no banner', own], ['with banner', other]]) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, locale });
    const page = await ctx.newPage();
    await page.goto(`${url}${pre}/approach/`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    const stops = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      stops.push(await describe(page));
      if (stops[stops.length - 1].name.startsWith('summary')) break;
    }
    const idx = stops.findIndex((s) => s.name.startsWith('summary'));
    check(idx > 0 && stops.every((s) => s.visible && s.ring), `${name} (${label}) header controls reachable, each stop visible with a focus ring`, stops.map((s) => `${s.name}${s.ring ? '' : ' NO RING'}${s.visible ? '' : ' OFFSCREEN'}`).join(' > '));
    if (label === 'with banner') check(stops.length > 1 && /btn/.test(stops[1].name), `${name} language banner controls come right after the skip link`, stops[1]?.name);
    if (idx > 0) {
      await page.keyboard.press('Enter');
      const opened = await page.$eval('details.menu', (d) => d.open);
      await page.keyboard.press('Tab');
      const inMenu = await page.evaluate(() => !!document.activeElement?.closest('details.menu nav'));
      const first = await describe(page);
      await page.keyboard.press('Escape');
      const closed = await page.$eval('details.menu', (d) => !d.open);
      const back = await describe(page);
      check(opened && inMenu && first.visible && closed && back.name.startsWith('summary') && back.ring, `${name} (${label}) menu: Enter opens, Tab enters, Escape closes and returns focus`, `opened=${opened} inMenu=${inMenu} firstVisible=${first.visible} closed=${closed} focus=${back.name}`);
    }
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: own });
  const page = await ctx.newPage();
  // Skip link
  await page.goto(`${url}${pre}/approach/`, { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  const skip = await describe(page);
  check(skip.name.startsWith('a.skip-link') && skip.visible && skip.ring, `${name} first Tab is the visible skip link`, skip.name);
  await page.keyboard.press('Enter');
  // The fragment navigation and the focus move land a moment after the key event; wait for them.
  const onMain = await page.waitForFunction(() => document.activeElement?.id === 'main', null, { timeout: 2000 }).then(() => true, () => false);
  check(onMain, `${name} Enter on the skip link focuses main`, await describe(page).then((d) => d.name));
  // Theme toggle
  await page.locator('[data-theme-toggle]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 2000 }).catch(() => {});
  const d1 = await page.evaluate(() => [document.documentElement.dataset.theme, getComputedStyle(document.body).backgroundColor, document.querySelector('[data-theme-toggle]').getAttribute('aria-label')]);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 2000 }).catch(() => {});
  const d2 = await page.evaluate(() => [document.documentElement.dataset.theme, getComputedStyle(document.body).backgroundColor]);
  check(d1[0] === 'dark' && dark(d1[1]) && d2[0] === 'light' && !dark(d2[1]), `${name} theme button switches to dark and back by keyboard`, `${d1.join(' | ')} -> ${d2.join(' | ')}`);
  // Table of contents link
  const toc = page.locator('.toc a').first();
  const href = await toc.getAttribute('href');
  await toc.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const top = await page.evaluate((id) => document.getElementById(id)?.getBoundingClientRect().top, href.slice(1));
  check(top !== undefined && top >= 0 && top < 220, `${name} table of contents link lands on its section by keyboard`, `${href} top=${Math.round(top)}px`);
  // Lightbox on About
  await page.goto(`${url}${pre}/about/`, { waitUntil: 'load' });
  await page.locator('.gallery-thumb').first().focus();
  await page.keyboard.press('Enter');
  const opened = await page.$eval('dialog.lightbox', (d) => d.open);
  const focusIn = await page.evaluate(() => !!document.activeElement?.closest('dialog.lightbox'));
  await page.keyboard.press('ArrowRight');
  const count = await page.$eval('.lb-count', (e) => e.textContent ?? '');
  await page.keyboard.press('Escape');
  const closed = await page.$eval('dialog.lightbox', (d) => !d.open);
  const returned = await page.evaluate(() => document.activeElement?.classList.contains('gallery-thumb'));
  check(opened && focusIn && /^2\b/.test(count.trim()) && closed && returned, `${name} lightbox: Enter opens, focus inside, arrow key moves, Escape closes, focus returns`, `opened=${opened} focusIn=${focusIn} count="${count.trim()}" closed=${closed} returned=${returned}`);
  // Age finder radios
  await page.goto(`${url}${pre}/printables/age-finder/`, { waitUntil: 'load' });
  await page.locator('fieldset input').first().focus();
  await page.keyboard.press('ArrowDown');
  const second = await page.evaluate(() => document.activeElement?.checked && document.activeElement === document.querySelectorAll('fieldset input')[1]);
  check(!!second, `${name} age finder radio groups work with the arrow keys`);
  await ctx.close();
}
console.log(out.join('\n'));
const passed = out.filter((l) => l.startsWith('ok')).length;
console.log(`\nKeyboard test: ${passed} of ${out.length} checks passed`);
await browser.close();
server.close();
process.exit(passed === out.length ? 0 : 1);
