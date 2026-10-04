# Content guide (weimeijiao)

How the page copy in `src/content/<locale>/` is written and checked. SPEC.md is the contract; this file is the working detail for anyone writing or editing content. Check your files with:

```
node scripts/check-content.mjs src/content/en/tools/time-out.mdx src/content/zh-hans/tools/time-out.mdx src/content/zh-hant/tools/time-out.mdx
```

The full build (`npm run build`) runs QA on the built pages and `node scripts/link-test.mjs` checks every link and anchor.

## 1. Voice

- Warm, direct, non-judgmental, short sentences. Parents arrive stressed. The first screen of every page answers "what do I do now?": that is the `start` list (3 to 5 concrete steps) or the `now` list on situations.
- Talk to the parent ("you"), about "your child". Children in examples are generic: no names. Personal and family references (Brian, Zoe, Naomi, Kelsea, the owner's "my kids" or "our family", the relocation story, dedications) appear only on the About page; every other page speaks in a neutral expert voice. Generic parent scripts such as "In our family, hands are gentle" are fine.
- The English brand name is WeiMeiJiao, one word with no spaces (the Chinese names are 魏美娇 / 魏美嬌). The linter rejects other spellings.
- Practical first, then why. No moralizing, no shaming, no guilt. Admit uncertainty plainly.
- Each locale is written natively, not translated sentence by sentence. Scripts ("what to say") must sound like something a parent in that place would really say to a child.

## 2. Evidence and citations

- Every factual claim about outcomes (what works, what harms, what is normal at an age, how common something is) cites a source in `content/sources.yml`. Cite only ids that exist there. Never cite anything else, never invent a study, number or quote.
- The claim must match the source's `finding` or one of its `key_facts`. Do not add numbers, ages, effect sizes, sample details or conclusions that are not there. If a `Note:` key fact gives a caution (small sample, ages outside 0-10, correlational), respect it in the wording.
- Match the wording to the study type: meta-analyses and trials "found"; longitudinal and cross-sectional studies show something was "linked with" or "associated with" an outcome (not "causes"); reviews "conclude" or "argue"; position statements "recommend". Pilot and single small studies are described as small or early.
- Practical advice that makes no outcome claim (for example "get down to your child's eye level") needs no citation, but do not present it as research-backed.
- Weak or mixed findings are said plainly, and on Encouraging learning pages are marked with `<Mixed />` right after the sentence.
- How to write a citation:
  - MDX body: `<Cite id="kaminski-2008" />`. English: after the punctuation that ends the clause (`...behavior.<Cite id="x" />`). Chinese: before the sentence-ending punctuation (`……的效果更好<Cite id="x" />。`).
  - Frontmatter strings (lists such as `how`, `now`, `start`): `[[cite:kaminski-2008]]` in the same positions.
- Find sources with grep, then read the entry:
  `grep -n "topics:.*time-out" content/sources.yml`, `grep -n "^- id: kaminski-2008" -A 30 content/sources.yml`.
  The `side` field (majority, minority) matters on the physical discipline and little-time pages. `strength` (consistent, mixed, single-study) and `ages` are verifier notes for Encouraging learning sources.

## 3. Links

- Every in-content link goes to the exact section it refers to, never just the top of a page (unless the link means the whole page, such as a printable).
- MDX body: `<L to="/toolbox/#time-out">time-out</L>`. Frontmatter strings: `[time-out](/toolbox/#time-out)`.
- Paths are locale-neutral (no `/en/` or `/zh-hant/`; the locale is added automatically) and end with `/` before any `#anchor`.
- Use the anchors in §7. If you need a new anchor on a page you are writing, add the heading with that id in all three locales.
- External links only for DOIs (the Research page does those) and the sister site `https://showtellshare.org` (mealtime and food).

## 4. Markup

- Headings in MDX bodies are HTML with explicit ids, identical in all three locales: `<h2 id="edge-cases">Edge cases</h2>`, `<h3 id="aggression">...</h3>`. Never markdown `##` headings. No `<h1>` (the page title is the h1). Heading text is plain text: no links or citations inside headings.
- Components available in MDX: `<Cite id="..." />`, `<L to="...">...</L>`, `<Say context="optional situation">script without quote marks</Say>` (quote marks are added per language), `<Note title="optional" kind="safety">...</Note>` (kind="safety" for safety notes), `<Mixed />`, `<Effort time="about 1 minute" label="Time per use" />` (little-time guide), `<Gallery />` (About only).
- Markdown inside MDX: paragraphs, `-` and `1.` lists, `**bold**`, `*italic*`. Keep paragraphs short. Blank line before and after components that hold block content.
- Frontmatter is YAML. Quote any English string that contains `: `, `#`, starts with a quote or bracket, or contains `[[cite:...]]` or `[text](/path/)` (use double quotes and escape inner double quotes as `\"`, or single quotes). Chinese text with full-width punctuation usually needs no quotes, but quoting is always safe.
- `say` lists and `<Say>` hold the words only, without surrounding quote marks.
- Keep the `image` id each file already has (the photographs are listed in `content/images.yml`; see SPEC §9 and docs/IMAGES.md).

## 5. Language and typography

All three locales:
- No em dashes (—, also no Chinese 破折号 ——), no en dashes (–), no ⸺. Use commas, colons, full stops or parentheses. Numeric ranges use a plain hyphen: `3-5 岁`, `3-5 years`, or 至/到 in Chinese prose.
- No draft markers, TODO, TBD, FIXME, lorem ipsum.
- Numbers as digits.

Simplified Chinese (`zh-hans`, mainland usage):
- Quotes “ ” and ‘ ’. Full-width punctuation （），：；！？、。 Spaces between Chinese and Latin letters or digits: `3 岁`, `PCIT 课程`.
- Mainland vocabulary: 视频, 信息, 屏幕, 质量, 打印, 网络, 软件, 幼儿园, 小学, 作业, 课外班, 家长, 爷爷奶奶 / 外公外婆, 西红柿, 土豆, 荟萃分析, 随机对照试验, 效应量, 儿科医生.
- Never: 影片, 资讯, 萤幕, 品质 (for quality), 列印, 网路, 国小, 安亲班, 统合分析, 效果量, 阿公阿嬷, 亲职, 使用者.

Traditional Chinese (`zh-hant`, Taiwan usage; vocabulary, not character conversion):
- Quotes 「 」 and 『 』. Full-width punctuation. Spaces between Chinese and Latin letters or digits.
- Taiwan vocabulary: 影片, 資訊, 螢幕, 品質, 列印, 網路, 軟體, 幼兒園, 國小, 功課 / 作業, 安親班 / 才藝班, 家長, 長輩 / 阿公阿嬤 / 爺爺奶奶, 番茄, 馬鈴薯, 統合分析, 隨機對照試驗, 效果量, 兒科醫師, 心理師, 親職課程, 計畫, 支持.
- Never: 視頻, 信息, 屏幕, 質量 (means mass in Taiwan), 打印, 網絡, 軟件, 默認, 數據 (use 資料), 早教, 學前班, 小學生 (use 國小學童 / 孩子), 寶媽, 荟萃 / 薈萃.
- Character forms are Taiwan standard (the linter runs OpenCC t→tw): 裏→裡, 綫→線, 爲→為, 衆→眾, 着→著 (verb particle), 麪→麵.

English: plain US spelling, sentence-case headings, curly or straight quotes consistently within a file.

## 6. Glossary (use these names when you name a tool, situation or idea)

Phases (from `src/i18n/ui.ts`): 0-12 months Babies / 宝宝 / 寶寶; 1-3 years Toddlers / 学步儿 / 學步兒; 3-5 years Preschoolers / 学龄前 / 學齡前; 5-7 years Starting school / 幼小衔接 / 幼小銜接; 7-10 years School age / 小学生 / 國小學童; 10-12 years Preteens / 青春期前 / 青春期前 (pre-adolescence, the end of primary school). The site covers birth to age 12.

Sections: Best-proven approach / 证据最强的方法 / 證據最強的方法; Toolbox / 工具箱 / 工具箱; Situations / 常见难题 / 常見難題; When you have little time / 时间不够时 / 時間不夠時; Physical discipline / 关于体罚 / 關於體罰; Encouraging learning / 鼓励学习 / 鼓勵學習; Research / 研究依据 / 研究依據; Printables / 打印资料 / 列印資源; About / 关于本站 / 關於本站; Sources (the bibliography page, linked from the footer only) / 参考文献 / 參考文獻.

Tools (title in the tool file; use the same words when linking):

| slug | English | 简体 | 繁體 |
|---|---|---|---|
| connection-time | Connection time | 专属陪伴时间 | 專屬陪伴時間 |
| clear-expectations | Clear expectations and instructions | 清楚的期望和指令 | 清楚的期待和指令 |
| specific-praise | Specific praise and attention | 具体的表扬和关注 | 具體的稱讚和關注 |
| planned-ignoring | Planned ignoring | 有计划的忽略 | 有計畫的忽略 |
| redirection | Redirection | 转移注意力 | 轉移注意力 |
| choices | Offering choices | 给孩子选择 | 給孩子選擇 |
| when-then | When-then | 先……再…… | 先……再…… |
| natural-consequences | Natural consequences | 自然后果 | 自然後果 |
| logical-consequences | Logical consequences | 逻辑后果 | 邏輯後果 |
| time-in | Time-in | 陪伴冷静（time-in） | 陪伴冷靜（time-in） |
| time-out | Time-out, used correctly | 正确使用暂停（time-out） | 正確使用暫停（time-out） |
| privilege-removal | Privilege removal | 暂时取消特权 | 暫時取消特權 |
| problem-solving | Solving problems together | 一起解决问题 | 一起解決問題 |
| routines | Routines and visual schedules | 日常作息和图片日程表 | 固定作息和圖片時間表 |
| family-meetings | Family meetings | 家庭会议 | 家庭會議 |
| repair | Repair after conflict | 冲突后的修复 | 衝突後的修復 |

In running text: time-out = 暂停 / 暫停 (first mention on a page: 暂停（time-out） / 暫停（time-out））.

Situations:

| slug | English | 简体 | 繁體 |
|---|---|---|---|
| tantrums | Tantrums | 发脾气 | 鬧脾氣 |
| public-meltdowns | Public meltdowns | 在外面情绪崩溃 | 在外面情緒崩潰 |
| hitting-biting | Hitting and biting | 打人、咬人 | 打人、咬人 |
| sibling-fighting | Sibling fighting | 兄弟姐妹打架 | 手足吵架 |
| bedtime | Bedtime battles | 睡前拉锯战 | 睡前拉鋸戰 |
| mealtime | Mealtime struggles | 吃饭难 | 吃飯問題 |
| screens | Screens | 屏幕时间 | 螢幕時間 |
| lying | Lying | 说谎 | 說謊 |
| defiance | Defiance and "no" | 对着干、说“不” | 唱反調、說「不」 |
ignores-me | My toddler ignores me | 学步儿不理我 | 學步兒不理我 |
| whining | Whining | 哼哼唧唧、缠人 | 一直盧、哭哭啼啼 |
| homework | Homework | 写作业 | 寫功課 |
| grandparents | Grandparents with different rules | 祖辈规矩不一样 | 長輩規矩不一樣 |

Research terms: meta-analysis 荟萃分析 / 統合分析; systematic review 系统综述 / 系統性回顧; randomized controlled trial 随机对照试验 / 隨機對照試驗; effect size 效应量 / 效果量; correlation 相关 / 相關; causation 因果; position statement 政策声明 / 政策聲明; parenting program 家长培训课程 / 親職課程; behavioral parent training 行为取向的家长培训 / 行為取向的親職訓練; American Academy of Pediatrics 美国儿科学会 / 美國兒科醫學會; PCIT 亲子互动治疗（PCIT） / 親子互動治療（PCIT）; Triple P 3P 正向教养课程（Triple P） / 3P 正向教養課程（Triple P）; Incredible Years “不可思议的岁月”（Incredible Years） / 「不可思議的歲月」（Incredible Years）; PMTO 俄勒冈家长管理训练（PMTO） / 奧勒岡親職管理訓練（PMTO）; ADHD 注意缺陷多动障碍（ADHD） / 注意力不足過動症（ADHD）; autism 孤独症谱系障碍（自闭症） / 自閉症類群障礙（自閉症）; developmental assessment 发育评估 / 發展評估; spanking 打屁股; physical punishment 体罚 / 體罰.

## 7. Anchor map (deep-link targets)

Template anchors (always present):
- Home `/`: `#ages`, `#age-<phase>`, `#start-here`, `#entry-<approach|problem|littleTime|toolbox|learning|physical|research|printables>`, `#about-this-site`.
- Toolbox `/toolbox/`: `#<tool>` (card), `#<tool>-how`, `#<tool>-ages`, `#<tool>-evidence`, `#<tool>-mistakes`, `#<tool>-say`, `#evidence-levels`.
- Situations `/situations/`: `#<situation>`, `#<situation>-now`, `-why`, `-say`, `-prevent`, `-help`.
- Research `/research/`: `#src-<source id>` (each bibliography entry), `#bibliography`, `#group-<programs|techniques|physical|development|everyday|learning>`.
- Sources `/sources/`: `#all`, `#group-<programs|techniques|physical|development|everyday|learning>`, `#src-<source id>` (every entry in `content/sources.yml`, cited or not; each links to its Research entry and lists the pages that cite it).
- By age `/by-age/`: `#phase-<phase>`. Phase pages `/by-age/<phase>/`: `#start`, `#printable`.
- Learning `/learning/`: `#learning-<phase>`. Learning phase pages `/learning/<phase>/`: `#start`, `#printable`.
- Printables `/printables/`: `#quiz`, `#summaries`, `#learning`, `#tools`, `#printable-<slug>`. Printable pages: `/printables/<slug>/` (age-finder, summary-<phase>, learning-<phase>, routine-chart, calm-down-plan, family-rules).
- About `/about/`: `#photos`.

Planned content anchors (the writers of these pages create them; others may link to them):
- `/by-age/<phase>/`: `#normal`, `#works`, `#backfires`, `#say` (h2, required). h3 ids inside them are free.
- `/approach/`: `#why`, `#core` (h3: `#attention`, `#instructions`, `#ignoring`, `#consequences`, `#follow-through`), `#getting-started`, `#programs`, `#chinese-families`, `#edge-cases` (h3: `#refuses-time-out`, `#aggression`, `#public-places`, `#siblings`, `#caregivers-disagree`, `#grandparents`, `#dangerous-behavior`, `#developmental-differences`, `#preteens`, `#not-working`), `#get-help`.
- `/little-time/`: `#principle`, `#short-time-out`, `#privilege-removal`, `#when-then`, `#planned-ignoring`, `#routines`, `#effort-table`, `#physical-discipline` (h3 `#what-studies-found`), `#bottom-line`.
- `/physical-discipline/`: `#safety-vs-punishment` (h3 `#safety-holds`), `#majority-view`, `#minority-view`, `#agreement`, `#disagreement`, `#major-bodies`, `#decide`, `#warning-signs`, `#instead`, `#repair`, `#law`.
- `/learning/<phase>/`: h2 ids from `#talk`, `#read`, `#play`, `#praise`, `#motivation`, `#focus`, `#numbers`, `#sleep-screens`, `#homework`, `#study`, `#evidence` (each phase page uses the ones that fit its age).
- `/research/`: `#how-to-read` (h3 `#study-types`, `#correlation`, `#effect-sizes`, `#evidence-levels`, `#limits`).
- `/sources/`: `#intro`.
- `/about/`: `#story`, `#why`, `#sister-site`, `#disclaimer`, `#get-help`, `#help-lines`.
- Intro sections on hub pages: `#intro` (toolbox, situations, by-age, learning, printables, home), `#how-to-use`.

## 8. Page formats

Frontmatter fields per collection are defined in `src/content.config.ts`; extra fields per page are read by the templates in `src/pages/[...lang]/`. The linter checks both. Short version:
- Phase (`phases/<phase>.mdx`): description (40-200 chars), lede, start (3-5), image, summary {normal 3-5, works 3-6, backfires 2-5, say 3-6} (this is also the printable one-page summary, so each item stands alone), tools (3+ tool slugs), situations (2+ situation slugs); body with h2 `normal`, `works`, `backfires`, `say`.
- Learning (`learning/<phase>.mdx`): description, lede, start (3-5), image, summary {everyday 3-6, talk 2-5, avoid 2-4} (also the printable one-pager); body with h2 sections from the anchor map.
- Tool (`tools/<slug>.mdx`): title, summary (one sentence), ages (phases), agesNote, evidence (strong / moderate / emerging / contested, see `src/i18n/ui.ts` for the definitions), image, how (3-8 steps), mistakes (2-6), say (2-5), related (tool slugs), situations (situation slugs); body = the evidence paragraph(s) with citations.
- Situation (`situations/<slug>.mdx`): title, summary, ages, image, now (3-7 steps for the moment itself), say (2-5), prevent (2-6), help (1-5: when to get professional help), tools (tool slugs), related (situation slugs); body = why it happens, with citations.
- Pages (`pages/<slug>.mdx`): title, description, lede, image, plus page-specific fields (see the existing files and templates).
