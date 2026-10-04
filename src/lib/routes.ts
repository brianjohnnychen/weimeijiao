// URL helpers. All internal links go through these so every locale stays in step.
import { LOCALES, LOCALE_META, localizePath, splitLocale, type Locale } from '../i18n/locales';
import { SITE_URL, type Phase, type Printable, type Situation, type Tool } from './site';

export const paths = {
  home: () => '/',
  byAge: () => '/by-age/',
  phase: (p: Phase) => `/by-age/${p}/`,
  approach: () => '/approach/',
  edgeCases: () => '/approach/edge-cases/',
  littleTime: () => '/little-time/',
  learning: () => '/learning/',
  learningPhase: (p: Phase) => `/learning/${p}/`,
  toolbox: () => '/toolbox/',
  tool: (t: Tool) => `/toolbox/${t}/`,
  situations: () => '/situations/',
  situation: (s: Situation) => `/situations/${s}/`,
  physical: () => '/physical-discipline/',
  research: () => '/research/',
  printables: () => '/printables/',
  printable: (p: Printable) => `/printables/${p}/`,
  printablePdf: (p: Printable) => `/printables/${p}.pdf`,
  about: () => '/about/',
};

export const href = (locale: Locale, path: string) => localizePath(locale, path);

export const absolute = (pathWithPrefix: string) => new URL(pathWithPrefix, SITE_URL).href;

/** The same page in every locale, for the switcher, hreflang and the sitemap. */
export function alternates(pathname: string) {
  const { path } = splitLocale(pathname);
  return LOCALES.map((locale) => ({
    locale,
    lang: LOCALE_META[locale].lang,
    href: localizePath(locale, path),
    url: absolute(localizePath(locale, path)),
  }));
}

/** Path of the OG image generated for a page by scripts/postbuild.mjs. */
export function ogImagePath(pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return `/og/${clean ? clean.replace(/\//g, '--') : 'home'}.png`;
}
