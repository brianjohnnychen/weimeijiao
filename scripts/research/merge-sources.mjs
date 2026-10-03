// One-off helper (kept for the record): merges verified research batches into
// content/sources.yml, keeping only academic sources (SPEC §6) and adding evidence levels
// and the zh-Hans / zh-Hant findings from translations.yml.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const [, , researchDir, translationsFile, outFile] = process.argv;
const LEVELS = {
  'kaminski-2008': 'meta-analysis', 'leijten-2019': 'meta-analysis', 'leijten-2018': 'meta-analysis',
  'owen-2012': 'systematic-review', 'dadds-tully-2019': 'review', 'knight-2020': 'longitudinal',
  'morawska-sanders-2011': 'review', 'sanders-2014': 'meta-analysis', 'menting-2013': 'meta-analysis',
  'holden-2022': 'pilot', 'leijten-2016': 'experiment', 'radley-dart-2016': 'review',
  'aap-2018-discipline': 'position-statement', 'larzelere-2024': 'meta-analysis',
  'narang-2020': 'position-statement', 'wolke-2017': 'meta-analysis', 'wakschlag-2012': 'cross-sectional',
  'belden-2008': 'cross-sectional', 'tremblay-2004': 'longitudinal', 'cote-2006': 'longitudinal',
  'alink-2006': 'longitudinal', 'paruthi-2016': 'position-statement', 'mindell-2009': 'rct',
  'mindell-2006': 'review', 'zubler-2022': 'review', 'aap-2016-media': 'position-statement',
  'aap-2026-digital-ecosystems': 'position-statement',
};
const tr = YAML.parse(readFileSync(translationsFile, 'utf8'));
const batches = ['r1-physical.yml', 'r3-methods.yml', 'r4-development.yml', 'r5-situations.yml'];
const out = [];
for (const b of batches) {
  let data = YAML.parse(readFileSync(join(researchDir, b), 'utf8'));
  if (!Array.isArray(data)) data = data.sources;
  for (const s of data) {
    if (!LEVELS[s.id]) continue;
    const t = tr[s.id];
    if (!t) throw new Error(`missing translation for ${s.id}`);
    const entry = {
      id: s.id,
      evidence_level: LEVELS[s.id],
      authors: s.authors,
      year: s.year,
      title: s.title,
      venue: s.venue,
      ...(s.doi ? { doi: String(s.doi) } : {}),
      ...(s.pmid ? { pmid: String(s.pmid) } : {}),
      url: s.url,
      lang: s.lang ?? 'en',
      finding: { en: s.finding, 'zh-hans': t['zh-hans'], 'zh-hant': t['zh-hant'] },
      ...(s.key_facts ? { key_facts: s.key_facts } : {}),
      topics: t.topics ?? s.topics ?? [],
      ...(s.side ? { side: s.side } : {}),
      accessed: '2026-10-04',
      verified_via: s.verified_via,
    };
    out.push(entry);
  }
}
const missing = Object.keys(LEVELS).filter((id) => !out.some((e) => e.id === id));
if (missing.length) throw new Error(`not found in research: ${missing.join(', ')}`);
const header = `# Every source the site cites (SPEC §6). Academic and scientific sources only: peer-reviewed
# journal articles, systematic reviews and meta-analyses, Cochrane reviews, university-press books,
# and policy statements of scientific or medical bodies published in peer-reviewed journals.
# Fields: id, evidence_level, authors, year, title, venue, doi/pmid/url, finding (en, zh-hans, zh-hant),
# key_facts (verified specifics writers may use), topics, accessed, verified_via (how it was checked).
# Never add an entry you have not opened and verified. scripts/check-sources.mjs checks every link
# and every DOI's metadata in CI.
`;
writeFileSync(outFile, header + YAML.stringify(out, { lineWidth: 0 }));
console.log(`wrote ${out.length} sources`);
