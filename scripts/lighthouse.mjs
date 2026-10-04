// Lighthouse over the built site (dist/), served locally: Home, one phase page and Physical
// discipline in all three locales, mobile and desktop (SPEC §10: every category >= 95).
//   LIGHTHOUSE_BIN=/path/to/lighthouse node scripts/lighthouse.mjs
// (Lighthouse is not a project dependency; install it anywhere, e.g. `npm i --prefix /tmp/lh lighthouse`.)
// Each page and form factor runs 3 times (LIGHTHOUSE_RUNS) and the median run by performance is
// reported, as Lighthouse recommends, because single runs vary by several points.
// Writes docs/lighthouse.md. Exit code 1 if any median score is below 95.
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { serve } from './serve.mjs';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bin = process.env.LIGHTHOUSE_BIN || 'lighthouse';
const chrome = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
const PAGES = [
  ['Home', '/'],
  ['Phase 3-5', '/by-age/3-5-years/'],
  ['Physical discipline', '/physical-discipline/'],
];
const LOCALES = [
  ['zh-Hans', ''],
  ['zh-Hant', '/zh-hant'],
  ['en', '/en'],
];
const CATS = ['performance', 'accessibility', 'best-practices', 'seo'];
const RUNS = Math.max(1, Number(process.env.LIGHTHOUSE_RUNS || 3));

const { server, url } = await serve(join(root, 'dist'));
const tmp = await mkdtemp(join(tmpdir(), 'lh-'));
const rows = [];
let low = 0;
for (const [locale, prefix] of LOCALES) {
  for (const [name, path] of PAGES) {
    for (const preset of ['mobile', 'desktop']) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        const out = join(tmp, `${locale}-${preset}-${name.replace(/\W+/g, '-')}-${i}.json`);
        const args = [url + prefix + path, '--quiet', '--output=json', `--output-path=${out}`, `--only-categories=${CATS.join(',')}`, `--chrome-flags=--headless=new --no-sandbox`];
        if (preset === 'desktop') args.push('--preset=desktop');
        await run(bin, args, { env: { ...process.env, CHROME_PATH: chrome }, maxBuffer: 64 * 1024 * 1024 });
        const report = JSON.parse(await readFile(out, 'utf8'));
        const scores = CATS.map((c) => Math.round((report.categories[c]?.score ?? 0) * 100));
        const failing = CATS.flatMap((c) =>
          Object.values(report.audits)
            .filter((a) => report.categories[c].auditRefs.some((r) => r.id === a.id && r.weight > 0) && a.score !== null && a.score < 1)
            .map((a) => a.id),
        );
        runs.push({ scores, failing });
      }
      runs.sort((a, b) => a.scores[0] - b.scores[0]);
      const { scores, failing } = runs[Math.floor(runs.length / 2)];
      const range = `${runs[0].scores[0]}-${runs[runs.length - 1].scores[0]}`;
      scores.forEach((s) => s < 95 && low++);
      rows.push({ locale, name, preset, scores, failing, range });
      console.log(`${locale} ${name} ${preset}: ${scores.join(' / ')} (performance over ${RUNS} runs: ${range})${failing.length ? `  (not full marks: ${[...new Set(failing)].join(', ')})` : ''}`);
    }
  }
}
server.close();
await rm(tmp, { recursive: true, force: true });

const when = new Date().toISOString().replace('T', ' ').slice(0, 16);
const md = [
  `# Lighthouse (${when} UTC)`,
  '',
  `Local static server over dist/ with compression (the same files GitHub Pages serves). Each row is the median of ${RUNS} runs by performance; the range column shows the spread of the performance score. Scores: performance / accessibility / best practices / SEO. Target: every category 95 or higher.`,
  '',
  '| Locale | Page | Form factor | Perf | A11y | Best practices | SEO | Perf range | Audits below full marks (median run) |',
  '|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.locale} | ${r.name} | ${r.preset} | ${r.scores.join(' | ')} | ${r.range} | ${[...new Set(r.failing)].join(', ') || '-'} |`),
  '',
];
await writeFile(join(root, 'docs', 'lighthouse.md'), md.join('\n'));
console.log(low ? `${low} score(s) below 95` : 'All scores 95 or higher');
process.exit(low ? 1 : 0);
