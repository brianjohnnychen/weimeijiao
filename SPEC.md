# 魏美娇 · weimeijiao — SPEC

Owner: Brian Chen (Meteor City LLC). Built in Claude Code from this repo. Not Lovable.

Revised 2026-10-04 by Brian's SPEC change (academic-only sources, no per-country law content, new sections: The one best-proven approach with edge cases, When you have little time, Encouraging learning). Logged in docs/REVIEWER-CHANGES.md.

## 1. What this is

A free, trilingual, research-based educational website on **disciplining young children, birth to about age 10**, modeled on Brian's earlier site showtellshare.org (repo `brianjohnnychen/showtellshare`, public, static HTML on GitHub Pages). Same spirit: practical, warm, plain-language, built by a parent about his own kids, organized by developmental phase, with printable tools.

Audience: parents and caregivers (primary), grandparents, teachers and nannies (secondary). Chinese-speaking families in Taiwan, mainland China and overseas, plus English readers.

Name and brand: the site's name is 魏美娇 (Simplified) / 魏美嬌 (Traditional) / "Wei Mei Jiao" (English). Choose a short tagline per language in §6 voice. No mascot or third-party characters.

## 2. Domains and hosting (already set up by the Cowork chat, do not redo)

| Domain | Role | Where |
|---|---|---|
| 魏美娇.com (`xn--3ys368f86s.com`) | **Primary**, shown in the address bar | Registered at Dynadot, DNS on Cloudflare, A/AAAA → GitHub Pages (DNS only, not proxied); `www` CNAME → `brianjohnnychen.github.io` |
| weimeijiao.com | 301 → `https://xn--3ys368f86s.com` + same path, query kept | Cloudflare Registrar + Cloudflare redirect rule |
| 魏美嬌.com (`xn--k6s926f86s.com`) | 301 → primary, same path | Dynadot + Cloudflare redirect rule |

- Hosting: **GitHub Pages**, built and deployed by GitHub Actions (`.github/workflows/deploy.yml`, `actions/deploy-pages`). Repo is public, so Actions minutes are free.
- **Deploys are manual and happen once, after the final QA pass.** The custom domain is already attached to Pages, so any deploy is public. `deploy.yml` runs only on `workflow_dispatch`. Build sessions never run it: they preview and test locally and with Playwright, CI (`ci.yml`) builds and tests every push without deploying, and when a build and its own QA are done the session writes READY FOR FINAL PASS with the QA results and open issues in docs/STATUS.md, commits, and stops. The final QA pass (run on a different model) fixes everything it can, then runs `deploy.yml` to go live at `xn--3ys368f86s.com`, turns on Enforce HTTPS if its token allows, confirms the site loads and both redirect domains work (deploy.yml's smoke-test job checks this), and lists any open issues in docs/STATUS.md. Hosting stays on GitHub Pages (Brian tested it from mainland China).
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
   - 7–10 years: responsibility, chores, screens, homework, peer issues, family meetings, earning trust.
   Each phase page: what's developmentally normal, what works and why, what backfires, scripts parents can say (in that language), a printable one-page summary.
2a. **The one best-proven approach** (core of the discipline section) — behavioral parent training, the shared core of PCIT, Triple P, Incredible Years and PMTO: warm attention and specific praise for wanted behavior, clear instructions, planned ignoring of minor misbehavior, brief consistent consequences, consistent follow-through. Cited to meta-analyses (e.g., Kaminski et al. 2008, *J Abnorm Child Psychol*; Comer et al. 2013, *Clin Psychol Rev*, on PMT and PCIT), each verified. Phase pages, Toolbox and Situations link back to it. Followed by an **Edge cases** section for that approach: the child refuses or leaves time-out; aggression or hitting others; public places; siblings; two caregivers disagree; grandparent caregivers; dangerous behavior; developmental differences, ADHD and autism (when to seek a professional); what to do when it is not working after several weeks.
3. **Toolbox** — one card per method with how-to, ages it fits, evidence strength (Strong / Moderate / Emerging / Contested), common mistakes: connection time, clear expectations, specific praise and attention, planned ignoring, redirection, choices, when-then, natural consequences, logical consequences, time-in, time-out (correct use), privilege removal, problem-solving, routines and visual schedules, family meetings, repair after conflict.
4. **Situations** — quick guides: tantrums, public meltdowns, hitting/biting, sibling fighting, bedtime, mealtime (link to showtellshare.org for food), screens, lying, defiance/"no", whining, homework, grandparents with different rules.
4a. **When you have little time** — recommendations for time-poor parents, built from the research: effective time-outs are short (cite the studies on duration, roughly 1 to 4 minutes, and on not needing a parent to sit with the child), quick privilege removal, when-then, planned ignoring, prevention through routines, each with an honest effort estimate. It also addresses physical discipline using only academic sources: the time-out backup studies (Roberts & Powers 1990, *Behavior Therapy*, and related Roberts work; Larzelere's conditional-spanking research and Larzelere et al. 2024) versus the majority meta-analytic evidence (Gershoff & Grogan-Kaylor 2016; AAP, Sege & Siegel 2018). State exactly what those studies found, including where non-physical backups such as a brief room time-out worked as well as a spank. Do not claim physical discipline is faster or more effective for busy parents unless a peer-reviewed source shows that. No how-to instructions for hitting.
5. **Physical discipline** — see §7.
5a. **Encouraging learning** — a full top-level section in all three languages, organised by the same five age phases (hub + one page per phase), built only on academic sources: serve-and-return talk and language exposure, shared and dialogic reading, play-based learning, process vs person praise (e.g., Gunderson et al.), autonomy support and intrinsic motivation (e.g., Deci, Koestner & Ryan 1999 meta-analysis on rewards), executive function (e.g., Diamond), early numeracy talk, sleep and screens per AAP, homework and parent involvement (e.g., Hill & Tyson 2009 meta-analysis), retrieval practice and spacing for older children. Any finding with weak or mixed evidence (e.g., growth-mindset interventions, Sisk et al. 2018) is marked as such. In the nav, the home page entry points, Printables and the AI image list.
6. **Research** — plain-language summaries of the main studies and position statements, each with full citation and link (DOI/PubMed where possible), plus a note on how to read evidence (correlation vs causation, effect sizes).
7. **Printables** — age finder quiz (10 questions → phase), phase summaries, routine chart template, calm-down plan, family rules poster, learning-at-home one-pagers per phase. Print CSS; each printable also downloadable as PDF generated at build time if practical.
8. **About** — Brian's story and why he built it (see §8), the family photo gallery, a link to showtellshare.org as the sister project, contact (hello@weimeijiao.com once email is set up; until then omit), and a clear disclaimer that this is educational content and not medical, psychological or legal advice, with "when to get professional help" signs and crisis and help-line information (kept in the About disclaimer).

## 6. Voice and content rules

- Warm, direct, non-judgmental, short sentences. Parents arrive stressed; the first screen of every page answers "what do I do now?".
- Every factual claim about outcomes cites a source on the Research page (footnote-style links). No invented statistics, studies or quotes. If you cannot verify a source, leave the claim out.
- Sources are academic and scientific only. Allowed: peer-reviewed journal articles, systematic reviews and meta-analyses, Cochrane reviews, university-press books, and policy statements of scientific or medical bodies published in peer-reviewed journals (e.g., AAP in *Pediatrics*). Not allowed: blogs, news, magazines, advocacy sites, parenting websites, opinion pieces, and organisation web pages or fact sheets that are not published in a peer-reviewed journal. Any source that fails this is dropped, along with the claims that depended on it.
- Record every source used in `content/sources.yml` (id, authors, year, title, venue, DOI/URL, one-line finding, accessed date, evidence level). Evidence level is one of: meta-analysis, systematic review, RCT, experiment, longitudinal, cross-sectional, pilot, review, position statement, book.
- Scripts and examples are written natively in each language, not translated word for word.
- No em dashes in any user-facing copy in any language.
- Children in examples are generic; never use Brian's daughters' names outside the About page.

## 7. Physical discipline page (Brian's decision: present both sides)

Brian chose to cover physical discipline by presenting both sides, with the weight of the research shown clearly, and letting parents decide. Build it exactly that way:

7.1 **Separate two things up front.** Physical *intervention* for safety (grabbing a child running into the street, holding a child to stop them hurting someone, removing a child from danger) is appropriate and necessary at every age; explain how to do it calmly. Physical *punishment* (spanking, smacking, hitting with objects) is the contested topic the rest of the page covers.

7.2 **What the research says (majority view).** Summarize at minimum, with citations:
- Gershoff & Grogan-Kaylor (2016), *Journal of Family Psychology*, meta-analysis of ~75 studies / ~160,000 children: spanking associated with more detrimental outcomes and not with better compliance.
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

Every page other than About gets illustrations generated by AI, never photos of real children.

- Style: one consistent illustration style across the site (soft flat illustration, warm palette matching the tokens, East Asian and mixed families, no text in images, no logos, no recognizable characters or real people).
- Generator: Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`) called from GitHub Actions.
  - `content/images.yml` lists every image: id, page, prompt (English), alt text in all three languages, size.
  - `.github/workflows/images.yml` (`workflow_dispatch` + on change to `content/images.yml`) generates any image whose file is missing into `src/assets/ai/<id>.png`, then commits them. Uses repo secrets `CF_ACCOUNT_ID` and `CF_AI_TOKEN`.
  - The secrets exist (added 2026-10-04). The site must still build without generated files: components fall back to a tasteful placeholder (gradient + icon) when an image file is missing. This is the only temporary piece and needs no code change when images land.
- Review every generated image yourself (open the PNG) and regenerate any with distorted hands, text artifacts, unsafe or odd content.

## 10. Definition of done

- All pages in §5 (including the best-proven approach with edge cases, the little-time guide and the Encouraging learning section) exist in all three locales with real, cited content from academic sources only; no lorem ipsum, no TODOs in user-facing copy.
- Lighthouse ≥ 95 for performance, accessibility, best practices, SEO on mobile and desktop for Home, one phase page and Physical discipline.
- Verified at 375px and 1280px widths in all three locales (screenshots in `docs/screenshots/`).
- Builds via Actions (CI on every push; deploy only by manual dispatch); `CNAME` present; sitemap, robots.txt, hreflang, OG images in place.
- Every in-content link and button goes to the exact section it refers to: anchor ids on every heading, card, edge case and source entry; deep links such as `/toolbox/#time-out`; citation markers link to the exact entry on the Research page, which links back to each place it is cited. Never just the top of a page.
- An automated link test (`scripts/link-test.mjs`) checks that every internal link resolves to an existing page and element id in all three locales; it runs in CI and its latest results are recorded in docs/QA.md.
- docs/QA.md keeps the QA checklist: fact-check per claim, UI/UX at 375px and 1280px, dark mode, keyboard navigation, no third-party assets, and the link test results.
- When the build and its own QA are done, docs/STATUS.md says READY FOR FINAL PASS with the QA results and open issues; the final QA pass then fixes what it can and deploys (§2).
- `content/sources.yml` complete, academic sources only, each with an evidence level; every citation link resolves.
- docs/STATUS.md and docs/RUNLOG.md updated.
