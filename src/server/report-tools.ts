import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

import {
  type ConcertScope,
  getAttendanceOverview,
  getSongTimeline,
  getStatsScope,
  rankCities,
  rankGuests,
  rankSongs,
  type SongSectionScope,
} from './report-stats'

const RankEntrySchema = z.object({
  label: z.string(),
  value: z.number(),
})

const WHOLE_NUMBER_PATTERN = /^\d+$/

const StatsScopeSchema = z.object({
  dateRange: z.string().nullable(),
  showCount: z.number(),
})

/** 将模型为未使用的可选参数生成的空值统一视为未传入。 */
function normalizeOptionalToolInput(value: unknown): unknown {
  if (value === null || value === 'null') return
  if (typeof value === 'string' && value.trim() === '') return
  return value
}

const ConcertScopeSchema = z.preprocess(normalizeOptionalToolInput, z.enum(['selected', 'all']).optional())
  .transform((value) => value ?? 'selected')

const SongSectionScopeSchema = z.preprocess(
  normalizeOptionalToolInput,
  z.enum(['all', 'main', 'request', 'encore']).optional()
)
  .transform((value) => value ?? 'all')

const OptionalDateSchema = z.preprocess(
  normalizeOptionalToolInput,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.').optional()
)

const WholeNumberSchema = z
  .number()
  .int()
  .or(z.string().regex(WHOLE_NUMBER_PATTERN, 'Use a whole number.').transform(Number))

const OptionalMonthSchema = z.preprocess(
  normalizeOptionalToolInput,
  WholeNumberSchema.pipe(z.number().int().min(1).max(12)).optional()
)

const OptionalSeasonSchema = z.preprocess(
  normalizeOptionalToolInput,
  z.enum(['spring', 'summer', 'autumn', 'winter']).optional()
)

const TimeRangeInputShape = {
  endDate: OptionalDateSchema,
  month: OptionalMonthSchema,
  season: OptionalSeasonSchema,
  startDate: OptionalDateSchema,
}

interface BaseToolInput {
  concertScope?: unknown
  endDate?: unknown
  month?: unknown
  season?: unknown
  startDate?: unknown
}

interface SongToolInput extends BaseToolInput {
  section?: unknown
}

function isConcertScope(value: unknown): value is ConcertScope {
  return value === 'all' || value === 'selected'
}

function isSongSectionScope(value: unknown): value is SongSectionScope {
  return value === 'all' || value === 'encore' || value === 'main' || value === 'request'
}

function isSeason(value: unknown): value is 'autumn' | 'spring' | 'summer' | 'winter' {
  return value === 'autumn' || value === 'spring' || value === 'summer' || value === 'winter'
}

function getOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  return
}

const AttendanceOverviewTool = toolDefinition({
  name: 'get_attendance_overview',
  description:
    'Get concert count, city count, venue count, date range, and first show. Optionally filter every result by startDate/endDate in YYYY-MM-DD, month, or season. Use concertScope=all for all non-hidden tour shows.',
  inputSchema: z.object({
    ...TimeRangeInputShape,
    concertScope: ConcertScopeSchema,
  }),
  outputSchema: z.object({
    cityCount: z.number(),
    dateRange: z.string().nullable(),
    firstShow: z.string().nullable(),
    showCount: z.number(),
    venueCount: z.number(),
  }),
})

const RankCitiesTool = toolDefinition({
  name: 'rank_cities',
  description:
    'Rank concerts by city. Optionally filter every result by startDate/endDate in YYYY-MM-DD, month, or season. Use concertScope=all for questions about all shows or the whole tour.',
  inputSchema: z.object({
    ...TimeRangeInputShape,
    concertScope: ConcertScopeSchema,
  }),
  outputSchema: z.object({
    entries: z.array(RankEntrySchema),
    scope: StatsScopeSchema,
  }),
})

const RankSongsTool = toolDefinition({
  name: 'rank_songs',
  description:
    'Rank songs by performance count. Optionally filter every result by startDate/endDate in YYYY-MM-DD, month, or season. Use concertScope=all for all shows. Use section=request for 点歌, section=encore for encore songs, section=main for main set.',
  inputSchema: z.object({
    ...TimeRangeInputShape,
    concertScope: ConcertScopeSchema,
    section: SongSectionScopeSchema,
  }),
  outputSchema: z.object({
    entries: z.array(RankEntrySchema),
    scope: StatsScopeSchema,
  }),
})

const SongTimelineTool = toolDefinition({
  name: 'song_timeline',
  description:
    'Find every concert where a song title appears, ordered by date. Optionally filter every result by startDate/endDate in YYYY-MM-DD, month, or season. Supports selected/all concert scope and song section filtering.',
  inputSchema: z.object({
    ...TimeRangeInputShape,
    concertScope: ConcertScopeSchema,
    section: SongSectionScopeSchema,
    songTitle: z.string().min(1),
  }),
  outputSchema: z.object({
    entries: z.array(
      z.object({
        city: z.string(),
        date: z.string(),
        dayLabel: z.string(),
        note: z.string().optional(),
        title: z.string(),
      })
    ),
    scope: StatsScopeSchema,
  }),
})

const RankGuestsTool = toolDefinition({
  name: 'rank_guests',
  description:
    'Rank special guests by appearance count. Optionally filter every result by startDate/endDate in YYYY-MM-DD, month, or season. Use concertScope=all for all non-hidden tour shows.',
  inputSchema: z.object({
    ...TimeRangeInputShape,
    concertScope: ConcertScopeSchema,
  }),
  outputSchema: z.object({
    entries: z.array(RankEntrySchema),
    scope: StatsScopeSchema,
  }),
})

/**
 * 创建本次请求可用的服务端统计工具。
 *
 * 所有工具默认查询当前用户传入的 showIds；当模型明确识别到“所有场次/全巡演”时，
 * 可以传 `concertScope: "all"` 切到全量非隐藏场次。模型只能读取这些工具返回的聚合
 * 结果，不能自由访问 D1 或拼接 SQL。
 */
export function createReportTools(db: D1Database, showIds: number[]) {
  const baseScope = (input: BaseToolInput) => ({
    concertScope: isConcertScope(input.concertScope) ? input.concertScope : 'selected',
    endDate: typeof input.endDate === 'string' ? input.endDate : undefined,
    month: getOptionalNumber(input.month),
    season: isSeason(input.season) ? input.season : undefined,
    startDate: typeof input.startDate === 'string' ? input.startDate : undefined,
  })
  const songScope = (input: SongToolInput) => ({
    ...baseScope(input),
    section: isSongSectionScope(input.section) ? input.section : 'all',
  })

  return [
    AttendanceOverviewTool.server(async (input) => getAttendanceOverview(db, showIds, baseScope(input))),
    RankCitiesTool.server(async (input) => ({
      entries: await rankCities(db, showIds, baseScope(input)),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
    RankSongsTool.server(async (input) => ({
      entries: await rankSongs(db, showIds, songScope(input)),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
    SongTimelineTool.server(async (input) => ({
      entries: await getSongTimeline(db, showIds, input.songTitle, songScope(input)),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
    RankGuestsTool.server(async (input) => ({
      entries: await rankGuests(db, showIds, baseScope(input)),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
  ]
}
