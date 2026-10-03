// Every page of the site (locale-neutral path, plus title and illustration per locale).
// Used by the sitemap, the OG image sources and the QA scripts.
import { LOCALES, type Locale } from '../i18n/locales';
import { t } from '../i18n/ui';
import { PHASES, PRINTABLES } from './site';
import { paths } from './routes';
import { getPage, getPhase, getLearning } from './content';

export interface PageInfo {
  path: string;
  title: Record<Locale, string>;
  image?: string;
}

export async function pageList(): Promise<PageInfo[]> {
  const list: PageInfo[] = [];
  const titled = async (path: string, slug: string, image?: string) => {
    const title = {} as Record<Locale, string>;
    let img = image;
    for (const l of LOCALES) {
      const e = await getPage(l, slug);
      title[l] = e.data.title;
      img = img ?? e.data.image;
    }
    list.push({ path, title, image: img });
  };
  const byLocale = (fn: (l: Locale) => string) => Object.fromEntries(LOCALES.map((l) => [l, fn(l)])) as Record<Locale, string>;

  await titled(paths.home(), 'home', 'home-hero');
  await titled(paths.byAge(), 'by-age');
  for (const p of PHASES) {
    const img = (await getPhase('en', p)).data.image;
    list.push({ path: paths.phase(p), title: byLocale((l) => `${t(l).phaseName[p]} (${t(l).phaseAge[p]})`), image: img });
  }
  await titled(paths.approach(), 'approach');
  await titled(paths.toolbox(), 'toolbox');
  await titled(paths.situations(), 'situations');
  await titled(paths.littleTime(), 'little-time');
  await titled(paths.physical(), 'physical-discipline');
  await titled(paths.learning(), 'learning');
  for (const p of PHASES) {
    const img = (await getLearning('en', p)).data.image;
    const hub = byLocale((l) => t(l).nav.learning);
    list.push({ path: paths.learningPhase(p), title: byLocale((l) => `${hub[l]}: ${t(l).phaseName[p]} (${t(l).phaseAge[p]})`), image: img });
  }
  await titled(paths.research(), 'research');
  await titled(paths.printables(), 'printables');
  for (const slug of PRINTABLES) {
    if (slug.startsWith('summary-') || slug.startsWith('learning-')) {
      const p = slug.replace(/^(summary|learning)-/, '') as (typeof PHASES)[number];
      const kind = slug.startsWith('summary-') ? 'summary' : 'learning';
      const img = kind === 'summary' ? (await getPhase('en', p)).data.image : (await getLearning('en', p)).data.image;
      list.push({
        path: paths.printable(slug),
        title: byLocale((l) => `${kind === 'summary' ? t(l).phase.printable : t(l).learning.printable}: ${t(l).phaseName[p]} (${t(l).phaseAge[p]})`),
        image: img,
      });
    } else {
      await titled(paths.printable(slug), slug);
    }
  }
  await titled(paths.about(), 'about');
  return list;
}
