// Typed access to the per-locale content collections, with a parity check: every slug the
// site defines must exist in every locale, or the build fails.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { LOCALES, type Locale } from '../i18n/locales';
import { PHASES, SITUATIONS, TOOLS } from './site';

type Collection = 'phases' | 'learning' | 'tools' | 'situations' | 'pages';

async function entry<C extends Collection>(collection: C, locale: Locale, slug: string): Promise<CollectionEntry<C>> {
  const e = await getEntry(collection, `${locale}/${slug}`);
  if (!e) throw new Error(`Missing content: src/content/${locale}/${collection}/${slug}.mdx`);
  return e as CollectionEntry<C>;
}

export const getPhase = (locale: Locale, slug: string) => entry('phases', locale, slug);
export const getLearning = (locale: Locale, slug: string) => entry('learning', locale, slug);
export const getTool = (locale: Locale, slug: string) => entry('tools', locale, slug);
export const getSituation = (locale: Locale, slug: string) => entry('situations', locale, slug);
export const getPage = (locale: Locale, slug: string) => entry('pages', locale, slug);

export async function getPhases(locale: Locale) {
  return Promise.all(PHASES.map((p) => getPhase(locale, p)));
}
export async function getLearningPhases(locale: Locale) {
  return Promise.all(PHASES.map((p) => getLearning(locale, p)));
}
export async function getTools(locale: Locale) {
  return Promise.all(TOOLS.map((t) => getTool(locale, t)));
}
export async function getSituations(locale: Locale) {
  return Promise.all(SITUATIONS.map((s) => getSituation(locale, s)));
}

let parityChecked = false;
/** Fails the build if any locale is missing a page or has one the others lack. */
export async function assertParity() {
  if (parityChecked) return;
  for (const collection of ['phases', 'learning', 'tools', 'situations', 'pages'] as const) {
    const all = await getCollection(collection);
    const slugsBy = new Map<Locale, Set<string>>(LOCALES.map((l) => [l, new Set()]));
    for (const e of all) {
      const [locale, slug] = e.id.split('/');
      if (!slugsBy.has(locale as Locale)) throw new Error(`Content in unknown locale folder: ${e.id}`);
      slugsBy.get(locale as Locale)!.add(slug);
    }
    const union = new Set([...slugsBy.values()].flatMap((s) => [...s]));
    for (const [locale, slugs] of slugsBy) {
      const missing = [...union].filter((s) => !slugs.has(s));
      if (missing.length) throw new Error(`Locale ${locale} is missing ${collection}: ${missing.join(', ')}`);
    }
  }
  parityChecked = true;
}
