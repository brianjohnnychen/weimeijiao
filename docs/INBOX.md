# INBOX

## 1. Build the whole site (built; READY FOR FINAL PASS 2026-10-04 04:27 Taipei, see STATUS.md; go-live after the final pass)

Build everything in SPEC.md to its definition of done (§10) in one pass, final form, no v1:

1. Scaffold Astro (or Eleventy if you have a strong reason), trilingual routing per §4, layout, design tokens and dark mode per §3, header language switcher, footer with disclaimer.
2. `deploy.yml` building and deploying to GitHub Pages with `CNAME` = `xn--3ys368f86s.com`. Push early so the first deploy runs; note in docs/STATUS.md that Pages settings need enabling if your token cannot do it.
3. Research pass: build `content/sources.yml` from primary sources (SPEC §6, §7), verifying every link. Re-check the legal status lines in §7.5 against current primary sources and record the date checked.
4. Write all pages in §5 natively in Simplified, Traditional (Taiwan usage) and English, with citations.
5. Physical discipline page exactly per §7.
6. About page per §8 with the twelve family photos copied from the showtellshare repo and optimized, gallery and lightbox.
7. AI image pipeline per §9: `content/images.yml` with a prompt and trilingual alt text for every illustration, `images.yml` workflow using secrets `CF_ACCOUNT_ID` and `CF_AI_TOKEN`, placeholder fallback until images exist. If the secrets already exist, run the workflow and review every image.
8. Printables and age-finder quiz per §5.7.
9. SEO: sitemap, robots.txt, hreflang, canonical to `https://xn--3ys368f86s.com`, OG images per locale.
10. Verify (§10), save screenshots, update STATUS.md and RUNLOG.md, then mark this item done.

## 2. Fable audit of the live build (done 2026-10-04, PR #5; see STATUS.md and QA.md section 11)

Brian's audit brief: re-verify every factual claim against its source with the Actions source checker (academic sources only), flag and fix anything unsupported, overstated or mistranslated in all three locales; full UI/UX review at 375 and 1280 in zh-Hans, zh-Hant and en with dark mode and keyboard navigation; anchor link test; confirm every asset is self-hosted and China-safe. Content changes: (1) the site is less about Brian and his family: personal and family references only on the About page, everywhere else a neutral expert voice; (2) the English brand name is WeiMeiJiao, one word, everywhere. Added during the audit: `deploy.yml` runs on every push to `main`.

