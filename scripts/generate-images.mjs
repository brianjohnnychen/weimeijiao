// Generates the AI illustrations listed in content/images.yml with Cloudflare Workers AI
// (@cf/black-forest-labs/flux-1-schnell) and saves them as src/assets/ai/<id>.png.
// Only images whose file is missing are generated, plus any ids listed in REGENERATE
// (comma or space separated). Runs in GitHub Actions with CF_ACCOUNT_ID and CF_AI_TOKEN.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'ai');
const MODEL = '@cf/black-forest-labs/flux-1-schnell';
const STEPS = 8; // the model's maximum; best detail for hands and faces

const { CF_ACCOUNT_ID, CF_AI_TOKEN, REGENERATE = '' } = process.env;
if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
  console.log('::notice::CF_ACCOUNT_ID or CF_AI_TOKEN is not set; skipping image generation. Pages use placeholders.');
  process.exit(0);
}

const file = YAML.parse(readFileSync(join(root, 'content', 'images.yml'), 'utf8'));
const style = String(file.style).trim();
const regenerate = new Set(REGENERATE.split(/[\s,]+/).filter(Boolean));
const unknown = [...regenerate].filter((id) => !file.images.some((img) => img.id === id));
if (unknown.length) {
  console.error(`::error::Unknown ids in REGENERATE: ${unknown.join(', ')}`);
  process.exit(1);
}

const todo = file.images.filter((img) => regenerate.has(img.id) || !existsSync(join(outDir, `${img.id}.png`)));
console.log(`${file.images.length} images listed; ${todo.length} to generate.`);
await mkdir(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(img) {
  const prompt = `${img.prompt.trim()} ${style}`;
  if (prompt.length > 2048) throw new Error(`prompt too long (${prompt.length} chars)`);
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${MODEL}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_AI_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps: STEPS }),
    });
    const type = res.headers.get('content-type') || '';
    if (res.ok) {
      let bytes;
      if (type.startsWith('image/')) {
        bytes = Buffer.from(await res.arrayBuffer());
      } else {
        const json = await res.json();
        const b64 = json?.result?.image ?? json?.image;
        if (!b64) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 300)}`);
        bytes = Buffer.from(b64, 'base64');
      }
      return sharp(bytes).png({ compressionLevel: 9 }).toBuffer();
    }
    const body = (await res.text()).slice(0, 400);
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      console.log(`  ${img.id}: HTTP ${res.status}, retrying (attempt ${attempt})`);
      await sleep(2000 * 2 ** attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  throw new Error('gave up after retries');
}

const failed = [];
for (const img of todo) {
  try {
    const png = await generate(img);
    await writeFile(join(outDir, `${img.id}.png`), png);
    const meta = await sharp(png).metadata();
    console.log(`  generated ${img.id} (${meta.width}x${meta.height}, ${Math.round(png.length / 1024)} KB)`);
  } catch (err) {
    failed.push(img.id);
    console.log(`::warning::${img.id}: ${err.message}`);
  }
}

if (failed.length) {
  console.log(`::error::${failed.length} image(s) failed: ${failed.join(', ')}`);
  process.exitCode = 1;
}
