# 魏美娇 · weimeijiao — SPEC

Owner: Brian Chen (Meteor City LLC). Built in Claude Code from this repo. Not Lovable.

Revised 2026-10-04 by Brian's SPEC change (academic-only sources, no per-country law content, new sections: The one best-proven approach with edge cases, When you have little time, Encouraging learning). Logged in docs/REVIEWER-CHANGES.md.

Revised again 2026-10-04 (Brian, via the Fable audit session): the English brand name is WeiMeiJiao, one word; personal and family references appear only on the About page, the rest of the site speaks in a neutral expert voice (§1, §6, §8). Logged in docs/REVIEWER-CHANGES.md.

Revised a third time 2026-10-04 (Brian, via the Fable session): the age range runs to 12 with a new 10-12 phase everywhere (§1, §5, §5a, §5.7); a separate, low-key Sources page lists every source (§5.9); every source link must resolve to the correct work, not just answer 200 (§6, §10); a full translation QA with docs/GLOSSARY.md as the terminology reference (§6). Logged in docs/REVIEWER-CHANGES.md.

Revised a fourth time 2026-10-04 (Brian, via the Fable session): §9 is the image direction: ultra-realistic documentary photography instead of flat illustration, the most photorealistic Workers AI model (FLUX.2 [dev]), content limits, a full-size quality gate with a review log, no label or provenance metadata on images (Brian's correction), and an incremental rollout in approved batches within the free daily allocation.

Revised a fifth time 2026-10-04 (Brian, via the Fable session): two standing rules in §6 and §10: the whole site must be an easy, smooth read (flow within every page and from topic to topic, with a flow pass on every change), and every change is made to all three locales in the same pull request, enforced by a CI parity check.

Revised a sixth time 2026-10-04 (Brian, via the Fable session): two more standing rules in §6 and §10: citations name the authors and year in the sentence when a specific study is the point, marker hover text and the Sources page give author and year, and Sources entries follow APA 7th edition (§5.9); and a natural human voice, with a site-wide naturalness pass that keeps every fact and citation unchanged. Logged in docs/REVIEWER-CHANGES.md.

## 1. What this is

A free, trilingual, research-based educational website on **disciplining young children, birth to about age 12**, modeled on Brian's earlier site showtellshare.org (repo `brianjohnnychen/showtellshare`, public, static HTML on GitHub Pages). Same spirit: practical, warm, plain-language, organized by developmental phase, with printable tools. The site grew out of a parent raising his own kids, but that story lives on the About page only (§8); every other page speaks in a neutral expert voice.

Audience: parents and caregivers (primary), grandparents, teachers and nannies (secondary). Chinese-speaking families in Taiwan, mainland China and overseas, plus English readers.

Name and brand: the site's name is 魏美娇 (Simplified) / 魏美嬌 (Traditional) / "WeiMeiJiao" (English: one word, no spaces, everywhere it appears: site title, header, footer, meta and Open Graph tags, PDFs, alt text and docs). Choose a short tagline per language in §6 voice. No mascot or third-party characters.

## 2. Domains and hosting (already set up by the Cowork chat, do not redo)

| Domain | Role | Where |
|---|---|---|
| 魏美娇.com (`xn--3ys368f86s.com`) | **Primary**, shown in the address bar | Registered at Dynadot, DNS on Cloudflare, A/AAAA → GitHub Pages (DNS only, not proxied); `www` CNAME → `brianjohnnychen.github.io` |
| weimeijiao.com | 301 → `https://xn--3ys368f86s.com` + same path, query kept | Cloudflare Registrar + Cloudflare redirect rule |
| 魏美嬌.com (`xn--k6s926f86s.com`) | 301 → primary, same path | Dynadot + Cloudflare redirect rule |

- Hosting: **GitHub Pages**, built and deployed by GitHub Actions (`.github/workflows/deploy.yml`, `actions/deploy-pages`). Repo is public, so Actions minutes are free.
- **Deploys run automatically on every push to `main`, and on manual dispatch** (Brian's instruction of 2026-10-04, logged in docs/REVIEWER-CHANGES.md; it replaces the earlier manual-only rule). The custom domain is attached to Pages, so every deploy is public: a change goes live when its pull request is merged into `main`, so nothing merges until CI is green and the session's own QA is done. Sessions never dispatch `deploy.yml` by hand. Sessions preview and test locally and with Playwright, CI (`ci.yml`) builds and tests every push without deploying, and `deploy.yml`'s own build job runs the build, QA, link test and anchor test again before publishing; its smoke-test job then confirms the live site loads and both redirect domains work. Hosting stays on GitHub Pages (Brian tested it from mainland China). Earlier history: the first deploy was manual after the final QA pass (the previous wording of this bullet, including the 60-minute fallback rule for the final QA pass, is kept in docs/REVIEWER-CHANGES.md).
- Publish a `CNAME` file in the built output containing exactly `xn--3ys368f86s.com`.
- After the first successful deploy, Brian/Cowork sets Pages source = GitHub Actions, custom domain and Enforce HTTPS in repo settings. If your session's token can call the Pages API (`PUT /repos/{owner}/{repo}/pages`), do it yourself and log it in docs/STATUS.md.
- Canonical URLs, sitemap, hreflang and Open Graph all use `https://xn--3ys368f86s.com`.

## 3. Stack

- Static site generator: **Astro** (preferred) or Eleventy. Zero client JS by default; small islands only where interactivity is needed (language switcher memory, age finder quiz, print buttons).
- Content in Markdown/MDX per language, one source tree per locale, shared components.
- Fonts: carry over showtellshare's pairing (Lora + DM Sans) for Latin; add Noto Serif SC / Noto Serif TC (headings) and Noto Sans SC / TC (body) for Chinese. Every font is self-hosted: woff2 only, `font-display: swap`, CJK split into unicode-range subsets (Google's slicing, from the @fontsource packages) with each range trimmed to the characters the site actually uses, SC loaded only on zh-Hans pages and TC only on zh-Hant pages (`scripts/fonts.mjs` builds them on every build).
- No third-party assets (mainland China is a core audience and Google services are blocked there): load nothing from Google Fonts, gstatic, Google Analytics, reCAPTCHA, YouTube embeds, jsDelivr, unpkg or any other external service. Every script, stylesheet, font, image and frame comes from our own domain. Outbound links (DOIs, sister site) are fine. `scripts/qa.mjs` fails the build if any page references an external asset.
- Colour tokens: start from showtellshare's `:root` (cream #FAF7F2, warm-white #FFFDF9, green-dark #2D4A2D, green-mid #4A7C4A, green-light #D4E8C2, green-pale #EEF5E6, orange #C85A1E, orange-light #F5E6DC, text-dark #1E1E1A, text-mid #4A4A44, text-light #7A7A70, border #E0DBD0). Give this site its own identity by shifting the primary hue (for example a calm blue-teal or plum family) while keeping the warm neutrals so the two sites feel related. Support dark mode.
- Accessibility: WCAG 2.2 AA, semantic headings, alt text in all three languages, keyboard nav, reduced motion.
- Analytics: none. No trackers, no cookies.

## 4. Languages and URLs

Three locales, full parity (every page exists in all three):

| Locale | Path | `lang` |
|---|---|---|
| Simplified Chinese (default) | `/` | `zh-Hans` |
| Traditional Chinese | `/zh-hant/` | `zh-Hant` |
| English | `/en/` | `en` |

- Switcher in the header on every page, linking to the same page in the other locale. Remember the choice in localStorage (try/catch); no auto-redirect on first visit except a dismissible suggestion banner based on `navigator.language`.
- Traditional is written for Taiwan usage (vocabulary, not just character conversion: 影片 not 视频, 資訊 not 信息, etc.). Simplified is written for mainland usage. Never machine-convert one into the other without a vocabulary pass.
- No per-country legal content in any locale (see §7.5).

## 5. Pages (information architecture)

1. **Home** — what the site is, the core idea in one line, the five phases, entry points to "my child's age", "a problem right now", "the best-proven approach", "when you have little time", "encouraging learning", "the research".
2. **By age** — one page per phase with an overview hub:
   - 0–12 months: no discipline in the punitive sense; responsiveness, routines, safety-proofing, redirection.
   - 1–3 years: limits, redirection, choices, co-regulation of tantrums, biting/hitting, "no" stage.
   - 3–5 years: clear rules, praise of specific behavior, planned ignoring, time-in/time-out, logical consequences, preschool transitions.
   - 5–7 years: school readiness, privileges, natural consequences, problem-solving together, lying and fairness.
   - 7-10 years: responsibility, chores, screens, homework, early peer issues, family meetings, earning trust.
   - 10-12 years (pre-adolescence, the end of primary school): the start of puberty, peer influence and friendships, monitoring built on trust and disclosure, autonomy and negotiated rules, screens and social media, homework and study habits, lying and honesty, responsibility at home, the move to secondary school. The earlier 7-10 content that belongs to pre-adolescence moves here so the phases stay developmentally coherent.
   Each phase page: what's developmentally normal, what works and why, what backfires, scripts parents can say (in that language), a printable one-page summary.
2a. **The one best-proven approach** (core of the discipline section) — behavioral parent training, the shared core of PCIT, Triple P, Incredible Years and PMTO: warm attention and specific praise for wanted behavior, clear instructions, planned ignoring of minor misbehavior, brief consistent consequences, consistent follow-through. Cited to meta-analyses (e.g., Kaminski et al. 2008, *J Abnorm Child Psychol*; Comer et al. 2013, *Clin Psychol Rev*, on PMT and PCIT), each verified. Phase pages, Toolbox and Situations link back to it. Followed by an **Edge cases** section for that approach: the child refuses or leaves time-out; aggression or hitting others; public places; siblings; two caregivers disagree; grandparent caregivers; dangerous behavior; developmental differences, ADHD and autism (when to seek a professional); what to do when it is not working after several weeks.
3. **Toolbox** — one card per method with how-to, ages it fits, evidence strength (Strong / Moderate / Emerging / Contested), common mistakes: connection time, clear expectations, specific praise and attention, planned ignoring, redirection, choices, when-then, natural consequences, logical consequences, time-in, time-out (correct use), privilege removal, problem-solving, routines and visual schedules, family meetings, repair after conflict.
4. **Situations** — quick guides: tantrums, public meltdowns, hitting/biting, sibling fighting, bedtime, mealtime (link to showtellshare.org for food), screens, lying, defiance/"no", whining, homework, grandparents with different rules.
4a. **When you have little time** — recommendations for time-poor parents, built from the research: effective time-outs are short (cite the studies on duration, roughly 1 to 4 minutes, and on not needing a parent to sit with the child), quick privilege removal, when-then, planned ignoring, prevention through routines, each with an honest effort estimate. It also addresses physical discipline using only academic sources: the time-out backup studies (Roberts & Powers 1990, *Behavior Therapy*, and related Roberts work; Larzelere's conditional-spanking research and Larzelere et al. 2024) versus the majority meta-analytic evidence (Gershoff & Grogan-Kaylor 2016; AAP, Sege & Siegel 2018). State exactly what those studies found, including where non-physical backups such as a brief room time-out worked as well as a spank. Do not claim physical discipline is faster or more effective for busy parents unless a peer-reviewed source shows that. No how-to instructions for hitting.
5. **Physical discipline** — see §7.
5a. **Encouraging learning** — a full top-level section in all three languages, organised by the same six age phases (hub + one page per phase, including 10-12), built only on academic sources: serve-and-return talk and language exposure, shared and dialogic reading, play-based learning, process vs person praise (e.g., Gunderson et al.), autonomy support and intrinsic motivation (e.g., Deci, Koestner & Ryan 1999 meta-analysis on rewards), executive function (e.g., Diamond), early numeracy talk, sleep and screens per AAP, homework and parent involvement (e.g., Hill & Tyson 2009 meta-analysis), retrieval practice and spacing for older children. Any finding with weak or mixed evidence (e.g., growth-mindset interventions, Sisk et al. 2018) is marked as such. In the nav, the home page entry points, Printables and the AI image list.
6. **Research** — plain-language summaries of the main studies and position statements, each with full citation and link (DOI/PubMed where possible), plus a note on how to read evidence (correlation vs causation, effect sizes).
7. **Printables** — age finder quiz (10 questions → one of the six phases), phase summaries (including 10-12), routine chart template, calm-down plan, family rules poster, learning-at-home one-pagers per phase (including 10-12). Print CSS; each printable also downloadable as PDF generated at build time if practical.
9. **Sources** (added 2026-10-04) — a separate, low-key bibliography page at `/sources/` (参考文献 / 參考文獻 / Sources) listing every entry in `content/sources.yml`, cited or not: full academic citation, evidence level, DOI or stable link, and which pages cite it, grouped by topic, in all three locales. It is not in the main navigation; the footer links to it discreetly. Each in-text citation and each Research page entry may link to its entry there.
8. **About** — Brian's story and why he built it (see §8), the family photo gallery, a link to showtellshare.org as the sister project, contact (hello@weimeijiao.com once email is set up; until then omit), and a clear disclaimer that this is educational content and not medical, psychological or legal advice, with "when to get professional help" signs and crisis and help-line information (kept in the About disclaimer). Entries follow APA 7th edition (authors, year, title, journal and volume in italics, pages, DOI link); English works stay in English on every locale's page and Chinese-language works follow the Chinese APA 7 conventions; one line at the top of the page says so (added 2026-10-04).

## 6. Voice and content rules

- Warm, direct, non-judgmental, short sentences. Parents arrive stressed; the first screen of every page answers "what do I do now?".
- Every factual claim about outcomes cites a source on the Research page (footnote-style links). No invented statistics, studies or quotes. If you cannot verify a source, leave the claim out.
- Sources are academic and scientific only. Allowed: peer-reviewed journal articles, systematic reviews and meta-analyses, Cochrane reviews, university-press books, and policy statements of scientific or medical bodies published in peer-reviewed journals (e.g., AAP in *Pediatrics*). Not allowed: blogs, news, magazines, advocacy sites, parenting websites, opinion pieces, and organisation web pages or fact sheets that are not published in a peer-reviewed journal. Any source that fails this is dropped, along with the claims that depended on it.
- Record every source used in `content/sources.yml` (id, authors, year, title, venue, DOI/URL, one-line finding, accessed date, evidence level). Evidence level is one of: meta-analysis, systematic review, RCT, experiment, longitudinal, cross-sectional, pilot, review, position statement, book.
- Scripts and examples are written natively in each language, not translated word for word.
- Translation quality (added 2026-10-04): the three locales say the same thing with the same claims, numbers, ages and hedges; terminology follows docs/GLOSSARY.md (the single terminology reference, kept current); phrasing is natural for native readers (mainland usage in Simplified, Taiwan usage in Traditional, US English); Traditional Chinese uses the correct Taiwan character forms and vocabulary with no machine-conversion artifacts (one-to-many character errors such as 頭發 for 頭髮, 面 for 麵, 干 for 乾/幹, 后 for 後, 里 for 裡). A full translation QA reviews every page against the other locales and the sources and fixes everything.
- No em dashes in any user-facing copy in any language.
- Children in examples are generic; never use Brian's daughters' names outside the About page.
- No personal or family references outside the About page: no Brian, Zoe, Naomi or Kelsea, no "my kids" or "our family" meaning the owner's family, no relocation story, no dedications. Those passages are written in a neutral expert voice. The About page keeps the family story and the photo gallery (§8). Parent scripts such as "In our family, hands are gentle" are generic and fine.


### Flow (added 2026-10-04)

The whole site must be an easy, smooth read. Within a page: one thought leads to the next, every section opens by connecting to the one before it, and pages of a kind keep the same order of sections (situations: right now, why, what to say, prevention, when to get help; phases: what is normal, what works, what backfires, things you can say). Between pages: links lead naturally to the next relevant page, in the words of that page's heading, and placed where the reader needs them rather than in a list at the end. Every change ends with a flow pass over the changed page and every page it touches, in all three locales; a site-wide flow read-through runs whenever the queue is quiet.

### Three locales in one pull request (added 2026-10-04)

Every change is made to Simplified Chinese, Traditional Chinese (Taiwan usage) and English in the same pull request: content, titles, summaries, alt text, glossary, sources, navigation, printables and the age finder. `scripts/parity-test.mjs` runs in CI and fails when a page, situation, tool, phase or learning page exists in one locale but not the others, when a list in their frontmatter has a different length across locales, or when an image lacks alt text in a locale.

### Citations in the text (added 2026-10-04)

Every factual claim keeps an in-text citation. The numbered superscript markers stay, for flow, and when a specific study is the point the sentence also names the authors and year in APA form: English "Gershoff and Grogan-Kaylor (2016) found...", three or more authors "Leijten et al. (2019)"; Traditional Chinese "Gershoff 與 Grogan-Kaylor（2016）發現……", "Leijten 等人（2019）"; Simplified Chinese "Gershoff 和 Grogan-Kaylor（2016）发现……", "Leijten 等（2019）"; organizations by their glossary name. The marker's hover and tap text gives the author and year, and the Sources page gives author and year in APA 7th edition entries (authors, year, title, journal, volume, pages, DOI link) in all three locales, English works kept in English and Chinese-language works in the Chinese APA 7 conventions, with one line at the top of the page saying so. `scripts/check-content.mjs` fails when an author-year in a sentence does not match a source cited in that sentence.

### Natural voice (added 2026-10-04)

The prose reads like a thoughtful human parenting-research writer, not a model: sentence length and openers vary; evidence is folded into the sentence instead of the formula "In a meta-analysis of N studies..."; no tidy triplets or stock transitions; no filler such as "it is important to note"; no stacked hedges; no em dashes; no paragraph shape repeated from page to page. Chinese reads as native Taiwan usage (zh-Hant) or mainland usage (zh-Hans), never translated English. Read each page aloud in your head for rhythm. A naturalness pass changes wording only: every fact, number, study description and citation stays, the sources and test suites rerun, and all three locales change in the same pull request.

## 7. Physical discipline page (Brian's decision: present both sides)

Brian chose to cover physical discipline by presenting both sides, with the weight of the research shown clearly, and letting parents decide. Build it exactly that way:

7.1 **Separate two things up front.** Physical *intervention* for safety (grabbing a child running into the street, holding a child to stop them hurting someone, removing a child from danger) is appropriate and necessary at every age; explain how to do it calmly. Physical *punishment* (spanking, smacking, hitting with objects) is the contested topic the rest of the page covers.

7.2 **What the research says (majority view).** Summarize at minimum, with citations:
- Gershoff & Grogan-Kaylor (2016), *Journal of Family Psychology*: meta-analyses of 111 effect sizes representing 160,927 children; 13 of 17 mean effect sizes were significant, all linking spanking with more detrimental outcomes (verified against the abstract, which does not give the number of studies or a separate compliance result, so the site does not state those).
- AAP policy statement "Effective Discipline to Raise Healthy Children" (Sege & Siegel, *Pediatrics*, 2018): recommends against spanking and harsh verbal discipline.
- Other peer-reviewed meta-analyses, reviews and journal-published policy statements as verified. (The WHO fact sheet and the APA 2019 resolution are not journal publications, so under §6 they are not cited.)

7.3 **What proponents argue (minority view).** Summarize fairly, with citations:
- Larzelere, Gunnoe, Pritsker & Ferguson (2024), *Marriage & Family Review*, meta-analysis of controlled longitudinal studies: customary spanking explained less than 1% of the remaining variance in each child outcome once baseline adjustment is controlled; the authors attribute harmful-looking results to residual confounding and discourage blanket anti-spanking injunctions (verified against the abstract).
- Larzelere's "conditional spanking" position (e.g., Larzelere & Kuhn 2005, *Clinical Child and Family Psychology Review*): that outcomes depend on how it is used. Present the conditions proponents themselves describe as *their* position, attributed to them, not as the site's instructions.
- Cultural and family-autonomy arguments parents commonly raise.

7.4 **How to weigh it.** Plain explanation of where the two camps agree (harsh, frequent, angry or implement-based punishment is harmful; warmth and consistency matter most; non-physical methods work) and where they disagree (whether occasional mild spanking adds harm). State clearly what the major scientific and medical bodies recommend, citing only their peer-reviewed policy statements (e.g., AAP in *Pediatrics*). Then the decision-support section: questions a parent can ask themselves, warning signs that discipline has become abuse, what to do instead in the moment, and how to repair after losing your temper.

7.5 **The law.** No per-country legal content anywhere on the site. One neutral sentence only: laws on physical discipline differ from country to country, so check the law where you live.

Tone on this page: neutral and factual, no moralizing either way, no graphic descriptions, never a step-by-step "how to spank" guide.

## 8. About page and photos

Reuse the same family photos from showtellshare.org's About page. They are public in `brianjohnnychen/showtellshare` at `assets/personal-1.jpg`, `personal-2.jpg`, `personal-3.png`, `personal-4.png`, `personal-5.jpg`, `personal-6.png`, `personal-7.jpg`, `personal-8.jpg`, `personal-9.png`, `personal-10.png`, `personal-11.png`, `personal-12.png` (raw URLs `https://raw.githubusercontent.com/brianjohnnychen/showtellshare/main/assets/<file>`). Copy them into this repo (`src/assets/family/`), optimize (AVIF/WebP + fallback, responsive sizes), and keep their existing alt text, translated:

1 Naomi preparing dumpling filling · 2 Two girls folding dumplings · 3 Toddler pressing dough · 4 Girls eating dumplings · 5 Zoe and Naomi making wontons · 6 Children cooking · 7 Zoe and daughters baking · 8 Naomi and Kelsea with vegetables · 9 Two girls shelling beans · 10 Family baking cookies · 11 Kelsea helping at the stove · 12 Zoe and Kelsea whisking

Story source (from showtellshare's About, for tone; rewrite for this topic): the site is built by Brian about raising his own daughters Naomi and Kelsea with his wife Zoe, after the family relocated from Boston to Taiwan to be closer to Brian's parents. It is the companion to Show Tell Share. Keep it personal, short, and in Brian's voice. Gallery with lightbox like showtellshare's.

## 9. AI-generated images

Every page other than About gets one illustration generated by AI, never a photo of real children; the real family photos stay on the About page. Revised 2026-10-04 on Brian's image direction (INBOX item 3), his correction the same day (no labels), and his change of direction that evening (INBOX item 7): the photographic plan is dropped and every image is a polished illustration.

- Style: one consistent, high-quality flat editorial illustration style matching the best of the first pieces (home, approach, connection time, babies): clean simplified shapes with a soft paper-grain texture, a warm limited palette (cream, peach, terracotta, muted teal, olive) on a pale cream background, soft diffuse light, friendly simplified faces, East Asian families with natural proportions and correct hands, cozy slightly imperfect homes and everyday places in Taiwan and mainland China, one clear focal action per picture, no text, logos, signs, speech bubbles or symbols. The shared style text lives once in `content/images.yml` and is appended to every scene prompt.
- Content limits: never depict hitting, spanking, injury, a crying or frightened child being punished, or any child in distress beyond ordinary mild frustration. The physical-discipline and safety pages use neutral scenes (a parent kneeling to talk, a calm corner, holding a hand at a crossing).
- Generator: Cloudflare Workers AI, called from GitHub Actions, with the strongest text-to-image model in the catalog for illustration quality: `@cf/black-forest-labs/flux-2-dev` (FLUX.2 [dev]) with illustration prompts, compared against the existing style at review; the workflow prints the account's current Text-to-Image catalog and the model's input schema on every run so a newer model replaces it deliberately.
  - `content/images.yml` lists every image: id, page, prompt (English, the scene only), alt text in all three languages (kept through regeneration), size.
  - `.github/workflows/images.yml` runs on manual dispatch only (the daily schedule and the push trigger are gone): it generates several candidates per image (default 3, each with its own seed, several requests in flight) for the ids asked for or for every id without an approved illustration, discards any picture drawn as a panel inside a margin (`scripts/lib/frame-check.mjs`) and re-rolls it, and commits them under `image-candidates/` on the review branch `images/incoming`. Candidates never ship.
  - Plan and cost: Cloudflare Workers Paid is active for this job (Brian, via Cowork, 2026-10-04), so the free daily allocation no longer gates the work; generation runs as fast as the quota allows. When every image is approved and merged, STATUS.md starts with the line ILLUSTRATIONS COMPLETE and Brian is told in the session, Cowork cancels the paid plan, and nothing on the site may depend on Workers AI afterwards (the site builds and deploys from the committed files alone).
  - Secrets `CF_ACCOUNT_ID` and `CF_AI_TOKEN` exist. The site must still build without generated files: components fall back to a placeholder (gradient + icon) when a page's illustration is missing; a first-style `<id>.png` stays until its replacement is approved; the loader prefers `<id>.jpg`.
- Quality gate: open every candidate at full size; keep the cleanest per image and reject anything with garbled text, odd hands or faces, melted objects, uneven style against the set, impossible anatomy or lighting, or a breach of the content limits; regenerate with a changed prompt when no candidate passes. docs/IMAGES.md keeps the review log per image: model and settings, candidates seen, the one kept and why, rejections and their reasons.
- Labeling: none. No caption, watermark, visible label or AI provenance metadata on any image (the generator writes plain JPEGs with no metadata).
- Rollout: incremental and without Brian. Approved images are copied to `src/assets/ai/<id>.jpg` on a batch branch from `main`, merged through a pull request once CI is green, and go live on their own (deploy.yml).

## 10. Definition of done

- All pages in §5 (including the best-proven approach with edge cases, the little-time guide and the Encouraging learning section) exist in all three locales with real, cited content from academic sources only; no lorem ipsum, no TODOs in user-facing copy.
- Every change ships in all three locales in the same pull request, and `scripts/parity-test.mjs` passes in CI (no page, situation, tool, phase or learning page missing in a locale, frontmatter lists the same length, alt text in every locale). Every change has had its flow pass (§6, Flow).
- Lighthouse ≥ 95 for performance, accessibility, best practices, SEO on mobile and desktop for Home, one phase page and Physical discipline.
- Verified at 375px and 1280px widths in all three locales (screenshots in `docs/screenshots/`).
- Builds via Actions (CI on every push; deploy only by manual dispatch); `CNAME` present; sitemap, robots.txt, hreflang, OG images in place.
- Every in-content link and button goes to the exact section it refers to: anchor ids on every heading, card, edge case and source entry; deep links such as `/toolbox/#time-out`; citation markers link to the exact entry on the Research page, which links back to each place it is cited. Never just the top of a page.
- An automated link test (`scripts/link-test.mjs`) checks that every internal link resolves to an existing page and element id in all three locales; it runs in CI and its latest results are recorded in docs/QA.md.
- docs/QA.md keeps the QA checklist: fact-check per claim, UI/UX at 375px and 1280px, dark mode, keyboard navigation, no third-party assets, and the link test results.
- When the build and its own QA are done, docs/STATUS.md says READY FOR FINAL PASS with the QA results and open issues; the final QA pass then fixes what it can and deploys (§2).
- `content/sources.yml` complete, academic sources only, each with an evidence level; every source link resolves to the correct work, not just to a page that answers 200: the Actions checker confirms that each DOI or URL resolves and that the landing page's title or DOI matches the cited work (no homepage, search page, paywall error or different paper); DOI links are preferred; docs/QA.md reports the counts.
- Citations and voice (§6): the lint's author-year check passes; sentences that make a specific study the point name its authors and year; new or reworked text follows the natural-voice rule.
- docs/STATUS.md and docs/RUNLOG.md updated.
