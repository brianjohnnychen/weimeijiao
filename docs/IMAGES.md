# Image review log

The quality gate of SPEC §9. Every candidate the images workflow generates is opened at full size and judged before anything is merged: garbled text, odd hands or faces, melted objects, uneven style against the rest of the set, impossible anatomy or lighting, or a breach of the content limits means rejection. The cleanest candidate per image is copied to `src/assets/ai/<id>.jpg` on a batch branch and merged through a pull request; this log records the decision.

## Direction

- 2026-10-03: first style, flat illustrations from flux-1-schnell (31 pieces, 1024x1024).
- 2026-10-04 morning: Brian's photo direction (documentary photography, FLUX.2 [dev]); blocked all day by error 4006 on the free allocation (runs below).
- 2026-10-04 22:25 Taipei: Brian replaces the photo plan with polished illustrations for every image, in one consistent style matching the best first pieces, several candidates per image, Workers Paid active so the daily block no longer applies; the daily schedule is gone and runs are manual. When every image is approved and merged, STATUS.md starts with ILLUSTRATIONS COMPLETE and Cowork cancels the paid plan.

## Model choice

- Chosen: `@cf/black-forest-labs/flux-2-dev` (FLUX.2 [dev], Black Forest Labs; on Workers AI since 2025-11-25, Cloudflare's most capable image model, multipart input, 1024x768 output here, 28 inference steps). Brian asked for the most photorealistic text-to-image model in the Workers AI catalog, FLUX.2 [dev] or newer if available. Every workflow run prints the account's current Text-to-Image catalog and the chosen model's input schema; the first run's output is recorded below, and a newer flagship replaces the choice only deliberately, here.
- Cost at Cloudflare's published rate for this model ($0.00041 per 512x512 output tile per step, $0.011 per 1,000 neurons): about 3,100 neurons for one 1024x768 image at 28 steps, so the free daily allocation of 10,000 neurons covers about three images a day. That is why the rollout is a few images per day.
- Catalog as printed by the first run (37178445115, 2026-10-04 04:56 UTC), 10 Text-to-Image models: `@cf/black-forest-labs/flux-2-dev`, `@cf/black-forest-labs/flux-2-klein-9b`, `@cf/black-forest-labs/flux-2-klein-4b`, `@cf/black-forest-labs/flux-1-schnell`, `@cf/leonardo/lucid-origin`, `@cf/leonardo/phoenix-1.0`, `@cf/lykon/dreamshaper-8-lcm`, `@cf/stabilityai/stable-diffusion-xl-base-1.0` (beta), `@cf/bytedance/stable-diffusion-xl-lightning` (beta), `@cf/runwayml/stable-diffusion-v1-5-inpainting` (beta). FLUX.2 [dev] is the flagship of the list (Cloudflare describes it as generating highly realistic and detailed images); the two FLUX.2 [klein] models are its smaller distilled versions, cheaper and faster but not more photorealistic, so the choice stands.
- Schema: Cloudflare's schema endpoint describes this model only as a multipart body, so the field names come from Cloudflare's model page: `prompt` (required), `steps`, `guidance`, `width` (default 1024, 256 to 1920), `height` (default 768, 256 to 1920), `seed`, and up to four reference images `input_image_0` to `input_image_3` (not used here). The script sends prompt, steps, width and height.
- Usage report: the GraphQL dataset is `aiInferenceAdaptiveGroups` with `sum.totalNeurons`; the token answered "not authorized for that account", so the report stays empty until Account Analytics: Read is added to CF_AI_TOKEN (a Cloudflare setting, for Cowork or Brian).

## Runs

| Date and time (UTC) | Run | Result |
|---|---|---|
| 2026-10-03 17:21-17:31 | 37140206854 (first style, flux-1-schnell) | 31 illustrations generated, then error 4006 "daily free allocation used up" on every further request from 17:27 |
| 2026-10-04 00:22, 00:24, 01:31, 03:08, 04:40 | 37161742742, 37168281018, 37173192470, 37177668112 | error 4006 on the first request each time, nothing generated |
| 2026-10-04 04:56 | 37178445115 (new pipeline, flux-2-dev) | catalog and schema printed; usage not authorized; error 4006 on the first request, nothing generated |
| 2026-10-04 14:55-14:56 | 37211030610 (illustration pipeline, flux-2-dev, calibration: 8 ids x 2 candidates, seeds, 3 in flight) | 16 candidates in about a minute on the paid plan, no quota error. Style consistent and clean (tantrums, redirection, ignores-me, learning 3-5 all usable); 6 of 16 came with an inset cream border (home, phase 1-3, physical hero), the home hero painterly, the printables fridge scene full of tiny glyphs. Style text tightened (full-bleed, no frame, flat colour areas), printables prompt changed to a crayon drawing scene; full run follows |

## Images

Status: placeholder or first-style illustration live, photograph awaiting generation; generated, awaiting review; approved (merged in PR); rejected (reason; prompt changed; regenerating). Attempts counts generated photographs for the id.

| id | page | status | attempts | model and settings | review notes |
|---|---|---|---|---|---|
| home-hero | home | first-style illustration live; photograph awaiting generation | 0 | | |
| by-age-hero | by-age | first-style illustration live; photograph awaiting generation | 0 | | |
| approach-hero | approach | first-style illustration live; photograph awaiting generation | 0 | | |
| edge-cases-hero | approach/edge-cases | first-style illustration live; photograph awaiting generation | 0 | | |
| toolbox-hero | toolbox | first-style illustration live; photograph awaiting generation | 0 | | |
| situations-hero | situations | first-style illustration live; photograph awaiting generation | 0 | | |
| little-time-hero | little-time | first-style illustration live; photograph awaiting generation | 0 | | |
| physical-hero | physical | placeholder; photograph awaiting generation | 0 | | |
| learning-hero | learning | first-style illustration live; photograph awaiting generation | 0 | | |
| research-hero | research | placeholder; photograph awaiting generation | 0 | | |
| printables-hero | printables | placeholder; photograph awaiting generation | 0 | | |
| phase-0-12-months | phase/0-12-months | first-style illustration live; photograph awaiting generation | 0 | | |
| phase-1-3-years | phase/1-3-years | placeholder; photograph awaiting generation | 0 | | |
| phase-3-5-years | phase/3-5-years | placeholder; photograph awaiting generation | 0 | | |
| phase-5-7-years | phase/5-7-years | first-style illustration live; photograph awaiting generation | 0 | | |
| phase-7-10-years | phase/7-10-years | first-style illustration live; photograph awaiting generation | 0 | | |
| phase-10-12-years | phase/10-12-years | placeholder; photograph awaiting generation | 0 | | |
| learning-0-12-months | learning/0-12-months | first-style illustration live; photograph awaiting generation | 0 | | |
| learning-1-3-years | learning/1-3-years | first-style illustration live; photograph awaiting generation | 0 | | |
| learning-3-5-years | learning/3-5-years | placeholder; photograph awaiting generation | 0 | | |
| learning-5-7-years | learning/5-7-years | first-style illustration live; photograph awaiting generation | 0 | | |
| learning-7-10-years | learning/7-10-years | first-style illustration live; photograph awaiting generation | 0 | | |
| learning-10-12-years | learning/10-12-years | placeholder; photograph awaiting generation | 0 | | |
| tool-connection-time | tool/connection-time | first-style illustration live; photograph awaiting generation | 0 | | |
| tool-clear-expectations | tool/clear-expectations | placeholder; photograph awaiting generation | 0 | | |
| tool-specific-praise | tool/specific-praise | first-style illustration live; photograph awaiting generation | 0 | | |
| tool-planned-ignoring | tool/planned-ignoring | first-style illustration live; photograph awaiting generation | 0 | | |
| tool-redirection | tool/redirection | placeholder; photograph awaiting generation | 0 | | |
| tool-choices | tool/choices | placeholder; photograph awaiting generation | 0 | | |
| tool-when-then | tool/when-then | placeholder; photograph awaiting generation | 0 | | |
| tool-natural-consequences | tool/natural-consequences | placeholder; photograph awaiting generation | 0 | | |
| tool-logical-consequences | tool/logical-consequences | first-style illustration live; photograph awaiting generation | 0 | | |
| tool-time-in | tool/time-in | placeholder; photograph awaiting generation | 0 | | |
| tool-time-out | tool/time-out | first-style illustration live; photograph awaiting generation | 0 | | |
| tool-privilege-removal | tool/privilege-removal | placeholder; photograph awaiting generation | 0 | | |
| tool-problem-solving | tool/problem-solving | placeholder; photograph awaiting generation | 0 | | |
| tool-routines | tool/routines | placeholder; photograph awaiting generation | 0 | | |
| tool-family-meetings | tool/family-meetings | first-style illustration live; photograph awaiting generation | 0 | | |
| tool-repair | tool/repair | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-tantrums | situation/tantrums | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-public-meltdowns | situation/public-meltdowns | placeholder; photograph awaiting generation | 0 | | |
| situation-hitting-biting | situation/hitting-biting | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-sibling-fighting | situation/sibling-fighting | placeholder; photograph awaiting generation | 0 | | |
| situation-bedtime | situation/bedtime | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-mealtime | situation/mealtime | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-screens | situation/screens | placeholder; photograph awaiting generation | 0 | | |
| situation-lying | situation/lying | placeholder; photograph awaiting generation | 0 | | |
| situation-defiance | situation/defiance | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-whining | situation/whining | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-homework | situation/homework | first-style illustration live; photograph awaiting generation | 0 | | |
| situation-grandparents | situation/grandparents | first-style illustration live; photograph awaiting generation | 0 | | |
| printable-age-finder | printables/age-finder | placeholder; photograph awaiting generation | 0 | | |
| printable-calm-down | printables/calm-down-plan | placeholder; photograph awaiting generation | 0 | | |
| printable-family-rules | printables/family-rules | first-style illustration live; photograph awaiting generation | 0 | | |
