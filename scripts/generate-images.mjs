// Generates the site's photographs listed in content/images.yml with Cloudflare Workers AI and saves
// them as src/assets/ai/<id>.jpg (SPEC §9). Runs in GitHub Actions with CF_ACCOUNT_ID and CF_AI_TOKEN.
// Nothing it writes goes live by itself: the workflow commits to a review branch, and every image is
// inspected at full size and logged in docs/IMAGES.md before its pull request is merged.
//
// Environment:
//   CF_ACCOUNT_ID, CF_AI_TOKEN   required; without them the script exits 0 and pages keep their placeholders
//   IMAGE_MODEL                  Workers AI model id (default: FLUX.2 [dev], the most photorealistic in the catalog)
//   IMAGE_STEPS                  inference steps (default 28)
//   IMAGE_GUIDANCE               guidance scale; sent only when set
//   MAX_IMAGES                   at most this many images per run (default 4; the free daily allocation covers about 3)
//   REGENERATE                   ids to generate again even if a file exists (comma or space separated)
//   PROBE_ONLY                   "true": print the catalog, the model's schema and the usage report, generate nothing
import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'ai');
const MODEL = process.env.IMAGE_MODEL || '@cf/black-forest-labs/flux-2-dev';
const STEPS = Number(process.env.IMAGE_STEPS || 28);
const GUIDANCE = process.env.IMAGE_GUIDANCE ? Number(process.env.IMAGE_GUIDANCE) : undefined;
const MAX = Math.max(0, Number(process.env.MAX_IMAGES || 4));
const PROBE_ONLY = /^(1|true|yes)$/i.test(process.env.PROBE_ONLY || '');
const WIDTH = 1024;
const HEIGHT = 768; // the 4:3 display crop; three 512x512 output tiles per step

const { CF_ACCOUNT_ID, CF_AI_TOKEN, REGENERATE = '' } = process.env;
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
  note(JSON.stringify(input ?? sch.text, null, 1).slice(0, 3500));

  await usage();
  return models.length === 0 || listed;
}

/** Neurons used per day and model over the last 7 days, when the token may read account analytics. */
async function usage() {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86400000);
  const day = (d) => d.toISOString().slice(0, 10);
  note(`\nWorkers AI usage on this account, ${day(from)} to ${day(to)} (GraphQL analytics; needs Account Analytics: Read on the token):`);
  for (const field of ['totalNeurons', 'neurons']) {
    const query = `{ viewer { accounts(filter: {accountTag: "${CF_ACCOUNT_ID}"}) { aiInferenceAdaptiveGroups(limit: 500, filter: {date_geq: "${day(from)}", date_leq: "${day(to)}"}, orderBy: [date_ASC]) { dimensions { date modelId } sum { ${field} } count } } } }`;
    const r = await getJson('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    const groups = r.json?.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups;
    if (Array.isArray(groups)) {
      if (!groups.length) note('  no inference recorded in this period');
      const byDay = new Map();
      for (const g of groups) {
        const d = g.dimensions?.date;
        const m = g.dimensions?.modelId ?? '?';
        if (!byDay.has(d)) byDay.set(d, new Map());
        byDay.get(d).set(m, (byDay.get(d).get(m) ?? 0) + Number(g.sum?.[field] ?? 0));
      }
      for (const [d, models] of byDay) {
        const total = [...models.values()].reduce((a, b) => a + b, 0);
        note(`  ${d}: ${Math.round(total)} neurons (${[...models].map(([m, v]) => `${m} ${Math.round(v)}`).join(', ')})`);
      }
      return;
    }
    note(`  sum.${field}: ${r.status} ${JSON.stringify(r.json?.errors ?? r.text).slice(0, 400)}`);
  }
  note('  Usage could not be read with this token. The Workers AI page of the Cloudflare dashboard shows the daily neurons.');
}

const file = YAML.parse(readFileSync(join(root, 'content', 'images.yml'), 'utf8'));
const style = String(file.style).trim();
const regenerate = new Set(REGENERATE.split(/[\s,]+/).filter(Boolean));
const unknown = [...regenerate].filter((id) => !file.images.some((img) => img.id === id));
if (unknown.length) {
  console.error(`::error::Unknown ids in REGENERATE: ${unknown.join(', ')}`);
  process.exit(1);
}
const fileFor = (id) => ['jpg', 'png'].map((ext) => join(outDir, `${id}.${ext}`)).find((p) => existsSync(p));

const modelOk = await probe();
if (PROBE_ONLY) {
  console.log('\nPROBE_ONLY set: nothing generated.');
  process.exit(0);
}
if (!modelOk) {
  console.log(`::error::${MODEL} is not in this account's Text-to-Image catalog (see the list above). Set IMAGE_MODEL to a listed model.`);
  process.exit(1);
}

// Work list: everything without a photograph, pages that show a placeholder first, then pages that still
// show an illustration from the first style; explicit REGENERATE ids go first of all.
const todo = file.images
  .filter((img) => regenerate.has(img.id) || !existsSync(join(outDir, `${img.id}.jpg`)))
  .sort((a, b) => Number(regenerate.has(b.id)) - Number(regenerate.has(a.id)) || Number(Boolean(fileFor(a.id))) - Number(Boolean(fileFor(b.id))));
const batch = todo.slice(0, MAX);
note(`\n${file.images.length} images listed; ${todo.length} without a photograph; this run generates up to ${MAX}: ${batch.map((i) => i.id).join(', ') || 'nothing'}.`);
note(`Model ${MODEL}, ${WIDTH}x${HEIGHT}, ${STEPS} steps${GUIDANCE !== undefined ? `, guidance ${GUIDANCE}` : ''}.`);
await mkdir(outDir, { recursive: true });

async function generate(img) {
  const prompt = `${img.prompt.trim()} ${style}`.replace(/\s+/g, ' ');
  if (prompt.length > 2048) throw new Error(`prompt too long (${prompt.length} chars)`);
  const url = api(`/ai/run/${MODEL}`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('steps', String(STEPS));
    form.append('width', String(WIDTH));
    form.append('height', String(HEIGHT));
    if (GUIDANCE !== undefined) form.append('guidance', String(GUIDANCE));
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
      return sharp(bytes).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    }
    const body = (await res.text()).slice(0, 500);
    if (res.status === 429 && /daily free allocation|"code":\s*4006/.test(body)) {
      const e = new Error(`daily free allocation used up: ${body}`);
      e.quota = true;
      throw e;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      console.log(`  ${img.id}: HTTP ${res.status}, retrying (attempt ${attempt})`);
      await sleep(3000 * 2 ** attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  throw new Error('gave up after retries');
}

const generated = [];
const failed = [];
let quotaHit = false;
for (const img of batch) {
  const started = Date.now();
  try {
    const jpg = await generate(img);
    await writeFile(join(outDir, `${img.id}.jpg`), jpg);
    const meta = await sharp(jpg).metadata();
    generated.push(img.id);
    note(`  generated ${img.id} (${meta.width}x${meta.height}, ${Math.round(jpg.length / 1024)} KB, ${Math.round((Date.now() - started) / 1000)} s)`);
  } catch (err) {
    console.log(`::warning::${img.id}: ${err.message}`);
    summary.push(`  ${img.id}: ${String(err.message).slice(0, 200)}`);
    if (err.quota) {
      quotaHit = true;
      break;
    }
    failed.push(img.id);
  }
}

const remaining = todo.filter((i) => !generated.includes(i.id)).map((i) => i.id);
if (quotaHit) {
  note(`::warning::Cloudflare answered "daily free allocation used up" (error 4006) at ${new Date().toISOString()}. ${generated.length} generated this run; ${remaining.length} still without a photograph: ${remaining.join(', ')}. The next scheduled run continues after 00:00 UTC.`);
} else if (failed.length) {
  console.log(`::error::${failed.length} image(s) failed: ${failed.join(', ')}`);
  process.exitCode = 1;
} else {
  note(`Done: ${generated.length} generated this run; ${remaining.length} still without a photograph${remaining.length ? `: ${remaining.join(', ')}` : ''}.`);
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `generated=${generated.join(' ')}\nremaining=${remaining.length}\nquota=${quotaHit}\n`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + summary.join('\n') + '\n```\n');
