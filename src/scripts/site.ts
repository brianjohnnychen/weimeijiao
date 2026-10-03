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

export function initSite() {
  initTheme();
  initLocale();
  initMenu();
}
