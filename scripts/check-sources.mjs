// Source checker. Runs in GitHub Actions (the site's permanent link checker).
//
//   node scripts/check-sources.mjs                      check every entry in content/sources.yml
//   node scripts/check-sources.mjs --details            ...and print each source's abstract
//   node scripts/check-sources.mjs --candidates FILE    look up candidate sources (DOI or citation
//                                                       query): metadata, abstract, best matches
//   node scripts/check-sources.mjs --helplines FILE     confirm each help line's number still
//                                                       appears on its official page
//   node scripts/check-sources.mjs --quotes FILE        print, word for word, the sentences of a
//                                                       source's abstract and article page (or any
//                                                       page) that match a pattern
//
// Checks for content/sources.yml:
//   - DOI is registered (doi.org handle API) and its Crossref metadata matches the entry
//     (title, year within one, first author's surname appears in the authors field).
//   - The URL resolves (2xx/3xx). Sites that block scripts are retried in headless Chrome; if
//     they still refuse but the DOI checks out, that is a warning, not a failure.
//   - PMIDs resolve in PubMed with a matching title.
// Exit code 1 when any check fails.
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const UA_BOT = 'weimeijiao-source-check/1.0 (+https://xn--3ys368f86s.com; citation verification)';
const UA_BROWSER =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { json = false, browser = false, timeout = 25000, accept } = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: ctrl.signal,
        headers: {
          'User-Agent': browser ? UA_BROWSER : UA_BOT,
          Accept: accept ?? (json ? 'application/json' : 'text/html,application/xhtml+xml,*/*;q=0.8'),
          'Accept-Language': 'en,zh;q=0.8',
        },
      });
      clearTimeout(timer);
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(1500 * attempt);
        continue;
      }
      const body = json ? (res.ok ? await res.json().catch(() => null) : null) : await res.text().catch(() => '');
      return { status: res.status, ok: res.ok, url: res.url, body };
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 3) return { status: 0, ok: false, url, body: null, error: String(err?.message ?? err) };
      await sleep(1500 * attempt);
    }
  }
}

const clean = (s) =>
  String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2013;|&#8211;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const norm = (s) =>
  clean(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function titleScore(a, b) {
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.startsWith(B) || B.startsWith(A)) return 0.95;
  const ta = new Set(A.split(' '));
  const tb = new Set(B.split(' '));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  return inter / Math.max(ta.size, tb.size);
}

function crossrefSummary(m) {
  const year = m?.issued?.['date-parts']?.[0]?.[0] ?? m?.['published-print']?.['date-parts']?.[0]?.[0];
  const online = m?.['published-online']?.['date-parts']?.[0]?.[0];
  const authors = (m?.author ?? []).map((a) => [a.family, a.given].filter(Boolean).join(', ') || a.name).join('; ');
  return {
    doi: m?.DOI,
    title: clean(m?.title?.[0]),
    subtitle: clean(m?.subtitle?.[0]),
    authors,
    firstFamily: m?.author?.[0]?.family ?? m?.author?.[0]?.name ?? '',
    container: clean(m?.['container-title']?.[0]),
    volume: m?.volume,
    issue: m?.issue,
    page: m?.page ?? m?.['article-number'],
    year,
    online,
    type: m?.type,
    publisher: m?.publisher,
    abstract: clean(m?.abstract),
    resourceUrl: m?.resource?.primary?.URL,
    altIds: (m?.['alternative-id'] ?? []).map(String),
  };
}

async function crossrefWork(doi) {
  const r = await get(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { json: true });
  return r.ok && r.body?.message ? crossrefSummary(r.body.message) : null;
}

async function crossrefQuery(query, rows = 3) {
  const url = `https://api.crossref.org/works?rows=${rows}&query.bibliographic=${encodeURIComponent(query)}`;
  const r = await get(url, { json: true });
  return (r.body?.message?.items ?? []).map(crossrefSummary);
}

async function doiRegistered(doi) {
  const r = await get(`https://doi.org/api/handles/${encodeURIComponent(doi)}`, { json: true });
  return r.body?.responseCode === 1;
}

async function europePmc(doi) {
  const q = encodeURIComponent(`DOI:"${doi}"`);
  const r = await get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${q}&resultType=core&format=json`, { json: true });
  const hit = r.body?.resultList?.result?.[0];
  if (!hit) return null;
  return { pmid: hit.pmid, pmcid: hit.pmcid, title: clean(hit.title), abstract: clean(hit.abstractText), journal: hit.journalInfo?.journal?.title, year: hit.pubYear };
}

async function openAlexAbstract(doi) {
  const r = await get(`https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`, { json: true });
  const inv = r.body?.abstract_inverted_index;
  if (!inv) return '';
  const words = [];
  for (const [w, positions] of Object.entries(inv)) for (const p of positions) words[p] = w;
  return words.filter(Boolean).join(' ');
}

async function pubmedSummary(pmid) {
  const r = await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmid}`, { json: true });
  const rec = r.body?.result?.[pmid];
  return rec ? { title: clean(rec.title), source: rec.source, pubdate: rec.pubdate, doi: rec.articleids?.find((a) => a.idtype === 'doi')?.value } : null;
}

async function pubmedAbstract(pmid) {
  const r = await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`, { accept: 'text/plain' });
  return r.ok ? clean(r.body) : '';
}

async function pubmedSearch(term) {
  const r = await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=3&term=${encodeURIComponent(term)}`, { json: true });
  return r.body?.esearchresult?.idlist ?? [];
}

let browserPromise;
async function chromeStatus(url) {
  try {
    if (!browserPromise) {
      const { chromium } = await import('playwright-core');
      const executablePath =
        process.env.CHROME_PATH ||
        ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p));
      if (!executablePath) return { status: 0, error: 'no Chrome found' };
      browserPromise = chromium.launch({ executablePath, headless: true });
    }
    const browser = await browserPromise;
    const page = await browser.newPage({ userAgent: UA_BROWSER });
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(2500);
      const title = await page.title().catch(() => '');
      const metas = await page
        .evaluate(() => {
          const get = (n) => [...document.querySelectorAll(`meta[name="${n}" i], meta[property="${n}" i]`)].map((m) => m.getAttribute('content') ?? '');
          const h1 = [...document.querySelectorAll('h1')].map((h) => (h.textContent ?? '').trim()).filter(Boolean).slice(0, 3);
          return { doi: [...get('citation_doi'), ...get('dc.identifier'), ...get('DC.Identifier'), ...get('prism.doi')], title: [...get('citation_title'), ...get('dc.title'), ...get('og:title'), ...h1] };
        })
        .catch(() => ({ doi: [], title: [] }));
      return { status: res?.status() ?? 0, title, finalUrl: page.url(), metas };
    } finally {
      await page.close();
    }
  } catch (err) {
    return { status: 0, error: String(err?.message ?? err) };
  }
}

async function urlStatus(url) {
  let r = await get(url, { browser: true });
  const titleOf = (html) => clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html ?? '')?.[1] ?? '').slice(0, 140);
  if (r.status >= 200 && r.status < 400) return { ok: true, status: r.status, via: 'fetch', title: titleOf(r.body), finalUrl: r.url, metas: metasOf(r.body) };
  const c = await chromeStatus(url);
  if (c.status >= 200 && c.status < 400) return { ok: true, status: c.status, via: 'chrome', title: c.title, finalUrl: c.finalUrl, metas: c.metas };
  return { ok: false, status: c.status || r.status, via: c.status ? 'chrome' : 'fetch', error: c.error ?? r.error, finalUrl: c.finalUrl ?? r.url };
}

/** Citation metadata a landing page declares (Highwire, Dublin Core, PRISM, Open Graph). */
function metasOf(html) {
  const out = { doi: [], title: [] };
  for (const m of String(html ?? '').matchAll(/<meta\s+[^>]*>/gi)) {
    const tag = m[0];
    const name = (/\b(?:name|property)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? '').toLowerCase();
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1] ?? '';
    if (!name || !content) continue;
    if (['citation_doi', 'dc.identifier', 'prism.doi'].includes(name)) out.doi.push(content);
    if (['citation_title', 'dc.title', 'og:title'].includes(name)) out.title.push(clean(content));
  }
  return out;
}

const WRONG_PAGE = /^(home|homepage|search|search results|log ?in|sign ?in|error|not found|page not found|access denied|forbidden|just a moment|attention required|request rejected|\s*)$/i;

/** The publisher's URL for a DOI usually embeds the DOI (psycnet.apa.org/doiLanding?doi=..., onlinelibrary.wiley.com/doi/...),
 *  so a final URL that carries the cited DOI is that work's page even when the body cannot be read. doi.org itself does not count. */
function urlCarriesWork(url, work) {
  if (!url || !work) return false;
  let u = String(url);
  try {
    u = decodeURIComponent(u);
  } catch {}
  try {
    if (/(^|\.)doi\.org$/i.test(new URL(url).hostname)) return false;
  } catch {
    return false;
  }
  const low = u.toLowerCase();
  if (work.doi && low.includes(String(work.doi).toLowerCase())) return 'the cited DOI';
  // Crossref's alternative-id is the publisher's own id for the work (Elsevier's PII, for example).
  for (const id of work.altIds ?? []) if (id.length >= 6 && /\d/.test(id) && low.includes(id.toLowerCase())) return `the publisher's id for this work (${id})`;
  const norm = (x) => {
    try {
      const v = new URL(x);
      return (v.hostname.replace(/^www\./, '') + v.pathname.replace(/\/$/, '')).toLowerCase();
    } catch {
      return '';
    }
  };
  if (work.resourceUrl && norm(u) && norm(u) === norm(work.resourceUrl)) return 'the landing URL Crossref registers for this DOI';
  return false;
}

/** Does the landing page carry the cited work? By its DOI in the page metadata, by its title, or by its URL. */
function landingMatch(s, link, work = { doi: s.doi }) {
  const doi = String(s.doi ?? '').toLowerCase();
  const pageDois = (link.metas?.doi ?? []).map((d) => String(d).toLowerCase().replace(/^(doi:|https?:\/\/(dx\.)?doi\.org\/)/, ''));
  if (doi && pageDois.includes(doi)) return { ok: true, how: 'DOI in page metadata' };
  const titles = [link.title ?? '', ...(link.metas?.title ?? [])].filter(Boolean);
  let best = 0;
  for (const t of titles) best = Math.max(best, titleScore(t, s.title), titleScore(t.replace(/\s*[|:-]\s*[^|:-]*$/, ''), s.title));
  if (best >= 0.5) return { ok: true, how: `title matches (${best.toFixed(2)})` };
  const carried = urlCarriesWork(link.finalUrl, work);
  if (carried) return { ok: true, how: `final URL carries ${carried} (${link.finalUrl})` };
  const host = (() => { try { return new URL(link.finalUrl ?? s.url).pathname; } catch { return ''; } })();
  const looksWrong = WRONG_PAGE.test(clean(link.title ?? '')) || host === '/' || /\/search\b|\/login\b|\/error\b/i.test(host);
  return { ok: false, how: looksWrong ? `landing page is not the work (title "${(link.title ?? '').slice(0, 80)}", path ${host})` : `title does not match (best ${best.toFixed(2)}: "${(link.title ?? '').slice(0, 80)}")` };
}

function wrap(text, width = 110, indent = '    ') {
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if ((line + ' ' + word).trim().length > width) {
      out.push(indent + line.trim());
      line = word;
    } else line += ' ' + word;
  }
  if (line.trim()) out.push(indent + line.trim());
  return out.join('\n');
}

async function semanticScholarAbstract(doi) {
  // Real abstracts only (never the machine-generated TLDR).
  const r = await get(`https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=title,abstract`, { json: true });
  return clean(r.body?.abstract ?? '');
}

async function publisherAbstract(doi) {
  try {
    if (!browserPromise) await chromeStatus('about:blank');
    const browser = await browserPromise;
    if (!browser) return '';
    const page = await browser.newPage({ userAgent: UA_BROWSER });
    try {
      await page.goto(`https://doi.org/${doi}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(3000);
      const text = await page.evaluate(() => {
        const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.getAttribute('content') ?? '';
        const fromMeta = meta('citation_abstract') || meta('dc.description') || meta('DC.Description') || meta('og:description') || meta('description');
        const section = document.querySelector('#abstracts, .abstract, #abstract, section.Abstract, div.Abstracts, [class*="abstract" i]');
        const fromSection = section ? section.textContent : '';
        return fromSection && fromSection.length > fromMeta.length ? fromSection : fromMeta;
      });
      return clean(text);
    } finally {
      await page.close();
    }
  } catch {
    return '';
  }
}

async function abstractFor(doi, pmid) {
  let pm = pmid;
  let abs = '';
  let source = '';
  if (doi) {
    const ep = await europePmc(doi);
    if (ep?.abstract) {
      abs = ep.abstract;
      source = 'Europe PMC';
    }
    pm = pm || ep?.pmid;
  }
  if (!abs && pm) {
    abs = await pubmedAbstract(pm);
    if (abs) source = 'PubMed';
  }
  if (!abs && doi) {
    abs = await openAlexAbstract(doi);
    if (abs) source = 'OpenAlex';
  }
  if (!abs && doi) {
    abs = await semanticScholarAbstract(doi);
    if (abs) source = 'Semantic Scholar';
  }
  if (!abs && doi) {
    const pub = await publisherAbstract(doi);
    if (pub && pub.length > 120) {
      abs = pub;
      source = 'publisher page';
    }
  }
  return { abstract: abs, source, pmid: pm };
}

const summary = [];
function report(line) {
  console.log(line);
}

async function checkSources(details) {
  const file = join(root, 'content', 'sources.yml');
  const sources = YAML.parse(readFileSync(file, 'utf8')) ?? [];
  let failures = 0;
  let warnings = 0;
  const landing = { byDoi: 0, byTitle: 0, byUrl: 0, byUrlBlocked: 0, blocked: 0, wrong: 0, notDoiLink: 0 };
  const lists = { byUrlBlocked: [], blocked: [], wrong: [] };
  report(`Checking ${sources.length} sources in content/sources.yml\n`);
  summary.push('| id | DOI / metadata | link | notes |', '|---|---|---|---|');
  for (const s of sources) {
    const notes = [];
    let doiCell = 'n/a';
    let doiOk = false;
    let cr = null;
    if (s.doi) {
      const registered = await doiRegistered(s.doi);
      cr = await crossrefWork(s.doi);
      if (!registered && !cr) {
        doiCell = 'FAIL: DOI not found';
        failures++;
      } else if (cr) {
        const score = titleScore(`${cr.title} ${cr.subtitle}`.trim(), s.title);
        const score2 = titleScore(cr.title, s.title);
        const yearOk = !s.year || !cr.year || Math.abs(Number(cr.year) - Number(s.year)) <= 1 || (cr.online && Math.abs(Number(cr.online) - Number(s.year)) <= 1);
        const family = norm(cr.firstFamily);
        const lastWord = family.split(' ').pop();
        const authorOk = !family || norm(s.authors).includes(family) || (lastWord && norm(s.authors).includes(lastWord));
        if (Math.max(score, score2) < 0.8 || !yearOk || !authorOk) {
          doiCell = `FAIL: metadata mismatch (title ${Math.max(score, score2).toFixed(2)}, year ${cr.year}, first author ${cr.firstFamily})`;
          notes.push(`Crossref: ${cr.authors} (${cr.year}). ${cr.title}${cr.subtitle ? ': ' + cr.subtitle : ''}. ${cr.container} ${cr.volume ?? ''}(${cr.issue ?? ''}) ${cr.page ?? ''}`);
          failures++;
        } else {
          doiCell = 'ok';
          doiOk = true;
          const venueNote = `${cr.container} ${cr.volume ?? ''}${cr.issue ? `(${cr.issue})` : ''}${cr.page ? `, ${cr.page}` : ''}`;
          if (details) notes.push(`Crossref: ${cr.authors} (${cr.year}). ${cr.title}. ${venueNote}`);
        }
      } else {
        doiCell = 'ok (registered; no Crossref record)';
        doiOk = true;
      }
    }
    if (s.pmid) {
      const pm = await pubmedSummary(String(s.pmid));
      if (!pm) {
        notes.push(`FAIL: PMID ${s.pmid} not found`);
        failures++;
      } else if (titleScore(pm.title, s.title) < 0.8) {
        notes.push(`FAIL: PMID ${s.pmid} title is "${pm.title}"`);
        failures++;
      }
    }
    const work = { doi: s.doi, altIds: cr?.altIds ?? [], resourceUrl: cr?.resourceUrl };
    let link = await urlStatus(s.url);
    let linkCell;
    if (link.ok) {
      let m = landingMatch(s, link, work);
      if (!m.ok && link.via === 'fetch') {
        // A 200 whose HTML is only a script shell or a bot check: let a real browser render the page.
        const c = await chromeStatus(s.url);
        if (c.status >= 200 && c.status < 400) {
          const rendered = { ok: true, status: c.status, via: 'chrome', title: c.title, finalUrl: c.finalUrl, metas: c.metas };
          const m2 = landingMatch(s, rendered, work);
          if (m2.ok) {
            link = rendered;
            m = m2;
          }
        }
      }
      if (m.ok) {
        linkCell = `ok ${link.status} (${link.via}): ${m.how}`;
        landing[m.how.startsWith('DOI') ? 'byDoi' : m.how.startsWith('final URL') ? 'byUrl' : 'byTitle']++;
      } else if (doiOk && /doi\.org\//.test(s.url)) {
        // The DOI resolved (registry and Crossref agree on the work) but the publisher's page did
        // not let us read its title or metadata: usually a bot check served with status 200.
        linkCell = `warn ${link.status} (${link.via}): page unreadable, ${m.how}; DOI verified`;
        landing.blocked++;
        lists.blocked.push(s.id);
        warnings++;
      } else {
        linkCell = `FAIL ${link.status} (${link.via}): ${m.how}`;
        landing.wrong++;
        lists.wrong.push(s.id);
        failures++;
      }
    } else if (doiOk && urlCarriesWork(link.finalUrl, work)) {
      // The DOI resolved to the publisher's page for this very work; the publisher then refused the automated reader.
      linkCell = `warn ${link.status}: resolves to the publisher page for this work (final URL carries ${urlCarriesWork(link.finalUrl, work)}: ${link.finalUrl}), which refuses automated readers; DOI verified`;
      landing.byUrlBlocked++;
      lists.byUrlBlocked.push(s.id);
      warnings++;
    } else if (doiOk) {
      linkCell = `warn ${link.status}: site refuses automated access${link.finalUrl ? ` (final URL ${link.finalUrl})` : ''}; DOI verified`;
      landing.blocked++;
      lists.blocked.push(s.id);
      warnings++;
    } else {
      linkCell = `FAIL ${link.status} ${link.error ?? ''}`.trim();
      landing.wrong++;
      lists.wrong.push(s.id);
      failures++;
    }
    if (s.doi && !/^https:\/\/doi\.org\//.test(s.url)) {
      notes.push(`prefer the DOI link: url is ${s.url}, DOI link is https://doi.org/${s.doi}`);
      landing.notDoiLink++;
      warnings++;
    }
    report(`- ${s.id}\n    DOI: ${doiCell}\n    link: ${linkCell} ${s.url}${link.title ? `\n    page title: ${link.title}` : ''}`);
    for (const n of notes) report(wrap(n));
    if (details) {
      const a = await abstractFor(s.doi, s.pmid);
      if (a.abstract) report(`    abstract (${a.source}${a.pmid ? `, PMID ${a.pmid}` : ''}):\n${wrap(a.abstract.slice(0, 2400), 110, '      ')}`);
      else report('    abstract: none found');
    }
    summary.push(`| ${s.id} | ${doiCell} | ${linkCell} | ${notes.join('; ').replace(/\|/g, '/')} |`);
    await sleep(300);
  }
  report(`\n${sources.length} sources, ${failures} failure(s), ${warnings} warning(s).`);
  report(`Landing pages: ${landing.byDoi} carry the cited DOI in their metadata, ${landing.byTitle} match by title, ${landing.byUrl} resolve to a publisher URL that carries the cited DOI, ${landing.byUrlBlocked} resolve to such a URL but the publisher refuses automated readers, ${landing.blocked} could not be read at all (DOI verified in the registry and Crossref), ${landing.wrong} do not land on the cited work, ${landing.notDoiLink} entries use a link other than the DOI.`);
  if (lists.blocked.length) report(`Could not be read at all (registry and Crossref only): ${lists.blocked.join(', ')}`);
  if (lists.wrong.length) report(`Do not land on the cited work: ${lists.wrong.join(', ')}`);
  summary.push('', `Landing pages: ${landing.byDoi} by DOI metadata, ${landing.byTitle} by title, ${landing.byUrl} by URL, ${landing.byUrlBlocked} by URL (body blocked), ${landing.blocked} unreadable (DOI verified), ${landing.wrong} wrong, ${landing.notDoiLink} not DOI links.`);
  return failures;
}

async function lookupCandidates(fileArg) {
  const list = YAML.parse(readFileSync(join(root, fileArg), 'utf8')) ?? [];
  report(`Looking up ${list.length} candidate sources from ${fileArg}\n`);
  for (const c of list) {
    report(`================================================================\n# ${c.key}${c.claim ? `\n  claim to check: ${c.claim}` : ''}`);
    let cr = null;
    if (c.doi) {
      cr = await crossrefWork(c.doi);
      if (!cr) report(`  DOI ${c.doi}: NOT FOUND in Crossref (registered: ${await doiRegistered(c.doi)})`);
    }
    if (!cr && c.query) {
      const hits = await crossrefQuery(c.query, 3);
      report(`  Crossref search "${c.query}":`);
      hits.forEach((h, i) => report(`   ${i + 1}. ${h.doi} | ${h.authors.slice(0, 160)} (${h.year}). ${h.title}${h.subtitle ? ': ' + h.subtitle : ''}. ${h.container} ${h.volume ?? ''}(${h.issue ?? ''}) ${h.page ?? ''} [${h.type}]`));
      const best = hits.find((h) => titleScore(h.title, c.query) > 0.5) ?? hits[0];
      if (best && c.query && norm(c.query).includes(norm(best.firstFamily))) cr = best;
    }
    if (!cr && c.pubmed) {
      const ids = await pubmedSearch(c.pubmed);
      report(`  PubMed search "${c.pubmed}": ${ids.join(', ') || 'no hits'}`);
      for (const id of ids.slice(0, 2)) {
        const pm = await pubmedSummary(id);
        if (pm) report(`   PMID ${id}: ${pm.title} | ${pm.source} ${pm.pubdate} | doi ${pm.doi ?? '-'}`);
      }
    }
    if (cr) {
      report(`  MATCH: ${cr.authors}\n    (${cr.year}${cr.online && cr.online !== cr.year ? `, online ${cr.online}` : ''}). ${cr.title}${cr.subtitle ? ': ' + cr.subtitle : ''}.\n    ${cr.container}, ${cr.volume ?? '-'}(${cr.issue ?? '-'}), ${cr.page ?? '-'}. doi:${cr.doi} [${cr.type}; ${cr.publisher}]`);
      const a = await abstractFor(cr.doi, c.pmid);
      const abs = a.abstract || cr.abstract;
      if (abs) report(`  abstract (${a.abstract ? a.source : 'Crossref'}${a.pmid ? `, PMID ${a.pmid}` : ''}):\n${wrap(abs.slice(0, 3000), 110, '    ')}`);
      else report('  abstract: none found');
    }
    if (c.url) {
      const u = await urlStatus(c.url);
      report(`  url ${c.url}: ${u.ok ? 'ok' : 'FAIL'} ${u.status} ${u.title ?? ''}`);
    }
    await sleep(400);
  }
  return 0;
}

/** Rendered text of a page in headless Chrome (for sites that block plain fetches or render with JS). */
async function chromeText(url) {
  try {
    if (!browserPromise) await chromeStatus('about:blank');
    const browser = await browserPromise;
    if (!browser) return { status: 0, text: '' };
    const page = await browser.newPage({ userAgent: UA_BROWSER });
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(3500);
      const text = await page.evaluate(() => document.body?.innerText ?? '');
      return { status: res?.status() ?? 0, text, finalUrl: page.url() };
    } finally {
      await page.close();
    }
  } catch (err) {
    return { status: 0, text: '', error: String(err?.message ?? err) };
  }
}

// Help lines (About page): each entry lists the official page(s) that publish the number and the
// strings that must appear there. status: published lines are on the site and fail the job if no
// source shows them any more; status: candidate lines are looked up (with search hints) only.
async function checkHelplines(fileArg) {
  const list = YAML.parse(readFileSync(join(root, fileArg), 'utf8')) ?? [];
  let failures = 0;
  report(`Checking ${list.length} help lines from ${fileArg}\n`);
  summary.push('| help line | number | result | source |', '|---|---|---|---|');
  const digits = (v) => String(v).replace(/[^0-9]/g, '');
  for (const h of list) {
    const expect = h.expect ?? [h.phone];
    let ok = false;
    let loaded = 0; // sources that answered with a real page (as opposed to timeouts, resets, WAF blocks)
    const challenge = /request is being verified|verify you are (a )?human|just a moment|attention required|checking your browser|captcha|access denied|403 forbidden/i;
    for (const src of h.sources ?? []) {
      const r = await get(src, { browser: true });
      let text = r.ok ? clean(r.body ?? '') : '';
      let via = `fetch ${r.status}`;
      if (r.ok && text.length > 200 && !challenge.test(text)) loaded++;
      const has = (t) => expect.every((e) => t.includes(e) || (digits(e).length >= 3 && digits(t).includes(digits(e))));
      if (!has(text)) {
        const c = await chromeText(src);
        if (c.text) {
          text = c.text.replace(/\s+/g, ' ');
          via = `chrome ${c.status}`;
          if (c.status >= 200 && c.status < 400 && text.length > 200 && !challenge.test(text) && !(r.ok && text.length > 200)) loaded++;
        } else via += `, chrome ${c.status}${c.error ? ' ' + c.error.slice(0, 80) : ''}`;
      }
      const found = has(text);
      const e0 = expect[0];
      const i = text.indexOf(e0);
      const snippet = i >= 0 ? text.slice(Math.max(0, i - 200), i + 240) : text.slice(0, 240);
      report(`- ${h.id} (${h.phone}) via ${src}: ${via} ${found ? 'FOUND' : 'NOT FOUND'}\n${wrap(snippet, 110, '    ')}`);
      summary.push(`| ${h.id} | ${h.phone} | ${found ? 'found' : 'not found'} (${via}) | ${src} |`);
      if (found) {
        ok = true;
        break;
      }
      await sleep(400);
    }
    // Only lines the site publishes can fail the job (they guard the About page against stale
    // numbers, re-checked weekly). Candidates are still being researched: report and search.
    // A published number fails the job only when a source page loads and no longer shows it; if every
    // source is unreachable from the runner (common for mainland China sites), it is a warning.
    if (!ok && h.status === 'published' && loaded > 0) {
      failures++;
      report(`    ${h.id}: PUBLISHED line not shown on its source pages any more: update or remove it on the About page`);
    } else if (!ok && h.status === 'published') {
      report(`    ${h.id}: warning: every source was unreachable from the runner this time (not counted as a failure)`);
      summary.push(`| ${h.id} | ${h.phone} | warning: sources unreachable | - |`);
    }
    if (!ok && h.status !== 'published') report(`    ${h.id}: candidate, not confirmed yet (not published on the site)`);
    if (!ok) for (const q of h.search ?? []) await searchHint(q);
  }
  return failures;
}

/** For a help line not yet confirmed: list search results so an official page can be found
 *  and added to its sources for the next run (the result pages themselves are never a source). */
async function searchHint(entry) {
  const query = typeof entry === 'string' ? entry : entry.q;
  const mkt = (typeof entry === 'object' && entry.mkt) || 'en-US';
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10&mkt=${mkt}&setlang=${mkt}&cc=${mkt.split('-')[1]}`;
  // Bing result links are redirects (/ck/a?...&u=a1<base64url>); decode them to the real address.
  const real = (href) => {
    try {
      const u = new URL(href).searchParams.get('u');
      if (u && u.startsWith('a1')) return Buffer.from(u.slice(2).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    } catch {}
    return href;
  };
  try {
    if (!browserPromise) await chromeStatus('about:blank');
    const browser = await browserPromise;
    const page = await browser.newPage({ userAgent: UA_BROWSER, locale: mkt });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(2500);
      const hits = await page.evaluate(() =>
        [...document.querySelectorAll('li.b_algo')].slice(0, 8).map((li) => ({
          title: li.querySelector('h2')?.innerText ?? '',
          href: li.querySelector('h2 a')?.href ?? '',
          snippet: (li.querySelector('.b_caption p, .b_lineclamp2, .b_algoSlug')?.innerText ?? '').slice(0, 220),
        })),
      );
      report(`    search "${query}" (${mkt}): ${hits.length} result(s)`);
      for (const r of hits) report(`      - ${r.title} | ${real(r.href)}\n${wrap(r.snippet, 104, '        ')}`);
      // Second engine (DuckDuckGo's HTML endpoint), which handles Chinese queries better here.
      const kl = { 'zh-TW': 'tw-tzh', 'zh-CN': 'cn-zh', 'zh-HK': 'hk-tzh' }[mkt] ?? 'us-en';
      await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=${kl}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(1500);
      const ddg = await page.evaluate(() =>
        [...document.querySelectorAll('.result')].slice(0, 8).map((r) => ({
          title: r.querySelector('.result__a')?.textContent?.trim() ?? '',
          href: r.querySelector('.result__a')?.getAttribute('href') ?? '',
          snippet: (r.querySelector('.result__snippet')?.textContent ?? '').trim().slice(0, 220),
        })),
      );
      const ddgReal = (href) => {
        try {
          const u = new URL(href, 'https://duckduckgo.com').searchParams.get('uddg');
          return u ? decodeURIComponent(u) : href;
        } catch {
          return href;
        }
      };
      report(`    duckduckgo "${query}" (${kl}): ${ddg.length} result(s)`);
      for (const r of ddg) report(`      - ${r.title} | ${ddgReal(r.href)}\n${wrap(r.snippet, 104, '        ')}`);
    } finally {
      await page.close();
    }
  } catch (err) {
    report(`    search "${query}": failed (${String(err?.message ?? err).slice(0, 100)})`);
  }
}

// Quote lookups (content/source-quotes.yml): settle a wording question by reading the source's
// own sentences. Each entry is { id, pattern, urls? } for a sources.yml entry (abstract plus
// article page), { url, pattern } for any page, or { search } for search results with snippets. Notices of reaffirmation, retirement or errata are
// always printed. Informational only: never fails the job.
async function lookupQuotes(fileArg) {
  const entries = YAML.parse(readFileSync(join(root, fileArg), 'utf8')) ?? [];
  const all = YAML.parse(readFileSync(join(root, 'content', 'sources.yml'), 'utf8'));
  const list = Array.isArray(all) ? all : all.sources;
  const NOTICE = /reaffirm|retired|retirement|erratum|errata|expired/i;
  const sentencesOf = (text) => clean(text).split(/(?<=[.!?])\s+(?=[A-Z0-9"“(\[])/);
  const show = (label, text, re) => {
    const hits = sentencesOf(text).filter((x) => re.test(x) || NOTICE.test(x));
    report(`  ${label}: ${hits.length} matching sentence(s)`);
    for (const h of hits.slice(0, 60)) report(wrap(`- ${h.slice(0, 700)}`, 106, '      '));
  };
  for (const e of entries) {
    const re = new RegExp(e.pattern ?? '.', 'i');
    if (e.id) {
      const s = list.find((x) => x.id === e.id);
      if (!s) {
        report(`\n${e.id}: not in content/sources.yml`);
        continue;
      }
      report(`\n${e.id}: ${s.title} (pattern /${re.source}/i)`);
      const { abstract, source } = await abstractFor(s.doi, s.pmid);
      if (abstract) show(`abstract (${source})`, abstract, re);
      else report('  abstract: none found');
      for (const u of [...new Set([s.url, s.doi && `https://doi.org/${s.doi}`, ...(e.urls ?? [])].filter(Boolean))]) {
        const page = await chromeText(u);
        report(`  page ${u} -> ${page.status} ${page.finalUrl ?? ''} (${page.text.length} chars)${page.error ? ' ' + page.error.slice(0, 120) : ''}`);
        if (page.text) show('page', page.text, re);
      }
    } else if (e.search) {
      report(`\nsearch: ${e.search}`);
      await searchHint({ q: e.search, mkt: e.mkt });
    } else if (e.url) {
      report(`\n${e.url} (pattern /${re.source}/i)`);
      const page = await chromeText(e.url);
      report(`  -> ${page.status} ${page.finalUrl ?? ''} (${page.text.length} chars)${page.error ? ' ' + page.error.slice(0, 120) : ''}`);
      if (page.text) show('page', page.text, re);
    }
  }
  return 0;
}

let failures = 0;
const candidates = option('--candidates');
const helplines = option('--helplines');
const quotes = option('--quotes');
if (candidates) failures += await lookupCandidates(candidates);
else if (helplines) failures += await checkHelplines(helplines);
else if (quotes) failures += await lookupQuotes(quotes);
else failures += await checkSources(flag('--details'));

if (process.env.GITHUB_STEP_SUMMARY && summary.length) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Source check\n\n${summary.join('\n')}\n`);
}
if (browserPromise) await (await browserPromise).close().catch(() => {});
process.exit(failures ? 1 : 0);
