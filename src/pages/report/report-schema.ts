import { z } from 'zod'

/** 报告卡片中一行排行条数据。 */
export interface ReportRankEntry {
  label: string
  value: number
}

/** 报告卡片中一条时间线记录。 */
export interface ReportTimelineEntry {
  city: string
  date: string
  note?: string
}

/** 渲染一张专属报告卡片所需的完整结构化数据。 */
export interface ReportCardData {
  /** 卡片底部的数据口径说明。 */
  footnote: string
  /** 主答案上方的小标题。 */
  heroLabel: string
  /** 主答案为纯数值时附加的单位；歌名、城市名等完整答案不应提供此字段。 */
  heroUnit?: string
  /** 主答案文本。 */
  heroValue: string
  /** 用户问题的卡片标题复述。 */
  question: string
  /** 横向排行条；与 timeline 互斥。 */
  rank?: ReportRankEntry[]
  /** 生成卡片时展示的工具计算步骤。 */
  steps: string[]
  themeColor: string
  /** 日期时间线；与 rank 互斥。 */
  timeline?: ReportTimelineEntry[]
}

export const ReportRankEntrySchema = z.object({
  label: z.string().min(1),
  value: z.number().nonnegative(),
})

export const ReportTimelineEntrySchema = z.object({
  city: z.string().min(1),
  date: z.string().min(1),
  note: z.string().optional(),
})

export const ReportCardSchema = z
  .object({
    footnote: z.string().min(1),
    heroLabel: z.string().min(1),
    heroUnit: z.string().optional(),
    heroValue: z.string().min(1),
    question: z.string().min(1),
    rank: z.array(ReportRankEntrySchema).optional(),
    steps: z.array(z.string().min(1)).min(1).max(5),
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    timeline: z.array(ReportTimelineEntrySchema).optional(),
  })
  .refine((card) => !(card.rank && card.timeline), {
    message: 'A report card can render either rank or timeline, not both.',
  })

export const REPORT_SUGGESTIONS = [
  '我在哪个城市看了最多场',
  '秋天我听过最多次的点歌是什么',
  '《温柔》我一共听过几次',
  '我遇见过哪些嘉宾',
]

export const REPORT_GREETING =
  '我是 5525 数据电台。关于你这一年的巡演记录，想知道点什么？试试下面的问题，或者自己问一个。'
