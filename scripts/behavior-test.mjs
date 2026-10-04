// Interactive behaviour in all three locales, against the built site: the age finder's scoring
// (exact, in sixths of a point, compared with an independent count over random answer sets), its
// unanswered-question flow and result focus; the photo lightbox (no empty <img>, focus, scroll
// lock, closing); the toolbox age filter (live count, links to filtered-out tools); the language
// banner (browser language list, dismiss); the theme toggle; the language switcher keeping the
// #section; the no-JavaScript fallbacks; the 404 page; 320px reflow of the printables; dark-mode
// contrast on the white sheets; the mobile menu; the Research back link; the Mixed evidence link;
// and unique landmark names.
//   node scripts/behavior-test.mjs        (exit 1 if any check fails)
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
const PREFIX = ['', '/zh-hant', '/en'];
const ctxFor = (opts = {}) => browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'en-US', ...opts });
// Chinese pages switch to their web fonts after load and keep the reader's place by scrolling, so
// checks that measure positions wait for that switch first (as the anchor test does).
const open = async (page, target) => {
  await page.goto(target);
  await page
    .waitForFunction(() => !document.documentElement.lang.startsWith('zh') || document.documentElement.classList.contains('cjk-ready'), null, { timeout: 20000 })
    .catch(() => {});
};

// 1. Age finder: integer scoring, tie-break, 1.5-point rule; incomplete flow; result focus
for (const pre of PREFIX) {
  const ctx = await ctxFor();
  const page = await ctx.newPage();
  await open(page, `${url}${pre}/printables/age-finder/`);
  const qs = await page.$$eval('fieldset', (fss) => fss.map((fs) => [...fs.querySelectorAll('input')].map((i) => i.value)));
  const phases = await page.$eval('[data-quiz]', (f) => JSON.parse(f.dataset.phases));
  const order = Object.keys(phases);
  const byHref = Object.fromEntries(order.map((p) => [phases[p].href, p]));
  const expected = (ans) => {
    const s = Object.fromEntries(order.map((p) => [p, 0]));
    ans.forEach((a, qi) => { const ps = qs[qi][a].split(' '); for (const p of ps) s[p] += 6 / ps.length; });
    const r = [...order].sort((a, b) => s[b] - s[a] || order.indexOf(a) - order.indexOf(b));
    return { best: r[0], also: s[r[1]] > 0 && s[r[0]] - s[r[1]] <= 9 ? r[1] : null };
  };
  const run = (ans) => page.evaluate((ans) => {
    const form = document.querySelector('[data-quiz]');
    form.reset();
    [...form.querySelectorAll('fieldset')].forEach((fs, i) => { if (ans[i] !== undefined) fs.querySelectorAll('input')[ans[i]].checked = true; });
    form.requestSubmit();
    const r = document.querySelector('#result');
    return { links: [...r.querySelectorAll('a')].map((a) => a.getAttribute('href')), text: r.textContent, focusResult: document.activeElement === r, active: document.activeElement?.name ?? document.activeElement?.id, missing: document.querySelectorAll('fieldset.is-missing').length, notes: [...document.querySelectorAll('.quiz-missing')].filter((n) => !n.hidden).length, hidden: r.hidden };
  }, ans);
  const L = (s) => s.split(' ').map((c) => 'ABCDEF'.indexOf(c));
  let r = await run(L('A A A A B B A A C C'));
  check(byHref[r.links[0]] === '0-12-months' && byHref[r.links[1]] === '3-5-years', `${pre || '/'} age finder: exact 1.5-point gap shows "also" (AAAABBAACC)`, JSON.stringify(r.links));
  check(r.focusResult, `${pre || '/'} age finder: result gets focus`);
  r = await run(L('A A B A B C A B B C'));
  check(byHref[r.links[0]] === '1-3-years' && byHref[r.links[1]] === '3-5-years', `${pre || '/'} age finder: tie goes to the younger age (AABABCABBC)`, JSON.stringify(r.links));
  let bad = 0;
  for (let k = 0; k < 300; k++) {
    const ans = qs.map((opts) => Math.floor(Math.random() * opts.length));
    const e = expected(ans);
    const got = await run(ans);
    const gb = byHref[got.links[0]], ga = got.links[1] ? byHref[got.links[1]] : null;
    if (gb !== e.best || ga !== e.also) bad++;
  }
  check(bad === 0, `${pre || '/'} age finder: 300 random answer sets match exact scoring`, `${bad} mismatches`);
  r = await run([0, 0, 0, 0, 0, 0, 0]);
  check(r.missing === 3 && r.notes === 3 && r.active === 'q8' && !r.hidden && r.text.length > 5, `${pre || '/'} age finder: incomplete flags 3 questions and focuses q8`, JSON.stringify({ missing: r.missing, notes: r.notes, active: r.active }));
  const legendNum = await page.$eval('fieldset legend', (l) => getComputedStyle(l, '::before').content);
  check(/counter\(quiz\)/.test(legendNum), `${pre || '/'} age finder: question number drawn in the legend`, legendNum);
  const rows = await page.$$eval('.key-table tbody tr', (trs) => trs.map((tr) => tr.children.length));
  check(new Set(rows).size === 1, `${pre || '/'} age finder: key rows all have the same number of cells`, JSON.stringify(rows));
  const hint = await page.$eval('.print-actions .muted', (e) => e.textContent);
  check(/two|两|兩/i.test(hint), `${pre || '/'} age finder: print hint says two pages`, hint);
  await ctx.close();
}

// 2. Lightbox
for (const pre of PREFIX) {
  const ctx = await ctxFor();
  const page = await ctx.newPage();
  await open(page, `${url}${pre}/about/`);
  check((await page.$$('dialog.lightbox img')).length === 0, `${pre || '/'} lightbox: no <img> without a source before opening`);
  const thumbIsLink = await page.$eval('.gallery-thumb', (a) => a.tagName === 'A' && /\.webp$/.test(a.getAttribute('href')));
  check(thumbIsLink, `${pre || '/'} gallery: thumbnails link to the large photo`);
  await page.locator('.gallery-thumb').nth(2).scrollIntoViewIfNeeded();
  const y0 = await page.evaluate(() => scrollY);
  await page.locator('.gallery-thumb').nth(2).click();
  const st = await page.evaluate(() => ({ open: document.querySelector('dialog.lightbox').open, src: document.querySelector('dialog.lightbox img')?.getAttribute('src'), focus: document.activeElement?.className, overflow: getComputedStyle(document.documentElement).overflow, count: document.querySelector('.lb-count').textContent }));
  check(st.open && st.src && st.focus.includes('lb-close') && st.overflow === 'hidden', `${pre || '/'} lightbox: opens with photo, focus on Close, page scroll locked`, JSON.stringify(st));
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(200);
  const y1 = await page.evaluate(() => scrollY);
  check(Math.abs(y1 - y0) < 2, `${pre || '/'} lightbox: wheel does not scroll the page behind`, `${y0} -> ${y1}`);
  const capBox = await page.evaluate(() => { const c = document.querySelector('.lb-caption').getBoundingClientRect(); const n = document.querySelector('.lb-count').getBoundingClientRect(); return { capBottom: c.bottom, countTop: n.top }; });
  check(capBox.countTop >= capBox.capBottom - 1, `${pre || '/'} lightbox: count sits below the caption at 375px`, JSON.stringify(capBox));
  await page.mouse.click(30, 120);
  const closed = await page.evaluate(() => !document.querySelector('dialog.lightbox').open && document.activeElement?.classList.contains('gallery-thumb'));
  check(closed, `${pre || '/'} lightbox: click on the dark area closes it and focus returns to the thumbnail`);
  await ctx.close();
}

// 3. Toolbox filter: hidden target reset, live count
for (const pre of PREFIX) {
  const ctx = await ctxFor();
  const page = await ctx.newPage();
  await open(page, `${url}${pre}/toolbox/`);
  await page.click('button[data-age="0-12-months"]');
  const count = await page.$eval('.filter-count', (e) => e.textContent);
  check(/\d/.test(count), `${pre || '/'} toolbox: filter announces a count`, count);
  const target = await page.evaluate(() => {
    for (const card of document.querySelectorAll('.tool-card:not([hidden])')) {
      for (const a of card.querySelectorAll('.tool-related a[href^="#"]')) {
        const t = document.getElementById(a.getAttribute('href').slice(1));
        if (t?.hidden) { a.setAttribute('data-test-link', '1'); return t.id; }
      }
    }
    return null;
  });
  if (target) {
    await page.click('[data-test-link]');
    await page.waitForTimeout(400);
    const res = await page.evaluate((id) => { const t = document.getElementById(id); const b = t.getBoundingClientRect(); return { hidden: t.hidden, top: Math.round(b.top), all: document.querySelector('button[data-age="all"]').getAttribute('aria-pressed') }; }, target);
    check(!res.hidden && res.all === 'true' && res.top >= -5 && res.top < 300, `${pre || '/'} toolbox: link to a filtered-out tool shows all tools and lands on it`, JSON.stringify({ target, ...res }));
  } else check(false, `${pre || '/'} toolbox: no related link to a hidden card found to test`);
  await ctx.close();
}

// 4. Banner detection, dismiss
const langCtx = async (langs, path) => {
  const ctx = await ctxFor({ locale: langs[0] });
  await ctx.addInitScript((l) => { Object.defineProperty(navigator, 'languages', { get: () => l }); Object.defineProperty(navigator, 'language', { get: () => l[0] }); }, langs);
  const page = await ctx.newPage();
  await open(page, url + path);
  const shown = await page.evaluate(() => { const b = document.querySelector('[data-lang-banner]'); if (!b || b.hidden) return null; return b.querySelector('[data-banner-for]:not([hidden])')?.dataset.bannerFor; });
  return { ctx, page, shown };
};
{
  let t = await langCtx(['ja-JP', 'zh-TW', 'en-US'], '/');
  check(t.shown === 'zh-hant', 'banner: ja-JP, zh-TW, en-US on / suggests 繁體', String(t.shown));
  // dismiss
  await t.page.click('[data-banner-for="zh-hant"] [data-banner-dismiss]');
  const d = await t.page.evaluate(() => ({ hidden: document.querySelector('[data-lang-banner]').hidden, focus: document.activeElement?.id, locale: localStorage.getItem('wmj-locale'), closed: localStorage.getItem('wmj-banner-closed'), pad: document.body.style.paddingBottom }));
  check(d.hidden && d.focus === 'main' && d.locale === null && d.closed === 'zh-hant' && !d.pad, 'banner: dismiss moves focus to main, is not a language choice, clears the padding', JSON.stringify(d));
  await t.page.reload();
  const again = await t.page.evaluate(() => document.querySelector('[data-lang-banner]').hidden);
  check(again && t.page.url().endsWith('/'), 'banner: stays closed after reload and / does not redirect');
  await t.ctx.close();
  t = await langCtx(['zh-Hans-HK'], '/zh-hant/');
  check(t.shown === 'zh-hans', 'banner: zh-Hans-HK on /zh-hant/ suggests 简体', String(t.shown));
  await t.ctx.close();
  t = await langCtx(['fr-FR'], '/en/');
  check(t.shown == null, 'banner: fr-FR on /en/ shows nothing', String(t.shown));
  await t.ctx.close();
  t = await langCtx(['en-US'], '/');
  const pad = await t.page.evaluate(() => ({ pad: document.body.style.paddingBottom, bh: Math.ceil(document.querySelector('[data-lang-banner]').getBoundingClientRect().height) }));
  check(t.shown === 'en' && parseInt(pad.pad) === pad.bh, 'banner: en-US on / shows English banner and pads the page by its height', JSON.stringify(pad));
  await t.ctx.close();
}

// 5. Theme: system change listener, theme-color follows manual choice
{
  const ctx = await ctxFor({ colorScheme: 'light' });
  const page = await ctx.newPage();
  await open(page, `${url}/en/`);
  const l1 = await page.getAttribute('[data-theme-toggle]', 'aria-label');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(100);
  const l2 = await page.getAttribute('[data-theme-toggle]', 'aria-label');
  check(l1 !== l2, 'theme: label follows a system colour change', `${l1} -> ${l2}`);
  await page.click('[data-theme-toggle]');
  const metas = await page.$$eval('meta[name="theme-color"]', (ms) => ms.map((m) => m.content));
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  check(theme === 'light' && metas.every((c) => c === '#fffdf9'), 'theme: manual light choice sets the toolbar colour', JSON.stringify({ theme, metas }));
  await ctx.close();
}

// 6. Language switch keeps the section
{
  const ctx = await ctxFor();
  const page = await ctx.newPage();
  await open(page, `${url}/toolbox/#time-out`);
  await page.click('.lang-switch a[data-set-locale="en"]');
  await page.waitForLoadState('load');
  check(page.url().endsWith('/en/toolbox/#time-out'), 'language switcher carries the #section', page.url());
  await ctx.close();
}

// 7. No JS
{
  const ctx = await ctxFor({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${url}/en/printables/age-finder/`);
  const vis = await page.evaluate(() => ({ toggle: getComputedStyle(document.querySelector('[data-theme-toggle]')).display, print: getComputedStyle(document.querySelector('[data-print]')).display, quiz: getComputedStyle(document.querySelector('.quiz-actions')).display }));
  check(vis.toggle === 'none' && vis.print === 'none' && vis.quiz === 'none', 'no JS: theme toggle, Print and quiz buttons hidden', JSON.stringify(vis));
  await page.goto(`${url}/about/`);
  const href = await page.getAttribute('.gallery-thumb', 'href');
  const resp = await page.request.get(url + href);
  check(resp.ok() && resp.headers()['content-type'] === 'image/webp', 'no JS: gallery thumbnail opens the large photo', href);
  await page.goto(`${url}/`);
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  check(/Noto Sans SC/.test(font), 'no JS: Chinese pages use the self-hosted Noto stack', font);
  await ctx.close();
}

// 8. 404 with a saved language
{
  const ctx = await ctxFor();
  const page = await ctx.newPage();
  await open(page, `${url}/en/`);
  await page.evaluate(() => localStorage.setItem('wmj-locale', 'en'));
  await open(page, `${url}/en/no-such-page/`);
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => ({ path: location.pathname, banner: !!document.querySelector('[data-lang-banner]'), current: document.querySelectorAll('[aria-current="page"]').length }));
  check(st.path === '/en/no-such-page/' && !st.banner && st.current === 0, '404: no redirect, no banner, nothing marked current', JSON.stringify(st));
  await ctx.close();
}

// 9. Reflow at 320px
for (const p of ['/printables/routine-chart/', '/zh-hant/printables/routine-chart/', '/en/printables/routine-chart/', '/printables/age-finder/', '/zh-hant/printables/age-finder/', '/en/printables/age-finder/']) {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const page = await ctx.newPage();
  await open(page, url + p);
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  check(w <= 320, `320px: ${p} has no sideways scroll`, String(w));
  await ctx.close();
}

// 10. Dark mode sheet: table header contrast, focus colour
{
  const ctx = await ctxFor({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await open(page, `${url}/en/printables/routine-chart/`);
  const c = await page.evaluate(() => { const th = document.querySelector('.routine-table tbody th'); const cs = getComputedStyle(th); return { color: cs.color, bg: cs.backgroundColor, focus: getComputedStyle(document.querySelector('.sheet')).getPropertyValue('--focus').trim() }; });
  const lum = (rgb) => { const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const r = ratio(c.color, c.bg);
  check(r >= 4.5 && c.focus === '#1c4f58', 'dark mode: routine chart headers readable and focus ring dark on the white sheet', `${r.toFixed(2)}:1 ${JSON.stringify(c)}`);
  await ctx.close();
}

// 11. Menu closes when focus leaves it
for (const pre of PREFIX) {
  const ctx = await ctxFor();
  const page = await ctx.newPage();
  await open(page, `${url}${pre}/approach/`);
  await page.click('details.menu summary');
  const links = await page.$$('.menu-panel a');
  await links[links.length - 1].focus();
  await page.keyboard.press('Tab');
  const stillOpen = await page.evaluate(() => document.querySelector('details.menu').open);
  check(!stillOpen, `${pre || '/'} menu: closes when Tab moves past the last link`);
  await page.click('details.menu summary');
  await page.mouse.click(200, 700);
  const stillOpen2 = await page.evaluate(() => document.querySelector('details.menu').open);
  check(!stillOpen2, `${pre || '/'} menu: closes on a tap outside`);
  await ctx.close();
}

// 12. Research back link after a citation (new tab safe)
{
  const ctx = await ctxFor();
  const page = await ctx.newPage();
  await open(page, `${url}/en/toolbox/`);
  const cite = page.locator('sup.cite a').nth(5);
  const id = await cite.getAttribute('id');
  await cite.click();
  await page.waitForLoadState('load');
  const back = await page.evaluate(() => { const b = document.querySelector('[data-back]'); return { hidden: b.hidden, href: b.getAttribute('href') }; });
  check(!back.hidden && back.href === `/en/toolbox/#${id}`, 'research: back link returns to the exact citation marker', JSON.stringify(back));
  await ctx.close();
}

// 13. Mixed badge and landmarks
{
  const ctx = await ctxFor({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await open(page, `${url}/en/learning/0-12-months/`);
  const m = await page.$eval('a.mixed', (a) => a.getAttribute('href'));
  check(m === '/en/research/#evidence-levels', 'Mixed evidence badge links to its explanation', m);
  for (const p of ['/situations/', '/about/', '/approach/', '/en/', '/zh-hant/by-age/0-12-months/']) {
    await open(page, url + p);
    const lm = await page.evaluate(() => {
      const names = [...document.querySelectorAll('nav, aside, [role="navigation"], [role="complementary"], section[aria-label], section[aria-labelledby]')].map((e) => {
        const role = e.getAttribute('role') || (e.tagName === 'NAV' ? 'navigation' : e.tagName === 'ASIDE' ? 'complementary' : 'region');
        const lb = e.getAttribute('aria-labelledby');
        const name = e.getAttribute('aria-label') || (lb ? document.getElementById(lb)?.textContent.trim() : '') || '';
        return `${role}|${name}`;
      });
      const counts = {};
      for (const n of names) counts[n] = (counts[n] || 0) + 1;
      return Object.entries(counts).filter(([, c]) => c > 1);
    });
    check(lm.length === 0, `landmarks unique on ${p}`, JSON.stringify(lm));
  }
  await ctx.close();
}

await browser.close();
server.close();
console.log(out.join('\n'));
const failed = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\nBehavior test: ${out.length - failed} of ${out.length} checks passed`);
process.exit(failed ? 1 : 0);
