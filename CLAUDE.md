# CLAUDE.md — weimeijiao

Read SPEC.md first. It is the contract. docs/INBOX.md holds the queued work; "Read the inbox." starts a session.

## Session rules
- Work on `main` directly unless told otherwise; commit in small, meaningful steps with clear messages.
- At the start and end of every session append a line to docs/RUNLOG.md: start time, end time, duration (Asia/Taipei), model, what ran.
- Keep docs/STATUS.md current: what is done, what is blocked and on whom, next step.
- docs/REVIEWER-CHANGES.md lists changes Brian's Cowork chat made directly in the repo or in Cloudflare/GitHub settings. Read it at session start and do not undo those changes.
- Never touch DNS, Cloudflare, Dynadot or GitHub settings unless the inbox item says so. Those are owned by the Cowork chat.
- Never invent sources, studies, statistics or quotes. Verify every citation by opening it. If you cannot verify, leave it out.
- No em dashes in user-facing copy in any language.
- Physical discipline content follows SPEC §7 exactly: both sides, weight of evidence shown, no how-to instructions.
- Verify on 375px and 1280px in all three locales before calling anything done. Save screenshots to docs/screenshots/.
- Parallel work is fine for research, copy per locale and independent components; the build config, layout, and deploy workflow are owned by one agent at a time, and verification runs sequentially.
- Brian provides real-device feedback only; you handle all code.
- Flow (Brian, 2026-10-04): the whole site must be an easy, smooth read. Every page flows from section to section (transitions, the same order of sections across pages of a kind) and the pages flow from topic to topic (links that lead naturally to the next relevant page). Every change gets a flow pass over the page and every page it touches; a site-wide flow read-through runs when the queue is quiet.
- Three locales, one PR (Brian, 2026-10-04): every change is made to Simplified Chinese, Traditional Chinese (Taiwan usage) and English in the same pull request: content, titles, summaries, alt text, glossary, sources, navigation, printables and the age finder. `scripts/parity-test.mjs` runs in CI and fails when a page, situation, tool or phase exists in one locale but not the others.
