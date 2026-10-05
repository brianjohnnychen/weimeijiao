// Author-year forms for citations (SPEC §6, Citations in the text): the in-text form per locale
// ("Gershoff and Grogan-Kaylor (2016)", "Gershoff 與 Grogan-Kaylor（2016）", "Leijten 等（2019）")
// and the parts of an APA 7 reference. Plain JavaScript so both the Astro templates and the
// scripts can import it.

/** Split an APA author string into authors: [{ surname, initials, group }]. */
export function parseAuthors(authors) {
  const out = [];
  let etAl = false;
  const tokens = String(authors ?? '').split(/,\s*/).map((t) => t.trim()).filter(Boolean);
  for (let tok of tokens) {
    if (tok.startsWith('&')) tok = tok.slice(1).trim();
    if (!tok) continue;
    if (/^(?:&\s*)?et al\.?$/i.test(tok)) { etAl = true; continue; }
    const isInitials = /^(?:[A-Z][a-z]?\.(?:\s*-?\s*[A-Z]\.)*\s*)+$/.test(tok) || /^(?:[A-Z]\.\s?)+(?:[A-Z][a-z]+)?$/.test(tok);
    if (isInitials && out.length && !out[out.length - 1].initials && !out[out.length - 1].group) {
      out[out.length - 1].initials = tok;
    } else {
      const group = /\s/.test(tok) && !/^(?:van|von|de|del|der|den|da|di|le|la|du)\s/i.test(tok) && tok.split(/\s+/).length > 2;
      out.push({ surname: tok, initials: '', group });
    }
  }
  return { authors: out, etAl };
}

/** Group authors with a name per locale (used in the in-text form). */
export const GROUP_NAMES = {
  'Council on Communications and Media': { en: 'Council on Communications and Media', 'zh-hans': '美国儿科学会传播与媒体委员会', 'zh-hant': '美國兒科醫學會傳播與媒體委員會' },
  'American Academy of Pediatrics': { en: 'American Academy of Pediatrics', 'zh-hans': '美国儿科学会', 'zh-hant': '美國兒科醫學會' },
  'American Academy of Sleep Medicine': { en: 'American Academy of Sleep Medicine', 'zh-hans': '美国睡眠医学会', 'zh-hant': '美國睡眠醫學會' },
};

const JOIN = { en: ' and ', 'zh-hans': ' 和 ', 'zh-hant': ' 與 ' };
const ETAL = { en: ' et al.', 'zh-hans': ' 等', 'zh-hant': ' 等人' };

/** Names part of the in-text citation: "Gershoff and Grogan-Kaylor", "Leijten et al.", "Gershoff 與 Grogan-Kaylor". */
export function inTextNames(authors, locale = 'en', groupNames = GROUP_NAMES) {
  const { authors: list, etAl } = parseAuthors(authors);
  const name = (a) => (a.group && groupNames[a.surname]?.[locale]) || a.surname;
  if (!list.length) return '';
  if (list.length === 1 && !etAl) return name(list[0]);
  if (list.length === 2 && !etAl) return `${name(list[0])}${JOIN[locale] ?? JOIN.en}${name(list[1])}`;
  return `${name(list[0])}${ETAL[locale] ?? ETAL.en}`;
}

/** Full in-text citation with the year in the locale's parentheses. */
export function inTextCite(source, locale = 'en', groupNames = GROUP_NAMES) {
  const names = inTextNames(source.authors, locale, groupNames);
  const year = source.year !== undefined ? String(source.year) : 'n.d.';
  return locale === 'en' ? `${names} (${year})` : `${names}（${year}）`;
}

/** Parts of an APA 7 reference from the stored venue string "Journal, 12(3), 45-67". */
export function venueParts(venue) {
  const m = /^(.*?),\s*(\d+)(?:\((\d+(?:-\d+)?|[\w ]+)\))?(?:,\s*(.+))?$/.exec(String(venue ?? '').trim());
  if (!m) {
    const m2 = /^(.*?),\s*(e?\d[\w-]*)$/.exec(String(venue ?? '').trim()); // "Pediatrics, e2021052138"
    if (m2) return { journal: m2[1], volume: '', issue: '', pages: m2[2] };
    return { journal: String(venue ?? '').replace(/\.$/, ''), volume: '', issue: '', pages: '' };
  }
  return { journal: m[1], volume: m[2], issue: m[3] ?? '', pages: m[4] ?? '' };
}
