// Deep links land on their target. The link test proves every #anchor exists; this proves the
// browser actually scrolls there: long pages skip layout for off-screen blocks (content-visibility),
// which must not leave a deep-linked target out of view. For a sample of anchors of every kind
// (headings, citation markers inside paragraphs, tool and situation cards, sections inside a card,
// bibliography entries) in all three locales, it opens the page at #id in a fresh tab at 375px and
// 1280px and checks the target sits at the top of the viewport, just below the sticky header.
//   node scripts/anchor-test.mjs        (exit 1 if any target is out of place)
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chromePath = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
if (!chromePath) throw new Error('No Chrome found; set CHROME_PATH');

const TARGETS = [
  '/approach/#refuses-time-out',
  '/by-age/3-5-years/#cite-kaminski-2008-1',
  '/toolbox/#problem-solving',
  '/research/#src-white-1972',
  '/sources/#src-pinquart-2017-externalizing',
  '/zh-hant/by-age/10-12-years/#knowing',
  '/en/approach/#preteens',
  '/zh-hant/physical-discipline/#instead',
  '/zh-hant/situations/#homework',
  '/zh-hant/little-time/#short-time-out',
  '/en/toolbox/#time-out',
  '/en/toolbox/#time-out-how',
  '/en/situations/#bedtime-prevent',
  '/en/research/#src-zubler-2022',
  '/en/learning/7-10-years/#cite-roediger-karpicke-2006-1',
  '/en/physical-discipline/#warning-signs',
];

const { server, url } = await serve(join(root, 'dist'));
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
let bad = 0;
for (const width of [375, 1280]) {
  for (const target of TARGETS) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    await page.goto(url + target, { waitUntil: 'load' });
    // Chinese pages switch to the web fonts after load; measure once that has happened (or given up).
    await page.waitForFunction(() => !document.documentElement.lang.startsWith('zh') || document.documentElement.classList.contains('cjk-ready'), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    const id = decodeURIComponent(target.split('#')[1]);
    const box = await page.evaluate((id) => {
      const el = document.getElementById(id);
      const header = document.querySelector('.site-header');
      if (!el) return null;
      // Where the visible part of the header ends (0 when the header has scrolled away).
      return { top: Math.round(el.getBoundingClientRect().top), header: Math.max(0, Math.round(header?.getBoundingClientRect().bottom ?? 0)) };
    }, id);
    // The target's top edge must be below whatever is left of the header, within 200px of it.
    const ok = box && box.top >= box.header - 2 && box.top <= box.header + 200;
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${width}px ${target}${box ? ` (top ${box.top}px, header ends ${box.header}px)` : ' (target not found)'}`);
    await page.close();
  }
}
await browser.close();
server.close();
console.log(bad ? `Anchor test: ${bad} target(s) out of place` : `Anchor test: all ${TARGETS.length * 2} targets in place`);
process.exit(bad ? 1 : 0);
