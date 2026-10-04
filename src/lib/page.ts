// Per-page setup shared by the route files.
import type { Locale } from '../i18n/locales';

/** Must run in a page's frontmatter before any MDX renders (citation markers read it). */
export function setupCites(locals: App.Locals, locale: Locale, mode: 'link' | 'bibliography' = 'link') {
  locals.cites = { locale, mode, seen: {} };
}

/** h2/h3 headings with explicit ids in an MDX body, for "On this page" lists. */
export function headingsIn(body: string | undefined, levels: number[] = [2]): { depth: number; id: string; text: string }[] {
  if (!body) return [];
  const out: { depth: number; id: string; text: string }[] = [];
  for (const m of body.matchAll(/<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)) {
    const depth = Number(m[1]);
    if (!levels.includes(depth)) continue;
    out.push({ depth, id: m[2], text: m[3].replace(/<[^>]+>/g, '').trim() });
  }
  return out;
}
