// Content linter for the MDX sources in src/content/<locale>/<collection>/<slug>.mdx.
// Runs before the build (fast, no Astro), so writers can check their own files:
//   node scripts/check-content.mjs                    every content file
//   node scripts/check-content.mjs src/content/en/tools/time-out.mdx ...
// Checks: frontmatter shape per collection and page, citation ids exist in content/sources.yml,
// internal links point at real routes and planned anchors, headings carry ids, no em/en dashes
// or draft markers, and locale vocabulary (zh-Hant: Taiwan forms and terms; zh-Hans: no
// Traditional characters or Taiwan-only terms). The post-build link test is the final word on
// anchors; this catches mistakes early. Exit code 1 on any error.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import * as OpenCC from 'opencc-js';
import { parseAuthors } from '../src/lib/cite-text.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src', 'content');
const LOCALES = ['zh-hans', 'zh-hant', 'en'];
const PHASES = ['0-12-months', '1-3-years', '3-5-years', '5-7-years', '7-10-years', '10-12-years'];
const TOOLS = ['connection-time', 'clear-expectations', 'specific-praise', 'planned-ignoring', 'redirection', 'choices', 'when-then', 'natural-consequences', 'logical-consequences', 'time-in', 'time-out', 'privilege-removal', 'problem-solving', 'routines', 'family-meetings', 'repair'];
const SITUATIONS = ['tantrums', 'public-meltdowns', 'hitting-biting', 'sibling-fighting', 'bedtime', 'mealtime', 'screens', 'lying', 'ignores-me', 'defiance', 'whining', 'homework', 'grandparents'];
const EDGE_CASES = ['refuses-time-out', 'aggression', 'public-places', 'siblings', 'caregivers-disagree', 'grandparents', 'dangerous-behavior', 'developmental-differences', 'preteens', 'not-working'];
const EVIDENCE = ['strong', 'moderate', 'emerging', 'contested'];
const ICONS = ['wake', 'toilet', 'wash', 'teeth', 'dress', 'breakfast', 'shoes', 'backpack', 'play', 'dinner', 'bath', 'pajamas', 'book', 'sleep', 'tidy', 'homework'];
const PRINTABLES = ['age-finder', ...PHASES.map((p) => `summary-${p}`), ...PHASES.map((p) => `learning-${p}`), 'routine-chart', 'calm-down-plan', 'family-rules'];

const SOURCE_LIST = YAML.parse(readFileSync(join(root, 'content', 'sources.yml'), 'utf8')) ?? [];
const sources = new Set(SOURCE_LIST.map((s) => s.id));
const sourceById = new Map(SOURCE_LIST.map((s) => [s.id, s]));
const images = new Set((YAML.parse(readFileSync(join(root, 'content', 'images.yml'), 'utf8'))?.images ?? YAML.parse(readFileSync(join(root, 'content', 'images.yml'), 'utf8')) ?? []).map((i) => i.id));

// Anchors that page templates always render (see src/pages and src/layouts).
const TEMPLATE_ANCHORS = {
  '/': ['main', 'home-title', 'core-idea', 'ages', 'ages-title', ...PHASES.map((p) => `age-${p}`), 'start-here', 'entries-title', ...['approach', 'problem', 'littleTime', 'toolbox', 'learning', 'physical', 'research', 'printables'].map((k) => `entry-${k}`), 'about-this-site', 'about-title'],
  '/toolbox/': ['evidence-levels', ...EVIDENCE.map((e) => `evidence-${e}`), ...TOOLS.flatMap((t) => [t, `${t}-title`, `${t}-how`, `${t}-ages`, `${t}-evidence`, `${t}-mistakes`, `${t}-say`])],
  '/situations/': SITUATIONS.flatMap((s) => [s, `${s}-title`, `${s}-now`, `${s}-why`, `${s}-say`, `${s}-prevent`, `${s}-help`]),
  '/research/': ['bibliography', 'bibliography-heading', ...['programs', 'techniques', 'physical', 'development', 'everyday', 'learning'].map((g) => `group-${g}`), ...[...sources].map((id) => `src-${id}`)],
  '/printables/': ['quiz', 'summaries', 'learning', 'tools', ...PRINTABLES.map((p) => `printable-${p}`)],
  '/by-age/': ['phases', 'phases-title', ...PHASES.map((p) => `phase-${p}`)],
  '/learning/': ['by-age', ...PHASES.map((p) => `learning-${p}`)],
  '/about/': ['photos', ...Array.from({ length: 12 }, (_, i) => `photo-${i + 1}`)],
  '/sources/': ['all', 'all-heading', ...['programs', 'techniques', 'physical', 'development', 'everyday', 'learning'].map((g) => `group-${g}`), ...[...sources].map((id) => `src-${id}`)],
};
for (const p of PHASES) {
  TEMPLATE_ANCHORS[`/by-age/${p}/`] = ['start', 'printable'];
  TEMPLATE_ANCHORS[`/learning/${p}/`] = ['start', 'printable'];
}
for (const p of ['/approach/', '/little-time/']) TEMPLATE_ANCHORS[p] = ['start'];
TEMPLATE_ANCHORS['/printables/age-finder/'] = ['quiz', 'scoring', ...Array.from({ length: 10 }, (_, i) => `q-q${i + 1}`)];
TEMPLATE_ANCHORS['/printables/routine-chart/'] = ['morning', 'evening'];
TEMPLATE_ANCHORS['/printables/calm-down-plan/'] = ['grown-up'];
TEMPLATE_ANCHORS['/printables/family-rules/'] = ['poster', 'how'];
for (const p of PHASES) {
  TEMPLATE_ANCHORS[`/printables/summary-${p}/`] = ['normal', 'works', 'backfires', 'say'];
  TEMPLATE_ANCHORS[`/printables/learning-${p}/`] = ['everyday', 'talk', 'avoid'];
}
// Anchors the writer brief plans for pages being written in parallel (docs: the brief's anchor map).
const PLANNED = {
  '/approach/': ['why', 'core', 'attention', 'instructions', 'ignoring', 'consequences', 'follow-through', 'getting-started', 'programs', 'chinese-families', 'edge-cases', ...EDGE_CASES, 'get-help'],
  '/little-time/': ['principle', 'short-time-out', 'privilege-removal', 'when-then', 'planned-ignoring', 'routines', 'effort-table', 'physical-discipline', 'what-studies-found', 'bottom-line'],
  '/physical-discipline/': ['safety-vs-punishment', 'safety-holds', 'majority-view', 'minority-view', 'agreement', 'disagreement', 'major-bodies', 'decide', 'warning-signs', 'instead', 'repair', 'law'],
  '/research/': ['how-to-read', 'study-types', 'correlation', 'effect-sizes', 'evidence-levels', 'limits'],
  '/about/': ['story', 'why', 'sister-site', 'disclaimer', 'get-help', 'help-lines'],
  '/sources/': ['intro'],
  '/toolbox/': ['intro', 'how-to-use'],
  '/situations/': ['intro', 'first-aid'],
  '/by-age/': ['intro', 'how-to-use'],
  '/learning/': ['intro', 'principles', 'evidence-notes'],
  '/printables/': ['intro'],
  '/': ['intro'],
};
for (const p of PHASES) {
  PLANNED[`/by-age/${p}/`] = ['normal', 'works', 'backfires', 'say'];
  PLANNED[`/learning/${p}/`] = ['talk', 'read', 'play', 'praise', 'motivation', 'focus', 'numbers', 'sleep-screens', 'homework', 'study', 'evidence'];
}
const ROUTES = new Set(['/', '/by-age/', ...PHASES.map((p) => `/by-age/${p}/`), '/approach/', '/toolbox/', '/situations/', '/little-time/', '/physical-discipline/', '/learning/', ...PHASES.map((p) => `/learning/${p}/`), '/research/', '/printables/', ...PRINTABLES.map((p) => `/printables/${p}/`), '/about/', '/sources/']);

const toTw = OpenCC.Converter({ from: 't', to: 'tw' });
const toCn = OpenCC.Converter({ from: 't', to: 'cn' });
const MAINLAND_IN_HANT = ['質量', '視頻', '屏幕', '數據', '互聯網', '信息', '短信', '打印', '默認', '軟件', '網絡', '鼠標', '博客', '激活', '優化', '程序員', '早教', '點擊', '登錄', '賬號', '用戶', '視屏', '幼兒園大班', '課外班', '學前班', '小學生', '寶媽', '奶爸', '荟萃', '薈萃', '質疑度'];
const TAIWAN_IN_HANS = ['软体', '网路', '列印', '萤幕', '国小', '安亲班', '资讯', '品质', '影片', '幼稚园', '冷气', '计程车', '点选', '登入', '帐号', '使用者', '阿嬷', '阿公', '统合分析', '效果量'];
const BANNED = [
  { re: /[—―⸺⸻]/, label: 'em dash (use a comma, colon, full stop or parentheses)' },
  { re: /–/, label: 'en dash (use a hyphen for ranges)' },
  { re: /WMJ-DRAFT/, label: 'draft marker' },
  { re: /\b(TODO|TBD|FIXME|lorem ipsum|XXX)\b/i, label: 'placeholder text' },
  { re: /\b(Brian|Zoe|Naomi|Kelsea)\b/, label: 'personal names (About page only; every other page is in a neutral expert voice)', unless: (f) => f.includes('/pages/about.mdx') },
  { re: /\b(Wei Mei Jiao|Weimeijiao|WeiMeijiao|Wei-Mei-Jiao)\b/, label: 'English brand name is WeiMeiJiao, one word' },
];

const errors = [];
const warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function anchorsFromBody(body) {
  return [...body.matchAll(/<h[23]\s+id="([^"]+)"/g)].map((m) => m[1]);
}

// Author-year in the sentence (SPEC §6, Citations in the text): "Gershoff and Grogan-Kaylor (2016)",
// "Leijten et al. (2019)", "Gershoff 與 Grogan-Kaylor（2016）", "Leijten 等人（2019）" must match a source cited
// in the same sentence: the year, and the first surname for a person author. An organization or an all-caps
// name is checked on the year alone. Sentence: from the previous terminator to the next one, plus any
// citation markers that follow it (English markers sit after the full stop).
const SENTENCE_END = /[.!?。！？]/;
const MARKERS_AHEAD = /^(?:\s*(?:<Cite\s+id=["'][^"']+["']\s*\/>|\[\[cite:[^\]]+\]\]))+/;
function sentenceWindow(text, at, from = at) {
  let start = at;
  while (start > 0 && !SENTENCE_END.test(text[start - 1]) && text[start - 1] !== '\n') start--;
  // Markers right after the previous terminator belong to the previous sentence.
  const lead = MARKERS_AHEAD.exec(text.slice(start));
  if (lead) start += lead[0].length;
  let end = from; // scan forward from the end of the author-year itself, so "et al." does not end the sentence
  while (end < text.length && !SENTENCE_END.test(text[end]) && text[end] !== '\n') end++;
  // Markers right after the terminator belong to this sentence (English style); a marker before 。 is inside already.
  let tail = end + 1;
  for (;;) {
    const rest = text.slice(tail);
    const m = MARKERS_AHEAD.exec(rest);
    if (!m) break;
    tail += m[0].length;
  }
  return text.slice(start, tail);
}
function markerIdsIn(windowText) {
  return [...windowText.matchAll(/<Cite\s+id=["']([^"']+)["']\s*\/>|\[\[cite:([^\]]+)\]\]/g)].map((m) => m[1] ?? m[2]);
}
const SENTENCE_STARTERS = new Set(['When', 'In', 'As', 'The', 'A', 'An', 'But', 'And', 'So', 'If', 'Across', 'Among', 'For', 'Both', 'Even', 'Then', 'Yet', 'Still', 'Once', 'After', 'Before', 'While', 'Because', 'Although', 'Though', 'Since', 'Unless', 'Until', 'Whether', 'What', 'Why', 'How', 'Where', 'That', 'This', 'These', 'Those', 'Here', 'There', 'Later', 'Earlier', 'Meanwhile', 'Instead', 'Indeed', 'Finally', 'First', 'Second', 'Third', 'Next', 'Now', 'Today', 'Only', 'Most', 'Many', 'Some', 'Few', 'Several', 'Two', 'Three', 'One', 'Another', 'Other', 'Each', 'Every', 'No', 'Not', 'Nor', 'Or', 'Also', 'Again', 'Perhaps', 'Of', 'On', 'At', 'By', 'With', 'From', 'To', 'Into', 'Over', 'Under', 'About', 'Through', 'During', 'Without', 'Within', 'Between', 'Against', 'Like', 'Unlike', 'Rather', 'Whereas', 'Say', 'Ask', 'Keep', 'Let', 'Make', 'Start', 'Use', 'Look', 'Think', 'Notice', 'Compare', 'Consider', 'Take', 'Try', 'Read', 'See', 'Note', 'Researchers', 'Parents', 'Children', 'Mothers', 'Fathers', 'Toddlers', 'Preschoolers', 'Babies', 'Preteens', 'Teens', 'Studies', 'Research', 'Evidence', 'Data']);
const AUTHOR_YEAR = {
  en: /\b([A-Z][A-Za-z'’-]+(?:(?: (?:and|&) | et al\.)[A-Z]?[A-Za-z'’-]*)?) \((\d{4})[a-z]?\)/g,
  zh: /([A-Z][A-Za-z'’-]+(?: (?:和|與) [A-Z][A-Za-z'’-]+| 等人?)?|[一-鿿]{2,}(?:學會|学会|委員會|委员会|協會|协会|組織|组织|中心|學院|学院|部))（(\d{4})[a-z]?）/g,
};
function checkAuthorYears(F, locale, text, where) {
  const re = locale === 'en' ? AUTHOR_YEAR.en : AUTHOR_YEAR.zh;
  for (const m of text.matchAll(re)) {
    const [whole, namePart, year] = m;
    const before = text.slice(Math.max(0, m.index - 40), m.index);
    // Skip "Comment on Gershoff (2002)"-style quotations inside titles, and years that are not citations (e.g. "the 2016 statement" has no parentheses).
    const window = sentenceWindow(text, m.index, m.index + whole.length);
    const ids = markerIdsIn(window).filter((id) => sourceById.has(id));
    const surname = namePart.split(/ (?:and|&|和|與) | et al\.| 等/)[0].trim();
    const isPerson = /^[A-Z][a-z]/.test(surname) && !/^(?:American|National|International|World|Council|Committee|Academy|Society|Association|Institute|Centers?|Department|Organization|Organisation|Royal|Canadian|British|Australian|European)$/.test(surname) && !/[一-鿿]/.test(surname) && !/^[A-Z]{2,}$/.test(surname);
    // "The American Academy of Pediatrics (2018)": a capitalized phrase (with of/for/on/and/the connectors) right before the
    // name makes it an organization, checked on the year alone. Sentence starters such as "When" do not count.
    const preMatch = /((?:(?:[A-Z][A-Za-z'’-]+|of|for|on|and|the|de|du|des|et|&) )+)$/.exec(text.slice(Math.max(0, m.index - 100), m.index));
    const orgPhrase = !!preMatch && preMatch[1].trim().split(' ').some((w) => /^[A-Z]/.test(w) && !SENTENCE_STARTERS.has(w)) && !/\b(?:and|&)\s*$/.test(before);
    if (!ids.length) { err(F, `${where}: "${whole}" names a study but no citation marker sits in the same sentence`); continue; }
    const byYear = ids.map((id) => sourceById.get(id)).filter((src) => String(src.year) === year);
    if (!byYear.length) { err(F, `${where}: "${whole}" does not match the year of any source cited in that sentence (${ids.join(', ')})`); continue; }
    if (isPerson && !orgPhrase) {
      const hit = byYear.some((src) => parseAuthors(src.authors).authors.some((a) => a.surname.toLowerCase() === surname.toLowerCase() || a.surname.toLowerCase().endsWith(' ' + surname.toLowerCase())));
      if (!hit) err(F, `${where}: "${whole}" names ${surname}, who is not an author of the source cited in that sentence (${byYear.map((x) => x.id).join(', ')})`);
    }
  }
}

// Anchors defined by content: MDX headings per route (all locales share ids).
const files = walk(contentDir);
const contentAnchors = {};
const routeOf = (collection, slug) => {
  if (collection === 'phases') return `/by-age/${slug}/`;
  if (collection === 'learning') return `/learning/${slug}/`;
  if (collection === 'tools') return '/toolbox/';
  if (collection === 'situations') return '/situations/';
  const map = { home: '/', 'by-age': '/by-age/', approach: '/approach/', toolbox: '/toolbox/', situations: '/situations/', 'little-time': '/little-time/', 'physical-discipline': '/physical-discipline/', learning: '/learning/', research: '/research/', printables: '/printables/', about: '/about/', sources: '/sources/', 'age-finder': '/printables/age-finder/', 'routine-chart': '/printables/routine-chart/', 'calm-down-plan': '/printables/calm-down-plan/', 'family-rules': '/printables/family-rules/' };
  return map[slug];
};
const parsed = new Map();
for (const f of files) {
  const rel = relative(contentDir, f);
  const [locale, collection, name] = rel.split('/');
  const slug = name.replace(/\.mdx$/, '');
  const text = readFileSync(f, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  let data = null;
  let body = '';
  if (m) {
    try {
      data = YAML.parse(m[1]);
    } catch (e) {
      data = { __error: String(e.message).split('\n')[0] };
    }
    body = m[2];
  }
  parsed.set(f, { rel, locale, collection, slug, data, body, text });
  const route = routeOf(collection, slug);
  if (route) (contentAnchors[route] ??= new Set()), anchorsFromBody(body).forEach((a) => contentAnchors[route].add(a));
}
const anchorsFor = (route) => new Set([...(TEMPLATE_ANCHORS[route] ?? []), ...(PLANNED[route] ?? []), ...(contentAnchors[route] ?? [])]);

const targets = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const selected = targets.length ? targets.map((t) => join(root, t)) : files;

const strings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
};
const count = (f, v, name, min, max) => {
  if (!Array.isArray(v)) return err(f, `${name} must be a list`);
  if (v.length < min || v.length > max) err(f, `${name} has ${v.length} items (allowed ${min}-${max})`);
  v.forEach((x, i) => typeof x !== 'string' && err(f, `${name}[${i}] must be a string`));
};
const str = (f, v, name, { min = 1, max = Infinity } = {}) => {
  if (typeof v !== 'string' || !v.trim()) return err(f, `${name} is missing or not a string`);
  if (v.length < min || v.length > max) err(f, `${name} length ${v.length} (allowed ${min}-${max})`);
};

function checkLink(f, to, where) {
  if (/^tel:\+?[0-9-]+$/.test(to)) return; // tap-to-call links for help lines
  if (/^https?:\/\//.test(to)) {
    if (!/^https:\/\/(showtellshare\.org|doi\.org)\b/.test(to)) warn(f, `${where}: external link ${to} (only DOIs and showtellshare.org are expected in copy)`);
    return;
  }
  if (to.startsWith('#')) return; // same-page anchor: checked by the post-build link test
  const [path, hash] = to.split('#');
  if (!path.startsWith('/') || !path.endsWith('/')) return err(f, `${where}: link "${to}" must be a locale-neutral path starting and ending with /`);
  if (/^\/(en|zh-hant)\//.test(path)) return err(f, `${where}: link "${to}" must not include a locale prefix`);
  if (!ROUTES.has(path)) return err(f, `${where}: link "${to}": no such page`);
  if (hash && !anchorsFor(path).has(hash)) err(f, `${where}: link "${to}": no planned anchor #${hash} on ${path}`);
  if (!hash && !['/printables/age-finder/', '/printables/routine-chart/', '/printables/calm-down-plan/', '/printables/family-rules/', ...PRINTABLES.map((p) => `/printables/${p}/`)].includes(path)) warn(f, `${where}: link "${to}" goes to the top of a page; deep-link to the section it refers to`);
}

function checkText(f, locale, text, where) {
  for (const b of BANNED) if (b.re.test(text) && !(b.unless && b.unless(f))) err(f, `${where}: ${b.label}`);
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\[\[cite:[^\]]+\]\]/g, '').replace(/\]\([^)]+\)/g, ']');
  if (locale === 'zh-hant') {
    const conv = toTw(plain);
    if (conv !== plain) {
      for (let i = 0; i < plain.length; i++) if (plain[i] !== conv[i]) {
        err(f, `${where}: zh-Hant character form "${plain.slice(Math.max(0, i - 3), i + 4)}" (Taiwan form: "${conv.slice(Math.max(0, i - 3), i + 4)}")`);
        break;
      }
    }
    if (/[一-鿿]/.test(plain) && toCn(plain) === plain && plain.replace(/[^一-鿿]/g, '').length > 30) warn(f, `${where}: text looks like Simplified Chinese`);
    for (const w of MAINLAND_IN_HANT) if (plain.includes(w)) err(f, `${where}: mainland term "${w}" in zh-Hant`);
    if (/[“”]/.test(plain)) warn(f, `${where}: zh-Hant uses 「」 quotes, not “”`);
  } else if (locale === 'zh-hans') {
    const conv = toCn(plain);
    if (conv !== plain) {
      for (let i = 0; i < plain.length; i++) if (plain[i] !== conv[i]) {
        err(f, `${where}: Traditional character in zh-Hans "${plain.slice(Math.max(0, i - 3), i + 4)}"`);
        break;
      }
    }
    for (const w of TAIWAN_IN_HANS) if (plain.includes(w)) err(f, `${where}: Taiwan term "${w}" in zh-Hans`);
    if (/[「」]/.test(plain)) warn(f, `${where}: zh-Hans uses “” quotes, not 「」`);
  } else if (/[一-鿿]/.test(plain.replace(/魏美娇|魏美嬌/g, ''))) warn(f, `${where}: Chinese characters in English copy`);
  for (const m of text.matchAll(/\[\[cite:([^\]]+)\]\]/g)) if (!sources.has(m[1])) err(f, `${where}: unknown source id "${m[1]}" (not in content/sources.yml)`);
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) checkLink(f, m[2], where);
  // Two links joined by 和/and read as one long name when either name has 和/and in it
  // ("routines and visual schedules and bedtime battles"): join them with ，以及 / ", and".
  const LINK = String.raw`(?:<L\s+to="[^"]*">([^<]*)</L>|\[([^\]]+)\]\([^)\s]+\))`;
  for (const m of text.matchAll(new RegExp(`${LINK}\\s*(和|与|與|及|and)\\s*${LINK}`, 'g'))) {
    const [a, b, join] = [m[1] ?? m[2], m[4] ?? m[5], m[3]];
    const has = (name) => (join === 'and' ? /\band\b/.test(name) : /[和与與及]/.test(name));
    if (has(a) || has(b)) err(f, `${where}: links "${a}" ${join} "${b}" read as one name; join them with ${locale === 'en' ? '", and"' : '"，以及"'}`);
  }
}

for (const f of selected) {
  const p = parsed.get(f);
  if (!p) {
    err(relative(root, f), 'not a content file under src/content/<locale>/<collection>/');
    continue;
  }
  const { rel, locale, collection, slug, data, body } = p;
  const F = `src/content/${rel}`;
  if (!LOCALES.includes(locale)) err(F, `unknown locale folder ${locale}`);
  if (!data) {
    err(F, 'missing frontmatter (--- yaml --- at the top)');
    continue;
  }
  if (data.__error) {
    err(F, `frontmatter YAML does not parse: ${data.__error}`);
    continue;
  }
  const d = data;
  // Shape per collection (mirrors src/content.config.ts) and per page template.
  if (collection === 'phases') {
    str(F, d.description, 'description', { min: 40, max: 200 });
    str(F, d.lede, 'lede');
    count(F, d.start, 'start', 3, 5);
    count(F, d.summary?.normal, 'summary.normal', 3, 5);
    count(F, d.summary?.works, 'summary.works', 3, 6);
    count(F, d.summary?.backfires, 'summary.backfires', 2, 5);
    count(F, d.summary?.say, 'summary.say', 3, 6);
    if (!Array.isArray(d.tools) || d.tools.length < 3 || d.tools.some((t) => !TOOLS.includes(t))) err(F, `tools must list 3+ of: ${TOOLS.join(', ')}`);
    if (!Array.isArray(d.situations) || d.situations.length < 2 || d.situations.some((t) => !SITUATIONS.includes(t))) err(F, `situations must list 2+ of: ${SITUATIONS.join(', ')}`);
    for (const id of ['normal', 'works', 'backfires', 'say']) if (!anchorsFromBody(body).includes(id)) err(F, `body needs <h2 id="${id}">`);
  } else if (collection === 'learning') {
    str(F, d.description, 'description', { min: 40, max: 200 });
    str(F, d.lede, 'lede');
    count(F, d.start, 'start', 3, 5);
    count(F, d.summary?.everyday, 'summary.everyday', 3, 6);
    count(F, d.summary?.talk, 'summary.talk', 2, 5);
    count(F, d.summary?.avoid, 'summary.avoid', 2, 4);
  } else if (collection === 'tools') {
    str(F, d.title, 'title');
    str(F, d.summary, 'summary');
    if (!Array.isArray(d.ages) || !d.ages.length || d.ages.some((a) => !PHASES.includes(a))) err(F, 'ages must list phases');
    str(F, d.agesNote, 'agesNote');
    if (!EVIDENCE.includes(d.evidence)) err(F, `evidence must be one of ${EVIDENCE.join(', ')}`);
    count(F, d.how, 'how', 3, 8);
    count(F, d.mistakes, 'mistakes', 2, 6);
    count(F, d.say, 'say', 2, 5);
    if ((d.related ?? []).some((t) => !TOOLS.includes(t) || t === slug)) err(F, 'related must list other tool slugs');
    if ((d.situations ?? []).some((t) => !SITUATIONS.includes(t))) err(F, 'situations must list situation slugs');
    if (!body.trim()) err(F, 'body (the evidence paragraph) is empty');
  } else if (collection === 'situations') {
    str(F, d.title, 'title');
    str(F, d.summary, 'summary');
    if (!Array.isArray(d.ages) || !d.ages.length || d.ages.some((a) => !PHASES.includes(a))) err(F, 'ages must list phases');
    count(F, d.now, 'now', 3, 7);
    count(F, d.say, 'say', 2, 5);
    count(F, d.prevent, 'prevent', 2, 6);
    count(F, d.help, 'help', 1, 5);
    if (!Array.isArray(d.tools) || !d.tools.length || d.tools.some((t) => !TOOLS.includes(t))) err(F, 'tools must list tool slugs');
    if ((d.related ?? []).some((t) => !SITUATIONS.includes(t) || t === slug)) err(F, 'related must list other situation slugs');
    if (!body.trim()) err(F, 'body (why it happens) is empty');
  } else if (collection === 'pages') {
    str(F, d.title, 'title');
    str(F, d.description, 'description', { min: 40, max: 200 });
    if (slug === 'home') {
      for (const k of ['lede', 'coreIdea', 'ctaAge', 'ctaProblem', 'agesTitle', 'agesLede', 'entriesTitle', 'aboutTitle']) str(F, d[k], k);
      for (const k of ['approach', 'problem', 'littleTime', 'toolbox', 'learning', 'physical', 'research', 'printables']) {
        str(F, d.entries?.[k]?.title, `entries.${k}.title`);
        str(F, d.entries?.[k]?.text, `entries.${k}.text`);
      }
    }
    if (slug === 'research') {
      for (const k of ['bibliographyTitle', 'bibliographyIntro', 'citedIn', 'pubmed', 'back']) str(F, d[k], k);
      for (const k of ['programs', 'techniques', 'physical', 'development', 'everyday', 'learning']) str(F, d.groups?.[k], `groups.${k}`);
    }
    if (slug === 'printables') for (const k of ['quiz', 'summaries', 'learning', 'tools']) str(F, d.groups?.[k], `groups.${k}`);
    if (slug === 'age-finder') {
      if (!Array.isArray(d.questions) || d.questions.length !== 10) err(F, 'questions must have exactly 10 entries');
      (d.questions ?? []).forEach((q, i) => {
        if (q.id !== `q${i + 1}`) err(F, `questions[${i}].id must be q${i + 1}`);
        str(F, q.text, `questions[${i}].text`);
        if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) err(F, `questions[${i}] needs 2-6 options`);
        (q.options ?? []).forEach((o, j) => {
          str(F, o.text, `questions[${i}].options[${j}].text`);
          if (!Array.isArray(o.phases) || !o.phases.length || o.phases.some((x) => !PHASES.includes(x))) err(F, `questions[${i}].options[${j}].phases must list phases`);
        });
      });
      str(F, d.note, 'note');
      count(F, d.scoringSteps, 'scoringSteps', 2, 6);
    }
    if (slug === 'routine-chart') {
      count(F, d.days, 'days', 7, 7);
      for (const k of ['morningTitle', 'eveningTitle', 'tip', 'blankLabel']) str(F, d[k], k);
      for (const k of ['morning', 'evening']) {
        if (!Array.isArray(d[k]) || d[k].length < 3) err(F, `${k} needs 3+ steps`);
        (d[k] ?? []).forEach((s, i) => {
          if (!ICONS.includes(s.icon)) err(F, `${k}[${i}].icon must be one of ${ICONS.join(', ')}`);
          str(F, s.text, `${k}[${i}].text`);
        });
      }
    }
    if (slug === 'calm-down-plan') {
      for (const k of ['nameLabel', 'grownUpTitle']) str(F, d[k], k);
      if (!Array.isArray(d.prompts) || d.prompts.length < 3) err(F, 'prompts needs 3+ entries');
      (d.prompts ?? []).forEach((q, i) => {
        str(F, q.id, `prompts[${i}].id`);
        str(F, q.label, `prompts[${i}].label`);
        if (!Array.isArray(q.examples) || q.examples.length < 2) err(F, `prompts[${i}].examples needs 2+ entries`);
      });
      count(F, d.grownUp, 'grownUp', 3, 8);
    }
    if (slug === 'family-rules') {
      for (const k of ['posterTitle', 'howTitle', 'signLabel']) str(F, d[k], k);
      count(F, d.rules, 'rules', 3, 8);
      if (typeof d.blankRules !== 'number') err(F, 'blankRules must be a number');
      count(F, d.how, 'how', 3, 8);
    }
    if (['approach', 'little-time'].includes(slug) && d.start) count(F, d.start, 'start', 3, 5);
    if (slug === 'approach') for (const e of [...EDGE_CASES, 'edge-cases']) if (!anchorsFromBody(body).includes(e)) err(F, `body needs <h${e === 'edge-cases' ? 2 : 3} id="${e}">`);
  }
  if (d.image && !images.has(d.image)) err(F, `image "${d.image}" is not in content/images.yml`);

  // Body: headings, citations, links, components.
  if (/^#{1,6}\s/m.test(body)) err(F, 'markdown # headings have no id: use <h2 id="..."> or <h3 id="...">');
  for (const m of body.matchAll(/<h([1-6])(\s[^>]*)?>/g)) {
    if (m[1] === '1') err(F, 'no <h1> in content (the page title is the h1)');
    else if (!/\sid="[a-z0-9]+(?:-[a-z0-9]+)*"/.test(m[2] ?? '')) err(F, `<h${m[1]}> needs a kebab-case id`);
  }
  const ids = anchorsFromBody(body);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) err(F, `duplicate heading ids: ${[...new Set(dup)].join(', ')}`);
  for (const m of body.matchAll(/<Cite\s+id=["']([^"']+)["']\s*\/>/g)) if (!sources.has(m[1])) err(F, `unknown source id "${m[1]}" (not in content/sources.yml)`);
  if (/<Cite(?![^>]*\/>)/.test(body)) err(F, '<Cite> must be self-closing: <Cite id="..." />');
  for (const m of body.matchAll(/<L\s+to=["']([^"']+)["']\s*>/g)) checkLink(F, m[1], 'body');
  for (const m of body.matchAll(/\]\((\/[^)\s]*)\)/g)) err(F, `body: use <L to="${m[1]}">…</L> for internal links, not markdown links`);
  for (const m of body.matchAll(/<Say[^>]*>([\s\S]*?)<\/Say>/g)) if (/^\s*["“「'‘『]/.test(m[1])) warn(F, '<Say> adds quote marks itself; drop the quotes inside');
  const tags = [...body.matchAll(/<([A-Z][A-Za-z]*)\b/g)].map((m) => m[1]);
  for (const t of tags) if (!['Cite', 'Say', 'Note', 'L', 'Mixed', 'Effort', 'Gallery'].includes(t)) err(F, `unknown component <${t}>`);
  checkText(F, locale, body, 'body');
  checkAuthorYears(F, locale, body, 'body');
  for (const s of strings(d)) { checkText(F, locale, s, 'frontmatter'); checkAuthorYears(F, locale, s, 'frontmatter'); }
  if (locale !== 'en') for (const s of strings(d.say ?? d.summary?.say ?? [])) if (/^\s*["“「]/.test(s)) warn(F, 'say lines are shown inside quote marks already; drop the quotes');
}

// Cross-locale parity: the same heading ids in every locale.
if (!targets.length) {
  const bySlug = new Map();
  for (const [, p] of parsed) {
    const key = `${p.collection}/${p.slug}`;
    if (!bySlug.has(key)) bySlug.set(key, {});
    bySlug.get(key)[p.locale] = anchorsFromBody(p.body).join(',');
  }
  for (const [key, byLocale] of bySlug) {
    const vals = new Set(Object.values(byLocale));
    if (vals.size > 1) err(`src/content/*/${key}.mdx`, `heading ids differ between locales: ${JSON.stringify(byLocale)}`);
    for (const l of LOCALES) if (!(l in byLocale)) err(`src/content/${l}/${key}.mdx`, 'missing in this locale');
  }
}

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`ERROR    ${e}`);
console.log(`\n${selected.length} file(s) checked: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
