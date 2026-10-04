// Loads content/sources.yml, the single record of every source the site cites.
// Every <Cite id="..."> must match an entry here; the build fails otherwise.
import YAML from 'yaml';
import { z } from 'astro/zod';
import raw from '../../content/sources.yml?raw';
import type { Locale } from '../i18n/locales';
import { STUDY_TYPES } from './site';

const localized = z.object({ en: z.string(), 'zh-hans': z.string(), 'zh-hant': z.string() });

const SourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  /** Evidence level: what kind of study or document this is (SPEC §6). */
  evidence_level: z.enum(STUDY_TYPES),
  authors: z.string(),
  year: z.union([z.number(), z.string()]).optional(),
  date: z.string().optional(),
  title: z.string(),
  title_en: z.string().optional(),
  venue: z.string(),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  url: z.string().url(),
  lang: z.enum(['en', 'zh-Hant', 'zh-Hans']),
  finding: localized,
  key_facts: z.array(z.string()).optional(),
  topics: z.array(z.string()).default([]),
  side: z.enum(['majority', 'minority', 'neutral']).optional(),
  /** Ages studied, as the abstract states them (research note for writers). */
  ages: z.string().optional(),
  /** How settled the finding is across the sources on the site: consistent, mixed, or one study. */
  strength: z.enum(['consistent', 'mixed', 'single-study']).optional(),
  accessed: z.union([z.string(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)),
  verified_via: z.string(),
  articles: z.array(z.object({ article: z.string(), text: z.string(), text_en: z.string().optional() })).optional(),
  status: z.string().optional(),
  status_checked: z.union([z.string(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)).optional(),
  phone: z.string().optional(),
  operator: z.string().optional(),
  hours: z.string().optional(),
  scope: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;

const parsed = z.array(SourceSchema).parse(YAML.parse(raw) ?? []);
const byId = new Map<string, Source>();
for (const s of parsed) {
  if (byId.has(s.id)) throw new Error(`Duplicate source id in content/sources.yml: ${s.id}`);
  byId.set(s.id, s);
}

export const SOURCES: readonly Source[] = parsed;

export function getSource(id: string): Source {
  const s = byId.get(id);
  if (!s) throw new Error(`Unknown source id "${id}". Add it to content/sources.yml (verified) or remove the citation.`);
  return s;
}

/** Citation ids in MDX source or frontmatter text, in order of first appearance.
 *  Matches <Cite id="..."> in MDX and [[cite:...]] in frontmatter strings. */
export function citeIdsIn(text: string | undefined): string[] {
  if (!text) return [];
  const ids: string[] = [];
  for (const m of text.matchAll(/<Cite\s+id=["']([^"']+)["']|\[\[cite:([a-z0-9-]+)\]\]/g)) {
    const id = m[1] ?? m[2];
    getSource(id);
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Everything in a content entry that can carry citations: frontmatter strings, then the body. */
export function entryText(entry: { body?: string; data: unknown } | undefined): string {
  if (!entry) return '';
  return `${JSON.stringify(entry.data)}\n${entry.body ?? ''}`;
}

/** Year label for a citation, e.g. "2016" or "2026, updated". */
export function yearOf(s: Source): string {
  return s.year !== undefined ? String(s.year) : 'n.d.';
}

export function sourceLink(s: Source): { href: string; label: string } {
  if (s.doi) return { href: `https://doi.org/${s.doi}`, label: `doi:${s.doi}` };
  const host = new URL(s.url).hostname.replace(/^www\./, '');
  return { href: s.url, label: host };
}

export const sourceAnchor = (id: string) => `src-${id}`;

/** Map a source's language tag to an HTML lang attribute. */
export const sourceLang = (s: Source) => s.lang;

export function findingFor(s: Source, locale: Locale): string {
  return s.finding[locale];
}
