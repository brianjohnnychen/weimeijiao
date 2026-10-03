// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://xn--3ys368f86s.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // HTML-aware whitespace compression (Astro 7 defaults to JSX rules, which can drop
  // meaningful spaces between inline elements in English copy).
  compressHTML: true,
  integrations: [mdx()],
  image: {
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
  // Static site: no advanced-routing entrypoint.
  fetchFile: null,
});
