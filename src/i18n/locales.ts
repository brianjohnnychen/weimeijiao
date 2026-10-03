// Locale registry. Every page exists in all three locales at the same path, with a prefix
// for the non-default locales: / (zh-Hans), /zh-hant/ (zh-Hant), /en/ (en).
export const LOCALES = ['zh-hans', 'zh-hant', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'zh-hans';

interface LocaleMeta {
  /** BCP 47 tag for `lang` and `hreflang`. */
  lang: string;
  /** URL prefix, '' for the default locale. */
  prefix: string;
  /** Name of the language in that language. */
  label: string;
  /** Open Graph locale. */
  og: string;
  /** Self-hosted CJK font stylesheet, if any. */
  fontCss: string | null;
  /** Site name in this locale. */
  siteName: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  'zh-hans': { lang: 'zh-Hans', prefix: '', label: '简体中文', og: 'zh_CN', fontCss: '/fonts/sc.css', siteName: '魏美娇' },
  'zh-hant': { lang: 'zh-Hant', prefix: '/zh-hant', label: '繁體中文', og: 'zh_TW', fontCss: '/fonts/tc.css', siteName: '魏美嬌' },
  en: { lang: 'en', prefix: '/en', label: 'English', og: 'en_US', fontCss: null, siteName: 'Wei Mei Jiao' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** `lang` route param (undefined for the default locale) to a locale. */
export function localeFromParam(param: string | undefined): Locale {
  if (param === undefined) return DEFAULT_LOCALE;
  if (isLocale(param) && param !== DEFAULT_LOCALE) return param;
  throw new Error(`Unknown locale param: ${param}`);
}

/** The `lang` param for a locale in a `[...lang]` route. */
export function paramFromLocale(locale: Locale): string | undefined {
  return locale === DEFAULT_LOCALE ? undefined : locale;
}

/** Static paths for a page that exists once per locale. */
export function localeStaticPaths() {
  return LOCALES.map((locale) => ({ params: { lang: paramFromLocale(locale) }, props: { locale } }));
}

/** Prefix a site path (starting and ending with '/') for a locale. */
export function localizePath(locale: Locale, path: string): string {
  if (!path.startsWith('/')) throw new Error(`Path must start with '/': ${path}`);
  return `${LOCALE_META[locale].prefix}${path}`;
}

/** Split a pathname into its locale and the locale-neutral path. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  for (const locale of LOCALES) {
    const prefix = LOCALE_META[locale].prefix;
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      const rest = pathname.slice(prefix.length) || '/';
      return { locale, path: rest };
    }
  }
  return { locale: DEFAULT_LOCALE, path: pathname || '/' };
}
