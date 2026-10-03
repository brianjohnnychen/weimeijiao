// Citations. Markers use one site-wide numbering (the order of the Research page bibliography),
// link to the exact entry on the Research page (#src-<id>), and every bibliography entry links
// back to each place it is cited (#cite-<id>-1 on that page).
import { getCollection } from 'astro:content';
import { SOURCES, citeIdsIn, entryText, getSource, type Source } from './sources';
import type { Locale } from '../i18n/locales';
import { TOOLS, SITUATIONS, PHASES } from './site';
import { href, paths } from './routes';
import { t, withColon, inBrackets, phaseLabel as phaseLabelFor } from '../i18n/ui';

/** Research page sections, in display order. A source goes in the first section whose topic it has. */
export const RESEARCH_GROUPS = [
  { key: 'programs', topics: ['parenting-programs', 'connection'] },
  { key: 'techniques', topics: ['praise', 'instructions', 'ignoring', 'consequences', 'time-out', 'time-in', 'response-cost', 'problem-solving', 'choices', 'repair'] },
  { key: 'physical', topics: ['physical-punishment', 'harsh-verbal', 'culture'] },
  { key: 'development', topics: ['development', 'milestones', 'infant-crying', 'safety', 'tantrums', 'aggression', 'self-regulation', 'when-to-get-help', 'lying', 'siblings', 'coparenting', 'grandparents', 'neurodevelopment'] },
  { key: 'everyday', topics: ['sleep', 'routines', 'screens', 'mealtime', 'homework'] },
  { key: 'learning', topics: ['language', 'reading', 'play', 'motivation', 'praise-learning', 'mindset', 'executive-function', 'numeracy', 'study-skills', 'school'] },
] as const;
export type ResearchGroupKey = (typeof RESEARCH_GROUPS)[number]['key'];

export function groupOf(s: Source): ResearchGroupKey {
  for (const g of RESEARCH_GROUPS) {
    if (s.topics.some((t) => (g.topics as readonly string[]).includes(t))) return g.key;
  }
  return 'development';
}

const sortKey = (s: Source) => `${s.authors.toLowerCase()} ${String(s.year ?? '')}`;

// Every source cited anywhere in the content. The Research page lists these and only these:
// sources.yml may also hold verified sources that no page cites, and they stay off the page.
const CONTENT = import.meta.glob<string>('/src/content/**/*.{md,mdx}', { query: '?raw', import: 'default', eager: true });
const CITED = new Set(Object.values(CONTENT).flatMap((text) => citeIdsIn(text)));

/** All cited sources in bibliography order, grouped. */
export const BIBLIOGRAPHY: { key: ResearchGroupKey; sources: Source[] }[] = RESEARCH_GROUPS.map((g) => ({
  key: g.key,
  sources: SOURCES.filter((s) => CITED.has(s.id) && groupOf(s) === g.key).sort((a, b) => sortKey(a).localeCompare(sortKey(b))),
})).filter((g) => g.sources.length > 0);

const ORDER = BIBLIOGRAPHY.flatMap((g) => g.sources.map((s) => s.id));

/** Site-wide citation number for a source. */
export function citeNumber(id: string): number {
  const n = ORDER.indexOf(id) + 1;
  if (!n) {
    getSource(id);
    throw new Error(`Source ${id} is not in the bibliography order`);
  }
  return n;
}

export const researchHref = (locale: Locale, id: string) => `${href(locale, paths.research())}#src-${id}`;

/** One page that cites sources: its path, its label, and the MDX bodies it renders, in order. */
interface CitingPage {
  path: string;
  label: string;
  bodies: (string | undefined)[];
}

async function citingPages(locale: Locale): Promise<CitingPage[]> {
  const byId = async <C extends 'phases' | 'learning' | 'tools' | 'situations' | 'pages'>(collection: C) =>
    new Map((await getCollection(collection)).filter((e) => e.id.startsWith(`${locale}/`)).map((e) => [e.id.split('/')[1], e]));
  const [phases, learning, tools, situations, pages] = await Promise.all([
    byId('phases'),
    byId('learning'),
    byId('tools'),
    byId('situations'),
    byId('pages'),
  ]);
  const title = (slug: string) => (pages.get(slug)?.data as { title?: string } | undefined)?.title ?? slug;
  const ui = t(locale);
  const phaseLabel = (p: (typeof PHASES)[number]) => phaseLabelFor(locale, p);
  const list: CitingPage[] = [];
  // Only what each page actually renders: phase and learning pages show `start` and the body;
  // their `summary` lists appear on the printable one-pagers instead.
  const startAndBody = (e: { body?: string; data: unknown } | undefined) =>
    e ? [JSON.stringify((e.data as { start?: unknown }).start ?? []), e.body ?? ''] : [];
  const summaryOf = (e: { data: unknown } | undefined) => (e ? [JSON.stringify((e.data as { summary?: unknown }).summary ?? {})] : []);
  for (const p of PHASES) {
    const e = phases.get(p);
    list.push({ path: paths.phase(p), label: `${ui.nav.byAge}: ${phaseLabel(p)}`, bodies: startAndBody(e) });
  }
  list.push({ path: paths.approach(), label: title('approach'), bodies: [entryText(pages.get('approach'))] });
  list.push({ path: paths.toolbox(), label: title('toolbox'), bodies: [entryText(pages.get('toolbox')), ...TOOLS.map((t) => entryText(tools.get(t)))] });
  list.push({ path: paths.situations(), label: title('situations'), bodies: [entryText(pages.get('situations')), ...SITUATIONS.map((s) => entryText(situations.get(s)))] });
  list.push({ path: paths.littleTime(), label: title('little-time'), bodies: [entryText(pages.get('little-time'))] });
  list.push({ path: paths.physical(), label: title('physical-discipline'), bodies: [entryText(pages.get('physical-discipline'))] });
  for (const p of PHASES) {
    const e = learning.get(p);
    list.push({ path: paths.learningPhase(p), label: `${ui.nav.learning}: ${phaseLabel(p)}`, bodies: startAndBody(e) });
  }
  for (const p of PHASES) {
    list.push({ path: paths.printable(`summary-${p}` as const), label: withColon(locale, ui.nav.printables, `${ui.phase.printable}${locale === 'en' ? ' ' : ''}${inBrackets(locale, ui.phaseAge[p])}`), bodies: summaryOf(phases.get(p)) });
    list.push({ path: paths.printable(`learning-${p}` as const), label: withColon(locale, ui.nav.printables, `${ui.learning.printable}${locale === 'en' ? ' ' : ''}${inBrackets(locale, ui.phaseAge[p])}`), bodies: summaryOf(learning.get(p)) });
  }
  for (const slug of ['age-finder', 'routine-chart', 'calm-down-plan', 'family-rules'] as const) {
    const e = pages.get(slug);
    if (e) list.push({ path: paths.printable(slug), label: `${ui.nav.printables}: ${title(slug)}`, bodies: [e.body, slug === 'age-finder' ? JSON.stringify((e.data as { questions?: unknown }).questions ?? []) : ''] });
  }
  for (const slug of ['home', 'by-age', 'learning', 'about', 'printables']) {
    const e = pages.get(slug);
    if (e) list.push({ path: slug === 'home' ? '/' : `/${slug}/`, label: title(slug), bodies: [entryText(e)] });
  }
  return list;
}

const citedInCache = new Map<Locale, Map<string, { href: string; label: string }[]>>();

/** For each source id, the pages (in this locale) that cite it, linking to the first marker. */
export async function citedIn(locale: Locale): Promise<Map<string, { href: string; label: string }[]>> {
  const cached = citedInCache.get(locale);
  if (cached) return cached;
  const map = new Map<string, { href: string; label: string }[]>();
  for (const page of await citingPages(locale)) {
    const ids = new Set(page.bodies.flatMap((b) => citeIdsIn(b)));
    for (const id of ids) {
      const arr = map.get(id) ?? [];
      arr.push({ href: `${href(locale, page.path)}#cite-${id}-1`, label: page.label });
      map.set(id, arr);
    }
  }
  citedInCache.set(locale, map);
  return map;
}

/** Ids cited across a page's bodies, sorted by site-wide number (for the page's source list). */
export function pageSources(bodies: (string | undefined)[]): string[] {
  const ids = new Set(bodies.flatMap((b) => citeIdsIn(b)));
  return [...ids].sort((a, b) => citeNumber(a) - citeNumber(b));
}
