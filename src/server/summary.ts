import { createServerFn } from '@tanstack/react-start'
import type { Show } from '@/types'
import { CITY_COORDINATES } from './city-coordinates'
import { getDb } from './db'
import type { SummarySetlistItem } from './shows'
import { querySummarySnapshot } from './shows'

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

export interface RandomSongEntry {
  /** 随机曲目在选中场次中的出现次数（点歌 + 安可行数之和）。 */
  count: number
  /** setlist_items.title 的精确值，按标题精确分组。 */
  title: string
}

export interface RandomSongStats {
  /**
   * 出现次数 Top 10 的随机曲目，按次数降序、平票按标题排序保证 SSR 稳定。
   * 排行第一名即用户的「常驻曲」。
   */
  entries: RandomSongEntry[]
  /** 选中场次中随机曲目行的总数（含重复）。 */
  totalPlays: number
  /** 选中场次中随机曲目去重后的曲目数。 */
  uniqueCount: number
}

export interface RareSongEntry {
  /** 用户第一次听到该曲目的场次城市，作为纸条落款。 */
  heardCity: string
  /** 该曲目在用户选中场次中的出现次数（点歌 + 安可行数之和）。 */
  heardCount: number
  /** 用户第一次听到该曲目的场次日期 MM/DD 格式。 */
  heardDateSlash: string
  /** setlist_items.title 的精确值，按标题精确分组。 */
  title: string
  /** 该曲目在全巡演所有非隐藏场次中的出现次数（点歌 + 安可）。 */
  tourCount: number
}

export interface RareSongStats {
  /**
   * 冷门榜前 7 首：heardCount 升序 → tourCount 升序 → 标题排序保证 SSR 稳定。
   * 排行第一名即用户的「沧海遗珠」，无条件保留；其余条目需满足全巡演出现
   * 次数不超过 RARE_SONG_TOUR_COUNT_MAX，避免把巡演常驻曲当成冷门曲展示。
   */
  entries: RareSongEntry[]
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
  /** 所有包含嘉宾的非隐藏巡演场次；继承巡演快照日期排序，并为每场标记 isVisited。 */
  guestShows: GuestShow[]
}

export interface SummaryData {
  /**
   * 按演出日期排序的完整非隐藏场次目录。
   *
   * 由单次巡演快照读取计算，用于 Overview 时间线、City 地球在未选择场次时的兜底城市，
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
   * 选中场次的随机曲目统计（「专属歌单」卡）。
   *
   * 口径：item_type = 'song' 且 section = 'request'（点歌）或 section LIKE
   * 'encore_%'（安可），与报告页 report-stats.ts 的分段过滤一致；主歌单
   * （section = 'main'）不计入。
   */
  randomSongStats: RandomSongStats
  /**
   * 选中场次的冷门随机曲目统计（「最小众歌单」卡）。
   *
   * 与 randomSongStats 同一随机曲目口径，但按用户听到次数升序取最少的几首，
   * 并附上该曲目在全巡演非隐藏场次中的出现次数与用户第一次听到它的场次落款。
   */
  rareSongStats: RareSongStats
  /**
   * 根据请求传入的场次 id 解析出的完整 Show 记录。
   *
   * 由完整巡演快照过滤计算；useSummaryData 也会用它在 /summary 硬刷新后回填
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
 * Whether a setlist row counts toward "songs heard". This INCLUDES encore
 * songs and EXCLUDES medley/vcr/talking/event/special_guest/interaction rows.
 */
function isSong(item: SummarySetlistItem): boolean {
  return item.itemType === 'song'
}

/** How many ranked entries the playlist card shows. */
const RANDOM_SONG_RANK_LIMIT = 10

/**
 * "Random songs" are the non-fixed part of a show: request-section songs and
 * encore-section songs (section = 'request' OR section LIKE 'encore_%'),
 * matching the segment filters in report-stats.ts. Main-setlist songs are
 * excluded — they are identical across shows and would drown out the signal.
 */
function isRandomSong(item: SummarySetlistItem): boolean {
  return isSong(item) && (item.section === 'request' || item.section.startsWith('encore_'))
}

/** How many rare-song "paper slips" the rare-songs card shows (1 hero + 6 small notes). */
const RARE_SONG_RANK_LIMIT = 7

/**
 * A song only qualifies as "冷门" for the small-notes grid if the whole tour
 * sang it at most this many times (~5% of shows). Without this, a one-show
 * user — whose every song is heard exactly once — would get tour staples like
 * 顽固 (tour count 30+) presented as rarities. The hero slip is exempt: the
 * rarest thing the user heard is always worth showing.
 */
const RARE_SONG_TOUR_COUNT_MAX = 8

/** Byte-wise title comparison matching the SQL BINARY collation used by previous query tie-breaks. */
function compareTitles(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Counts titles in a setlist collection so every summary metric can reuse the
 * same one-query snapshot.
 */
function countTitles(items: SummarySetlistItem[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.title, (counts.get(item.title) ?? 0) + 1)
  }
  return counts
}

/** Builds the songs-heard card statistics from the complete in-memory snapshot. */
function buildSongStats(items: SummarySetlistItem[]): SongStats {
  const songs = items.filter(isSong)
  const entries = [...countTitles(songs)].map(([title, count]) => ({ title, count }))
  entries.sort((a, b) => b.count - a.count || compareTitles(a.title, b.title))

  return {
    totalSongs: songs.length,
    topSong: entries[0] ?? null,
  }
}

/** Builds the playlist-card ranking from the complete in-memory snapshot. */
function buildRandomSongStats(items: SummarySetlistItem[]): RandomSongStats {
  const randomSongs = items.filter(isRandomSong)
  const entries = [...countTitles(randomSongs)]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count || compareTitles(a.title, b.title))
    .slice(0, RANDOM_SONG_RANK_LIMIT)

  return {
    entries,
    totalPlays: randomSongs.length,
    uniqueCount: new Set(randomSongs.map((item) => item.title)).size,
  }
}

/**
 * The mirror of the playlist ranking: the user's LEAST-heard random songs
 * (same request/encore condition), ranked by heard count ascending, then by
 * how rarely the song appeared across the whole tour, then by title so the
 * ranking is deterministic across SSR/CSR. Tour-wide counts only consider
 * non-hidden shows; each entry carries the first show (city + date) where the
 * user heard the song, which the card prints as the slip's signature line.
 */
function buildRareSongStats(
  allItems: SummarySetlistItem[],
  selectedShowIds: Set<number>,
  showsById: Map<number, Show>
): RareSongStats {
  const tourCounts = countTitles(allItems.filter(isRandomSong))
  const heardByTitle = new Map<string, { heardCount: number; heardCity: string; heardDate: string }>()

  for (const item of allItems) {
    if (!(selectedShowIds.has(item.showId) && isRandomSong(item))) continue

    const show = showsById.get(item.showId)
    if (!show) continue

    const existing = heardByTitle.get(item.title)
    if (existing) {
      existing.heardCount += 1
      if (show.showDate < existing.heardDate) {
        existing.heardCity = show.city
        existing.heardDate = show.showDate
      }
    } else {
      heardByTitle.set(item.title, { heardCount: 1, heardCity: show.city, heardDate: show.showDate })
    }
  }

  const ranked = [...heardByTitle.entries()]
    .map(
      ([title, heard]): RareSongEntry => ({
        title,
        heardCount: heard.heardCount,
        heardCity: heard.heardCity,
        heardDateSlash: heard.heardDate.slice(5).replace('-', '/'),
        // Selected shows come from the non-hidden catalog, so this fallback is defensive only.
        tourCount: tourCounts.get(title) ?? heard.heardCount,
      })
    )
    .sort((a, b) => a.heardCount - b.heardCount || a.tourCount - b.tourCount || compareTitles(a.title, b.title))

  const entries = ranked
    .filter((entry, index) => index === 0 || entry.tourCount <= RARE_SONG_TOUR_COUNT_MAX)
    .slice(0, RARE_SONG_RANK_LIMIT)

  return { entries }
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

    const { shows: allShows, setlistItems } = await querySummarySnapshot(db)
    const selectedShowIds = new Set(showIds)
    const selectedShows = allShows.filter((show) => selectedShowIds.has(show.id))
    const selectedShowIdSet = new Set(selectedShows.map((show) => show.id))
    const selectedSetlistItems = setlistItems.filter((item) => selectedShowIdSet.has(item.showId))
    const showsById = new Map(allShows.map((show) => [show.id, show]))

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
      songStats: buildSongStats(selectedSetlistItems),
      randomSongStats: buildRandomSongStats(selectedSetlistItems),
      rareSongStats: buildRareSongStats(setlistItems, selectedShowIdSet, showsById),
      guestStats: buildGuestStats(allShows, selectedShows),
    }
  })
