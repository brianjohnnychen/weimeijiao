# QA

The QA checklist (SPEC §10): fact-check per claim, UI and UX at 375px and 1280px, dark mode, keyboard navigation, no third-party assets, printables, Lighthouse, sources and help lines, and the link test. Every check except the fact-check is a script, so it can be rerun at any time; CI (`.github/workflows/ci.yml`) runs the content lint, the build with QA, the link test, the anchor test and the behavior test on every push.

Latest full run: 2026-10-04 07:20-07:47 UTC, the site-wide flow read-through (section 14). Times below are UTC.

## At a glance

| Check | How to rerun | Latest result |
|---|---|---|
| Content lint | `node scripts/check-content.mjs` | 171 MDX files (57 per locale), 0 errors, 0 warnings |
| Locale parity | `node scripts/parity-test.mjs` (new, in CI) | 57 entries per locale: every page, situation, tool, phase and learning page present in all three locales, frontmatter lists the same length, alt text in every locale for 55 images |
| Build and QA | `npm run build` (Astro, then `scripts/postbuild.mjs`, then `scripts/qa.mjs`) | 120 pages (40 per locale), 0 errors, 0 warnings; 48 PDFs; 120 Open Graph images |
| Link test | `node scripts/link-test.mjs --write` | 20,387 internal links, 14,377 of them to an anchor, 0 broken (block at the end) |
| Anchor test | `node scripts/anchor-test.mjs` | 32 of 32 deep links land on their target (16 kinds of target, now including the Sources page, the 10-12 page and the preteens section; 375px and 1280px) |
| UI check | `node scripts/ui-check.mjs` | 165 page views (18 entries in the page list: the 17 pages plus the new situation section at its anchor), no problems ([report](screenshots/ui-check.md)) |
| Behavior test | `node scripts/behavior-test.mjs` | 81 of 81 checks pass: age finder scoring (now counted in twelfths of a point, so an answer covering four age ranges splits exactly) and flow, lightbox, toolbox filter, language banner, theme, language switcher, no-JavaScript fallbacks, 404, 320px reflow, dark-mode sheets, menu, Research back link, landmarks (section 9) |
| Keyboard test | `node scripts/keyboard-test.mjs` | 33 of 33 checks pass at 375px in all three locales: skip link, every header control with a visible focus ring (with and without the language banner), mobile menu, theme button, table of contents links, photo lightbox, age finder radio groups (section 11) |
| Accessibility audit | axe-core 4.13.0 (WCAG 2.2 AA and best practice), rerun in this pass; html-validate 11.16 in the final pass | 0 axe violations in 363 page runs (all 121 pages at 375px light, 375px dark and 1280px, section 14); html-validate leaves only cosmetic or deliberate messages (section 9) |
| Printables | page limits in `scripts/postbuild.mjs` | 45 one-page sheets (15 per locale) and the 2-page age finder in each locale, all at 100% scale |
| Third-party assets | `scripts/qa.mjs` | none; every font, image and script is served from the site's own domain |
| Lighthouse | `LIGHTHOUSE_BIN=… node scripts/lighthouse.mjs` | all 18 medians (3 runs each) are 98 or higher: performance 100 on every desktop page and on the English mobile pages, 99 on five Chinese mobile pages and 98 on the zh-Hant physical discipline page on mobile; accessibility, best practices and SEO 100 on every page; single mobile runs ranged down to 89 (zh-Hant 3-5 page) while the medians held ([lighthouse.md](lighthouse.md), section 14) |
| Sources | `.github/workflows/sources.yml` (push, weekly, manual) | 176 entries: every DOI registered and its Crossref metadata (title, year, first author) matches the citation; all 176 links are DOI links; landing pages: 8 carry the cited DOI in their citation metadata, 88 resolve to a publisher URL that carries the cited DOI or the publisher's id for the work, 80 resolve to such a URL but the publisher refuses automated readers (the URL still names the work), 0 could not be tied to the work, 0 land on a wrong page (Actions run 37181587302, 2026-10-04 06:01-06:10 UTC) |
| Help lines | same workflow, `helplines` job | all 14 help-line numbers found on their official pages (run 37181587302) |

## 1. Fact-check per claim

Method. Every cited claim on every page was compared, in all three locales, with its entry in `content/sources.yml`: the finding, the key facts (quoted from the abstract or the publisher's page), the evidence level, the ages studied and, for physical discipline, which side of the debate it represents. The entries themselves were checked against Crossref, Europe PMC, PubMed, OpenAlex, Semantic Scholar or the publisher's page by the sources workflow in GitHub Actions; `verified_via` in each entry records how. Eleven separate reviews covered the whole site. Reviewers fixed wording that went beyond a source (causal wording for correlational studies, a single study presented as a general fact, a missing hedge, a missing sample or age range, undated policy statements), and checked Chinese vocabulary per locale (mainland usage for zh-Hans, Taiwan usage for zh-Hant) and US usage for English.

Totals: 776 citation markers per locale, pointing to 141 distinct sources, with the same citations in the same places in all three locales.

| Pages | Cited claims checked per locale | Notes |
|---|---|---|
| Toolbox hub and 16 tools | 63 | AAP 2018 dated everywhere; "consistency" no longer overstated; time-out length and back-up claims limited to what the small studies show |
| Situations hub and 12 situations | 82 | minority view on spanking stated as a minority; sample sizes and "small" added where the studies are small |
| Best-proven approach | 73 | 23 claim fixes: program descriptions limited to what sources state; wait-list comparison described without a randomization claim |
| By age: hub, 0-12 months, 1-3, 3-5 | 106 | preschool findings no longer applied to toddlers; minority spanking view added with its citation |
| By age: 5-7, 7-10 | 83 | recommendations stated as recommendations; correlational findings marked as links |
| When you have little time | 31 | effort figures labelled as our estimates; two citations added |
| Physical discipline | 58 | both sides with the weight of evidence; Gershoff & Grogan-Kaylor (2016) stated exactly (111 effect sizes, 160,927 children, 13 of 17 mean effects significant, all detrimental); no how-to |
| Encouraging learning: hub, 0-12 months, 1-3, 3-5 | 146 | mixed evidence marked; dosage, sample and setting wording matched to sources |
| Encouraging learning: 5-7, 7-10 | 59 | AAP 2016 media guidance scoped to ages 0 to 5, as its abstract states |
| Research, About, printables | 21 | Research lists only sources cited somewhere on the site |

Re-verified on 2026-10-04 by the Fable audit: every one of the 776 citation markers per locale was compared again with its source's abstract as printed by the source checker, in all three locales, and 15 claims were corrected (section 11).

Word-for-word lookups (`content/source-quotes.yml`, `quotes` job) settled the remaining wording questions on 2026-10-03: the AAP 2018 abstract and the AAP's own "Where We Stand: Spanking" page (recorded in sources.yml), the age range of the AAP 2016 media statement (0 to 5 years), the design of kennedy-kramer-2008 (wait-list comparison; randomization not stated) and the sample of roediger-karpicke-2006 (students; ages not stated).

## 2. UI and UX at 375px and 1280px

`scripts/ui-check.mjs` opens 14 pages (home, by-age hub, a phase page, approach, toolbox, situations, little time, physical discipline, learning hub, a learning phase page, research, printables hub, age finder, about) in all three locales at 375px and 1280px in light mode and at 375px in dark mode, plus the home page at 320px, with the browser language set to the page's language. On every full page it checks: no horizontal overflow, no console errors, no failed requests, no broken images, and that the site name in the header is neither cut off nor running under the header controls. Screenshots of the first screen of each view are in [docs/screenshots/](screenshots/). Result: no problems in 129 views.

Repeated on 2026-10-04 by the Fable audit on the rebuilt site (129 views, no problems; screenshots refreshed) with a by-eye pass over 20 of them in all three locales, both widths and dark mode (section 11).

Checked by eye on the screenshots (home, toolbox, research, little time and physical discipline in different locales, widths and themes): this is how the English header problem was found (at 375px the name ran under the language switcher). It is fixed, and the UI check now tests for it. The 21 pages still waiting for their illustration show the designed placeholder (open issue in STATUS.md).

## 2a. Deep links land on their target

The link test proves every `#anchor` exists; `scripts/anchor-test.mjs` proves the browser actually scrolls there. Long pages skip layout for off-screen blocks, and Chinese pages switch to their web fonts after load, and neither may move a deep-linked target out of view. For 13 targets of every kind (headings, citation markers inside paragraphs, tool and situation cards, a section inside a card, bibliography entries) in all three locales, it opens the page at `#id` in a fresh tab at 375px and 1280px, waits for the font switch, and checks the target sits just below whatever is visible of the header. CI runs it on a machine with no Chinese system font, the worst case for the font switch; that run is how a 300-700px jump on the Simplified Chinese toolbox was caught and fixed. Result: 26 of 26 in place.

## 3. Dark mode

The UI check loads every page at 375px with `prefers-color-scheme: dark` and confirms the page background really is dark; the theme button switches and remembers the choice (stored per browser; the page renders correctly without storage). Printables and PDFs always print light.

## 4. Keyboard navigation

At 1280px on every page the UI check confirms: the first Tab lands on a visible skip link; Enter on it moves focus to `<main>`; Tab then moves through the header controls with a visible focus ring. At 375px, `scripts/keyboard-test.mjs` (added by the audit, in CI) checks the same plus the mobile menu, the theme button, a table of contents link, the photo lightbox and the age finder's radio groups, with and without the language banner, in all three locales: 33 of 33 (section 11). All interactive elements are native links, buttons and form controls (the age finder uses radio buttons in fieldsets).

## 5. No third-party assets

`scripts/qa.mjs` fails the build if any page or stylesheet loads a script, stylesheet, font, image, frame or `url()` from another domain. All fonts are self-hosted (`@fontsource` packages; Chinese fonts are cut into unicode-range slices that contain only the characters the site uses, rebuilt by `scripts/fonts.mjs` on every build). Nothing is loaded from Google or other services that are blocked or slow in mainland China. Outbound links to sources and help lines are ordinary links, not assets.

## 6. Printables

`scripts/postbuild.mjs` renders every printable to an A4 PDF in headless Chrome and enforces page limits: every sheet fits on one page, and the age finder on two (one sheet, both sides). A sheet that runs over is shrunk slightly, never below 86%, and the build fails if it still does not fit. Latest run: all 42 PDFs fit at 100%. Citation markers are hidden on paper; each sheet's footer points to the Research page.

## 7. Lighthouse

`scripts/lighthouse.mjs` runs Lighthouse 13 (mobile and desktop presets) on Home, the 3-5 phase page and Physical discipline in all three locales against the built files served locally with compression, as GitHub Pages serves them. Each page and form factor runs three times and the median run is reported, because single runs vary by several points. Target: 95 or higher in every category. Results: [lighthouse.md](lighthouse.md).

Test machine: headless Chrome on Linux with the Noto CJK system fonts installed, as on Android phones. Without any Chinese system font, Chrome spends seconds searching fallback fonts glyph by glyph before first paint; no phone or computer in use is in that state (iOS and macOS ship PingFang, Windows ships Microsoft YaHei and JhengHei, Android ships Noto CJK), so that setup is not used for scores.

What was changed to reach the target on Chinese pages: the Noto web fonts load only after the page has loaded and gone idle and then switch in one step (they used to be requested before first paint, about 2 MB on a long page); off-screen prose blocks skip layout (`content-visibility`), which keeps that switch short; the Latin faces now carry their unicode-range, so English text no longer downloads the extended-Latin files; and English pages preload their three main faces, so text does not reflow when they arrive.

## 8. Sources and help lines

The sources workflow is the site's permanent link checker. On every change to `content/sources.yml` or `content/helplines.yml`, every Monday, and on demand, it checks every DOI against the DOI registry and Crossref (title, year, first author), every link (with headless Chrome for sites that block scripts) and every PMID, and confirms each help-line number still appears on its official page. Pages that only show a bot check count as unreachable, which is a warning, not a pass.

## 9. Final QA pass (2026-10-03, 21:31-23:10 UTC)

Run by the build session on its current model, because no switch to Fable with a FINAL QA PASS message arrived within 60 minutes of READY FOR FINAL PASS (SPEC §2). Three independent reviews read the built site, then every finding was fixed or explicitly accepted below, and every check was run again.

**Reviews.** (a) Interactive behaviour in all three locales at both widths: language switcher and banner, theme, menu, age finder (all 2,560,000 answer combinations checked against the printed key), gallery, printables, Research back link, a crawl of all 106 pages plus missing URLs, and the site without JavaScript. (b) Rendered text of all 106 pages: visible text, alt and label text, titles and descriptions, with seven pages read in full in all three locales, Chinese typography and vocabulary per locale, US English and a spell check. (c) HTML, accessibility and SEO: html-validate on all 106 files, axe-core on every page at 375px light and dark and at 1280px, the banner states, the open menu, lightbox and quiz, plus SEO, security and page weight.

**Fixed.**
- Open Graph images: the brand mark, illustration and long titles were laid out wrongly on all 105 cards (scoped styles did not reach the image or icon); now global styles, a smaller size for long titles and no break after a hyphen.
- Dark mode: the white printable sheets now use the whole light colour set, so table headers, the focus ring, hover colours and the age finder's radio buttons are readable, and printing from dark mode gives a light page.
- Language banner: it no longer covers the end of the page, focused links or the Research back button (the page reserves its height); it sits in a labelled landmark; it reads the browser's whole language list and the script subtag (zh-Hans-HK suggests Simplified); closing it moves focus to the content and no longer counts as a language choice.
- 404 page: no longer sends returning visitors to a home page, marks nothing as current and shows no banner. The home page no longer bounces the reader forward when they press Back.
- Without JavaScript: the Chinese font fallback now applies; the theme toggle, Print and quiz buttons are hidden; gallery thumbnails open the large photo.
- Mobile menu: scrolls on short screens, closes when focus leaves it or on a tap outside. Language switcher: the focus ring is no longer clipped, and switching language keeps the #section.
- Age finder: scoring is exact (whole sixths of a point), so the 1.5-point rule and ties match the printed key in every case; unanswered questions are flagged where they are; the result is announced and focused; smooth scrolling respects reduced motion; question numbers sit beside the question; the key table has full rows; the hint says it prints on two pages.
- Lightbox: no `<img>` without a source; the page behind does not scroll; a click on the dark area closes it; focus starts on Close; the count no longer runs into the caption.
- Toolbox: a link to a tool hidden by the age filter shows all tools first; the filter announces how many tools it shows.
- Research: the back button returns to the exact citation marker, also in a new tab and after using the page's table of contents.
- Landmarks: unique names everywhere (header and footer navigation, the Situations jump list); notes are notes, not unnamed complementary landmarks; /by-age/ has its missing h2.
- Text: 24 pairs of links joined by 和/and where a name already contained 和/and; Chinese punctuation in generated labels, citation labels, the footer and bold leads; first-mention glosses for time-out and program names; zh-Hant vocabulary (稱讚, 橫斷面研究, 早期讀寫能力, 幼兒園); US English (spank, store, candy, elementary and high school); digits used consistently; clearer wording on several pages; printables and their pages no longer share descriptions; 12 English descriptions trimmed to 160 characters or fewer; curly quotes in English alt text and descriptions (the QA script now checks attribute and meta text too); English sheets print weimeijiao.com, which English keyboards can type.
- Smaller items: page heroes no longer jump the download queue on phones and printable art loads eagerly; phone numbers never break across lines; the Mixed evidence label links to its explanation; the weekly chart and quiz key fit a 320px screen; robots.txt no longer names a folder that does not ship; unused built files are pruned; Chinese pages skip the 1-2 MB of web-font slices when the browser asks to save data or is on a 2G/3G-class connection. The site script grew past Vite's 4 KB inline limit during these fixes and became a separate request, which pushed the simulated Speed Index of the Chinese home page on mobile from 1.5 s to about 2.5 s; page scripts are now always inlined, and it is back to 1.5 s.

**Re-run results.** Content lint, build and QA, link test, anchor test, UI check and Lighthouse: see the table at the top. axe-core 4.13 with WCAG 2.2 AA and best-practice rules (with `content-visibility` forced visible, as reviewer (c) showed its off-screen boxes give false target-size alarms): 0 violations on all 106 pages at 375px light, 375px dark and 1280px, and in the 8 banner states. html-validate: the 248 duplicate-landmark and 3 missing-`src` messages are gone; what remains is 81 inline `aspect-ratio` styles on illustration placeholders (they go when the last illustrations are generated), 30 telephone numbers flagged for not using `&nbsp;` (they are kept on one line with CSS instead) and `role="list"` on the quiz list (kept on purpose: Safari drops list semantics when the numbers are drawn by CSS). The behavior test (`scripts/behavior-test.mjs`, new in this pass) checks the fixed behaviour and runs in CI.

**Accepted as is.** Seven English titles are 61-70 characters, so a search result may cut the site name at the end; the page name comes first. The tagline writes 十 (ten) as a character, as Chinese taglines usually do.

## 10. Open issues

See docs/STATUS.md for the current list and who it is waiting on.

## 11. Fable audit (2026-10-04, 09:54-10:42 Taipei)

Run on Claude Fable 5.1 on branch `claude/brave-darwin-7h6nne` ([PR #5](https://github.com/brianjohnnychen/weimeijiao/pull/5)) against the live build on `main`, after PR #3 and PR #4 had merged. Scope: re-verify every factual claim against its source with the Actions source checker, review the UI and UX at 375px and 1280px in all three locales with dark mode and keyboard navigation, run the anchor test, confirm that every asset is self-hosted, and apply Brian's two content changes (neutral expert voice outside About; English brand name WeiMeiJiao). Every check below was run on the rebuilt site after the content changes.

### Fact-check per claim, re-verified against the source checker

Method. The Actions source checker (`.github/workflows/sources.yml`, job `sources`, run 37166720251 on `main`, 2026-10-04 01:01 UTC) printed, for every one of the 146 entries in `content/sources.yml`, its DOI and Crossref check, its link check and its abstract (Europe PMC, PubMed, OpenAlex, Semantic Scholar or the publisher page): 146 sources, 0 failures, 70 warnings (publisher sites that refuse automated access; the DOI was verified for each). Eight reviewers, one per page group, read every cited sentence in all three locales side by side and compared it with that abstract and with the entry's `key_facts` and `verified_via` notes, applying the citation standard in docs/CONTENT-GUIDE.md §2: numbers, ages, samples and settings must be in the source; correlational studies are "linked with", reviews "conclude", position statements "recommend"; one small study is described as such; mixed findings on the learning pages carry the Mixed marker; the same claim with the same hedge in every locale. The reviewers also read the Chinese for locale vocabulary and for the no-personal-names rule. Nothing outside `sources.yml` was consulted; the citation APIs are not reachable from the build container, so the Actions run is the record.

| Page group | Markers checked per locale | Sources | Fixed |
|---|---|---|---|
| Toolbox hub and 16 tools (evidence ratings, age ranges and age notes included) | 70 | 39 | 0 |
| Situations hub and 12 situations | 82 | 39 | 2 |
| Best-proven approach with edge cases | 73 | 50 | 0 |
| By age: hub, 0-12 months, 1-3, 3-5 | 106 | 44 | 4 (10 sentences) |
| By age: 5-7, 7-10 | 87 | 35 | 2 |
| When you have little time; Physical discipline (SPEC §7 checked point by point) | 89 | 38 | 1 |
| Encouraging learning: hub, 0-12 months, 1-3, 3-5 | 181 | 48 | 4 |
| Encouraging learning: 5-7, 7-10; Research; printables; About | 88 | 54 | 2 |
| Total | 776 (2,328 across the three locales) | 141 distinct | 15 |

What was fixed (each in all three locales unless noted):
- Situations, Screens: the AAP 2016 media statement covers ages 0 to 5, so its age guide no longer reads as applying up to age 10 ("over age 2" is now "at ages 2 to 5", introduced as the guide "for children aged 0 to 5").
- Situations, Bedtime summary: the claim that a short, same-every-night routine helps now carries its citation (Mindell 2009), which the page already used for that claim.
- By age, 0-12 months: the review by a leading defender of occasional spanking (Larzelere 2000) is labelled a minority view among researchers.
- By age, 3-5 years: "even its defenders found" is now "even the minority who defend it found" (Larzelere & Kuhn 2005).
- By age, 3-5 years, time-out: children whose parents used time-out at 3 "did not differ significantly" from other children (Knight 2020 reports no significant difference; the hedge had been dropped).
- By age, 1-3 years (English only): a narrative review "reports", not "finds" (Joussemet 2008); the Chinese already said 指出.
- By age, 5-7 years (English only): expecting punishment weakened the appeal to children's own standards of honesty, the comparison Talwar 2015 actually tested; the Chinese already said so.
- By age, 7-10 years summary: in the six-country study, more physical discipline, not spanking specifically, went with more aggression and anxiety (Lansford 2005 measured physical discipline).
- Physical discipline (English only): in the Baumrind, Larzelere and Cowan critique, "the evidence she presented" is now "the evidence it presented"; the antecedent is the 2002 meta-analysis and Gershoff is never named on the page.
- Encouraging learning, 3-5 years (Chinese only): the Cameron 2001 sentence no longer says harm appears "only" under the stated conditions, an "only" the abstract does not contain.
- Encouraging learning hub, self-control: activities that build the skills into other activities are not "enjoyed more" as a measured outcome; the authors propose they are more enjoyable (Takacs & Kassai 2019).
- Encouraging learning hub, school age: the two homework findings that disagree (Barger 2019, Patall 2008) carry the Mixed marker, as the page's own evidence notes already treat them.
- Encouraging learning, 3-5 years and hub (Traditional Chinese only): 12 歲及以下 ("up to age 12"), not 12 歲以下.
- Encouraging learning, 5-7 years: the Cameron 2001 meta-analysis also found that rewards tied to the level of performance did not lower motivation, as the 7-10 page already said.
- Research, effect sizes: the d = 0.21 versus d = 0.69 gradient belongs to the first of Leijten 2019's meta-analyses (154 randomized trials), not to "two other meta-analyses".

Found correct and left alone: everything else, including every figure on the physical discipline and little-time pages (111 effect sizes and 160,927 children with 13 of 17 mean effects significant and detrimental; less than 1% of remaining variance; 26 studies and 10 of 13 tactics; 785 children aged 6 to 9; 2,788 families, 30% and 33%; 976 families; 69 prospective studies), every "in its 2018 policy statement" attribution, the minority-view labels on the spanking passages, all 15 Mixed markers per locale on the learning pages, the 16 toolbox evidence ratings and age ranges, and the About page's six cited sentences. No `finding` in `content/sources.yml` contradicts its abstract.

Judgment calls recorded for Brian (not changed, see STATUS.md): the SPEC §7.4 example agreement points "angry or implement-based punishment" and "warmth" are not asserted as shared positions because no minority-side source states them (implement use is under the warning signs via Zolotor 2008); the decision question that lists the proponents' conditions is attributed to them but could be read as a checklist; narrative reviews (Heilmann 2021, Mindell 2006, Owen 2012) are introduced with "found" where the guide prefers "concluded"; "Spanking:" is used as a lay label over corporal-punishment and physical-discipline sources in two summaries; Wang & Kenny 2014 is called "a US study" although its abstract gives only the sample's ethnic make-up; Kamins & Dweck 1999 Study 2's age rests on the sources.yml finding rather than the abstract; the 0-12 learning sheet states repair of mix-ups flatly where Tronick 1989 says "may be associated"; the AAP 2016 media statement is cited on the bedtime and mealtime pages without its 0-to-5 scope being stated there; the coparenting meta-analysis (parents) is applied to grandparent-parent cooperation through a bridging sentence. Bookkeeping in `sources.yml`, not changed: cote-2006 pages read 71-85 where Crossref gives 68-82; ollendick-2016 carries year 2015 (online first) with a 2016 volume; kamins-dweck-1999, vasquez-2016 and patall-2008-choice have no `strength` or `ages` note; kazdin-2008 is verified but cited nowhere.

### UI and UX, dark mode, keyboard

- `scripts/ui-check.mjs` on the rebuilt site: 129 views (14 pages x 3 locales x 375px light, 1280px light and 375px dark, plus the home page at 320px), no horizontal overflow, no console errors, no failed requests, no broken images, header fits; screenshots refreshed in docs/screenshots/.
- By eye, 20 screenshots across the three locales, both widths and dark mode (home, toolbox, approach, situations, little time, physical discipline, research, printables, age finder, learning 5-7, about): text wraps cleanly at 375px, the header shows the full name at 375px and only the mark at 320px, the white printable sheets keep their light colours in dark mode, the placeholder illustrations on the 21 pages still waiting for their image look intended. Nothing to fix.
- Keyboard at 1280px (UI check) and at 375px (`scripts/keyboard-test.mjs`, new, 33 checks, in CI): skip link first and visible, Enter on it focuses the content, every header control reachable with a 3px focus ring (with and without the language banner, whose two controls come right after the skip link), the mobile menu opens with Enter, Tab moves into it, Escape closes it and returns focus, the theme button switches to dark and back, a table of contents link lands on its section, the photo lightbox opens with Enter, moves with the arrow keys, closes with Escape and returns focus, the age finder's radio groups work with the arrow keys. A first version of the test read the state at the instant of the key event and caught the English pages mid-transition twice; it now waits up to two seconds for the expected state. A probe with event logging confirmed the site behaves correctly in each case.
- Dark mode: every page at 375px with `prefers-color-scheme: dark` has a dark background (UI check); the theme button switches and remembers the choice (behavior and keyboard tests).
- axe-core 4.13.0 (WCAG 2.2 AA, WCAG 2.1, WCAG 2.0 and best-practice rules, with `content-visibility` forced visible): 0 violations in 318 page runs, all 106 pages at 375px light, 375px dark and 1280px light.
- Behavior test (the version from `main`, which waits for the Chinese font switch): 81 of 81.

### Links, anchors and assets

- Link test: 14,359 internal links, 9,208 of them to an anchor, 0 broken (block at the end of this file).
- Anchor test: 26 of 26 deep links (13 targets of every kind at 375px and 1280px) land just below the header.
- Assets: `scripts/qa.mjs` passed (no third-party script, stylesheet, font, image or frame); a separate scan of the built output found no external host in any `src`, `href`, `url()`, preload or script tag (the only outbound links are doi.org, pubmed.ncbi.nlm.nih.gov and showtellshare.org, as ordinary links); the 519 font files and both Chinese font stylesheets are served from the site's own paths. Nothing loads from Google, gstatic, a CDN or any service blocked in mainland China.
- Lighthouse on the rebuilt site: all 18 medians (3 runs each) are 99 or higher: performance 99-100 on mobile (the Chinese home pages at 99) and 100 on desktop; accessibility, best practices and SEO 100 on every page (docs/lighthouse.md).

### Content changes

- Neutral expert voice outside About (all three locales): the home page's "About this site" paragraph no longer tells the family story; it describes the guide and links to the About page's "Why this site". The About page keeps the story and the photo gallery. The content lint now rejects Brian and Zoe outside About, as it already did Naomi and Kelsea; the built HTML outside /about/ contains none of the names, Boston or the relocation. Generic parent scripts ("In our family, hands are gentle") and the sister-site links stay.
- English brand name WeiMeiJiao, one word: site name (header, footer, page titles, Open Graph `site_name` and image alt, the share cards, the PDF footers), the About page, package.json, the smoke test and SPEC §1; the lint rejects the spaced spelling. Verified in the rebuilt titles, meta tags, PDF footers and the English share card. Chinese names stay 魏美娇 / 魏美嬌.
- Also in this pass (Brian's instruction during the audit): `deploy.yml` now runs on every push to `main` as well as on manual dispatch, so merging this PR publishes it (SPEC §2, REVIEWER-CHANGES.md).

### Left open

See STATUS.md: the judgment calls listed under the fact-check above; the AAP 2018 statement's reaffirmation status; the SPEC §4a time-out studies that cannot be cited; the 21 illustrations still waiting on the Workers AI quota (unchanged by this audit); Enforce HTTPS.

## 12. Age range to 12, Sources page, link verification and translation QA (2026-10-04, 11:01-12:36 Taipei)

Run on Claude Fable 5.1 on branch `claude/brave-darwin-7h6nne` ([PR #6](https://github.com/brianjohnnychen/weimeijiao/pull/6)) against `main` after PR #5. Brian's brief: (1) extend the age range to 12 with a full 10-12 phase everywhere, (2) a separate, low-key Sources page, (3) verify that every source link resolves to the correct work, (4) a full translation QA of the three locales with a glossary, then rerun the full test suite. SPEC.md and REVIEWER-CHANGES.md were updated first.

### The 10-12 phase

- **New pages, written natively in each locale:** By age, Preteens (10-12 years) (`/by-age/10-12-years/`: what is normal, what works with nine sections from warmth and limits to the move to secondary school, what backfires, things you can say) and Encouraging learning, Preteens (`/learning/10-12-years/`: homework, study methods, reading, praise and growth mindset, motivation, focus, sleep and screens). Each has a one-page summary or one-pager PDF, an image entry in `content/images.yml` (placeholder until the photo passes review in the image pass) and a place in the By age, Learning and Printables hubs, the home page and the sitemap.
- **Everywhere else:** the age finder gained 10-12 answers (13 new options per locale; the scoring now counts points in twelfths so an answer covering four age ranges splits exactly, and the behavior test's independent count uses the same unit); 13 tools carry 10-12 in their age range with a new preteen sentence in the age note; 7 situations carry the age, and screens, lying, homework and defiance each end with a 10-12 paragraph; the best-proven approach has a new "Preteens: more say, same core" section among the edge cases; When you have little time has a preteen paragraph; the 7-10 page is re-cut as 7-10 with a pointer to the new page; every "birth to 10" mention (titles, taglines, meta descriptions, Open Graph, SPEC, home, about, hubs, printables, content guide) now says 12.
- **19 new academic sources,** each looked up through the Actions candidates job (Crossref metadata and abstract) before being added to `content/sources.yml` with an evidence level, a trilingual finding and quoted key facts: Stattin and Kerr 2000 and Kerr and Stattin 2000 (parental monitoring and disclosure), Racz and McMahon 2011 (monitoring review), Steinberg and Monahan 2007 (resistance to peer influence), Laursen, Coy and Collins 1998 (parent-child conflict in adolescence), Fuligni and Eccles 1993 (family decision making and peer orientation), Eccles et al. 1993 (stage-environment fit), Dishion, McCord and Poulin 1999 (deviancy training), Ttofi and Farrington 2011 and Lereya, Samara and Wolke 2013 (bullying prevention and parenting), Ullsperger and Nikolas 2017 (pubertal timing), Pinquart 2017 (two meta-analyses of parenting dimensions), Carskadon 2011 and Cain and Gradisar 2010 (sleep and media), the AAP 2016 school-aged media statement, Orben and Przybylski 2019 and Odgers and Jensen 2020 (screens and well-being), Evans and Lee 2011 (lying at 8 to 16). Every claim on the new pages was checked against these entries by the writers and again by the round-B reviewers (below); the English page's six wording slips found by the Chinese writers (Talwar 2015 is 4- to 8-year-olds, Yeager 2019 is a secondary-school sample, Kerr and Stattin is about control efforts, Mol and Bus is variance in oral language, the AAP 2026 point is quoted as the statement makes it, an unsupported grade-level clause removed) were fixed in all three locales.

### Sources page

- `/sources/` (参考文献 / 參考文獻 / Sources) in all three locales, linked only from the footer's bottom line next to About. It lists all 165 entries of `content/sources.yml` grouped by the Research page's six topics and sorted by author: full citation, evidence level, DOI link (and PubMed where there is a PMID), a link to the Research entry, the one-line finding and the pages that cite it; a cited entry carries the same number as in the text; the 5 verified but not yet cited entries (Thomas and Zimmer-Gembeck 2007, Garland 2008, Patterson 2010, Kazdin 2008, Kazdin 1980) say so. Every Research entry links to its Sources entry; `#src-<id>` anchors work on both pages and are covered by the anchor test and the content lint's anchor map.

### Link verification

- **Method.** `scripts/check-sources.mjs` (the `Check sources` workflow, on every change to the sources, weekly, and on demand) already checked that each DOI is registered and that Crossref's title, year and first author match the citation. It now also judges the landing page: a page passes when its citation metadata carries the cited DOI, when its title matches the cited title, or when the final URL after the DOI redirect carries the cited DOI, the publisher's own id for the work (Crossref's alternative-id, such as an Elsevier PII) or the landing URL that Crossref registers for the DOI; a 200 whose HTML is only a script shell is rendered in headless Chrome before being called unreadable; a page that is a homepage, search, login or error page fails the run; a non-DOI link is flagged with the DOI link to use instead.
- **Result (run 37176288709, 2026-10-04 04:12-04:25 UTC, 165 entries, 0 failures):** 8 carry the cited DOI in their citation metadata, 82 resolve to a publisher URL that carries the cited DOI or the publisher's id for the work, 75 resolve to such a URL but the publisher refuses automated readers (the URL still names the work), 0 could not be tied to the work, 0 land on a wrong page. No link was replaced: none redirected to a homepage, a search page, a paywall error or a different paper, and all 165 links already were DOI links. The 75 pages that refuse automated readers are publisher article pages behind bot protection (for example Taylor & Francis, which answered 403, and APA PsycNet, which serves its content through scripts); for each, the DOI redirect lands on a URL that carries the cited DOI or the publisher's own id for the work, so the link is known to be the right page even though the checker could not read its body.
- The abstracts the run printed (`--details`) are the ones the writers and reviewers worked from.

### Translation QA

- **Method.** `docs/GLOSSARY.md` was written first (site, section and phase names, people, tools, situations, development and research terms, interface strings, banned forms; now 220 rows) and extended from every review. Seven parallel reviews then covered every page: early phases and hubs; learning pages and printables; eight situations and three tools; physical discipline and Research; the 13 tools with new preteen notes; four situations plus the approach, little-time and Sources pages; the 7-10 and 10-12 pages. Each compared the three locales sentence by sentence (frontmatter strings, scripts and body) and every cited sentence against its source's finding and quoted key facts, checked Taiwan character forms and vocabulary in zh-Hant and mainland vocabulary in zh-Hans, typography (citation markers before 。 in Chinese and after punctuation in English, quote styles, digits, spacing, no dashes) and natural phrasing, fixed the files directly and reported terms the glossary lacked. About 11,000 sentence comparisons (about 3,700 per locale); about 290 reviewer edits plus the site-wide sweeps below; `node scripts/check-content.mjs` clean after every round.
- **Accuracy against sources (all three locales unless noted):** Talwar 2015 ages 4 to 8; Yeager 2019 a national secondary-school sample; Kerr and Stattin 2000 control efforts, not tracking; Mol and Bus 2011 variance in oral language skills; the AAP 2026 sentence states the statement's own point (platforms designed for engagement and profit); Pinquart 2017 keeps its small-link hedge on approach, little-time and the 10-12 page; Stattin and Kerr's 14-year-old sample stated on the approach page; Laursen 1998 carries its few-studies caveat; Orben and Przybylski 2019 described as one analysis of three datasets covering more than 355,000 teenagers rather than "the best large studies"; Hale and Guan 2015 is a systematic review; Racz and McMahon 2011 conclude rather than confirm; the problem-solving trials are children with serious behavior problems, not older children; Narang 2020 covers infants and children; Yogman 2018 self-regulation skills; Leijten 2019 disruptive behavior; Siddiqui and Ross 2004 control families; Kaminski 2008 parenting programs; the AAP's aversive strategies sentence no longer adds "harsh"; a dropped hedge restored in the redirection summary; the missing motivation item added to the English 3-5 learning description.
- **Terminology, one form per term across pages and `sources.yml` findings:** 行为问题 / 行為問題 (conduct problems), 等待名单对照组 / 候補名單對照組 (wait-list control), 配合度 for the compliance finding, 文獻回顧 (review), 系统综述 / 系統性回顧 (Cochrane review), 稱讚 (praise in zh-Hant), 家长培训课程 / 親職課程 (parenting program), 家长管理训练 (PMT), 暂时取消特权 (the tool name), 睡前程序 / 睡前流程, 学习动机, 物质奖励 / 實質獎勵, 医学机构 / 醫學機構, 侮辱 (the AAP list), 家庭媒体使用计划 / 家庭媒體使用計畫, 参见 in zh-Hans and 請看 in zh-Hant before every cross-link (另见 / 另見 for see also), US English in the English copy (elementary school, check off, agree on, study for tests, Simon Says, punctuation inside quotes), thousands separators from 1,000 up.
- **Taiwan usage and characters in zh-Hant:** 佔 (佔上風, 獨佔), 扎實 (not 紮實), 算術, 憂鬱, 計畫, 裝置 / 3C 產品, 群組, 體育服, 安親班; no mainland terms remain (the build's QA caught one 登錄 in a source finding, now 預先註冊). zh-Hans: no Taiwan terms or Traditional characters; 幼儿园, 屏幕时间, 零花钱, 同伴, 校园欺凌. No machine-conversion artifacts were found beyond these character forms; the Chinese pages read as written, not converted.
- **Phrasing and parity:** hedges and examples aligned across locales (safe things to explore, squeeze a soft toy, dictation counts too, the small choice at the end of screen time); link texts to the new 10-12 pages echo the target headings in each locale; the Research page's "Strong" explanation now reads the same in all three locales; the agesNote order on specific praise follows the ages.
- **Deliberate localisation kept (owner may decide otherwise):** the About page lists help-line regions in a different order per locale; the zh lists of things used to hit a child carry one local item each (鸡毛掸子 / 藤條); the family-rules poster title is 我們家的約定 in zh-Hant; the age finder's game examples are local (飞行棋、跳棋、纸牌 / 大富翁、跳棋、撲克牌); Chinese bold lead-ins keep the full stop outside the bold; English house forms back-up, afterwards, say sorry and carry on.

### Test results

Everything in the table at the top was rerun on the final build of this branch; UI check screenshots for all 17 pages (now including the 10-12 pages and the Sources page) at 375px light and dark and 1280px light in the three locales are in docs/screenshots/, and 7 of them (the Sources page in all three locales and both widths, the 10-12 pages at 375px, 1280px and in dark mode) were reviewed by eye: no overflow, dark mode holds, the footer's Sources link sits next to About, the new printables fit one page.

### Left open

See STATUS.md: the 75 publisher pages that refuse automated readers (open issue 7); the AAP 2018 statement's reaffirmation status; the SPEC §4a time-out studies that cannot be cited; the illustrations (two new 10-12 entries join the 21 waiting ones; the image pass is queued in INBOX item 3); the localisation choices listed above; Enforce HTTPS.

## 13. Situation page My toddler ignores me, and two standing rules (2026-10-04, 13:48-14:46 Taipei)

Run on Claude Fable 5.1 on branch `claude/brave-darwin-7h6nne` ([PR #8](https://github.com/brianjohnnychen/weimeijiao/pull/8)) on Brian's brief via Cowork (INBOX item 4), ahead of the daily image check-ins.

### The page

- `/situations/#ignores-me` (学步儿不理我 / 學步兒不理我 / My toddler ignores me), ages 1-3 with a short "At 3 to 5" pointer that hands over to the defiance guide. Right now: get close and get attention, one short instruction as a statement with a gesture, wait a few seconds, when-then or a two-way choice, hands-on guidance, thanks the moment it is done, redirection when the instruction is a "stop". Why: growing autonomy and self-control still under construction, "do" requests harder than "don't", passive noncompliance as a stage that gives way to negotiating. Prevention: fewer instructions, attention for cooperation, connection time, redirection before trouble, planned ignoring of minor stuff, predictable transitions. When to get help: the generic "when it is not working" link only; no hearing checks, screening steps or red-flag content, as Brian asked.
- Written natively in each locale (English first, then Simplified and Traditional Chinese by two writers with the extended glossary: 先引起注意, 手把手带着做, 被动不服从, 心甘情愿地配合, 自我主张, 冲动控制, 讨价还价, 设限), same list lengths, citations, links and paragraph order in all three; the Chinese pages were read in full for flow.
- Linked from the defiance guide (the toddler step), the 1-3 phase page (the "no" section now also covers silence) and, through the situations list, the situations index; added to the SITUATIONS lists, `content/images.yml` (placeholder until the image pass), the glossary and the content guide.
- Sources: 13 candidates looked up by the candidates job (run 37181068575); 11 added with evidence levels, trilingual findings and quoted key facts (Schaffer and Crook 1980; Kuczynski et al. 1987; Crockenberg and Litman 1990; Kochanska, Coy and Murray 2001; Vaughn, Kopp and Krakow 1984; Power and Chapieski 1986; Wilder and Atwell 2006; Wilder et al. 2010; Mandal et al. 2000; Ford et al. 2001; Houck and LeCuyer-Maus 2004); two (Kuczynski and Kochanska 1990; Kochanska and Aksan 1995) returned no readable abstract and were left out. Every claim on the page matches a quoted key fact; the sources job on the branch (run 37181587302) re-verified all 176 entries: 0 failures, every link tied to its work.

### Standing rules (Brian, via Cowork)

- Flow and three locales per pull request are in CLAUDE.md, SPEC §6 (Flow; Three locales in one pull request) and §10, and REVIEWER-CHANGES. `scripts/parity-test.mjs` runs in CI and fails when a page, situation, tool, phase or learning page is missing in a locale, a frontmatter list differs in length across locales, or an image lacks alt text in a locale. Flow pass done on the new page and the pages it touches (defiance, 1-3, the situations index) in all three locales; the site-wide read-through is queued for a quiet moment.

### Test results

The table at the top: content lint 171 files, 0 errors; locale parity 57 entries per locale, clean; build 120 pages, QA 0 errors, 48 PDFs, 120 Open Graph images; link test 19,697 internal links (13,696 to an anchor), 0 broken; anchor test 32 of 32; behavior test 81 of 81; keyboard test 33 of 33; UI check 165 views (the 17 pages plus the new section at its anchor, three locales, 375px light, 1280px light and 375px dark), no problems; axe-core 4.13.0: 363 page runs, 0 violations; Lighthouse: all 18 medians 99 or higher (performance 99 on the zh-Hans and zh-Hant home pages on mobile and 100 everywhere else; one of the three zh-Hans home mobile runs scored 87, the median stayed 99); sources job run 37181587302: 176 entries, 0 failures, every link tied to its work; help lines 14 of 14. The new section was also read on the screenshots at 375px and 1280px in all three locales, light and dark (docs/screenshots/*situation-ignores-me*).

## 14. Site-wide flow read-through (2026-10-04, 14:55-15:47 Taipei)

Run on Claude Fable 5.1 on branch `claude/brave-darwin-7h6nne` ([PR #9](https://github.com/brianjohnnychen/weimeijiao/pull/9)) under Brian's flow rule (CLAUDE.md, SPEC §6): the whole site must be an easy, smooth read, with flow from section to section and from topic to topic, and a site-wide read-through when the queue is quiet. The queue was quiet after item 4 (the image pass waits on the daily allocation).

### Method

- Nine editors read the site in parallel, one group of pages each, every page in all three locales: top-level pages; phases 0-12 months, 1-3 and 3-5; phases 5-7, 7-10 and 10-12; situations (two groups, with the index); tools (two groups, with the toolbox intro); learning pages with their hub; physical discipline, research, sources, printables and About. Each worked from one brief: three kinds of problem (an opening that does not orient, an abrupt jump or a dead end between sections, a list out of natural order; a section order that differs from the page's siblings; a page or section that does not lead to the next relevant page) and hard limits (the same edit at the same place in all three locales, no claim, number, study description or citation touched, no heading text or id changed, no em or en dashes, Taiwan usage in Traditional Chinese, glossary terms, typical output 0 to 4 small edits per page, structural problems reported rather than rewritten).
- Each editor ran the content lint and the locale parity test after its edits; the coordinator read every English diff, relayed cross-group findings between editors (a tool that a guide sends readers to but that does not list the guide back, a phase section with no hand-over, a link target to verify), made the template changes the editors could not, committed the work by group, and then ran the full suite once on the combined tree.
- 135 content files (45 per locale: 12 pages, 6 phases, 13 situations, 8 tools, 6 learning pages) changed in nine commits; no source, claim or citation changed, no heading or anchor changed, no frontmatter list differs in length across locales.

### What changed

- **Templates.** The age chips on every situation section and tool card now link to the phase page for that age (the one hand-over no situation or tool had); the By age hub's section heading says six stages (it had said five since the 10-12 phase was added); the toddler guide precedes the defiance guide on the situations page, so its closing hand-over points forward.
- **Top-level pages.** The approach hands over to By age at the start of its core skills and to the situations hub at the start of its edge cases; its developmental-differences and get-help sections end on links instead of dead ends. By age closes with where to start for an older child; About points to By age; little-time links each habit to its tool and gives parents of babies and toddlers somewhere to go; research leads onward to the Sources page; printables opens with what is on offer; the family rules poster and the routine chart hand back to family meetings and bedtime battles; physical discipline gains one link to the Chinese-families evidence, with its balance untouched.
- **Phase pages.** 0-12 months bridges crying to signals, opens what works from the core approach, and hands over to the toddler page and its learning page; 1-3 links clear expectations from its limits section and lists the tool, keeps the "no" material together before the silence paragraph, and links sleep and screens; 3-5 gains an orienting opener for what's normal and links hitting and biting, sleep and screens, specific praise and the calm-down plan; 5-7 closes what's normal with a hand-over to the next phase and links bedtime battles and the calm-down plan; 7-10 links bedtime and sibling fighting from the sections that discuss them; 10-12 opens its hand-over section from trust, links homework and defiance, and closes the By age journey instead of stopping. The three youngest pages close What's normal the same way as their older siblings, hand their praise, choices and sleep sections over to the learning pages, and the babies page now lists grandparents while the toddler and preschool pages list mealtime struggles.
- **Situations.** The index bridges into its first-aid list; bedtime's steps run in order and its why section hands over to sleep and learning; tantrums marks the turn from why to what to do; public meltdowns names planned ignoring and time-in in its waiting step; whining closes on the approach's planned ignoring; mealtime's help item hands over to when it is not working; screens leads to family meetings, when-then, problem solving and the preteen learning page; each guide now leads to the tools its steps use and the tool cards list the guides back (about twenty reciprocal list entries added, three unused entries replaced or dropped); the toddler guide's example line drops the child's name, as the content guide requires; the homework guide describes the middle school meta-analysis the same way in both places.
- **Tools.** The toolbox intro links the tools it tells readers to start with; choices escalates in order; time-in calms the parent before the move; clear expectations and privilege removal open from the approach's core skills; redirection hands over to time-in and orders its lines by step; clear expectations hands over to the family rules poster.
- **Learning pages.** Orienting openers for the praise and numbers sections; connection time from the play sections; each early page closes by handing over to the next; the school pages link routines, specific praise, choices and family meetings; the hub names the 10-12 page.

### Left for Brian (content decisions, not flow)

- The three school learning pages (5-7, 7-10, 10-12) have no "How sure is this?" section, while the three early pages do; adding one means new evidence text with citations.
- The babies page links bedtime, hitting and biting, and screens, whose age chips start at 1-3 although their sources reach into the first year; either those guides gain 0-12 months in their ages or the babies page drops them.
- The phase pages differ in style by trio (h3 subsections and bullet lists on the three youngest, bold lead-ins and paragraphs on the three oldest; a "Things you can say" intro only on 0-12 and 1-3); consistent within each trio, left as deliberate.
- General tools (routines, specific praise, connection time, when-then) are used by more guides than their cards list; the lists were kept to the guides where the tool is the main lever.
- The mealtime guide links the sister site twice (end of the body and a prevention item), both in context.
- The screens guide deliberately frames switching off as follow-through rather than punishment; a consequence step for repeated refusals would be new advice.
- Little-time uses straight quotes in English prose, consistently within the file, which the content guide allows.

### Test results

The table at the top: content lint 171 files, 0 errors; locale parity 57 entries per locale, clean; build 120 pages, QA 0 errors, 48 PDFs, 120 Open Graph images; link test 20,387 internal links (14,377 to an anchor), 0 broken; anchor test 32 of 32; behavior test 81 of 81; keyboard test 33 of 33; UI check 165 views (18 pages in three locales at 375px light, 1280px light and 375px dark, plus the home page at 320px), no problems; axe-core 4.13.0: 363 page runs, 0 violations; Lighthouse: all 18 medians 98 or higher (performance 100 on every desktop page and on the English mobile pages, 99 on five Chinese mobile pages and 98 on the zh-Hant physical discipline page on mobile; accessibility, best practices and SEO 100 everywhere); sources unchanged in this pass, so the sources job's last run stands (37181587302: 176 entries, 0 failures).

<!-- link-test:start -->
Link test run 2026-10-04 07:21 UTC over dist/ (121 HTML pages).

| Locale | Pages | Internal links | With #anchor | Broken |
|---|---|---|---|---|
| zh-hans | 41 | 6823 | 4793 | 0 |
| zh-hant | 40 | 6782 | 4792 | 0 |
| en | 40 | 6782 | 4792 | 0 |
| all | 121 | 20387 | 14377 | 0 |

In-content links to a whole page (no #anchor), for review: 84 target page(s).
- /printables/family-rules/ <- /approach/ ("家规海报"); /by-age/3-5-years/ ("家规海报"); /printables/ ("家规海报"); +3 more
- /printables/summary-0-12-months/ <- /by-age/0-12-months/ ("打印本阶段的一页总结"); /printables/ ("宝宝（0-12 个月）"); /printables/ ("打印")
- /by-age/1-3-years/ <- /by-age/0-12-months/ ("下一个阶段学步儿（1-3 岁）"); /by-age/3-5-years/ ("上一个阶段学步儿（1-3 岁）"); /by-age/ ("学步儿（1-3 岁）")
- /printables/summary-1-3-years/ <- /by-age/1-3-years/ ("打印本阶段的一页总结"); /printables/ ("学步儿（1-3 岁）"); /printables/ ("打印")
- /by-age/0-12-months/ <- /by-age/1-3-years/ ("上一个阶段宝宝（0-12 个月）"); /by-age/ ("宝宝（0-12 个月）")
- /by-age/3-5-years/ <- /by-age/1-3-years/ ("下一个阶段学龄前（3-5 岁）"); /by-age/5-7-years/ ("上一个阶段学龄前（3-5 岁）"); /by-age/ ("学龄前（3-5 岁）")
- /printables/summary-10-12-years/ <- /by-age/10-12-years/ ("打印本阶段的一页总结"); /printables/ ("青春期前（10-12 岁）"); /printables/ ("打印")
- /by-age/7-10-years/ <- /by-age/10-12-years/ ("上一个阶段小学生（7-10 岁）"); /by-age/5-7-years/ ("下一个阶段小学生（7-10 岁）"); /by-age/ ("小学生（7-10 岁）")
- /printables/calm-down-plan/ <- /by-age/3-5-years/ ("冷静计划"); /by-age/5-7-years/ ("冷静计划"); /printables/ ("我的冷静计划"); +3 more
- /printables/routine-chart/ <- /by-age/3-5-years/ ("作息表"); /little-time/ ("日常作息表"); /printables/ ("早晚作息表"); +3 more
- /printables/summary-3-5-years/ <- /by-age/3-5-years/ ("打印本阶段的一页总结"); /printables/ ("学龄前（3-5 岁）"); /printables/ ("打印")
- /by-age/5-7-years/ <- /by-age/3-5-years/ ("下一个阶段幼小衔接（5-7 岁）"); /by-age/7-10-years/ ("上一个阶段幼小衔接（5-7 岁）"); /by-age/ ("幼小衔接（5-7 岁）")
- /printables/summary-5-7-years/ <- /by-age/5-7-years/ ("打印本阶段的一页总结"); /printables/ ("幼小衔接（5-7 岁）"); /printables/ ("打印")
- /printables/summary-7-10-years/ <- /by-age/7-10-years/ ("打印本阶段的一页总结"); /printables/ ("小学生（7-10 岁）"); /printables/ ("打印")
- /by-age/10-12-years/ <- /by-age/7-10-years/ ("下一个阶段青春期前（10-12 岁）"); /by-age/ ("青春期前（10-12 岁）")
- /printables/age-finder/ <- /by-age/ ("年龄小测验"); /printables/ ("年龄小测验"); /printables/ ("打印")
- /en/printables/family-rules/ <- /en/approach/ ("family rules poster"); /en/by-age/3-5-years/ ("family rules poster"); /en/printables/ ("Family rules poster"); +3 more
- /en/printables/summary-0-12-months/ <- /en/by-age/0-12-months/ ("Print the one-page summary for this age"); /en/printables/ ("Babies (0-12 months)"); /en/printables/ ("Print")
- /en/by-age/1-3-years/ <- /en/by-age/0-12-months/ ("Next ageToddlers (1-3 years)"); /en/by-age/3-5-years/ ("Previous ageToddlers (1-3 years)"); /en/by-age/ ("Toddlers (1-3 years)")
- /en/printables/summary-1-3-years/ <- /en/by-age/1-3-years/ ("Print the one-page summary for this age"); /en/printables/ ("Toddlers (1-3 years)"); /en/printables/ ("Print")
- /en/by-age/0-12-months/ <- /en/by-age/1-3-years/ ("Previous ageBabies (0-12 months)"); /en/by-age/ ("Babies (0-12 months)")
- /en/by-age/3-5-years/ <- /en/by-age/1-3-years/ ("Next agePreschoolers (3-5 years)"); /en/by-age/5-7-years/ ("Previous agePreschoolers (3-5 years)"); /en/by-age/ ("Preschoolers (3-5 years)")
- /en/printables/summary-10-12-years/ <- /en/by-age/10-12-years/ ("Print the one-page summary for this age"); /en/printables/ ("Preteens (10-12 years)"); /en/printables/ ("Print")
- /en/by-age/7-10-years/ <- /en/by-age/10-12-years/ ("Previous ageSchool age (7-10 years)"); /en/by-age/5-7-years/ ("Next ageSchool age (7-10 years)"); /en/by-age/ ("School age (7-10 years)")
- /en/printables/calm-down-plan/ <- /en/by-age/3-5-years/ ("calm-down plan"); /en/by-age/5-7-years/ ("calm-down plan"); /en/printables/ ("My calm-down plan"); +3 more
- /en/printables/routine-chart/ <- /en/by-age/3-5-years/ ("routine chart"); /en/little-time/ ("routine chart"); /en/printables/ ("Morning and evening routine chart"); +3 more
- /en/printables/summary-3-5-years/ <- /en/by-age/3-5-years/ ("Print the one-page summary for this age"); /en/printables/ ("Preschoolers (3-5 years)"); /en/printables/ ("Print")
- /en/by-age/5-7-years/ <- /en/by-age/3-5-years/ ("Next ageStarting school (5-7 years)"); /en/by-age/7-10-years/ ("Previous ageStarting school (5-7 years)"); /en/by-age/ ("Starting school (5-7 years)")
- /en/printables/summary-5-7-years/ <- /en/by-age/5-7-years/ ("Print the one-page summary for this age"); /en/printables/ ("Starting school (5-7 years)"); /en/printables/ ("Print")
- /en/printables/summary-7-10-years/ <- /en/by-age/7-10-years/ ("Print the one-page summary for this age"); /en/printables/ ("School age (7-10 years)"); /en/printables/ ("Print")
- /en/by-age/10-12-years/ <- /en/by-age/7-10-years/ ("Next agePreteens (10-12 years)"); /en/by-age/ ("Preteens (10-12 years)")
- /en/printables/age-finder/ <- /en/by-age/ ("age finder"); /en/printables/ ("Age finder quiz"); /en/printables/ ("Print")
- /en/printables/learning-0-12-months/ <- /en/learning/0-12-months/ ("Print the learning one-pager for this ag"); /en/printables/ ("Babies (0-12 months)"); /en/printables/ ("Print")
- /en/learning/1-3-years/ <- /en/learning/0-12-months/ ("Next ageToddlers (1-3 years)"); /en/learning/3-5-years/ ("Previous ageToddlers (1-3 years)"); /en/learning/ ("Toddlers (1-3 years)")
- /en/printables/learning-1-3-years/ <- /en/learning/1-3-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("Toddlers (1-3 years)"); /en/printables/ ("Print")
- /en/learning/0-12-months/ <- /en/learning/1-3-years/ ("Previous ageBabies (0-12 months)"); /en/learning/ ("Babies (0-12 months)")
- /en/learning/3-5-years/ <- /en/learning/1-3-years/ ("Next agePreschoolers (3-5 years)"); /en/learning/5-7-years/ ("Previous agePreschoolers (3-5 years)"); /en/learning/ ("Preschoolers (3-5 years)")
- /en/printables/learning-10-12-years/ <- /en/learning/10-12-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("Preteens (10-12 years)"); /en/printables/ ("Print")
- /en/learning/7-10-years/ <- /en/learning/10-12-years/ ("Previous ageSchool age (7-10 years)"); /en/learning/5-7-years/ ("Next ageSchool age (7-10 years)"); /en/learning/ ("School age (7-10 years)")
- /en/printables/learning-3-5-years/ <- /en/learning/3-5-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("Preschoolers (3-5 years)"); /en/printables/ ("Print")
- /en/learning/5-7-years/ <- /en/learning/3-5-years/ ("Next ageStarting school (5-7 years)"); /en/learning/7-10-years/ ("Previous ageStarting school (5-7 years)"); /en/learning/ ("Starting school (5-7 years)")
- /en/printables/learning-5-7-years/ <- /en/learning/5-7-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("Starting school (5-7 years)"); /en/printables/ ("Print")
- /en/printables/learning-7-10-years/ <- /en/learning/7-10-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("School age (7-10 years)"); /en/printables/ ("Print")
- /en/learning/10-12-years/ <- /en/learning/7-10-years/ ("Next agePreteens (10-12 years)"); /en/learning/ ("Preteens (10-12 years)")
- /printables/learning-0-12-months/ <- /learning/0-12-months/ ("打印本阶段的学习一页纸"); /printables/ ("宝宝（0-12 个月）"); /printables/ ("打印")
- /learning/1-3-years/ <- /learning/0-12-months/ ("下一个阶段学步儿（1-3 岁）"); /learning/3-5-years/ ("上一个阶段学步儿（1-3 岁）"); /learning/ ("学步儿（1-3 岁）")
- /printables/learning-1-3-years/ <- /learning/1-3-years/ ("打印本阶段的学习一页纸"); /printables/ ("学步儿（1-3 岁）"); /printables/ ("打印")
- /learning/0-12-months/ <- /learning/1-3-years/ ("上一个阶段宝宝（0-12 个月）"); /learning/ ("宝宝（0-12 个月）")
- /learning/3-5-years/ <- /learning/1-3-years/ ("下一个阶段学龄前（3-5 岁）"); /learning/5-7-years/ ("上一个阶段学龄前（3-5 岁）"); /learning/ ("学龄前（3-5 岁）")
- /printables/learning-10-12-years/ <- /learning/10-12-years/ ("打印本阶段的学习一页纸"); /printables/ ("青春期前（10-12 岁）"); /printables/ ("打印")
- /learning/7-10-years/ <- /learning/10-12-years/ ("上一个阶段小学生（7-10 岁）"); /learning/5-7-years/ ("下一个阶段小学生（7-10 岁）"); /learning/ ("小学生（7-10 岁）")
- /printables/learning-3-5-years/ <- /learning/3-5-years/ ("打印本阶段的学习一页纸"); /printables/ ("学龄前（3-5 岁）"); /printables/ ("打印")
- /learning/5-7-years/ <- /learning/3-5-years/ ("下一个阶段幼小衔接（5-7 岁）"); /learning/7-10-years/ ("上一个阶段幼小衔接（5-7 岁）"); /learning/ ("幼小衔接（5-7 岁）")
- /printables/learning-5-7-years/ <- /learning/5-7-years/ ("打印本阶段的学习一页纸"); /printables/ ("幼小衔接（5-7 岁）"); /printables/ ("打印")
- /printables/learning-7-10-years/ <- /learning/7-10-years/ ("打印本阶段的学习一页纸"); /printables/ ("小学生（7-10 岁）"); /printables/ ("打印")
- /learning/10-12-years/ <- /learning/7-10-years/ ("下一个阶段青春期前（10-12 岁）"); /learning/ ("青春期前（10-12 岁）")
- /zh-hant/printables/family-rules/ <- /zh-hant/approach/ ("家規海報"); /zh-hant/by-age/3-5-years/ ("家規海報"); /zh-hant/printables/ ("家規海報"); +3 more
- /zh-hant/printables/summary-0-12-months/ <- /zh-hant/by-age/0-12-months/ ("列印本階段的一頁摘要"); /zh-hant/printables/ ("寶寶（0-12 個月）"); /zh-hant/printables/ ("列印")
- /zh-hant/by-age/1-3-years/ <- /zh-hant/by-age/0-12-months/ ("下一個階段學步兒（1-3 歲）"); /zh-hant/by-age/3-5-years/ ("上一個階段學步兒（1-3 歲）"); /zh-hant/by-age/ ("學步兒（1-3 歲）")
- /zh-hant/printables/summary-1-3-years/ <- /zh-hant/by-age/1-3-years/ ("列印本階段的一頁摘要"); /zh-hant/printables/ ("學步兒（1-3 歲）"); /zh-hant/printables/ ("列印")
<!-- link-test:end -->
