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
  topSong: { title: string; count: number } | null
  totalSongs: number
}

export interface GuestShowInfo {
  city: string
  dateSlash: string
  dayLabel: string
  id: number
  posterUrl: string
  showEndTime: string | null
  showStartTime: string | null
  subTheme: string
  themeColor: string
  tourName: string
  tourTypeId: number
  venue: string
  versionName: string
}

export interface GuestShow {
  guests: string[]
  isVisited: boolean
  show: GuestShowInfo
  showDate: string
}

export interface GuestStats {
  guestShows: GuestShow[]
}

export interface SummaryData {
  /** Full non-hidden show catalog — feeds the Overview timeline and the City globe's no-selection fallback. */
  allShows: Show[]
  cityMarkers: CityMarker[]
  guestStats: GuestStats
  overview: { totalShows: number; cityCount: number; venueCount: number }
  /** Shows resolved from the requested ids — also used to rehydrate concertStore after a hard refresh. */
  selectedShows: Show[]
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

function buildGuestStats(allShows: Show[], selectedShows: Show[]): GuestStats {
  const selectedShowIds = new Set(selectedShows.map((show) => show.id))
  const guestShows = allShows
    .filter((show) => show.guests.length > 0)
    .map(
      (show): GuestShow => ({
        showDate: show.showDate,
        show: {
          id: show.id,
          tourName: show.tourName,
          subTheme: show.subTheme,
          versionName: show.versionName,
          city: show.city,
          venue: show.venue,
          dayLabel: show.dayLabel,
          dateSlash: show.dateSlash,
          posterUrl: show.posterUrl,
          themeColor: show.themeColor,
          showStartTime: show.showStartTime,
          showEndTime: show.showEndTime,
          tourTypeId: show.tourTypeId,
        },
        guests: show.guests,
        isVisited: selectedShowIds.has(show.id),
      })
    )

  return { guestShows }
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
      guestStats: buildGuestStats(allShows, selectedShows),
    }
  })
