// One-off helper (kept for the record): merges verified batches (scratchpad research files in the
// sources.yml format) into content/sources.yml. An id that already exists is replaced by the newer
// entry, keeping the older verified_via note. Titles and venues get display normalization
// (no em or en dashes in user-facing copy).
//   node scripts/research/merge-verified.mjs <batch.yml> [<batch.yml> ...]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = join(root, 'content', 'sources.yml');
const text = readFileSync(file, 'utf8');
const header = text.split('\n').filter((l) => l.startsWith('#')).join('\n') + '\n';
const current = YAML.parse(text);
const byId = new Map(current.map((s) => [s.id, s]));
const dash = (v) => (typeof v === 'string' ? v.replace(/\s*[—―]\s*/g, ' - ').replace(/–/g, '-') : v);
let added = 0;
let replaced = 0;
for (const batch of process.argv.slice(2)) {
  for (const s of YAML.parse(readFileSync(batch, 'utf8'))) {
    s.title = dash(s.title);
    s.venue = dash(s.venue);
    if (s.doi) s.doi = String(s.doi).toLowerCase();
    if (s.pmid) s.pmid = String(s.pmid);
    const old = byId.get(s.id);
    if (old) {
      if (old.verified_via && !String(s.verified_via).includes(old.verified_via)) s.verified_via = `${s.verified_via} Earlier: ${old.verified_via}`;
      byId.set(s.id, { ...old, ...s });
      replaced++;
    } else {
      byId.set(s.id, s);
      added++;
    }
  }
}
writeFileSync(file, header + YAML.stringify([...byId.values()], { lineWidth: 0 }));
console.log(`sources.yml: ${byId.size} entries (${added} added, ${replaced} replaced)`);
