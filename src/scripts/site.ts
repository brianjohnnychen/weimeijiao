// The only script every page loads: theme toggle, language memory and the language
// suggestion banner. Storage access is wrapped because it can throw (private mode, blocked).
type Locale = 'zh-hans' | 'zh-hant' | 'en';
const LOCALE_KEY = 'wmj-locale';
const THEME_KEY = 'wmj-theme';
/** Which suggestion the visitor closed. Closing the banner is not a language choice. */
const BANNER_KEY = 'wmj-banner-closed';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the choice just won't be remembered */
  }
}

function isLocale(v: string | null): v is Locale {
  return v === 'zh-hans' || v === 'zh-hant' || v === 'en';
}

/** The site locale a browser language tag maps to; the script subtag wins over the region. */
function localeOfTag(tag: string): Locale | null {
  const t = tag.toLowerCase();
  if (t === 'zh' || t.startsWith('zh-')) {
    if (/-hant(-|$)/.test(t)) return 'zh-hant';
    if (/-hans(-|$)/.test(t)) return 'zh-hans';
    return /-(tw|hk|mo)(-|$)/.test(t) ? 'zh-hant' : 'zh-hans';
  }
  return t === 'en' || t.startsWith('en-') ? 'en' : null;
}

/** Best guess from the browser's whole language list (first supported language wins); only
 *  used to suggest, never to redirect. Visitors who read none of the three get English. */
function browserLocale(): Locale {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  for (const tag of langs) {
    const l = localeOfTag(tag || '');
    if (l) return l;
  }
  return 'en';
}

function initTheme() {
  const root = document.documentElement;
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button) return;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => root.dataset.theme === 'dark' || (!root.dataset.theme && system.matches);
  // The browser's toolbar colour follows a manual choice too, not only the system setting.
  const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
  const colors = metas.map((m) => m.content);
  const darkColor = metas.find((m) => m.media.includes('dark'))?.content;
  const lightColor = metas.find((m) => !m.media.includes('dark'))?.content;
  const sync = () => {
    button.setAttribute('aria-label', isDark() ? button.dataset.labelLight || '' : button.dataset.labelDark || '');
    const chosen = root.dataset.theme;
    metas.forEach((m, i) => {
      m.content = (chosen === 'dark' ? darkColor : chosen === 'light' ? lightColor : colors[i]) ?? colors[i];
    });
  };
  sync();
  system.addEventListener?.('change', sync);
  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    write(THEME_KEY, next);
    sync();
  });
}

function initLocale() {
  const page = document.body.dataset.locale;
  if (!isLocale(page)) return;
  document.querySelectorAll<HTMLAnchorElement>('[data-set-locale]').forEach((a) => {
    a.addEventListener('click', () => {
      const l = a.dataset.setLocale ?? null;
      if (isLocale(l)) write(LOCALE_KEY, l);
      // Section ids are the same in every language, so switching keeps the reader's place.
      if (location.hash.length > 1 && !a.hash) a.hash = location.hash;
    });
  });

  const banner = document.querySelector<HTMLElement>('[data-lang-banner]');
  if (!banner) return;
  const saved = read(LOCALE_KEY);
  const suggest = isLocale(saved) ? saved : browserLocale();
  if (suggest === page || read(BANNER_KEY) === suggest) return;
  const variant = banner.querySelector<HTMLElement>(`[data-banner-for="${suggest}"]`);
  if (!variant) return;
  variant.hidden = false;
  banner.hidden = false;
  // The banner is fixed to the bottom of the screen: reserve its height so it never covers the
  // end of the page or a focused link. A ResizeObserver reports the height once the browser has
  // laid the page out anyway (no forced layout while the page loads) and again whenever it changes.
  const reserve = (height: number) => {
    const h = banner.hidden ? 0 : Math.ceil(height);
    document.body.style.paddingBottom = h ? `${h}px` : '';
    document.documentElement.style.scrollPaddingBottom = h ? `${h}px` : '';
    document.documentElement.style.setProperty('--banner-h', `${h}px`);
  };
  const measure = () => reserve(banner.getBoundingClientRect().height);
  if ('ResizeObserver' in window) {
    new ResizeObserver((entries) => reserve(entries[0].borderBoxSize?.[0]?.blockSize ?? entries[0].contentRect.height)).observe(banner);
  } else {
    measure();
    window.addEventListener('resize', measure);
  }
  variant.querySelector('[data-banner-dismiss]')?.addEventListener('click', () => {
    write(BANNER_KEY, suggest);
    banner.hidden = true;
    reserve(0);
    // The focused button is gone: continue from the page content instead of the top of the document.
    document.getElementById('main')?.focus({ preventScroll: true });
  });
}

function initMenu() {
  // Close the mobile menu on Escape, when focus moves out of it (so it never hides the focused
  // element) and on a tap or click outside it.
  const menu = document.querySelector<HTMLDetailsElement>('details.menu');
  if (!menu) return;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
  menu.addEventListener('focusout', (e) => {
    const next = (e as FocusEvent).relatedTarget as Node | null;
    if (menu.open && next && !menu.contains(next)) menu.open = false;
  });
  document.addEventListener('pointerdown', (e) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
  });
}

/**
 * Chinese pages: the self-hosted Noto faces come in many small unicode-range slices. Letting
 * each slice swap in as it arrives re-lays out the page dozens of times on a phone. Instead,
 * text first shows in the system CJK font; we ask the browser for exactly the slices this page
 * needs, then switch to Noto in one step (html.cjk-ready). Without JS, a <noscript> style
 * applies the Noto stacks directly.
 */
/** Run a change that reflows the page (the font switch) without moving what the reader is
 *  looking at: the deep-link target if it is on screen, otherwise the element at the top of the
 *  viewport, keeps its position. Native scroll anchoring is paused meanwhile so the two do not
 *  both correct. */
function keepPlace(change: () => void) {
  const root = document.documentElement;
  const headerBottom = Math.max(0, document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0);
  let anchor: Element | null = null;
  if (location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const box = target?.getBoundingClientRect();
    if (target && box && box.bottom > headerBottom && box.top < window.innerHeight) anchor = target;
  }
  if (!anchor && window.scrollY > 0) anchor = document.elementFromPoint(window.innerWidth / 2, headerBottom + 4);
  const before = anchor?.getBoundingClientRect().top;
  root.style.overflowAnchor = 'none';
  change();
  if (anchor && before !== undefined) {
    const shift = anchor.getBoundingClientRect().top - before;
    if (Math.abs(shift) >= 1) window.scrollBy(0, shift);
  }
  root.style.overflowAnchor = '';
}

/** Data saver on, or a 2G/3G-class connection: the system fonts stay (the Noto slices run 1-2 MB). */
function lightData(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (c.saveData === true || /(^|-)(2g|3g)$/.test(c.effectiveType ?? ''));
}

function initCjkFonts() {
  const root = document.documentElement;
  const lang = root.lang;
  if (!lang.startsWith('zh') || !('fonts' in document) || lightData()) return;
  const tc = lang === 'zh-Hant';
  const sans = tc ? 'Noto Sans TC' : 'Noto Sans SC';
  const serif = tc ? 'Noto Serif TC' : 'Noto Serif SC';
  const ready = () => keepPlace(() => root.classList.add('cjk-ready'));
  const link = document.querySelector<HTMLLinkElement>('link[data-cjk-css]');
  const cssLoaded = new Promise<void>((resolve) => {
    if (!link || link.rel === 'stylesheet') return resolve();
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => resolve(), { once: true });
  });
  const textOf = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)].map((e) => e.textContent ?? '').join('');
  // The page first renders with the system's Chinese fonts. The Noto slices it needs are fetched
  // only once the page has loaded and the browser is idle, so they never compete with first paint,
  // and the page switches in one step when all of them have arrived. If that takes longer than
  // 10 seconds the page keeps the system fonts (the slices stay cached for the next page).
  const start = () =>
    cssLoaded
      .then(() => {
        const body = document.body.textContent ?? '';
        const heads = textOf('h1, h2, h3, h4, .brand-name, .card-title, .core-idea, .phase-tile .age');
        const bold = textOf('strong, b, th, dt, legend, summary, .btn, .nav-link[aria-current], .eyebrow, .chip, .tool-head h2, .say-context');
        return Promise.race([
          Promise.all([document.fonts.load(`400 16px "${sans}"`, body), document.fonts.load(`700 16px "${sans}"`, bold || '中'), document.fonts.load(`600 16px "${serif}"`, heads || '中')]).then(() => true),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10000)),
        ]);
      })
      .then((loaded) => loaded && requestAnimationFrame(ready), () => {});
  const idle = () => ('requestIdleCallback' in window ? window.requestIdleCallback(() => start(), { timeout: 3000 }) : setTimeout(start, 1000));
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

/** Remember which citation marker was followed, so the Research page can link back to it. */
function initCiteMemory() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('sup.cite a') as HTMLAnchorElement | null;
    if (!a?.id || !a.hash.startsWith('#src-')) return;
    try {
      sessionStorage.setItem('wmj-cite-back', JSON.stringify({ from: `${location.pathname}#${a.id}`, src: decodeURIComponent(a.hash.slice(5)) }));
    } catch {}
  });
}

export function initSite() {
  initTheme();
  initLocale();
  initMenu();
  initCjkFonts();
  initCiteMemory();
}
