// The only script every page loads: theme toggle, language memory and the language
// suggestion banner. Storage access is wrapped because it can throw (private mode, blocked).
type Locale = 'zh-hans' | 'zh-hant' | 'en';
const LOCALE_KEY = 'wmj-locale';
const THEME_KEY = 'wmj-theme';

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

/** Best guess from the browser's language list; only used to suggest, never to redirect. */
function browserLocale(): Locale {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  const first = (langs[0] || 'en').toLowerCase();
  if (first.startsWith('zh')) {
    return /hant|-tw|-hk|-mo/.test(first) ? 'zh-hant' : 'zh-hans';
  }
  return 'en';
}

function initTheme() {
  const root = document.documentElement;
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button) return;
  const isDark = () =>
    root.dataset.theme === 'dark' || (!root.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const label = () => {
    button.setAttribute('aria-label', isDark() ? button.dataset.labelLight || '' : button.dataset.labelDark || '');
  };
  label();
  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    write(THEME_KEY, next);
    label();
  });
}

function initLocale() {
  const page = document.body.dataset.locale;
  if (!isLocale(page)) return;
  document.querySelectorAll<HTMLAnchorElement>('[data-set-locale]').forEach((a) => {
    a.addEventListener('click', () => {
      const l = a.dataset.setLocale ?? null;
      if (isLocale(l)) write(LOCALE_KEY, l);
    });
  });

  const banner = document.querySelector<HTMLElement>('[data-lang-banner]');
  if (!banner) return;
  const saved = read(LOCALE_KEY);
  const suggest = isLocale(saved) ? saved : browserLocale();
  if (suggest === page) return;
  const variant = banner.querySelector<HTMLElement>(`[data-banner-for="${suggest}"]`);
  if (!variant) return;
  variant.hidden = false;
  banner.hidden = false;
  variant.querySelector('[data-banner-dismiss]')?.addEventListener('click', () => {
    write(LOCALE_KEY, page);
    banner.hidden = true;
  });
}

function initMenu() {
  // Close the mobile menu after following an in-page link or pressing Escape.
  const menu = document.querySelector<HTMLDetailsElement>('details.menu');
  if (!menu) return;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
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

function initCjkFonts() {
  const root = document.documentElement;
  const lang = root.lang;
  if (!lang.startsWith('zh') || !('fonts' in document)) return;
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

export function initSite() {
  initTheme();
  initLocale();
  initMenu();
  initCjkFonts();
}
