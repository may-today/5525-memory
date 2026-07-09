/**
 * 专属报告当前支持的受控统计维度。
 *
 * 这里既是给维护者看的能力清单，也是系统提示词的数据来源。新增报告能力时，
 * 优先在这里补一条维度说明，再新增对应的 D1 统计 helper 和 TanStack AI tool。
 */
export const REPORT_DIMENSIONS = [
  {
    name: '出席概览',
    description: '统计场次总数、城市数、场馆数、日期范围和第一场演出；默认查已选场次，提到所有场次时传 concertScope=all。',
    tool: 'get_attendance_overview',
  },
  {
    name: '城市排行',
    description: '按城市聚合场次；默认查已选场次，提到所有场次/全巡演时传 concertScope=all。',
    tool: 'rank_cities',
  },
  {
    name: '歌曲排行',
    description: '统计歌曲出现次数；默认全部歌曲段落，点歌传 section=request，安可传 section=encore，所有场次传 concertScope=all。',
    tool: 'rank_songs',
  },
  {
    name: '单曲时间线',
    description: '查找某首歌出现过的日期、城市、场次标签和备注；支持 concertScope 和 section 参数。',
    tool: 'song_timeline',
  },
  {
    name: '嘉宾排行',
    description: '统计嘉宾出现次数；默认查已选场次，提到所有场次/全巡演时传 concertScope=all。',
    tool: 'rank_guests',
  },
  {
    name: '月份/季节歌曲排行',
    description: '按月份或春夏秋冬筛选后统计歌曲出现次数；支持 concertScope 和 section 参数。',
    tool: 'rank_songs_by_period',
  },
] as const

const CARD_SCHEMA_HINT =
  '{"question":string,"heroLabel":string,"heroValue":string,"heroUnit"?:string,"isHeroNumeric":boolean,"rank"?:Array<{"label":string,"value":number}>,"timeline"?:Array<{"date":string,"city":string,"note"?:string}>,"footnote":string,"steps":string[],"themeColor":"#RRGGBB"}'

/** 生成报告页专用系统提示词。 */
export function createReportSystemPrompt(showCount: number): string {
  const dimensions = REPORT_DIMENSIONS.map((item) => `- ${item.name}（${item.tool}）：${item.description}`).join('\n')

  return [
    'You are 5525 Data Station, a concise Chinese data reporter for a Mayday #5525 concert replay app.',
    'Answer every user question as exactly one JSON object. Do not wrap it in Markdown or code fences.',
    `The JSON object must match this shape: ${CARD_SCHEMA_HINT}.`,
    'Use the server tools for every statistic. Never invent counts, rankings, dates, or cities.',
    'If the user asks about 所有场次, 全部场次, 全巡演, or the whole tour, pass concertScope="all" to the relevant tool.',
    'If the user asks about 点歌, request songs, or requested songs, pass section="request" to song ranking or timeline tools.',
    'If no selected concerts are available, return a warm zero-state card that asks the user to choose concerts first.',
    'Use rank for comparisons and timeline for song encounter histories. Do not output both rank and timeline.',
    'Keep steps factual and short, naming the tool-backed work you performed.',
    'Use #f97316 as the default themeColor unless a tool result clearly suggests a better color.',
    `The current request contains ${showCount} selected concerts.`,
    'Supported controlled report dimensions:',
    dimensions,
  ].join('\n')
}
