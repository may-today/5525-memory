/**
 * Canned data powering the /report mock. No real computation happens —
 * suggestion chips map to a fixed card each, and free-form questions cycle
 * through the same cards in order.
 */

/** One row of a ranked-bar block inside a report card. */
export interface ReportRankEntry {
  label: string
  value: number
}

/** One stop of a timeline block inside a report card. */
export interface ReportTimelineEntry {
  city: string
  date: string
  note?: string
}

/** Everything needed to render one generated report card. */
export interface ReportCardData {
  /** Data-scope line printed in the ticket footer. */
  footnote: string
  /** Small label above the hero answer. */
  heroLabel: string
  /** Suffix rendered beside the hero value, e.g. "×6" or "次". */
  heroUnit?: string
  /** The main answer. Digits render in the dot-matrix face, CJK in WJH. */
  heroValue: string
  /** Whether heroValue is numeric (picks the dot-matrix face and a larger size). */
  isHeroNumeric: boolean
  /** The user question, restated as the card title. */
  question: string
  /** Ranked horizontal bars (mutually exclusive with timeline). */
  rank?: ReportRankEntry[]
  /** Fake computation steps shown while "thinking". */
  steps: string[]
  themeColor: string
  /** Vertical date timeline (mutually exclusive with rank). */
  timeline?: ReportTimelineEntry[]
}

export const REPORT_CARDS: ReportCardData[] = [
  {
    footnote: '统计范围 2025.09.01 – 11.30 · 共 3 场 · 含安可段落',
    heroLabel: '2025 年秋天 · 出现最多的歌',
    heroUnit: '×6',
    heroValue: '突然好想你',
    isHeroNumeric: false,
    question: '秋天我听过最多的歌',
    rank: [
      { label: '突然好想你', value: 6 },
      { label: '干杯', value: 5 },
      { label: '温柔', value: 5 },
      { label: '倔强', value: 4 },
      { label: '诺亚方舟', value: 3 },
    ],
    steps: ['检索你的 12 场演出记录…', '筛选 2025.09 – 11 的场次与歌单…', '统计歌曲出现次数…'],
    themeColor: '#f97316',
  },
  {
    footnote: '统计范围 全部已选场次 · 共 12 场 · 6 座城市',
    heroLabel: '看过最多场的城市',
    heroUnit: '×4',
    heroValue: '上海',
    isHeroNumeric: false,
    question: '我在哪个城市看了最多场',
    rank: [
      { label: '上海', value: 4 },
      { label: '北京', value: 3 },
      { label: '台北', value: 2 },
      { label: '香港', value: 2 },
      { label: '悉尼', value: 1 },
    ],
    steps: ['检索你的 12 场演出记录…', '按城市聚合场次…', '排序并生成卡片…'],
    themeColor: '#38bdf8',
  },
  {
    footnote: '含《温柔》全部版本 · 安可段落计入',
    heroLabel: '这一年，《温柔》陪了你',
    heroUnit: '次',
    heroValue: '5',
    isHeroNumeric: true,
    question: '《温柔》我一共听过几次',
    steps: ['检索你的 12 场演出记录…', '在歌单中匹配《温柔》及其版本…', '整理相遇时间线…'],
    themeColor: '#a78bfa',
    timeline: [
      { city: '上海', date: '2025.04.19' },
      { city: '北京', date: '2025.05.24', note: '还原版' },
      { city: '台北', date: '2025.08.16' },
      { city: '上海', date: '2025.10.03' },
      { city: '香港', date: '2025.11.22', note: '与嘉宾合唱' },
    ],
  },
]

/** Suggestion chips shown above the input; each maps to a canned card. */
export const REPORT_SUGGESTIONS = REPORT_CARDS.map((card) => card.question)

export const REPORT_GREETING =
  '我是 5525 数据电台。关于你这一年的巡演记录，想知道点什么？试试下面的问题，或者自己问一个。'

/**
 * Resolves a question to a canned card: exact chip matches get their card,
 * free-form questions cycle through the deck so every ask prints something.
 */
export function resolveReportCard(question: string, askIndex: number): ReportCardData {
  const matched = REPORT_CARDS.find((card) => card.question === question.trim())
  return matched ?? REPORT_CARDS[askIndex % REPORT_CARDS.length]
}
