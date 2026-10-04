// Post-deploy smoke test for the live site and its redirect domains (SPEC §2).
// Runs in GitHub Actions after deploy.yml's deploy job and on demand via smoke.yml.
//   node scripts/smoke-test.mjs              check everything, retrying for up to 8 minutes
//   node scripts/smoke-test.mjs --once       single attempt (no waiting for Pages to update)
// Exit code 1 if the primary site or a redirect domain fails; HTTPS enforcement and www are
// reported as warnings until Enforce HTTPS is on and the certificate covers www.
// The checks run in parallel and each request gives up after 20 seconds, so even when a domain
// does not resolve (slow DNS failures) the result table is always printed before the job's
// time limit.
import { appendFileSync } from 'node:fs';

const PRIMARY = 'https://xn--3ys368f86s.com';
const once = process.argv.includes('--once');
const deadline = Date.now() + (once ? 0 : 8 * 60 * 1000);
const pause = 30000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function head(url) {
  const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'weimeijiao-smoke-test' }, signal: AbortSignal.timeout(20000) });
  const body = res.status === 200 ? await res.text() : '';
  return { status: res.status, location: res.headers.get('location') ?? '', body };
}

const checks = [
  { name: 'Home (zh-Hans) loads', url: `${PRIMARY}/`, want: (r) => r.status === 200 && r.body.includes('魏美娇') },
  { name: 'Home (zh-Hant) loads', url: `${PRIMARY}/zh-hant/`, want: (r) => r.status === 200 && r.body.includes('魏美嬌') },
  { name: 'Home (en) loads', url: `${PRIMARY}/en/`, want: (r) => r.status === 200 && r.body.includes('Wei Mei Jiao') },
  { name: 'Deep page loads', url: `${PRIMARY}/en/toolbox/`, want: (r) => r.status === 200 && r.body.includes('id="time-out"') },
  { name: 'Research page loads', url: `${PRIMARY}/research/`, want: (r) => r.status === 200 && r.body.includes('id="bibliography"') },
  { name: 'Unknown path gives 404 page', url: `${PRIMARY}/no-such-page-smoke-test/`, want: (r) => r.status === 404 },
  { name: 'sitemap.xml', url: `${PRIMARY}/sitemap.xml`, want: (r) => r.status === 200 && r.body.includes('<urlset') },
  {
    name: 'weimeijiao.com redirects (path and query kept)',
    url: 'https://weimeijiao.com/en/toolbox/?smoke=1',
    want: (r) => [301, 308].includes(r.status) && r.location === `${PRIMARY}/en/toolbox/?smoke=1`,
  },
  {
    name: '魏美嬌.com redirects (path kept)',
    url: 'https://xn--k6s926f86s.com/en/',
    want: (r) => [301, 308].includes(r.status) && r.location.startsWith(`${PRIMARY}/en/`),
  },
  { name: 'http redirects to https (needs Enforce HTTPS)', url: 'http://xn--3ys368f86s.com/', want: (r) => [301, 308].includes(r.status) && r.location.startsWith('https://'), warnOnly: true },
  { name: 'www redirects to apex', url: 'https://www.xn--3ys368f86s.com/', want: (r) => [301, 308].includes(r.status) && r.location.startsWith(PRIMARY), warnOnly: true },
];

const check = async (c) => {
  let r;
  try {
    r = await head(c.url);
  } catch (err) {
    r = { status: 0, location: '', body: '', error: String(err?.cause?.code ?? err?.name ?? err?.message ?? err) };
  }
  return { ...c, r, ok: c.want(r) };
};

let results = [];
for (let attempt = 1; ; attempt++) {
  results = await Promise.all(checks.map(check));
  const hardFail = results.filter((x) => !x.ok && !x.warnOnly);
  if (!hardFail.length || Date.now() + pause > deadline) break;
  console.log(`Attempt ${attempt}: ${hardFail.length} check(s) failing, retrying in ${pause / 1000}s (Pages can take a few minutes)`);
  await sleep(pause);
}

const lines = ['| Check | URL | Result |', '|---|---|---|'];
for (const x of results) {
  const detail = `${x.r.status}${x.r.location ? ` → ${x.r.location}` : ''}${x.r.error ? ` (${x.r.error})` : ''}`;
  lines.push(`| ${x.name} | ${x.url} | ${x.ok ? 'pass' : x.warnOnly ? 'warning' : 'FAIL'}: ${detail} |`);
}
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Smoke test\n\n${lines.join('\n')}\n`);
process.exit(results.some((x) => !x.ok && !x.warnOnly) ? 1 : 0);
