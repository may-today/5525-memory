import { createServerFn } from '@tanstack/react-start'
import type { Show } from '@/types'
import { CITY_COORDINATES } from './city-coordinates'
import { getDb } from './db'
import { queryAllShows, queryShowsByIds } from './shows'

export interface CityMarker {
  cityName: string
  latitude: number
  longitude: number
}

export interface SongStats {
  totalSongs: number
  topSong: { title: string; count: number } | null
}

export interface SummaryData {
  /** Full non-hidden show catalog — feeds the Overview timeline and the City globe's no-selection fallback. */
  allShows: Show[]
  /** Shows resolved from the requested ids — also used to rehydrate concertStore after a hard refresh. */
  selectedShows: Show[]
  overview: { totalShows: number; cityCount: number; venueCount: number }
  cityMarkers: CityMarker[]
  songStats: SongStats
}

function buildCityMarkers(cityNames: string[]): CityMarker[] {
  const uniqueCities = [...new Set(cityNames)]
  const markers: CityMarker[] = []
  for (const cityName of uniqueCities) {
    const coord = CITY_COORDINATES[cityName]
    if (coord) markers.push({ cityName, ...coord })
  }
  return markers
}

/**
 * A row counts toward "songs heard" iff item_type = 'song'. This INCLUDES
 * encore-section songs (section LIKE 'encore_%') since those are still songs
 * performed, and EXCLUDES medley/vcr/talking/event/special_guest/interaction
 * rows, since those are not literal songs.
 */
async function querySongStats(db: D1Database, showIds: number[]): Promise<SongStats> {
  if (showIds.length === 0) return { totalSongs: 0, topSong: null }
  const placeholders = showIds.map(() => '?').join(',')

  const totalStmt = db
    .prepare(`SELECT COUNT(*) AS total FROM setlist_items WHERE show_id IN (${placeholders}) AND item_type = 'song'`)
    .bind(...showIds)
  const topStmt = db
    .prepare(
      `SELECT title, COUNT(*) AS cnt FROM setlist_items
       WHERE show_id IN (${placeholders}) AND item_type = 'song'
       GROUP BY title ORDER BY cnt DESC LIMIT 1`
    )
    .bind(...showIds)

  const [totalResult, topResult] = await db.batch<{ total: number } | { title: string; cnt: number }>([
    totalStmt,
    topStmt,
  ])

  const total = (totalResult.results[0] as { total: number } | undefined)?.total ?? 0
  const top = topResult.results[0] as { title: string; cnt: number } | undefined

  return {
    totalSongs: total,
    topSong: top ? { title: top.title, count: top.cnt } : null,
  }
}

/**
 * Single consolidated query for everything the /summary cards need (Card2's
 * mileage is out of scope — no home-city capture yet). Called once per
 * /summary mount with the user's selected show ids.
 */
export const getSummaryData = createServerFn({ method: 'POST' })
  .validator((showIds: number[]) => showIds)
  .handler(async ({ data: showIds }): Promise<SummaryData> => {
    const db = await getDb()

    const [allShows, selectedShows, songStats] = await Promise.all([
      queryAllShows(db),
      queryShowsByIds(db, showIds),
      querySongStats(db, showIds),
    ])

    const citiesForMarkers = selectedShows.length > 0 ? selectedShows.map((s) => s.city) : allShows.map((s) => s.city)

    return {
      allShows,
      selectedShows,
      overview: {
        totalShows: selectedShows.length,
        cityCount: new Set(selectedShows.map((s) => s.city)).size,
        venueCount: new Set(selectedShows.map((s) => s.venue)).size,
      },
      cityMarkers: buildCityMarkers(citiesForMarkers),
      songStats,
    }
  })
