// sitemap.xml with hreflang alternates for every page in all three locales.
import type { APIRoute } from 'astro';
import { LOCALES, LOCALE_META, localizePath } from '../i18n/locales';
import { absolute } from '../lib/routes';
import { pageList } from '../lib/pages-index';

export const GET: APIRoute = async () => {
  const pages = await pageList();
  const urls: string[] = [];
  for (const page of pages) {
    const alts = LOCALES.map((l) => ({ lang: LOCALE_META[l].lang, href: absolute(localizePath(l, page.path)) }));
    const xDefault = absolute(localizePath('zh-hans', page.path));
    for (const alt of alts) {
      urls.push(
        [
          '  <url>',
          `    <loc>${alt.href}</loc>`,
          ...alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`),
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}"/>`,
          '  </url>',
        ].join('\n'),
      );
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
