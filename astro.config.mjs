// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import smartQuotes from './scripts/smart-quotes.mjs';

export default defineConfig({
  site: 'https://xn--3ys368f86s.com',
  trailingSlash: 'always',
  // Inline the site stylesheet into each page: no render-blocking CSS request (faster first paint on slow networks).
  build: { format: 'directory', inlineStylesheets: 'always' },
  // HTML-aware whitespace compression (Astro 7 defaults to JSX rules, which can drop
  // meaningful spaces between inline elements in English copy).
  compressHTML: true,
  // smartQuotes runs after the pages are written: curly quotes in English frontmatter text.
  integrations: [mdx(), smartQuotes()],
  image: {
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
  // Inline the page scripts (the site script is about 5 KB): no extra request before the banner,
  // theme label and menu are ready. Other assets keep Vite's default 4 KB limit.
  vite: { build: { assetsInlineLimit: (file, content) => (file.endsWith('.js') ? content.length < 16384 : undefined) } },
  // Static site: no advanced-routing entrypoint.
  fetchFile: null,
});
