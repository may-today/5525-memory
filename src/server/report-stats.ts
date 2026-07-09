interface AttendanceOverview {
  cityCount: number
  dateRange: string | null
  firstShow: string | null
  showCount: number
  venueCount: number
}

export type ConcertScope = 'all' | 'selected'

export type SongSectionScope = 'all' | 'encore' | 'main' | 'request'

interface RankEntry {
  label: string
  value: number
}

interface SongTimelineEntry {
  city: string
  date: string
  dayLabel: string
  note?: string
  title: string
}

/** 报告统计范围信息，用于卡片脚注。 */
interface StatsScope {
  dateRange: string | null
  showCount: number
}

interface MonthlySongRankInput {
  month?: number
  season?: 'autumn' | 'spring' | 'summer' | 'winter'
}

interface ReportScopeInput {
  concertScope?: ConcertScope
}

interface SongScopeInput extends ReportScopeInput {
  section?: SongSectionScope
}

interface RowCount {
  count: number
}

interface DateRangeRow {
  max_date: string | null
  min_date: string | null
}

interface LabelCountRow {
  label: string
  value: number
}

interface SongTimelineRow {
  city: string
  day_label: string
  remark: string | null
  show_date: string
  title: string
}

interface JsonTextRow {
  text: string
}

function createSelectedShowsWhere(showIds: number[]): string {
  return `s.id IN (${showIds.map(() => '?').join(',')})`
}

function createSelectedSetlistWhere(showIds: number[]): string {
  return `si.show_id IN (${showIds.map(() => '?').join(',')})`
}

function buildShowScopeCondition(showIds: number[], input: ReportScopeInput): { params: number[]; sql: string } {
  if (input.concertScope === 'all') return { params: [], sql: 's.is_hidden = 0' }
  return { params: showIds, sql: createSelectedShowsWhere(showIds) }
}

function buildSetlistScopeCondition(showIds: number[], input: ReportScopeInput): { params: number[]; sql: string } {
  if (input.concertScope === 'all') return { params: [], sql: 's.is_hidden = 0' }
  return { params: showIds, sql: createSelectedSetlistWhere(showIds) }
}

function buildSongSectionCondition(section: SongSectionScope | undefined): string {
  if (section === 'request') return "si.section = 'request'"
  if (section === 'main') return "si.section = 'main'"
  if (section === 'encore') return "si.section LIKE 'encore_%'"
  return '1 = 1'
}

function formatDateRange(minDate: string | null, maxDate: string | null): string | null {
  if (!(minDate && maxDate)) return null
  return minDate === maxDate ? minDate : `${minDate} - ${maxDate}`
}

function normalizeShowIds(showIds: number[]): number[] {
  return [...new Set(showIds.filter((id) => Number.isInteger(id) && id > 0))]
}

function buildSeasonCondition(input: MonthlySongRankInput): { params: number[]; sql: string } {
  if (input.month) {
    return {
      params: [input.month],
      sql: "CAST(strftime('%m', s.show_date) AS INTEGER) = ?",
    }
  }

  if (input.season === 'spring') return { params: [], sql: "CAST(strftime('%m', s.show_date) AS INTEGER) IN (3,4,5)" }
  if (input.season === 'summer') return { params: [], sql: "CAST(strftime('%m', s.show_date) AS INTEGER) IN (6,7,8)" }
  if (input.season === 'autumn') return { params: [], sql: "CAST(strftime('%m', s.show_date) AS INTEGER) IN (9,10,11)" }
  if (input.season === 'winter') return { params: [], sql: "CAST(strftime('%m', s.show_date) AS INTEGER) IN (12,1,2)" }

  return { params: [], sql: '1 = 1' }
}

/** 清洗用户已选场次 ID，避免重复值、非整数或非法 ID 进入 D1 查询。 */
export function normalizeReportShowIds(showIds: number[]): number[] {
  return normalizeShowIds(showIds)
}

/** 出席概览：总场次、城市数、场馆数、日期范围和第一场演出；可查已选场次或全量非隐藏场次。 */
export async function getAttendanceOverview(db: D1Database, rawShowIds: number[], input: ReportScopeInput = {}): Promise<AttendanceOverview> {
  const showIds = normalizeShowIds(rawShowIds)
  if (showIds.length === 0 && input.concertScope !== 'all') {
    return { cityCount: 0, dateRange: null, firstShow: null, showCount: 0, venueCount: 0 }
  }

  const scope = buildShowScopeCondition(showIds, input)
  const [countResult, rangeResult, cityResult, venueResult, firstResult] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS count FROM shows s WHERE ${scope.sql}`).bind(...scope.params),
    db.prepare(`SELECT MIN(show_date) AS min_date, MAX(show_date) AS max_date FROM shows s WHERE ${scope.sql}`).bind(...scope.params),
    db.prepare(`SELECT COUNT(DISTINCT city) AS count FROM shows s WHERE ${scope.sql}`).bind(...scope.params),
    db.prepare(`SELECT COUNT(DISTINCT venue) AS count FROM shows s WHERE ${scope.sql}`).bind(...scope.params),
    db
      .prepare(`SELECT city || ' · ' || show_date || ' · ' || day_label AS text FROM shows s WHERE ${scope.sql} ORDER BY show_date ASC LIMIT 1`)
      .bind(...scope.params),
  ])

  const count = countResult.results[0] as RowCount | undefined
  const range = rangeResult.results[0] as DateRangeRow | undefined
  const city = cityResult.results[0] as RowCount | undefined
  const venue = venueResult.results[0] as RowCount | undefined
  const first = firstResult.results[0] as JsonTextRow | undefined

  return {
    cityCount: city?.count ?? 0,
    dateRange: formatDateRange(range?.min_date ?? null, range?.max_date ?? null),
    firstShow: first?.text ?? null,
    showCount: count?.count ?? 0,
    venueCount: venue?.count ?? 0,
  }
}

/** 多个排行类工具共用的统计范围：场次数与日期跨度。 */
export async function getStatsScope(db: D1Database, rawShowIds: number[], input: ReportScopeInput = {}): Promise<StatsScope> {
  const overview = await getAttendanceOverview(db, rawShowIds, input)
  return { dateRange: overview.dateRange, showCount: overview.showCount }
}

/** 城市排行：按城市聚合场次；可查已选场次或全量非隐藏场次。 */
export async function rankCities(db: D1Database, rawShowIds: number[], input: ReportScopeInput, limit: number): Promise<RankEntry[]> {
  const showIds = normalizeShowIds(rawShowIds)
  if (showIds.length === 0 && input.concertScope !== 'all') return []
  const scope = buildShowScopeCondition(showIds, input)
  const { results } = await db
    .prepare(`SELECT city AS label, COUNT(*) AS value FROM shows s WHERE ${scope.sql} GROUP BY city ORDER BY value DESC, city ASC LIMIT ?`)
    .bind(...scope.params, limit)
    .all<LabelCountRow>()
  return results
}

/** 歌曲排行：统计歌曲出现次数；可按场次范围和 main/request/encore 段落过滤。 */
export async function rankSongs(db: D1Database, rawShowIds: number[], input: SongScopeInput, limit: number): Promise<RankEntry[]> {
  const showIds = normalizeShowIds(rawShowIds)
  if (showIds.length === 0 && input.concertScope !== 'all') return []
  const scope = buildSetlistScopeCondition(showIds, input)
  const section = buildSongSectionCondition(input.section)
  const { results } = await db
    .prepare(
      `SELECT si.title AS label, COUNT(*) AS value FROM setlist_items si
       JOIN shows s ON s.id = si.show_id
       WHERE ${scope.sql} AND si.item_type = 'song' AND ${section}
       GROUP BY si.title ORDER BY value DESC, si.title ASC LIMIT ?`
    )
    .bind(...scope.params, limit)
    .all<LabelCountRow>()
  return results
}

/** 单曲时间线：查找某首歌的相遇记录；可按场次范围和 main/request/encore 段落过滤。 */
export async function getSongTimeline(
  db: D1Database,
  rawShowIds: number[],
  songTitle: string,
  input: SongScopeInput,
  limit: number
): Promise<SongTimelineEntry[]> {
  const showIds = normalizeShowIds(rawShowIds)
  const title = songTitle.trim()
  if ((showIds.length === 0 && input.concertScope !== 'all') || !title) return []

  const scope = buildSetlistScopeCondition(showIds, input)
  const section = buildSongSectionCondition(input.section)
  const { results } = await db
    .prepare(
      `SELECT s.city, s.show_date, s.day_label, si.title, si.remark
       FROM setlist_items si
       JOIN shows s ON s.id = si.show_id
       WHERE ${scope.sql} AND si.item_type = 'song' AND ${section} AND si.title LIKE ?
       ORDER BY s.show_date ASC, si.sort_order ASC LIMIT ?`
    )
    .bind(...scope.params, `%${title}%`, limit)
    .all<SongTimelineRow>()

  return results.map((row) => ({
    city: row.city,
    date: row.show_date,
    dayLabel: row.day_label,
    note: row.remark && row.remark !== 'NULL' ? row.remark : undefined,
    title: row.title,
  }))
}

/** 嘉宾排行：从 shows.guests JSON 数组统计嘉宾出现次数；可查已选场次或全量非隐藏场次。 */
export async function rankGuests(db: D1Database, rawShowIds: number[], input: ReportScopeInput, limit: number): Promise<RankEntry[]> {
  const showIds = normalizeShowIds(rawShowIds)
  if (showIds.length === 0 && input.concertScope !== 'all') return []
  const scope = buildShowScopeCondition(showIds, input)
  const { results } = await db.prepare(`SELECT guests AS text FROM shows s WHERE ${scope.sql}`).bind(...scope.params).all<JsonTextRow>()
  const counts = new Map<string, number>()

  for (const row of results) {
    const guests = JSON.parse(row.text) as string[]
    for (const guest of guests) {
      counts.set(guest, (counts.get(guest) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit)
}

/** 月份/季节歌曲排行：先按场次范围、月份/季节和歌曲段落筛选，再统计歌曲出现次数。 */
export async function rankSongsByPeriod(
  db: D1Database,
  rawShowIds: number[],
  input: MonthlySongRankInput & SongScopeInput,
  limit: number
): Promise<RankEntry[]> {
  const showIds = normalizeShowIds(rawShowIds)
  if (showIds.length === 0 && input.concertScope !== 'all') return []
  const period = buildSeasonCondition(input)
  const scope = buildSetlistScopeCondition(showIds, input)
  const section = buildSongSectionCondition(input.section)

  const { results } = await db
    .prepare(
      `SELECT si.title AS label, COUNT(*) AS value FROM setlist_items si
       JOIN shows s ON s.id = si.show_id
       WHERE ${scope.sql} AND si.item_type = 'song' AND ${section} AND ${period.sql}
       GROUP BY si.title ORDER BY value DESC, si.title ASC LIMIT ?`
    )
    .bind(...scope.params, ...period.params, limit)
    .all<LabelCountRow>()
  return results
}
