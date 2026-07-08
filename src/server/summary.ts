import { createServerFn } from '@tanstack/react-start'
import type { Show } from '@/types'
import { CITY_COORDINATES } from './city-coordinates'
import { getDb } from './db'
import { queryAllShows, queryShowsByIds } from './shows'

export interface CityMarker {
  /** 城市展示名；有选中场次时来自选中场次城市去重，未选择任何场次时来自所有非隐藏场次城市去重。 */
  cityName: string
  /** 从硬编码 CITY_COORDINATES 映射表解析出的纬度；映射表缺失的城市会被跳过。 */
  latitude: number
  /** 从硬编码 CITY_COORDINATES 映射表解析出的经度；映射表缺失的城市会被跳过。 */
  longitude: number
}

export interface SongStats {
  /** 选中场次中出现次数最多的歌曲，按歌曲标题精确分组统计；没有歌曲记录时为 null。 */
  topSong: { title: string; count: number } | null
  /** 选中场次中 item_type = 'song' 的歌单行总数。 */
  totalSongs: number
}

export interface GuestShowInfo {
  /** 嘉宾场次所在城市，复制自完整 Show 记录。 */
  city: string
  /** 嘉宾场次日期的 MM/DD 格式，由 show_date 派生。 */
  dateSlash: string
  /** 嘉宾场次标签，如 DAY1 或安可场标签。 */
  dayLabel: string
  /** 嘉宾场次在 shows 表中的 id。 */
  id: number
  /** 嘉宾场次海报 URL，复制自 shows 表。 */
  posterUrl: string
  /** 嘉宾场次实际散场时间；字面量 'NULL' 会被归一化为 null。 */
  showEndTime: string | null
  /** 嘉宾场次实际开场时间；字面量 'NULL' 会被归一化为 null。 */
  showStartTime: string | null
  /** 嘉宾场次子主题，复制自 shows 表。 */
  subTheme: string
  /** 嘉宾场次主题色，复制自 shows 表。 */
  themeColor: string
  /** 巡演名称，复制自 shows 表。 */
  tourName: string
  /** 巡演类型 id，复制自 shows 表。 */
  tourTypeId: number
  /** 嘉宾场次场馆，复制自完整 Show 记录。 */
  venue: string
  /** 版本名称，复制自 shows 表。 */
  versionName: string
}

export interface GuestShow {
  /** 从场次 guests JSON 数组解析出的嘉宾名；这里只包含至少有一位嘉宾的场次。 */
  guests: string[]
  /** 当前用户是否选择过该嘉宾场次；通过判断场次 id 是否存在于 selectedShows 集合中得到。 */
  isVisited: boolean
  /** 嘉宾卡片使用的精简场次信息，复制自完整 Show 记录。 */
  show: GuestShowInfo
  /** 嘉宾场次日期，YYYY-MM-DD 格式，用于按时间聚合与展示。 */
  showDate: string
}

export interface GuestStats {
  /** 所有包含嘉宾的非隐藏巡演场次；继承 queryAllShows 的日期排序，并为每场标记 isVisited。 */
  guestShows: GuestShow[]
}

export interface SummaryData {
  /**
   * 按演出日期排序的完整非隐藏场次目录。
   *
   * 由 queryAllShows 计算，用于 Overview 时间线、City 地球在未选择场次时的兜底城市，
   * 以及嘉宾场次统计。
   */
  allShows: Show[]
  /**
   * 地球城市标记列表。
   *
   * 用户至少选择一场时，由选中场次城市去重计算；未选择任何场次时，由 allShows
   * 中的全部城市去重计算。只有能在 CITY_COORDINATES 中匹配到经纬度的城市会被返回。
   */
  cityMarkers: CityMarker[]
  /**
   * 嘉宾相关场次统计。
   *
   * 基于 allShows 过滤出 guests 数组非空的场次，再根据场次 id 是否出现在
   * selectedShows 中标记用户是否到场。
   */
  guestStats: GuestStats
  /**
   * 选中场次的基础出席统计。
   *
   * totalShows 为 selectedShows.length；cityCount 为选中场次城市去重数；
   * venueCount 为选中场次场馆去重数。
   */
  overview: { totalShows: number; cityCount: number; venueCount: number }
  /**
   * 根据请求传入的场次 id 解析出的完整 Show 记录。
   *
   * 由 queryShowsByIds 计算；useSummaryData 也会用它在 /summary 硬刷新后回填
   * concertStore。
   */
  selectedShows: Show[]
  /**
   * 选中场次的歌曲统计。
   *
   * 从 setlist_items 中筛选 show_id 属于请求场次 id 且 item_type = 'song' 的记录计算。
   * 安可歌曲会被计入；VCR、talking、互动、嘉宾标记等非歌曲行会被排除。
   */
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
