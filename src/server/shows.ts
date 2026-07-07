import { createServerFn } from '@tanstack/react-start'
import type { Show } from '@/types'
import { getDb } from './db'

interface ShowRow {
  id: number
  tour_type_id: number
  tour_name: string
  sub_theme: string
  version_name: string
  city: string
  venue: string
  show_date: string
  day_label: string
  lineup: string
  guests: string
  global_effects: string
  contributor: string | null
  poster_url: string
  playlist_img: string
  theme_color: string
  show_start_time: string | null
  show_end_time: string | null
  is_announced: number
  is_hidden: number
  setlist_visible: number
  setlist_count: number
}

/** The raw export stores some missing values as the literal string 'NULL'. */
function nullable(value: string | null): string | null {
  return value === null || value === 'NULL' ? null : value
}

function mapShowRow(row: ShowRow): Show {
  return {
    id: row.id,
    tourName: row.tour_name,
    subTheme: row.sub_theme,
    versionName: row.version_name,
    city: row.city,
    venue: row.venue,
    showDate: row.show_date,
    dayLabel: row.day_label,
    lineup: JSON.parse(row.lineup) as string[],
    guests: JSON.parse(row.guests) as string[],
    globalEffects: JSON.parse(row.global_effects),
    contributor: nullable(row.contributor),
    posterUrl: row.poster_url,
    playlistImg: row.playlist_img,
    themeColor: row.theme_color,
    showStartTime: nullable(row.show_start_time),
    showEndTime: nullable(row.show_end_time),
    isAnnounced: row.is_announced,
    isHidden: row.is_hidden,
    setlistVisible: row.setlist_visible,
    tourTypeId: row.tour_type_id,
    setlistCount: row.setlist_count,
    date: row.show_date,
    dateSlash: row.show_date.slice(5).replace('-', '/'),
  }
}

const SHOW_SELECT = `
  SELECT s.*, (
    SELECT COUNT(*) FROM setlist_items si WHERE si.show_id = s.id
  ) AS setlist_count
  FROM shows s
`

/** All non-hidden shows, sorted by date. Used to populate the /form picker and the Overview timeline. */
export async function queryAllShows(db: D1Database): Promise<Show[]> {
  const { results } = await db
    .prepare(`${SHOW_SELECT} WHERE s.is_hidden = 0 ORDER BY s.show_date ASC`)
    .all<ShowRow>()
  return results.map(mapShowRow)
}

/** Resolve full Show rows for a set of ids. */
export async function queryShowsByIds(db: D1Database, ids: number[]): Promise<Show[]> {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(',')
  const { results } = await db
    .prepare(`${SHOW_SELECT} WHERE s.id IN (${placeholders})`)
    .bind(...ids)
    .all<ShowRow>()
  return results.map(mapShowRow)
}

export const getAllShows = createServerFn({ method: 'GET' }).handler(async (): Promise<Show[]> => {
  const db = await getDb()
  return queryAllShows(db)
})
