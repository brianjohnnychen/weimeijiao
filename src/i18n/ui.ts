// Interface strings, written natively per locale (Simplified for mainland usage, Traditional
// for Taiwan usage). Page copy lives in src/content/<locale>/.
import type { Locale } from './locales';
import type { EvidenceLevel, Phase, StudyType } from '../lib/site';

export interface UiStrings {
  tagline: string;
  nav: { home: string; byAge: string; approach: string; toolbox: string; situations: string; littleTime: string; physical: string; learning: string; research: string; printables: string; about: string };
  skipToContent: string;
  menu: string;
  language: string;
  theme: { toDark: string; toLight: string };
  footer: { disclaimer: string; privacy: string; sister: string; sisterLabel: string; copyright: string; sections: string };
  banner: { text: string; switchTo: string; dismiss: string };
  phaseName: Record<Phase, string>;
  phaseAge: Record<Phase, string>;
  evidence: Record<EvidenceLevel, string> & { label: string; explain: Record<EvidenceLevel, string> };
  studyType: Record<StudyType, string>;
  mixed: { label: string; explain: string };
  learning: { printableCta: string; printable: string; byAge: string };
  approach: { edgeCases: string; edgeCasesCta: string; backToApproach: string; onThisPage: string };
  ages: string;
  allAges: string;
  sources: string;
  sourcesIntro: string;
  researchLink: string;
  openSource: string;
  backToText: string;
  citeLabel: string;
  phase: { start: string; normal: string; works: string; backfires: string; say: string; printable: string; printableCta: string; tools: string; situations: string; prev: string; next: string };
  tool: { how: string; ages: string; evidence: string; mistakes: string; say: string; related: string; relatedSituations: string };
  situation: { now: string; why: string; say: string; prevent: string; help: string; tools: string };
  print: { print: string; pdf: string; printHint: string; fromSite: string };
  quiz: { see: string; restart: string; result: string; also: string; read: string; answered: string; incomplete: string; noJs: string; scoring: string };
  gallery: { open: string; close: string; prev: string; next: string; of: string };
  breadcrumbHome: string;
  readMore: string;
  updated: string;
  illustrationNote: string;
  notFound: { title: string; body: string; home: string };
}

export const UI: Record<Locale, UiStrings> = {
  'zh-hans': {
    tagline: '温和而坚定，从出生到十岁',
    nav: { home: '首页', byAge: '按年龄', approach: '证据最强的方法', toolbox: '工具箱', situations: '常见难题', littleTime: '时间不够时', physical: '关于体罚', learning: '鼓励学习', research: '研究依据', printables: '打印资料', about: '关于本站' },
    skipToContent: '跳到正文',
    menu: '菜单',
    language: '语言',
    theme: { toDark: '切换到深色模式', toLight: '切换到浅色模式' },
    footer: {
      disclaimer: '本站内容仅供教育参考，不构成医疗、心理或法律建议。如果担心孩子的安全或发展，请咨询儿科医生或当地专业人士。遇到紧急情况，请拨打当地急救或报警电话。',
      privacy: '本站不使用 Cookie，也不追踪访客。',
      sister: '姐妹站',
      sisterLabel: 'Show Tell Share：和孩子一起建立家庭饮食文化',
      copyright: '© 2026 Meteor City LLC',
      sections: '网站栏目',
    },
    banner: { text: '本页面有简体中文版。', switchTo: '切换到简体中文', dismiss: '关闭' },
    phaseName: { '0-12-months': '宝宝', '1-3-years': '学步儿', '3-5-years': '学龄前', '5-7-years': '幼小衔接', '7-10-years': '小学生' },
    phaseAge: { '0-12-months': '0-12 个月', '1-3-years': '1-3 岁', '3-5-years': '3-5 岁', '5-7-years': '5-7 岁', '7-10-years': '7-10 岁' },
    evidence: {
      label: '证据强度',
      strong: '强',
      moderate: '中等',
      emerging: '初步',
      contested: '有争议',
      explain: {
        strong: '有多项荟萃分析或随机对照试验支持，通常是成熟家长培训课程的核心内容。',
        moderate: '有一些对照研究支持，或作为课程组成部分有一致的证据。',
        emerging: '直接研究还少，依据来自相关研究或专业机构的建议。',
        contested: '可信的研究者对它的益处或害处意见不一。',
      },
    },
    studyType: {
      'meta-analysis': '荟萃分析',
      'systematic-review': '系统综述',
      rct: '随机对照试验',
      experiment: '实验研究',
      longitudinal: '纵向研究',
      'cross-sectional': '横断面研究',
      review: '综述',
      'position-statement': '专业机构声明',
      book: '学术专著',
    },
    mixed: { label: '证据不一', explain: '这项发现的研究结果不一致或证据较弱，可以参考，但不必当成定论。' },
    learning: { printableCta: '打印本阶段的学习一页纸', printable: '在家学习一页纸', byAge: '按年龄看学习' },
    approach: { edgeCases: '特殊情况', edgeCasesCta: '遇到特殊情况怎么办', backToApproach: '回到核心方法', onThisPage: '本页内容' },
    ages: '适用年龄',
    allAges: '所有年龄',
    sources: '参考资料',
    sourcesIntro: '文中的上标数字对应以下资料。每条资料都可以在研究依据页面找到完整说明。',
    researchLink: '在研究依据页面查看',
    openSource: '打开原文',
    backToText: '回到正文',
    citeLabel: '参考资料',
    phase: {
      start: '先做这几件事',
      normal: '这个阶段的正常表现',
      works: '有效的做法和原因',
      backfires: '容易适得其反的做法',
      say: '可以这样说',
      printable: '一页总结',
      printableCta: '打印本阶段的一页总结',
      tools: '这个阶段常用的工具',
      situations: '这个阶段常见的难题',
      prev: '上一个阶段',
      next: '下一个阶段',
    },
    tool: { how: '怎么做', ages: '适用年龄', evidence: '证据强度', mistakes: '常见错误', say: '可以这样说', related: '相关工具', relatedSituations: '适用的难题' },
    situation: { now: '现在就做', why: '为什么会这样', say: '可以这样说', prevent: '预防下一次', help: '什么时候需要求助', tools: '可以用到的工具' },
    print: { print: '打印', pdf: '下载 PDF', printHint: '用 A4 或 Letter 纸打印，一页即可。', fromSite: '来自 魏美娇.com' },
    quiz: {
      see: '看结果',
      restart: '重新开始',
      result: '建议从这个阶段读起',
      also: '也可以看看',
      read: '去读这一页',
      answered: '已回答',
      incomplete: '还有题目没回答。没把握的题，选最接近的答案就好。',
      noJs: '需要启用 JavaScript 才能自动计分。也可以打印出来，按下面的计分方法自己算。',
      scoring: '计分方法',
    },
    gallery: { open: '放大查看', close: '关闭', prev: '上一张', next: '下一张', of: '/' },
    breadcrumbHome: '首页',
    readMore: '继续阅读',
    updated: '最后更新',
    illustrationNote: '插图由 AI 生成，不是真实儿童的照片。',
    notFound: { title: '找不到这个页面', body: '链接可能已经更改。可以回到首页重新找。', home: '回到首页' },
  },
  'zh-hant': {
    tagline: '溫和而堅定，從出生到十歲',
    nav: { home: '首頁', byAge: '依年齡', approach: '證據最強的方法', toolbox: '工具箱', situations: '常見難題', littleTime: '時間不夠時', physical: '關於體罰', learning: '鼓勵學習', research: '研究依據', printables: '列印資源', about: '關於本站' },
    skipToContent: '跳到主要內容',
    menu: '選單',
    language: '語言',
    theme: { toDark: '切換到深色模式', toLight: '切換到淺色模式' },
    footer: {
      disclaimer: '本站內容僅供教育參考，不構成醫療、心理或法律建議。若擔心孩子的安全或發展，請諮詢兒科醫師或當地專業人員。遇到緊急狀況，請撥打當地緊急電話。',
      privacy: '本站不使用 Cookie，也不追蹤訪客。',
      sister: '姊妹站',
      sisterLabel: 'Show Tell Share：和孩子一起建立家庭飲食文化',
      copyright: '© 2026 Meteor City LLC',
      sections: '網站單元',
    },
    banner: { text: '本頁面有繁體中文版。', switchTo: '切換到繁體中文', dismiss: '關閉' },
    phaseName: { '0-12-months': '寶寶', '1-3-years': '學步兒', '3-5-years': '學齡前', '5-7-years': '幼小銜接', '7-10-years': '國小學童' },
    phaseAge: { '0-12-months': '0-12 個月', '1-3-years': '1-3 歲', '3-5-years': '3-5 歲', '5-7-years': '5-7 歲', '7-10-years': '7-10 歲' },
    evidence: {
      label: '證據強度',
      strong: '強',
      moderate: '中等',
      emerging: '初步',
      contested: '有爭議',
      explain: {
        strong: '有多項統合分析或隨機對照試驗支持，通常是成熟親職課程的核心內容。',
        moderate: '有一些對照研究支持，或作為課程組成部分有一致的證據。',
        emerging: '直接研究還不多，依據來自相關研究或專業機構的建議。',
        contested: '可信的研究者對它的益處或害處看法不一。',
      },
    },
    studyType: {
      'meta-analysis': '統合分析',
      'systematic-review': '系統性回顧',
      rct: '隨機對照試驗',
      experiment: '實驗研究',
      longitudinal: '縱貫研究',
      'cross-sectional': '橫斷面研究',
      review: '文獻回顧',
      'position-statement': '專業機構聲明',
      book: '學術專書',
    },
    mixed: { label: '證據不一', explain: '這項發現的研究結果不一致或證據較弱，可以參考，但不必當成定論。' },
    learning: { printableCta: '列印本階段的學習一頁紙', printable: '在家學習一頁紙', byAge: '依年齡看學習' },
    approach: { edgeCases: '特殊狀況', edgeCasesCta: '遇到特殊狀況怎麼辦', backToApproach: '回到核心方法', onThisPage: '本頁內容' },
    ages: '適用年齡',
    allAges: '所有年齡',
    sources: '參考資料',
    sourcesIntro: '文中的上標數字對應以下資料。每筆資料都可以在研究依據頁面找到完整說明。',
    researchLink: '在研究依據頁面查看',
    openSource: '開啟原文',
    backToText: '回到內文',
    citeLabel: '參考資料',
    phase: {
      start: '先做這幾件事',
      normal: '這個階段的正常表現',
      works: '有效的做法與原因',
      backfires: '容易適得其反的做法',
      say: '可以這樣說',
      printable: '一頁摘要',
      printableCta: '列印本階段的一頁摘要',
      tools: '這個階段常用的工具',
      situations: '這個階段常見的難題',
      prev: '上一個階段',
      next: '下一個階段',
    },
    tool: { how: '怎麼做', ages: '適用年齡', evidence: '證據強度', mistakes: '常見錯誤', say: '可以這樣說', related: '相關工具', relatedSituations: '適用的難題' },
    situation: { now: '現在就做', why: '為什麼會這樣', say: '可以這樣說', prevent: '預防下一次', help: '什麼時候需要求助', tools: '可以用到的工具' },
    print: { print: '列印', pdf: '下載 PDF', printHint: '用 A4 或 Letter 紙張列印，一頁就好。', fromSite: '來自 魏美嬌.com' },
    quiz: {
      see: '看結果',
      restart: '重新開始',
      result: '建議從這個階段讀起',
      also: '也可以看看',
      read: '前往這一頁',
      answered: '已回答',
      incomplete: '還有題目沒回答。沒把握的題目，選最接近的答案就好。',
      noJs: '需要啟用 JavaScript 才能自動計分。也可以列印出來，依照下面的計分方式自己算。',
      scoring: '計分方式',
    },
    gallery: { open: '放大檢視', close: '關閉', prev: '上一張', next: '下一張', of: '/' },
    breadcrumbHome: '首頁',
    readMore: '繼續閱讀',
    updated: '最後更新',
    illustrationNote: '插圖由 AI 生成，並非真實兒童的照片。',
    notFound: { title: '找不到這個頁面', body: '連結可能已經變更。可以回到首頁重新找。', home: '回到首頁' },
  },
  en: {
    tagline: 'Warm, firm discipline from birth to age 10',
    nav: { home: 'Home', byAge: 'By age', approach: 'Best-proven approach', toolbox: 'Toolbox', situations: 'Situations', littleTime: 'Little time', physical: 'Physical discipline', learning: 'Learning', research: 'Research', printables: 'Printables', about: 'About' },
    skipToContent: 'Skip to content',
    menu: 'Menu',
    language: 'Language',
    theme: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
    footer: {
      disclaimer: 'Educational information only. This is not medical, psychological or legal advice. If you are worried about your child\'s safety or development, talk to your pediatrician or a local professional. In an emergency, call your local emergency number.',
      privacy: 'No cookies, no trackers.',
      sister: 'Sister site',
      sisterLabel: 'Show Tell Share: build a food culture with your family',
      copyright: '© 2026 Meteor City LLC',
      sections: 'Sections',
    },
    banner: { text: 'This page is available in English.', switchTo: 'Switch to English', dismiss: 'Dismiss' },
    phaseName: { '0-12-months': 'Babies', '1-3-years': 'Toddlers', '3-5-years': 'Preschoolers', '5-7-years': 'Starting school', '7-10-years': 'School age' },
    phaseAge: { '0-12-months': '0-12 months', '1-3-years': '1-3 years', '3-5-years': '3-5 years', '5-7-years': '5-7 years', '7-10-years': '7-10 years' },
    evidence: {
      label: 'Evidence',
      strong: 'Strong',
      moderate: 'Moderate',
      emerging: 'Emerging',
      contested: 'Contested',
      explain: {
        strong: 'Backed by meta-analyses or several randomized trials, usually as a core part of established parenting programs.',
        moderate: 'Backed by some controlled studies, or consistent evidence as part of parenting programs.',
        emerging: 'Little direct research so far; the case rests on related studies or expert guidance.',
        contested: 'Credible researchers disagree about whether it helps or harms.',
      },
    },
    studyType: {
      'meta-analysis': 'Meta-analysis',
      'systematic-review': 'Systematic review',
      rct: 'Randomized trial',
      experiment: 'Experiment',
      longitudinal: 'Longitudinal study',
      'cross-sectional': 'Cross-sectional study',
      review: 'Review',
      'position-statement': 'Position statement',
      book: 'Academic book',
    },
    mixed: { label: 'Mixed evidence', explain: 'Studies on this finding disagree or the evidence is weak. Worth knowing, but not settled.' },
    learning: { printableCta: 'Print the learning one-pager for this age', printable: 'Learning at home one-pager', byAge: 'Learning by age' },
    approach: { edgeCases: 'Edge cases', edgeCasesCta: 'When it gets tricky: edge cases', backToApproach: 'Back to the core approach', onThisPage: 'On this page' },
    ages: 'Ages',
    allAges: 'All ages',
    sources: 'Sources',
    sourcesIntro: 'The small numbers in the text point to these sources. Each one has a full entry on the Research page.',
    researchLink: 'See it on the Research page',
    openSource: 'Open the source',
    backToText: 'Back to the text',
    citeLabel: 'Source',
    phase: {
      start: 'Start here',
      normal: 'What\'s normal at this age',
      works: 'What works, and why',
      backfires: 'What backfires',
      say: 'Things you can say',
      printable: 'One-page summary',
      printableCta: 'Print the one-page summary for this age',
      tools: 'Tools that fit this age',
      situations: 'Common situations at this age',
      prev: 'Previous age',
      next: 'Next age',
    },
    tool: { how: 'How to do it', ages: 'Ages it fits', evidence: 'Evidence strength', mistakes: 'Common mistakes', say: 'Things you can say', related: 'Related tools', relatedSituations: 'Situations it helps with' },
    situation: { now: 'Right now', why: 'Why it happens', say: 'Things you can say', prevent: 'Preventing the next one', help: 'When to get help', tools: 'Tools that help' },
    print: { print: 'Print', pdf: 'Download PDF', printHint: 'Prints on one A4 or Letter page.', fromSite: 'From weimeijiao (魏美娇.com)' },
    quiz: {
      see: 'See the result',
      restart: 'Start over',
      result: 'Start with this age',
      also: 'Also worth reading',
      read: 'Read this page',
      answered: 'answered',
      incomplete: 'Some questions are still blank. If you are not sure, pick the closest answer.',
      noJs: 'Automatic scoring needs JavaScript. You can also print this page and score it by hand with the key below.',
      scoring: 'How to score it',
    },
    gallery: { open: 'View larger', close: 'Close', prev: 'Previous photo', next: 'Next photo', of: 'of' },
    breadcrumbHome: 'Home',
    readMore: 'Read more',
    updated: 'Last updated',
    illustrationNote: 'Illustrations are AI-generated, not photos of real children.',
    notFound: { title: 'Page not found', body: 'The link may have changed. Try the home page.', home: 'Go to the home page' },
  },
};

export function t(locale: Locale): UiStrings {
  return UI[locale];
}
