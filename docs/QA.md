# QA

The QA checklist (SPEC §10): fact-check per claim, UI and UX at 375px and 1280px, dark mode, keyboard navigation, no third-party assets, printables, Lighthouse, sources and help lines, and the link test. Every check except the fact-check is a script, so it can be rerun at any time; CI (`.github/workflows/ci.yml`) runs the content lint, the build with QA, the link test, the anchor test and the behavior test on every push.

Latest full run: 2026-10-03 22:40-23:10 UTC, the final QA pass (section 9). Times below are UTC.

## At a glance

| Check | How to rerun | Latest result |
|---|---|---|
| Content lint | `node scripts/check-content.mjs` | 159 MDX files, 0 errors, 0 warnings (now also rejects two links joined by 和/and when a link name contains 和/and) |
| Build and QA | `npm run build` (Astro, then `scripts/postbuild.mjs`, then `scripts/qa.mjs`) | 105 pages (35 per locale), 0 errors, 0 warnings; 42 PDFs; 105 Open Graph images; 34 unused built files (4.49 MiB) pruned |
| Link test | `node scripts/link-test.mjs --write` | 14,353 internal links, 9,202 of them to an anchor, 0 broken (block at the end) |
| Anchor test | `node scripts/anchor-test.mjs` | 26 of 26 deep links land on their target (13 kinds of target, 375px and 1280px) |
| UI check | `node scripts/ui-check.mjs` | 129 page views, no problems ([report](screenshots/ui-check.md)) |
| Behavior test | `node scripts/behavior-test.mjs` | 81 of 81 checks pass: age finder scoring and flow, lightbox, toolbox filter, language banner, theme, language switcher, no-JavaScript fallbacks, 404, 320px reflow, dark-mode sheets, menu, Research back link, landmarks (section 9) |
| Accessibility audit | axe-core 4.13 (WCAG 2.2 AA and best practice) and html-validate 11.16, final pass | 0 axe violations in 326 page runs; html-validate leaves only cosmetic or deliberate messages (section 9) |
| Printables | page limits in `scripts/postbuild.mjs` | 39 one-page sheets and the 2-page age finder in each locale, all at 100% scale |
| Third-party assets | `scripts/qa.mjs` | none; every font, image and script is served from the site's own domain |
| Lighthouse | `LIGHTHOUSE_BIN=… node scripts/lighthouse.mjs` | all 18 medians 95 or higher: performance 95-100 on mobile and 100 on desktop; accessibility, best practices and SEO 100 everywhere ([lighthouse.md](lighthouse.md), section 7) |
| Sources | `.github/workflows/sources.yml` (push, weekly, manual) | 146 entries: every DOI registered, metadata matches, every link resolves; 0 failures (Actions run 37147001796) |
| Help lines | same workflow, `helplines` job | all 14 numbers found on their official pages (run 37147001796) |

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

Word-for-word lookups (`content/source-quotes.yml`, `quotes` job) settled the remaining wording questions on 2026-10-03: the AAP 2018 abstract and the AAP's own "Where We Stand: Spanking" page (recorded in sources.yml), the age range of the AAP 2016 media statement (0 to 5 years), the design of kennedy-kramer-2008 (wait-list comparison; randomization not stated) and the sample of roediger-karpicke-2006 (students; ages not stated).

## 2. UI and UX at 375px and 1280px

`scripts/ui-check.mjs` opens 14 pages (home, by-age hub, a phase page, approach, toolbox, situations, little time, physical discipline, learning hub, a learning phase page, research, printables hub, age finder, about) in all three locales at 375px and 1280px in light mode and at 375px in dark mode, plus the home page at 320px, with the browser language set to the page's language. On every full page it checks: no horizontal overflow, no console errors, no failed requests, no broken images, and that the site name in the header is neither cut off nor running under the header controls. Screenshots of the first screen of each view are in [docs/screenshots/](screenshots/). Result: no problems in 129 views.

Checked by eye on the screenshots (home, toolbox, research, little time and physical discipline in different locales, widths and themes): this is how the English header problem was found (at 375px the name ran under the language switcher). It is fixed, and the UI check now tests for it. The 21 pages still waiting for their illustration show the designed placeholder (open issue in STATUS.md).

## 2a. Deep links land on their target

The link test proves every `#anchor` exists; `scripts/anchor-test.mjs` proves the browser actually scrolls there. Long pages skip layout for off-screen blocks, and Chinese pages switch to their web fonts after load, and neither may move a deep-linked target out of view. For 13 targets of every kind (headings, citation markers inside paragraphs, tool and situation cards, a section inside a card, bibliography entries) in all three locales, it opens the page at `#id` in a fresh tab at 375px and 1280px, waits for the font switch, and checks the target sits just below whatever is visible of the header. CI runs it on a machine with no Chinese system font, the worst case for the font switch; that run is how a 300-700px jump on the Simplified Chinese toolbox was caught and fixed. Result: 26 of 26 in place.

## 3. Dark mode

The UI check loads every page at 375px with `prefers-color-scheme: dark` and confirms the page background really is dark; the theme button switches and remembers the choice (stored per browser; the page renders correctly without storage). Printables and PDFs always print light.

## 4. Keyboard navigation

At 1280px on every page the UI check confirms: the first Tab lands on a visible skip link; Enter on it moves focus to `<main>`; Tab then moves through the header controls with a visible focus ring. All interactive elements are native links, buttons and form controls (the age finder uses radio buttons in fieldsets).

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

<!-- link-test:start -->
Link test run 2026-10-03 23:08 UTC over dist/ (106 HTML pages).

| Locale | Pages | Internal links | With #anchor | Broken |
|---|---|---|---|---|
| zh-hans | 36 | 4811 | 3068 | 0 |
| zh-hant | 35 | 4771 | 3067 | 0 |
| en | 35 | 4771 | 3067 | 0 |
| all | 106 | 14353 | 9202 | 0 |

In-content links to a whole page (no #anchor), for review: 72 target page(s).
- /printables/family-rules/ <- /approach/ ("家规海报"); /by-age/3-5-years/ ("家规海报"); /printables/ ("家规海报"); +3 more
- /printables/summary-0-12-months/ <- /by-age/0-12-months/ ("打印本阶段的一页总结"); /printables/ ("宝宝（0-12 个月）"); /printables/ ("打印")
- /by-age/1-3-years/ <- /by-age/0-12-months/ ("下一个阶段学步儿（1-3 岁）"); /by-age/3-5-years/ ("上一个阶段学步儿（1-3 岁）"); /by-age/ ("学步儿（1-3 岁）")
- /printables/summary-1-3-years/ <- /by-age/1-3-years/ ("打印本阶段的一页总结"); /printables/ ("学步儿（1-3 岁）"); /printables/ ("打印")
- /by-age/0-12-months/ <- /by-age/1-3-years/ ("上一个阶段宝宝（0-12 个月）"); /by-age/ ("宝宝（0-12 个月）")
- /by-age/3-5-years/ <- /by-age/1-3-years/ ("下一个阶段学龄前（3-5 岁）"); /by-age/5-7-years/ ("上一个阶段学龄前（3-5 岁）"); /by-age/ ("学龄前（3-5 岁）")
- /printables/routine-chart/ <- /by-age/3-5-years/ ("作息表"); /little-time/ ("日常作息表"); /printables/ ("早晚作息表"); +3 more
- /printables/summary-3-5-years/ <- /by-age/3-5-years/ ("打印本阶段的一页总结"); /printables/ ("学龄前（3-5 岁）"); /printables/ ("打印")
- /by-age/5-7-years/ <- /by-age/3-5-years/ ("下一个阶段幼小衔接（5-7 岁）"); /by-age/7-10-years/ ("上一个阶段幼小衔接（5-7 岁）"); /by-age/ ("幼小衔接（5-7 岁）")
- /printables/summary-5-7-years/ <- /by-age/5-7-years/ ("打印本阶段的一页总结"); /printables/ ("幼小衔接（5-7 岁）"); /printables/ ("打印")
- /by-age/7-10-years/ <- /by-age/5-7-years/ ("下一个阶段小学生（7-10 岁）"); /by-age/ ("小学生（7-10 岁）")
- /printables/summary-7-10-years/ <- /by-age/7-10-years/ ("打印本阶段的一页总结"); /printables/ ("小学生（7-10 岁）"); /printables/ ("打印")
- /printables/age-finder/ <- /by-age/ ("年龄小测验"); /printables/ ("年龄小测验"); /printables/ ("打印")
- /en/printables/family-rules/ <- /en/approach/ ("family rules poster"); /en/by-age/3-5-years/ ("family rules poster"); /en/printables/ ("Family rules poster"); +3 more
- /en/printables/summary-0-12-months/ <- /en/by-age/0-12-months/ ("Print the one-page summary for this age"); /en/printables/ ("Babies (0-12 months)"); /en/printables/ ("Print")
- /en/by-age/1-3-years/ <- /en/by-age/0-12-months/ ("Next ageToddlers (1-3 years)"); /en/by-age/3-5-years/ ("Previous ageToddlers (1-3 years)"); /en/by-age/ ("Toddlers (1-3 years)")
- /en/printables/summary-1-3-years/ <- /en/by-age/1-3-years/ ("Print the one-page summary for this age"); /en/printables/ ("Toddlers (1-3 years)"); /en/printables/ ("Print")
- /en/by-age/0-12-months/ <- /en/by-age/1-3-years/ ("Previous ageBabies (0-12 months)"); /en/by-age/ ("Babies (0-12 months)")
- /en/by-age/3-5-years/ <- /en/by-age/1-3-years/ ("Next agePreschoolers (3-5 years)"); /en/by-age/5-7-years/ ("Previous agePreschoolers (3-5 years)"); /en/by-age/ ("Preschoolers (3-5 years)")
- /en/printables/routine-chart/ <- /en/by-age/3-5-years/ ("routine chart"); /en/little-time/ ("routine chart"); /en/printables/ ("Morning and evening routine chart"); +3 more
- /en/printables/summary-3-5-years/ <- /en/by-age/3-5-years/ ("Print the one-page summary for this age"); /en/printables/ ("Preschoolers (3-5 years)"); /en/printables/ ("Print")
- /en/by-age/5-7-years/ <- /en/by-age/3-5-years/ ("Next ageStarting school (5-7 years)"); /en/by-age/7-10-years/ ("Previous ageStarting school (5-7 years)"); /en/by-age/ ("Starting school (5-7 years)")
- /en/printables/summary-5-7-years/ <- /en/by-age/5-7-years/ ("Print the one-page summary for this age"); /en/printables/ ("Starting school (5-7 years)"); /en/printables/ ("Print")
- /en/by-age/7-10-years/ <- /en/by-age/5-7-years/ ("Next ageSchool age (7-10 years)"); /en/by-age/ ("School age (7-10 years)")
- /en/printables/summary-7-10-years/ <- /en/by-age/7-10-years/ ("Print the one-page summary for this age"); /en/printables/ ("School age (7-10 years)"); /en/printables/ ("Print")
- /en/printables/age-finder/ <- /en/by-age/ ("age finder"); /en/printables/ ("Age finder quiz"); /en/printables/ ("Print")
- /en/printables/learning-0-12-months/ <- /en/learning/0-12-months/ ("Print the learning one-pager for this ag"); /en/printables/ ("Babies (0-12 months)"); /en/printables/ ("Print")
- /en/learning/1-3-years/ <- /en/learning/0-12-months/ ("Next ageToddlers (1-3 years)"); /en/learning/3-5-years/ ("Previous ageToddlers (1-3 years)"); /en/learning/ ("Toddlers (1-3 years)")
- /en/printables/learning-1-3-years/ <- /en/learning/1-3-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("Toddlers (1-3 years)"); /en/printables/ ("Print")
- /en/learning/0-12-months/ <- /en/learning/1-3-years/ ("Previous ageBabies (0-12 months)"); /en/learning/ ("Babies (0-12 months)")
- /en/learning/3-5-years/ <- /en/learning/1-3-years/ ("Next agePreschoolers (3-5 years)"); /en/learning/5-7-years/ ("Previous agePreschoolers (3-5 years)"); /en/learning/ ("Preschoolers (3-5 years)")
- /en/printables/learning-3-5-years/ <- /en/learning/3-5-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("Preschoolers (3-5 years)"); /en/printables/ ("Print")
- /en/learning/5-7-years/ <- /en/learning/3-5-years/ ("Next ageStarting school (5-7 years)"); /en/learning/7-10-years/ ("Previous ageStarting school (5-7 years)"); /en/learning/ ("Starting school (5-7 years)")
- /en/printables/learning-5-7-years/ <- /en/learning/5-7-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("Starting school (5-7 years)"); /en/printables/ ("Print")
- /en/learning/7-10-years/ <- /en/learning/5-7-years/ ("Next ageSchool age (7-10 years)"); /en/learning/ ("School age (7-10 years)")
- /en/printables/learning-7-10-years/ <- /en/learning/7-10-years/ ("Print the learning one-pager for this ag"); /en/printables/ ("School age (7-10 years)"); /en/printables/ ("Print")
- /en/printables/calm-down-plan/ <- /en/printables/ ("My calm-down plan"); /en/printables/ ("Print"); /en/situations/ ("calm-down plan"); +1 more
- /printables/learning-0-12-months/ <- /learning/0-12-months/ ("打印本阶段的学习一页纸"); /printables/ ("宝宝（0-12 个月）"); /printables/ ("打印")
- /learning/1-3-years/ <- /learning/0-12-months/ ("下一个阶段学步儿（1-3 岁）"); /learning/3-5-years/ ("上一个阶段学步儿（1-3 岁）"); /learning/ ("学步儿（1-3 岁）")
- /printables/learning-1-3-years/ <- /learning/1-3-years/ ("打印本阶段的学习一页纸"); /printables/ ("学步儿（1-3 岁）"); /printables/ ("打印")
- /learning/0-12-months/ <- /learning/1-3-years/ ("上一个阶段宝宝（0-12 个月）"); /learning/ ("宝宝（0-12 个月）")
- /learning/3-5-years/ <- /learning/1-3-years/ ("下一个阶段学龄前（3-5 岁）"); /learning/5-7-years/ ("上一个阶段学龄前（3-5 岁）"); /learning/ ("学龄前（3-5 岁）")
- /printables/learning-3-5-years/ <- /learning/3-5-years/ ("打印本阶段的学习一页纸"); /printables/ ("学龄前（3-5 岁）"); /printables/ ("打印")
- /learning/5-7-years/ <- /learning/3-5-years/ ("下一个阶段幼小衔接（5-7 岁）"); /learning/7-10-years/ ("上一个阶段幼小衔接（5-7 岁）"); /learning/ ("幼小衔接（5-7 岁）")
- /printables/learning-5-7-years/ <- /learning/5-7-years/ ("打印本阶段的学习一页纸"); /printables/ ("幼小衔接（5-7 岁）"); /printables/ ("打印")
- /learning/7-10-years/ <- /learning/5-7-years/ ("下一个阶段小学生（7-10 岁）"); /learning/ ("小学生（7-10 岁）")
- /printables/learning-7-10-years/ <- /learning/7-10-years/ ("打印本阶段的学习一页纸"); /printables/ ("小学生（7-10 岁）"); /printables/ ("打印")
- /printables/calm-down-plan/ <- /printables/ ("我的冷静计划"); /printables/ ("打印"); /situations/ ("冷静计划"); +1 more
- /zh-hant/printables/family-rules/ <- /zh-hant/approach/ ("家規海報"); /zh-hant/by-age/3-5-years/ ("家規海報"); /zh-hant/printables/ ("家規海報"); +3 more
- /zh-hant/printables/summary-0-12-months/ <- /zh-hant/by-age/0-12-months/ ("列印本階段的一頁摘要"); /zh-hant/printables/ ("寶寶（0-12 個月）"); /zh-hant/printables/ ("列印")
- /zh-hant/by-age/1-3-years/ <- /zh-hant/by-age/0-12-months/ ("下一個階段學步兒（1-3 歲）"); /zh-hant/by-age/3-5-years/ ("上一個階段學步兒（1-3 歲）"); /zh-hant/by-age/ ("學步兒（1-3 歲）")
- /zh-hant/printables/summary-1-3-years/ <- /zh-hant/by-age/1-3-years/ ("列印本階段的一頁摘要"); /zh-hant/printables/ ("學步兒（1-3 歲）"); /zh-hant/printables/ ("列印")
- /zh-hant/by-age/0-12-months/ <- /zh-hant/by-age/1-3-years/ ("上一個階段寶寶（0-12 個月）"); /zh-hant/by-age/ ("寶寶（0-12 個月）")
- /zh-hant/by-age/3-5-years/ <- /zh-hant/by-age/1-3-years/ ("下一個階段學齡前（3-5 歲）"); /zh-hant/by-age/5-7-years/ ("上一個階段學齡前（3-5 歲）"); /zh-hant/by-age/ ("學齡前（3-5 歲）")
- /zh-hant/printables/routine-chart/ <- /zh-hant/by-age/3-5-years/ ("作息表"); /zh-hant/little-time/ ("作息表"); /zh-hant/printables/ ("早晚作息表"); +3 more
- /zh-hant/printables/summary-3-5-years/ <- /zh-hant/by-age/3-5-years/ ("列印本階段的一頁摘要"); /zh-hant/printables/ ("學齡前（3-5 歲）"); /zh-hant/printables/ ("列印")
- /zh-hant/by-age/5-7-years/ <- /zh-hant/by-age/3-5-years/ ("下一個階段幼小銜接（5-7 歲）"); /zh-hant/by-age/7-10-years/ ("上一個階段幼小銜接（5-7 歲）"); /zh-hant/by-age/ ("幼小銜接（5-7 歲）")
- /zh-hant/printables/summary-5-7-years/ <- /zh-hant/by-age/5-7-years/ ("列印本階段的一頁摘要"); /zh-hant/printables/ ("幼小銜接（5-7 歲）"); /zh-hant/printables/ ("列印")
- /zh-hant/by-age/7-10-years/ <- /zh-hant/by-age/5-7-years/ ("下一個階段國小學童（7-10 歲）"); /zh-hant/by-age/ ("國小學童（7-10 歲）")
- /zh-hant/printables/summary-7-10-years/ <- /zh-hant/by-age/7-10-years/ ("列印本階段的一頁摘要"); /zh-hant/printables/ ("國小學童（7-10 歲）"); /zh-hant/printables/ ("列印")
<!-- link-test:end -->
