# 魏美娇 · weimeijiao — SPEC

Owner: Brian Chen (Meteor City LLC). Built in Claude Code from this repo. Not Lovable.

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

- Hosting: **GitHub Pages**, built and deployed by GitHub Actions (`.github/workflows/deploy.yml`, `actions/deploy-pages`) on push to `main`. Repo is public, so Actions minutes are free.
- Publish a `CNAME` file in the built output containing exactly `xn--3ys368f86s.com`.
- After the first successful deploy, Brian/Cowork sets Pages source = GitHub Actions, custom domain and Enforce HTTPS in repo settings. If your session's token can call the Pages API (`PUT /repos/{owner}/{repo}/pages`), do it yourself and log it in docs/STATUS.md.
- Canonical URLs, sitemap, hreflang and Open Graph all use `https://xn--3ys368f86s.com`.

## 3. Stack

- Static site generator: **Astro** (preferred) or Eleventy. Zero client JS by default; small islands only where interactivity is needed (language switcher memory, age finder quiz, print buttons).
- Content in Markdown/MDX per language, one source tree per locale, shared components.
- Fonts: carry over showtellshare's pairing (Lora + DM Sans) for Latin; add Noto Serif SC / Noto Serif TC (headings) and Noto Sans SC / TC (body) for Chinese, subset or loaded per locale via Google Fonts.
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
- Legal sections are locale-aware (see §7.5).

## 5. Pages (information architecture)

1. **Home** — what the site is, the core idea in one line, the five phases, entry points to "my child's age", "a problem right now", "the research".
2. **By age** — one page per phase with an overview hub:
   - 0–12 months: no discipline in the punitive sense; responsiveness, routines, safety-proofing, redirection.
   - 1–3 years: limits, redirection, choices, co-regulation of tantrums, biting/hitting, "no" stage.
   - 3–5 years: clear rules, praise of specific behavior, planned ignoring, time-in/time-out, logical consequences, preschool transitions.
   - 5–7 years: school readiness, privileges, natural consequences, problem-solving together, lying and fairness.
   - 7–10 years: responsibility, chores, screens, homework, peer issues, family meetings, earning trust.
   Each phase page: what's developmentally normal, what works and why, what backfires, scripts parents can say (in that language), a printable one-page summary.
3. **Toolbox** — one card per method with how-to, ages it fits, evidence strength (Strong / Moderate / Emerging / Contested), common mistakes: connection time, clear expectations, specific praise and attention, planned ignoring, redirection, choices, when-then, natural consequences, logical consequences, time-in, time-out (correct use), privilege removal, problem-solving, routines and visual schedules, family meetings, repair after conflict.
4. **Situations** — quick guides: tantrums, public meltdowns, hitting/biting, sibling fighting, bedtime, mealtime (link to showtellshare.org for food), screens, lying, defiance/"no", whining, homework, grandparents with different rules.
5. **Physical discipline** — see §7.
6. **Research** — plain-language summaries of the main studies and position statements, each with full citation and link (DOI/PubMed where possible), plus a note on how to read evidence (correlation vs causation, effect sizes).
7. **Printables** — age finder quiz (10 questions → phase), phase summaries, routine chart template, calm-down plan, family rules poster. Print CSS; each printable also downloadable as PDF generated at build time if practical.
8. **About** — Brian's story and why he built it (see §8), the family photo gallery, a link to showtellshare.org as the sister project, contact (hello@weimeijiao.com once email is set up; until then omit), and a clear disclaimer that this is educational content and not medical, psychological or legal advice, with "when to get professional help" signs and where to find help per locale.

## 6. Voice and content rules

- Warm, direct, non-judgmental, short sentences. Parents arrive stressed; the first screen of every page answers "what do I do now?".
- Every factual claim about outcomes cites a source on the Research page (footnote-style links). No invented statistics, studies or quotes. If you cannot verify a source, leave the claim out.
- Use primary sources and major bodies: AAP, APA, WHO, UNICEF, CDC, Taiwan MOHW, peer-reviewed meta-analyses. Record every source used in `content/sources.yml` (id, authors, year, title, venue, DOI/URL, one-line finding, accessed date).
- Scripts and examples are written natively in each language, not translated word for word.
- No em dashes in any user-facing copy in any language.
- Children in examples are generic; never use Brian's daughters' names outside the About page.

## 7. Physical discipline page (Brian's decision: present both sides)

Brian chose to cover physical discipline by presenting both sides, with the weight of the research shown clearly, and letting parents decide. Build it exactly that way:

7.1 **Separate two things up front.** Physical *intervention* for safety (grabbing a child running into the street, holding a child to stop them hurting someone, removing a child from danger) is appropriate and necessary at every age; explain how to do it calmly. Physical *punishment* (spanking, smacking, hitting with objects) is the contested topic the rest of the page covers.

7.2 **What the research says (majority view).** Summarize at minimum, with citations:
- Gershoff & Grogan-Kaylor (2016), *Journal of Family Psychology*, meta-analysis of ~75 studies / ~160,000 children: spanking associated with more detrimental outcomes and not with better compliance.
- AAP policy statement "Effective Discipline to Raise Healthy Children" (Sege & Siegel, *Pediatrics*, 2018): recommends against spanking and harsh verbal discipline.
- WHO fact sheet on corporal punishment of children and health (verify current version and date).
- APA resolution on physical discipline (2019).

7.3 **What proponents argue (minority view).** Summarize fairly, with citations:
- Larzelere, Gunnoe, Pritsker & Ferguson (2024), *Marriage & Family Review*, meta-analysis of 47 controlled longitudinal studies: effects of spanking on outcomes are very small (under 1% of variance) once pre-existing behavior is controlled; they argue earlier reviews overstated harm.
- Larzelere's "conditional spanking" position (e.g., Larzelere & Kuhn 2005, *Clinical Child and Family Psychology Review*): that outcomes depend on how it is used. Present the conditions proponents themselves describe as *their* position, attributed to them, not as the site's instructions.
- Cultural and family-autonomy arguments parents commonly raise.

7.4 **How to weigh it.** Plain explanation of where the two camps agree (harsh, frequent, angry or implement-based punishment is harmful; warmth and consistency matter most; non-physical methods work) and where they disagree (whether occasional mild spanking adds harm). State clearly that every major pediatric and psychological body recommends against it and that many countries ban it. Then the decision-support section: questions a parent can ask themselves, warning signs that discipline has become abuse, what to do instead in the moment, and how to repair after losing your temper.

7.5 **The law, per locale** (verify each against current primary sources before publishing and record the date checked):
- Taiwan: Civil Code art. 1085 (parents may punish children "within the limit of necessity") — lawful at home as of the last check; corporal punishment banned in schools since the 2006 Fundamental Law of Education amendment; a 2023 Ministry of Justice draft to repeal art. 1085 was reported stalled as of 2024. Check for any 2025–2026 change.
- Mainland China: Law on the Protection of Minors (2020) bans maltreatment and domestic violence but allows "reasonable discipline"; Anti-Domestic Violence Law (2015); Family Education Promotion Law (2022). No explicit full ban at home as of the last check.
- United States: lawful at home in all states with limits defined by child-abuse statutes; school corporal punishment still legal in some states (verify count).
- Point readers to their local law and child-protection hotlines (Taiwan 113, mainland China, US Childhelp 1-800-422-4453; verify each).

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
  - Until those secrets exist, the site must still build: components fall back to a tasteful placeholder (gradient + icon) when an image file is missing. This is the only temporary piece and needs no code change when images land.
- Review every generated image yourself (open the PNG) and regenerate any with distorted hands, text artifacts, unsafe or odd content.

## 10. Definition of done

- All pages in §5 exist in all three locales with real, cited content; no lorem ipsum, no TODOs in user-facing copy.
- Lighthouse ≥ 95 for performance, accessibility, best practices, SEO on mobile and desktop for Home, one phase page and Physical discipline.
- Verified at 375px and 1280px widths in all three locales (screenshots in `docs/screenshots/`).
- Builds and deploys from `main` via Actions; `CNAME` present; sitemap, robots.txt, hreflang, OG images in place.
- `content/sources.yml` complete; every citation link resolves.
- docs/STATUS.md and docs/RUNLOG.md updated.
