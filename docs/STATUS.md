# STATUS

## LIVE AT https://魏美娇.com (2026-10-04, 10:00 Taipei)

The final QA pass ran 2026-10-04 05:31-07:20 Taipei (2026-10-03 21:31-23:20 UTC) on branch `claude/dreamy-mayer-2nub40` ([PR #1](https://github.com/brianjohnnychen/weimeijiao/pull/1)), run by the build session on its current model because no switch to Fable with a FINAL QA PASS message arrived within 60 minutes of READY FOR FINAL PASS (SPEC §2). Three separate reviews (interactive behaviour, rendered text in all three locales, HTML and accessibility) went through the built site; every finding is fixed or explicitly accepted, and every check was run again. Details: docs/QA.md, section 9.

### Go-live (SPEC §2), 2026-10-04 08:28-08:50 Taipei (00:28-00:50 UTC)

- **Merged:** [PR #1](https://github.com/brianjohnnychen/weimeijiao/pull/1) into `main` at 00:28 UTC (merge commit `26221d2`), after CI passed on its last commit.
- **Deployed:** `deploy.yml` on `main`, [Actions run 37165058193](https://github.com/brianjohnnychen/weimeijiao/actions/runs/37165058193). The build job passed: build, QA, PDFs, OG images, link test and anchor test on GitHub's runner. The deploy job published the site to GitHub Pages at 00:31 UTC.
- **Live check:** [smoke test run 37165530941](https://github.com/brianjohnnychen/weimeijiao/actions/runs/37165530941) at 00:38 UTC (single attempt). Results:
  - **Pass:** weimeijiao.com answers 301 to `https://xn--3ys368f86s.com/en/toolbox/?smoke=1`, keeping the path and query.
  - **Fail:** every check on 魏美娇.com (home in all three locales, a deep page, Research, the 404 page, sitemap.xml), and the 魏美嬌.com redirect. The runner could not resolve either domain (DNS error EAI_AGAIN). This was the DNS problem found before the deploy; Cowork fixed it at about 01:45 UTC (see the live check below and Earlier notes).
  - **Not reachable yet (warnings):** HTTPS enforcement and the www redirect, for the same reason.
  - The deploy run's own smoke job checked one URL at a time, and each DNS failure took several seconds, so it was still retrying when it hit its 15-minute limit at 00:46 UTC. GitHub cancelled it without its table, so run 37165058193 shows as "cancelled" although its build and deploy jobs succeeded. `scripts/smoke-test.mjs` now runs the checks in parallel, gives each request 20 seconds and stops retrying after 8 minutes, so the table always prints.
- **Enforce HTTPS:** not turned on. This session has no token for the Pages API, and GitHub can only enforce HTTPS after it has issued the certificate, which needed 魏美娇.com to resolve first. The certificate is issued now (open issue 1).
- **Illustrations:** the site went live with the designed placeholders on the 21 pages whose illustrations are not generated yet, because Cloudflare still reported its free daily allocation as used up (open issue 2). A second deploy adds them once they are generated and reviewed.

**Live check after the DNS fix** ([smoke test run 37169680760](https://github.com/brianjohnnychen/weimeijiao/actions/runs/37169680760), 02:00 UTC): every check passes, with one warning.
- **Pass:** 魏美娇.com serves the site over HTTPS. The checks covered the home page in all three locales, a deep page (`/en/toolbox/` with its `#time-out` section), Research (with its bibliography) and `sitemap.xml`. A missing path returns the 404 page.
- **Redirects pass:** weimeijiao.com and 魏美嬌.com redirect with 301 to the same path on 魏美娇.com (weimeijiao.com keeps the query too), and www redirects to the bare domain.
- **Warning:** plain HTTP is not yet redirected to HTTPS (`http://xn--3ys368f86s.com/` answers 200), because Enforce HTTPS is still off. GitHub's certificate is now issued, so the box can be ticked (open issue 1).

Both domains resolved within minutes of Cowork's Cloudflare fix (reported at about 01:45 UTC), and both certificates were in place by 02:00 UTC with no further deploy.

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
| Sources and help lines | Actions run 37161742748 (the latest change to sources.yml): 146 sources, 0 failures; all 14 help lines found on their official pages |

### What is built

- **Site:** Astro 7, static, three locales with full parity: Simplified Chinese at `/`, Traditional Chinese (Taiwan usage) at `/zh-hant/`, English at `/en/`. 35 pages per locale plus a trilingual 404, sitemap with hreflang, robots.txt and Open Graph images.
- **Content:** 159 MDX files written natively in each language, 776 citation markers per locale pointing to 141 distinct academic sources, each marker linked to its exact Research entry and back. Physical discipline follows SPEC §7.
- **Printables:** 14 per locale, 42 PDFs rendered at build time.
- **Images:** 31 of 52 AI illustrations generated and reviewed (21 follow after the quota reset); 12 family photos on About with gallery and lightbox.
- **Workflows:** `ci.yml` (every push: content lint, build with QA, link test, anchor test, behavior test), `sources.yml`, `images.yml`, `deploy.yml` (manual only; build, deploy, smoke test of the live site and both redirect domains), `smoke.yml`.

### Open issues

1. **Enforce HTTPS is off. Waiting on: Brian or Cowork (a GitHub setting).** GitHub's certificate for 魏美娇.com is issued: HTTPS and the www redirect passed at 02:00 UTC. The box in the repo's Settings → Pages can be ticked now; afterwards `http://` redirects to `https://`, and `smoke.yml` shows it as a pass instead of a warning. This session has no token for the Pages API. Note: the Cowork "Weimeijiao build watch" routine's prompt still says not to run deploy.yml; the go-live deploy above ran under Brian's later instruction (SPEC §2, REVIEWER-CHANGES.md).
2. **21 AI illustrations still to generate.** Cloudflare Workers AI's free daily allocation (10,000 neurons) ran out on 2026-10-03. Cloudflare's pricing page says the limits reset daily at 00:00 UTC, but the images workflow still got "you have used up your daily free allocation" at 00:22 and 00:24 UTC on 2026-10-04 (Actions run 37161742742, attempts 2 and 3) and again at 01:31 UTC (run 37168281018). Why is not known from here; one possibility is other Workers AI use on the same Cloudflare account, another is that the allocation runs for 24 hours from when it ran out (about 17:45 UTC on 2026-10-03). The next retry is scheduled for 18:05 UTC on 2026-10-04; when the images arrive it reviews every one, commits them and deploys again. Until then those pages show the designed placeholder (a paid plan would cost money, so it was not used).
3. **AAP 2018 discipline statement: reaffirmation status unknown.** AAP policy statements expire after 5 years unless reaffirmed; no notice was found and the article page blocks automated access. Every page says "in its 2018 policy statement". Waiting on: someone opening the article page in a browser.
4. **SPEC §4a sources not citable.** Hobbs et al. 1978, Kendall et al. 1975 and Roberts & Powers 1990 exist, but no abstract is reachable by automated checks, so they are left out under the rule never to cite what could not be verified. Waiting on: Brian, only if he wants them added (someone would need to read the abstracts).
5. **Judgment calls left for Brian:** the warning sign "You hit a baby or toddler" (the study's authors advise against spanking infants and toddlers; "toddler" overlaps the 2-6 range proponents discuss); the 2010 six-country study that also linked time-out with child anxiety is shown on the time-out tool but not on the 7-10 page; the family-rules poster repeats two points of the on-screen "Four keys"; two uncited framing sentences on the learning pages.

### Next step

- 18:05 UTC check-in (2026-10-04): retry the 21 illustrations (the 00:22, 00:24 and 01:31 UTC attempts hit the used-up allocation). When they arrive, review every one, merge them to `main` through a pull request, and run `deploy.yml` again.
- Brian or Cowork: tick Enforce HTTPS in the repo's Settings → Pages (open issue 1).

## Earlier notes

- Domains: registered by Cowork 2026-10-03 (see REVIEWER-CHANGES.md).
- DNS (resolved 2026-10-04): 魏美娇.com and 魏美嬌.com did not resolve after the first deploy. Cloudflare's nameservers answered REFUSED for both zones, because the zones were stuck at "initializing" with no plan selected. Cowork moved them to the Free plan at about 01:45 UTC. Both domains resolved by 01:46 UTC, and the HTTPS certificates followed by 02:00 UTC (live check above).
- First deploy: 2026-10-04 00:31 UTC, `deploy.yml` run 37165058193 on `main` (go-live above).
- GitHub Pages: enabled by Cowork (source = GitHub Actions, custom domain xn--3ys368f86s.com saved, HTTPS certificate pending).
- Repo secrets CF_ACCOUNT_ID and CF_AI_TOKEN: in place (added by Brian 2026-10-04); the AI image workflow runs.
- READY FOR FINAL PASS was marked 2026-10-04 04:27 Taipei on commit `b11d4d7`; its QA table is superseded by the one above.
