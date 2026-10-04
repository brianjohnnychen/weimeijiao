# Image review log

The quality gate of SPEC §9. Every photograph the images workflow generates is opened at full size and judged before its pull request is merged: AI tells (extra or fused fingers, warped faces or eyes, melted objects, garbled text, plastic skin, impossible lighting or anatomy, uncanny symmetry), the content limits (no hitting, spanking, injury, crying or frightened children, no distress beyond ordinary mild frustration; neutral scenes on the physical-discipline and safety pages; no real people), the scene fitting its page, and the alt text in `content/images.yml` still describing what is in the picture. A rejected image is deleted, its prompt adjusted if the fault was the prompt, and the id generated again in the next run. Images carry no caption, watermark, label or provenance metadata (Brian, 2026-10-04).

## Model choice

- Chosen: `@cf/black-forest-labs/flux-2-dev` (FLUX.2 [dev], Black Forest Labs; on Workers AI since 2025-11-25, Cloudflare's most capable image model, multipart input, 1024x768 output here, 28 inference steps). Brian asked for the most photorealistic text-to-image model in the Workers AI catalog, FLUX.2 [dev] or newer if available. Every workflow run prints the account's current Text-to-Image catalog and the chosen model's input schema; the first run's output is recorded below, and a newer flagship replaces the choice only deliberately, here.
- Cost at Cloudflare's published rate for this model ($0.00041 per 512x512 output tile per step, $0.011 per 1,000 neurons): about 3,100 neurons for one 1024x768 image at 28 steps, so the free daily allocation of 10,000 neurons covers about three images a day. That is why the rollout is a few images per day.
- Catalog and schema as printed by the first run: (pending the first run)

## Runs

| Date and time (UTC) | Run | Result |
|---|---|---|
| 2026-10-03 17:21-17:31 | 37140206854 (first style, flux-1-schnell) | 31 illustrations generated, then error 4006 "daily free allocation used up" on every further request from 17:27 |
| 2026-10-04 00:22, 00:24, 01:31, 03:08, 04:40 | 37161742742, 37168281018, 37173192470, 37177668112 | error 4006 on the first request each time, nothing generated |

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
