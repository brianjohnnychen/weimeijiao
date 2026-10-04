// English typography for the built site: straight quotes in visible English text become
// curly quotes and apostrophes ("it's" -> "it’s"). MDX body text is already curled at
// render time; this covers frontmatter strings, which Astro prints as &quot; and &#39;.
// Only text nodes in English (by the lang attribute in effect) are touched. Attributes,
// <script>, <style>, <textarea>, <pre> and <code> are left exactly as they are.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea']);
const VERBATIM = new Set(['pre', 'code', 'kbd', 'samp']);
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'data', 'dfn', 'em', 'i', 'mark', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u']);
const OPENERS = new Set([' ', '\t', '\n', '\r', ' ', '(', '[', '{', '“', '‘', '—', '–', '-', '/']);
const ELISION = /^(?:\d0s|em|tis|twas|til|cause|n)\b/i;
const TOKEN = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+|</g;
const ENTITY = /&(?:quot|#34|#x22|apos|#39|#x27|nbsp|#160|[a-zA-Z0-9#]+);|[\s\S]/gi;

const isWord = (c) => /[\p{L}\p{N}]/u.test(c);

function curl(text, state) {
  let out = '';
  for (const m of text.matchAll(ENTITY)) {
    const tok = m[0];
    const low = tok.toLowerCase();
    let ch = tok;
    if (low === '&quot;' || low === '&#34;' || low === '&#x22;') ch = '"';
    else if (low === '&apos;' || low === '&#39;' || low === '&#x27;') ch = "'";
    if (ch === '"') {
      ch = OPENERS.has(state.prev) ? '“' : '”';
    } else if (ch === "'") {
      const rest = text.slice(m.index + tok.length);
      if (isWord(state.prev)) ch = '’';
      else if (OPENERS.has(state.prev)) ch = ELISION.test(rest) ? '’' : '‘';
      else ch = '’';
    } else if (tok.length > 1) {
      // Another entity: keep it as written; &nbsp; counts as a space for context.
      out += tok;
      state.prev = low === '&nbsp;' || low === '&#160;' ? ' ' : '&';
      continue;
    }
    out += ch;
    state.prev = ch;
  }
  return out;
}

function langOf(attrs, inherited) {
  const m = /\slang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
  return m ? (m[1] ?? m[2] ?? m[3]).toLowerCase() : inherited;
}

export function smartQuotesHtml(html) {
  const stack = []; // { name, lang }
  const state = { prev: ' ' };
  const lower = html.toLowerCase();
  let verbatim = 0;
  let out = '';
  TOKEN.lastIndex = 0;
  let m;
  while ((m = TOKEN.exec(html))) {
    const tok = m[0];
    const name = m[1]?.toLowerCase();
    if (!name) {
      if (tok.startsWith('<')) { out += tok; continue; } // comment, doctype or a stray '<'
      const lang = stack.length ? stack[stack.length - 1].lang : '';
      out += verbatim || !lang.startsWith('en') ? tok : curl(tok, state);
      if (verbatim || !lang.startsWith('en')) state.prev = tok.slice(-1);
      continue;
    }
    const closing = tok.startsWith('</');
    if (!INLINE.has(name)) state.prev = ' ';
    if (closing) {
      out += tok;
      const i = stack.map((e) => e.name).lastIndexOf(name);
      if (i >= 0) {
        for (const e of stack.splice(i)) if (VERBATIM.has(e.name)) verbatim--;
      }
      continue;
    }
    out += tok;
    if (RAW.has(name)) {
      // Copy raw text up to the matching end tag untouched.
      const end = lower.indexOf(`</${name}`, TOKEN.lastIndex);
      const stop = end < 0 ? html.length : end;
      out += html.slice(TOKEN.lastIndex, stop);
      TOKEN.lastIndex = stop;
      continue;
    }
    if (VOID.has(name) || tok.endsWith('/>')) continue;
    const parent = stack.length ? stack[stack.length - 1].lang : '';
    stack.push({ name, lang: langOf(m[2] || '', parent) });
    if (VERBATIM.has(name)) verbatim++;
  }
  return out;
}

async function htmlFiles(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export async function smartQuotesDir(dir) {
  let changed = 0;
  for (const file of await htmlFiles(dir)) {
    const html = await readFile(file, 'utf8');
    const next = smartQuotesHtml(html);
    if (next !== html) {
      await writeFile(file, next);
      changed++;
    }
  }
  return changed;
}

export default function smartQuotes() {
  return {
    name: 'weimeijiao-smart-quotes',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const changed = await smartQuotesDir(fileURLToPath(dir));
        logger.info(`curled English quotes in ${changed} page(s)`);
      },
    },
  };
}
