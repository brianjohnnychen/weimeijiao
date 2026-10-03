# STATUS

## FINAL QA PASS DONE; GO-LIVE NEXT

The final QA pass ran 2026-10-04 05:31-07:20 Taipei (2026-10-03 21:31-23:20 UTC) on branch `claude/dreamy-mayer-2nub40` ([PR #1](https://github.com/brianjohnnychen/weimeijiao/pull/1)), run by the build session on its current model because no switch to Fable with a FINAL QA PASS message arrived within 60 minutes of READY FOR FINAL PASS (SPEC §2). Three separate reviews (interactive behaviour, rendered text in all three locales, HTML and accessibility) went through the built site; every finding is fixed or explicitly accepted, and every check was run again. Details: docs/QA.md, section 9.

Go-live follows the steps in SPEC §2 once the last 21 illustrations are generated after the 00:00 UTC quota reset (08:00 Taipei): merge PR #1 into `main`, run `deploy.yml` on `main`, check the live site and both redirect domains, record the result here. **Known blocker for the live check: 魏美娇.com and 魏美嬌.com do not resolve yet (open issue 1).**

### QA results (how to rerun: docs/QA.md)

| Check | Result |
|---|---|
| Fact-check per claim | 11 build-phase reviews plus the final text review covered every page in all three locales |
| Content lint | 159 files, 0 errors, 0 warnings |
| Build and QA | 105 pages, 0 errors, 0 warnings; no third-party assets; straight quotes now also checked in English alt, label and meta text |
| Link test | 14,353 internal links, 9,202 to an anchor, 0 broken |
| Anchor test | 26 of 26 deep links land on their target (375px and 1280px) |
| Behavior test (new) | 81 of 81 checks pass in all three locales |
| Accessibility | axe-core 4.13, WCAG 2.2 AA plus best practice: 0 violations on all 106 pages at 375px light, 375px dark and 1280px, and in the 8 banner states. html-validate: only cosmetic or deliberate messages left |
| UI check | 129 views in three locales: no overflow, console errors, failed requests or broken images; keyboard and dark mode pass; header fits |
| Printables | 39 one-page sheets and 3 two-page age finders, all at 100% scale |
| Lighthouse | All 18 medians (3 runs each) are 95 or higher: performance 95-100 on mobile and 100 on desktop; accessibility, best practices and SEO 100 on every page (docs/lighthouse.md) |
| Sources and help lines | the sources workflow re-runs on this push (sources.yml changed); its result is recorded here at go-live |

### What is built

- **Site:** Astro 7, static, three locales with full parity: Simplified Chinese at `/`, Traditional Chinese (Taiwan usage) at `/zh-hant/`, English at `/en/`. 35 pages per locale plus a trilingual 404, sitemap with hreflang, robots.txt and Open Graph images.
- **Content:** 159 MDX files written natively in each language, 776 citation markers per locale pointing to 141 distinct academic sources, each marker linked to its exact Research entry and back. Physical discipline follows SPEC §7.
- **Printables:** 14 per locale, 42 PDFs rendered at build time.
- **Images:** 31 of 52 AI illustrations generated and reviewed (21 follow after the quota reset); 12 family photos on About with gallery and lightbox.
- **Workflows:** `ci.yml` (every push: content lint, build with QA, link test, anchor test, behavior test), `sources.yml`, `images.yml`, `deploy.yml` (manual only; build, deploy, smoke test of the live site and both redirect domains), `smoke.yml`.

### Open issues

1. **魏美娇.com and 魏美嬌.com do not resolve (DNS). Waiting on: Cowork (Cloudflare).** Public DNS lookups from GitHub's runners on 2026-10-03 21:52 UTC (Google's resolver, plus the .com registry's RDAP record) show:
   - weimeijiao.com works: Cloudflare's nameservers (earl and lila) answer, and it resolves to Cloudflare's proxy.
   - xn--3ys368f86s.com (魏美娇.com) and xn--k6s926f86s.com (魏美嬌.com) fail with SERVFAIL. The .com registry sends both to the same Cloudflare nameservers that answer for weimeijiao.com, but those nameservers reply REFUSED for these two names ("lame delegation").
   - Both are registered at Dynadot with no registry hold (status: client transfer prohibited only).
   - What it means: Cloudflare is not serving these two zones yet. Usually a zone is still "pending" activation, or it was added under a different nameserver pair from the one set at Dynadot. To check: in the Cloudflare dashboard, open each zone's Overview. It must say Active, and its two assigned nameservers must match the ones set at Dynadot (earl and lila). If it is pending and they match, "Check nameservers" re-runs the activation check.
   - Until then 魏美娇.com does not load, GitHub cannot issue its HTTPS certificate, and weimeijiao.com (which redirects to 魏美娇.com) cannot show the site either. The deploy itself does not depend on DNS; once the zones are active, the deployed site appears with no further step. This session does not change DNS (CLAUDE.md).
2. **21 AI illustrations still to generate.** Cloudflare Workers AI's free daily allocation ran out; it resets at 00:00 UTC. A scheduled check-in at 00:20 UTC runs the images workflow, reviews every image and commits. Until then those pages show the designed placeholder (a paid plan would cost money, so it was not used).
3. **Go-live needs the code on `main`.** GitHub starts a `workflow_dispatch` workflow only from the default branch, and `main` has no workflows yet, so go-live is: merge PR #1 into `main`, then run `deploy.yml` on `main` (SPEC §2). The Cowork "Weimeijiao build watch" routine's prompt still says not to run deploy.yml; Brian's later instruction (SPEC §2, REVIEWER-CHANGES.md) supersedes it.
4. **Enforce HTTPS.** This session has no token for the Pages API, and GitHub can only enforce HTTPS once the certificate exists (after open issue 1 is fixed). The checkbox is for Brian or the Cowork routine.
5. **AAP 2018 discipline statement: reaffirmation status unknown.** AAP policy statements expire after 5 years unless reaffirmed; no notice was found and the article page blocks automated access. Every page says "in its 2018 policy statement". Waiting on: someone opening the article page in a browser.
6. **SPEC §4a sources not citable.** Hobbs et al. 1978, Kendall et al. 1975 and Roberts & Powers 1990 exist, but no abstract is reachable by automated checks, so they are left out under the rule never to cite what could not be verified. Waiting on: Brian, only if he wants them added (someone would need to read the abstracts).
7. **Judgment calls left for Brian:** the warning sign "You hit a baby or toddler" (the study's authors advise against spanking infants and toddlers; "toddler" overlaps the 2-6 range proponents discuss); the 2010 six-country study that also linked time-out with child anxiety is shown on the time-out tool but not on the 7-10 page; the family-rules poster repeats two points of the on-screen "Four keys"; two uncited framing sentences on the learning pages.

### Next step

00:20 UTC check-in: generate and review the 21 illustrations, then go live per SPEC §2 (merge PR #1, run `deploy.yml` on `main`, record the deploy and smoke-test results here).

## Earlier notes

- Domains: registered by Cowork 2026-10-03 (see REVIEWER-CHANGES.md); DNS for the two Chinese domains is not answering yet (open issue 1).
- GitHub Pages: enabled by Cowork (source = GitHub Actions, custom domain xn--3ys368f86s.com saved, HTTPS certificate pending).
- Repo secrets CF_ACCOUNT_ID and CF_AI_TOKEN: in place (added by Brian 2026-10-04); the AI image workflow runs.
- READY FOR FINAL PASS was marked 2026-10-04 04:27 Taipei on commit `b11d4d7`; its QA table is superseded by the one above.
