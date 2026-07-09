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
  rankSongsByPeriod,
  type SongSectionScope,
} from './report-stats'

const RankEntrySchema = z.object({
  label: z.string(),
  value: z.number(),
})

const StatsScopeSchema = z.object({
  dateRange: z.string().nullable(),
  showCount: z.number(),
})

const ConcertScopeSchema = z.enum(['selected', 'all']).default('selected')

const SongSectionScopeSchema = z.enum(['all', 'main', 'request', 'encore']).default('all')

interface BaseToolInput {
  concertScope?: ConcertScope
}

interface SongToolInput extends BaseToolInput {
  section?: SongSectionScope
}

const AttendanceOverviewTool = toolDefinition({
  name: 'get_attendance_overview',
  description:
    'Get concert count, city count, venue count, date range, and first show. Use concertScope=all for all non-hidden tour shows.',
  inputSchema: z.object({
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
  description: 'Rank concerts by city. Use concertScope=all for questions about all shows or the whole tour.',
  inputSchema: z.object({
    concertScope: ConcertScopeSchema,
    limit: z.number().int().min(1).max(8).default(5),
  }),
  outputSchema: z.object({
    entries: z.array(RankEntrySchema),
    scope: StatsScopeSchema,
  }),
})

const RankSongsTool = toolDefinition({
  name: 'rank_songs',
  description:
    'Rank songs by performance count. Use concertScope=all for all shows. Use section=request for 点歌, section=encore for encore songs, section=main for main set.',
  inputSchema: z.object({
    concertScope: ConcertScopeSchema,
    limit: z.number().int().min(1).max(8).default(5),
    section: SongSectionScopeSchema,
  }),
  outputSchema: z.object({
    entries: z.array(RankEntrySchema),
    scope: StatsScopeSchema,
  }),
})

const SongTimelineTool = toolDefinition({
  name: 'song_timeline',
  description: 'Find every concert where a song title appears, ordered by date. Supports selected/all concert scope and song section filtering.',
  inputSchema: z.object({
    concertScope: ConcertScopeSchema,
    limit: z.number().int().min(1).max(12).default(12),
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
  description: 'Rank special guests by appearance count. Use concertScope=all for all non-hidden tour shows.',
  inputSchema: z.object({
    concertScope: ConcertScopeSchema,
    limit: z.number().int().min(1).max(8).default(5),
  }),
  outputSchema: z.object({
    entries: z.array(RankEntrySchema),
    scope: StatsScopeSchema,
  }),
})

const RankSongsByPeriodTool = toolDefinition({
  name: 'rank_songs_by_period',
  description:
    'Rank songs within a selected month or season. Supports selected/all concert scope and section=request for 点歌.',
  inputSchema: z.object({
    concertScope: ConcertScopeSchema,
    limit: z.number().int().min(1).max(8).default(5),
    month: z.number().int().min(1).max(12).optional(),
    section: SongSectionScopeSchema,
    season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
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
  const baseScope = (input: BaseToolInput) => ({ concertScope: input.concertScope ?? 'selected' })
  const songScope = (input: SongToolInput) => ({
    concertScope: input.concertScope ?? 'selected',
    section: input.section ?? 'all',
  })

  return [
    AttendanceOverviewTool.server(async (input) => getAttendanceOverview(db, showIds, baseScope(input))),
    RankCitiesTool.server(async (input) => ({
      entries: await rankCities(db, showIds, baseScope(input), input.limit ?? 5),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
    RankSongsTool.server(async (input) => ({
      entries: await rankSongs(db, showIds, songScope(input), input.limit ?? 5),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
    SongTimelineTool.server(async (input) => ({
      entries: await getSongTimeline(db, showIds, input.songTitle, songScope(input), input.limit ?? 12),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
    RankGuestsTool.server(async (input) => ({
      entries: await rankGuests(db, showIds, baseScope(input), input.limit ?? 5),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
    RankSongsByPeriodTool.server(async (input) => ({
      entries: await rankSongsByPeriod(db, showIds, { ...songScope(input), month: input.month, season: input.season }, input.limit ?? 5),
      scope: await getStatsScope(db, showIds, baseScope(input)),
    })),
  ]
}
