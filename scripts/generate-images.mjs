// Generates illustration candidates for the images listed in content/images.yml with Cloudflare Workers AI
// (SPEC §9). Runs in GitHub Actions with CF_ACCOUNT_ID and CF_AI_TOKEN. Nothing it writes goes live by
// itself: candidates are saved under image-candidates/<id>-<n>.jpg on the review branch, the
// cleanest one per image is copied to src/assets/ai/<id>.jpg by hand after a full-size review, and
// docs/IMAGES.md logs the decision before the pull request is merged.
//
// Environment:
//   CF_ACCOUNT_ID, CF_AI_TOKEN   required; without them the script exits 0 and pages keep their placeholders
//   IMAGE_MODEL                  Workers AI model id (default: FLUX.2 [dev])
//   IMAGE_STEPS                  inference steps (default 28)
//   IMAGE_GUIDANCE               guidance scale; sent only when set
//   IMAGE_IDS                    ids to generate (comma or space separated); default: every id without an approved .jpg
//   CANDIDATES                   candidates per image (default 3), each with its own seed
//   PARALLEL                     requests in flight at once (default 3)
//   MAX_IMAGES                   at most this many ids per run (default: all)
//   PROBE_ONLY                   "true": print the catalog, the model's schema and the usage report, generate nothing
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'ai');
const candDir = join(root, 'image-candidates');
const MODEL = process.env.IMAGE_MODEL || '@cf/black-forest-labs/flux-2-dev';
const STEPS = Number(process.env.IMAGE_STEPS || 28);
const GUIDANCE = process.env.IMAGE_GUIDANCE ? Number(process.env.IMAGE_GUIDANCE) : undefined;
const CANDIDATES = Math.max(1, Number(process.env.CANDIDATES || 3));
const PARALLEL = Math.max(1, Number(process.env.PARALLEL || 3));
const MAX = process.env.MAX_IMAGES ? Math.max(0, Number(process.env.MAX_IMAGES)) : Infinity;
const PROBE_ONLY = /^(1|true|yes)$/i.test(process.env.PROBE_ONLY || '');
const WIDTH = 1024;
const HEIGHT = 768; // the 4:3 display crop

const { CF_ACCOUNT_ID, CF_AI_TOKEN, IMAGE_IDS = '' } = process.env;
if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
  console.log('::notice::CF_ACCOUNT_ID or CF_AI_TOKEN is not set; skipping image generation. Pages use placeholders.');
  process.exit(0);
}

const api = (path) => `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}${path}`;
const auth = { Authorization: `Bearer ${CF_AI_TOKEN}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const summary = [];
function note(line) {
  console.log(line);
  summary.push(line);
}

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...auth, ...(init.headers ?? {}) } });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text: text.slice(0, 2000) };
}

/** The account's Text-to-Image catalog, the chosen model's input schema, and the last week's usage. */
async function probe() {
  const cat = await getJson(api('/ai/models/search?task=Text-to-Image&per_page=100'));
  const models = Array.isArray(cat.json?.result) ? cat.json.result : [];
  note(`\nText-to-Image models in this account's Workers AI catalog (${models.length}${models.length ? '' : `; request answered ${cat.status}`}):`);
  for (const m of models) {
    const beta = (m.properties ?? []).some((p) => p.property_id === 'beta' && String(p.value) === 'true');
    note(`  ${m.name}${beta ? ' (beta)' : ''}: ${String(m.description ?? '').replace(/\s+/g, ' ').slice(0, 120)}`);
  }
  if (!models.length) note(`  ${cat.text.slice(0, 300)}`);
  const listed = models.some((m) => m.name === MODEL);
  note(`Chosen model: ${MODEL} (${models.length ? (listed ? 'in the catalog' : 'NOT in the catalog') : 'catalog unreadable'})`);
  const sch = await getJson(api(`/ai/models/schema?model=${encodeURIComponent(MODEL)}`));
  const input = sch.json?.result?.input ?? sch.json?.result ?? null;
  note(`\nInput schema of ${MODEL} (${sch.status}):`);
  note(JSON.stringify(input ?? sch.text, null, 1).slice(0, 2500));
  await usage();
  return models.length === 0 || listed;
}

/** Neurons used per day and model over the last 7 days, when the token may read account analytics. */
async function usage() {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86400000);
  const day = (d) => d.toISOString().slice(0, 10);
  note(`\nWorkers AI usage on this account, ${day(from)} to ${day(to)} (GraphQL analytics; needs Account Analytics: Read on the token):`);
  const query = `{ viewer { accounts(filter: {accountTag: "${CF_ACCOUNT_ID}"}) { aiInferenceAdaptiveGroups(limit: 500, filter: {date_geq: "${day(from)}", date_leq: "${day(to)}"}, orderBy: [date_ASC]) { dimensions { date modelId } sum { totalNeurons } count } } } }`;
  const r = await getJson('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  const groups = r.json?.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups;
  if (Array.isArray(groups)) {
    if (!groups.length) note('  no inference recorded in this period');
    const byDay = new Map();
    for (const g of groups) {
      const d = g.dimensions?.date;
      const m = g.dimensions?.modelId ?? '?';
      if (!byDay.has(d)) byDay.set(d, new Map());
      byDay.get(d).set(m, (byDay.get(d).get(m) ?? 0) + Number(g.sum?.totalNeurons ?? 0));
    }
    for (const [d, models] of byDay) {
      const total = [...models.values()].reduce((a, b) => a + b, 0);
      note(`  ${d}: ${Math.round(total)} neurons (${[...models].map(([m, v]) => `${m} ${Math.round(v)}`).join(', ')})`);
    }
    return;
  }
  note(`  usage not readable with this token: ${r.status} ${JSON.stringify(r.json?.errors ?? r.text).slice(0, 300)}`);
}

const file = YAML.parse(readFileSync(join(root, 'content', 'images.yml'), 'utf8'));
const style = String(file.style).trim();
const wanted = IMAGE_IDS.split(/[\s,]+/).filter(Boolean);
const unknown = wanted.filter((id) => !file.images.some((img) => img.id === id));
if (unknown.length) {
  console.error(`::error::Unknown ids in IMAGE_IDS: ${unknown.join(', ')}`);
  process.exit(1);
}

const modelOk = await probe();
if (PROBE_ONLY) {
  console.log('\nPROBE_ONLY set: nothing generated.');
  process.exit(0);
}
if (!modelOk) {
  console.log(`::error::${MODEL} is not in this account's Text-to-Image catalog (see the list above). Set IMAGE_MODEL to a listed model.`);
  process.exit(1);
}

// Work list: the ids asked for, or every id without an approved illustration (<id>.jpg); placeholders first,
// then pages still showing a first-style <id>.png.
const hasPng = (id) => existsSync(join(outDir, `${id}.png`));
const todo = (wanted.length ? file.images.filter((img) => wanted.includes(img.id)) : file.images.filter((img) => !existsSync(join(outDir, `${img.id}.jpg`))))
  .sort((a, b) => Number(hasPng(a.id)) - Number(hasPng(b.id)));
const batch = todo.slice(0, MAX);
note(`\n${file.images.length} images listed; ${todo.length} to do; this run generates ${CANDIDATES} candidate(s) each for ${batch.length}: ${batch.map((i) => i.id).join(', ') || 'nothing'}.`);
note(`Model ${MODEL}, ${WIDTH}x${HEIGHT}, ${STEPS} steps${GUIDANCE !== undefined ? `, guidance ${GUIDANCE}` : ''}, ${PARALLEL} in flight.`);
await mkdir(candDir, { recursive: true });

let sendSeed = true;
async function generate(img, seed) {
  // The full-bleed instruction leads, the scene follows, the shared style closes (frames came from busy prompts).
  const prompt = `Full-bleed flat illustration that fills the entire canvas edge to edge, no frame, no border, no margin: ${img.prompt.trim()} ${style}`.replace(/\s+/g, ' ');
  if (prompt.length > 2048) throw new Error(`prompt too long (${prompt.length} chars)`);
  const url = api(`/ai/run/${MODEL}`);
  for (let attempt = 1; attempt <= 4; attempt++) {
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('steps', String(STEPS));
    form.append('width', String(WIDTH));
    form.append('height', String(HEIGHT));
    if (GUIDANCE !== undefined) form.append('guidance', String(GUIDANCE));
    if (sendSeed) form.append('seed', String(seed));
    const res = await fetch(url, { method: 'POST', headers: auth, body: form });
    const type = res.headers.get('content-type') || '';
    if (res.ok) {
      let bytes;
      if (type.startsWith('image/')) {
        bytes = Buffer.from(await res.arrayBuffer());
      } else {
        const json = await res.json();
        const b64 = json?.result?.image ?? json?.result?.images?.[0] ?? json?.image;
        if (!b64) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 300)}`);
        bytes = Buffer.from(String(b64).replace(/^data:image\/\w+;base64,/, ''), 'base64');
      }
      // JPEG without any metadata: no EXIF, no XMP, no provenance fields (SPEC §9, no labeling).
      return sharp(bytes).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    }
    const body = (await res.text()).slice(0, 500);
    if (res.status === 400 && sendSeed && /seed/i.test(body)) {
      console.log(`  ${img.id}: the model rejected the seed field, continuing without seeds (${body.slice(0, 120)})`);
      sendSeed = false;
      continue;
    }
    if (res.status === 429 && /daily free allocation|"code":\s*4006/.test(body)) {
      const e = new Error(`allocation used up (error 4006), which should not happen on the paid plan: ${body}`);
      e.quota = true;
      throw e;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      console.log(`  ${img.id}: HTTP ${res.status}, retrying (attempt ${attempt})`);
      await sleep(4000 * 2 ** attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  throw new Error('gave up after retries');
}

// Jobs: one per candidate, run PARALLEL at a time; the seed is derived from the id and candidate number so a
// rerun for the same id gives new seeds only when the run's seed base changes.
const seedBase = Number(process.env.SEED_BASE || Date.now() % 1000000);
const jobs = [];
for (const img of batch) for (let n = 1; n <= CANDIDATES; n++) jobs.push({ img, n, seed: (seedBase + n * 7919 + img.id.length * 104729) % 2147483647 });
const done = new Map();
const failed = [];
let quotaHit = false;
let next = 0;
async function worker() {
  while (next < jobs.length && !quotaHit) {
    const job = jobs[next++];
    const started = Date.now();
    try {
      const jpg = await generate(job.img, job.seed);
      const name = `${job.img.id}-${job.n}.jpg`;
      await writeFile(join(candDir, name), jpg);
      const meta = await sharp(jpg).metadata();
      done.set(job.img.id, (done.get(job.img.id) ?? 0) + 1);
      note(`  ${name} (${meta.width}x${meta.height}, ${Math.round(jpg.length / 1024)} KB, ${Math.round((Date.now() - started) / 1000)} s, seed ${job.seed})`);
    } catch (err) {
      console.log(`::warning::${job.img.id}-${job.n}: ${err.message}`);
      summary.push(`  ${job.img.id}-${job.n}: ${String(err.message).slice(0, 200)}`);
      if (err.quota) quotaHit = true;
      else failed.push(`${job.img.id}-${job.n}`);
    }
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));

note(`\nDone: ${[...done.values()].reduce((a, b) => a + b, 0)} candidate(s) for ${done.size} image(s)${failed.length ? `; failed: ${failed.join(', ')}` : ''}${quotaHit ? '; stopped at an allocation error' : ''}.`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Illustration candidates\n\n\`\`\`\n${summary.join('\n')}\n\`\`\`\n`);
}
process.exit(quotaHit ? 1 : 0);
