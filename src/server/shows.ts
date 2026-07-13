import { createServerFn } from '@tanstack/react-start'
import type { Show } from '@/types'
import { getDb } from './db'

interface ShowRow {
  city: string
  contributor: string | null
  day_label: string
  guests: string | null
  id: number
  playlist_img: string
  setlist_count: number
  show_date: string
  show_end_time: string | null
  show_start_time: string | null
  sub_theme: string
  venue: string
  version_name: string
}

interface SummarySnapshotRow extends ShowRow {
  setlist_item_type: string | null
  setlist_section: string | null
  setlist_show_id: number | null
  setlist_title: string | null
}

/** The minimal setlist fields used to calculate summary-card statistics. */
export interface SummarySetlistItem {
  itemType: string
  section: string
  showId: number
  title: string
}

/** A complete non-hidden tour snapshot for one in-memory summary calculation. */
export interface SummarySnapshot {
  setlistItems: SummarySetlistItem[]
  shows: Show[]
}

/** The raw export stores some missing values as the literal string 'NULL'. */
function nullable(value: string | null): string | null {
  return value === null || value === 'NULL' ? null : value
}

function parseGuestList(value: string | null): string[] {
  const normalized = nullable(value)
  if (!normalized || normalized === '[]') return []

  if (normalized.startsWith('[')) {
    const parsed = JSON.parse(normalized)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  }

  return normalized
    .split(/[，,]/)
    .map((guest) => guest.trim())
    .filter(Boolean)
}

function mapShowRow(row: ShowRow, showIndex: number): Show {
  return {
    id: row.id,
    showIndex,
    // These presentation fallbacks are no longer stored per show in D1.
    tourName: '回到那一天 25周年巡演',
    subTheme: row.sub_theme,
    versionName: row.version_name,
    city: row.city,
    venue: row.venue,
    showDate: row.show_date,
    dayLabel: row.day_label,
    guests: parseGuestList(row.guests),
    contributor: nullable(row.contributor),
    playlistImg: row.playlist_img,
    themeColor: '#1E90FF',
    showStartTime: nullable(row.show_start_time),
    showEndTime: nullable(row.show_end_time),
    setlistCount: row.setlist_count,
    date: row.show_date,
    dateSlash: row.show_date.slice(5).replace('-', '/'),
  }
}

const SHOW_SELECT = `
  SELECT s.id, s.sub_theme, s.version_name, s.city, s.venue, s.show_date,
    s.day_label, s.guests, s.contributor, s.playlist_img, s.show_start_time,
    s.show_end_time, (
    SELECT COUNT(*) FROM setlist_items si WHERE si.show_id = s.id
  ) AS setlist_count
  FROM shows s
`

/** All shows, sorted by date. Used to populate the /form picker and the Overview timeline. */
export async function queryAllShows(db: D1Database): Promise<Show[]> {
  const { results } = await db
    .prepare(`${SHOW_SELECT} ORDER BY s.show_date ASC, s.id ASC`)
    .all<ShowRow>()
  return results.map((row, showIndex) => mapShowRow(row, showIndex))
}

/** Resolve full Show rows for a set of ids. */
export async function queryShowsByIds(db: D1Database, ids: number[]): Promise<Show[]> {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(',')
  const { results } = await db
    .prepare(`${SHOW_SELECT} WHERE s.id IN (${placeholders})`)
    .bind(...ids)
    .all<ShowRow>()
  return results.map((row) => mapShowRow(row, -1))
}

/**
 * Reads every show and its setlist rows with one D1 statement.
 * Summary statistics are then calculated from this snapshot in Worker memory.
 */
export async function querySummarySnapshot(db: D1Database): Promise<SummarySnapshot> {
  const { results } = await db
    .prepare(
      `SELECT s.id, s.sub_theme, s.version_name, s.city, s.venue, s.show_date,
       s.day_label, s.guests, s.contributor, s.playlist_img, s.show_start_time,
       s.show_end_time, COUNT(si.id) OVER (PARTITION BY s.id) AS setlist_count,
       si.show_id AS setlist_show_id,
       si.section AS setlist_section,
       si.item_type AS setlist_item_type,
       si.title AS setlist_title
       FROM shows s
       LEFT JOIN setlist_items si ON si.show_id = s.id
       ORDER BY s.show_date ASC, s.id ASC, si.sort_order ASC`
    )
    .all<SummarySnapshotRow>()

  const shows: Show[] = []
  const showIds = new Set<number>()
  const setlistItems: SummarySetlistItem[] = []

  for (const row of results) {
    if (!showIds.has(row.id)) {
      showIds.add(row.id)
      shows.push(mapShowRow(row, shows.length))
    }

    if (row.setlist_show_id !== null) {
      setlistItems.push({
        showId: row.setlist_show_id,
        section: row.setlist_section ?? '',
        itemType: row.setlist_item_type ?? '',
        title: row.setlist_title ?? '',
      })
    }
  }

  return { shows, setlistItems }
}

export const getAllShows = createServerFn({ method: 'GET' }).handler(async (): Promise<Show[]> => {
  const db = await getDb()
  return queryAllShows(db)
})
