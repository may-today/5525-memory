import { createServerFn } from '@tanstack/react-start'
import { geoCoordMap } from '@/data/geo-coord'
import { isRandomSongBlacklisted } from '@/data/song-filter'
import { songList } from '@/data/song-list'
import type { Show } from '@/types'
import { CITY_COORDINATES } from './city-coordinates'
import { getDb } from './db'
import type { SummarySetlistItem } from './shows'
import { querySummarySnapshot } from './shows'

export interface CityMarker {
  /** 城市展示名；来自全部场次城市去重，按场次日期顺序排列。 */
  cityName: string
  /** 用户选中场次中是否包含该城市；City 卡据此高亮标记并连接星轨。 */
  isVisited: boolean
  /** 从硬编码 CITY_COORDINATES 映射表解析出的纬度；映射表缺失的城市会被跳过。 */
  latitude: number
  /** 从硬编码 CITY_COORDINATES 映射表解析出的经度；映射表缺失的城市会被跳过。 */
  longitude: number
}

export interface LocationCoordinates {
  /** Latitude reported by the browser Geolocation API. */
  latitude: number
  /** Longitude reported by the browser Geolocation API. */
  longitude: number
}

export interface SummaryRequest {
  /** Optional city or region selected in the form when browser location is unavailable. */
  city: string
  /** Optional browser coordinates used to calculate round-trip travel distance. */
  coordinates: LocationCoordinates | null
  /** IDs of the shows selected in the form. */
  showIds: number[]
}

export interface SongStats {
  /** 选中场次中出现次数最多的歌曲，按歌曲标题精确分组统计；没有歌曲记录时为 null。 */
  topSong: { title: string; count: number } | null
  /** 选中场次中歌曲数；`medley` 歌单行会按加号拆为多首后计入。 */
  totalSongs: number
}

export interface TourSongAppearance {
  /** 用户选中场次中是否包含该场，即用户是否在这场听到过这首歌。 */
  isHeard: boolean
  /**
   * 该曲目在这场演出中所属的歌单段落：`main`（主歌单／普通）、`request`
   * （点歌）或 `encore`（安可），由 setlist_items.section 归一化而来。
   */
  sectionType: 'main' | 'request' | 'encore'
  /** 该曲目所在场次的精简展示信息，复制自完整 Show 记录。 */
  show: SummaryShowInfo
}

export interface TourSong {
  /**
   * 该曲目在全巡演所有场次中的出现记录，按场次日期升序排列
   * （继承自单次巡演快照的查询顺序）。
   */
  appearances: TourSongAppearance[]
  /** 曲库标准标题（五月天歌曲）或去除演出装饰后的歌单标题（惊喜歌曲）。 */
  title: string
  /** `mayday` 代表曲库内歌曲；`surprise` 代表曲库外歌曲。 */
  type: 'mayday' | 'surprise'
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
  /** 该曲目在全巡演所有场次中的出现次数（点歌 + 安可）。 */
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

export interface SeasonalSongEntry {
  /** 用户选中场次中落在该季的场次数。 */
  showCount: number
  /** 该季用户听过次数最多的随机曲目；该季没有随机曲目记录时为 null。 */
  song: { count: number; title: string } | null
}

export interface SeasonalSongStats {
  /**
   * 固定按春（3–5 月）、夏（6–8 月）、秋（9–11 月）、冬（12–2 月）顺序的
   * 四个季节条目；季节划分与报告页 report-stats.ts 的季节筛选一致。
   */
  seasons: [SeasonalSongEntry, SeasonalSongEntry, SeasonalSongEntry, SeasonalSongEntry]
}

export interface DurationShowEntry {
  /** 场次城市，复制自 Show。 */
  city: string
  /** 场次日期 MM/DD 格式，复制自 Show。 */
  dateSlash: string
  /** 场次标签，如 DAY1。 */
  dayLabel: string
  /** 该场真实时长（分钟），由开散场 HH:MM 差值算出（跨夜 +1440）。 */
  durationMinutes: number
  /** shows 表 id，列表渲染 key。 */
  id: number
  /** 场次日期 YYYY-MM-DD，列表按它升序。 */
  showDate: string
  /** 开场时刻距当日 0 点的分钟数；散场时刻 = startMinutes + durationMinutes（跨夜时超过 1440）。 */
  startMinutes: number
  /** 场次主题色，列表条目点缀用。 */
  themeColor: string
}

export interface DurationStats {
  /** 有真实时长记录的选中场次，按 showDate 升序；缺开/散场时间的场次不进列表。 */
  entries: DurationShowEntry[]
  /** 缺开/散场时间、按 FALLBACK_SHOW_MINUTES 兜底计入总数的选中场次数；>0 时前端注脚说明。 */
  fallbackCount: number
  /** 选中场次时长合计（分钟，含兜底），沙漏汇聚的目标数字。 */
  totalMinutes: number
}

/** 卡片场次展示需要的精简场次信息，复制自完整 Show 记录；被嘉宾统计与巡演曲目出现记录复用。 */
export interface SummaryShowInfo {
  /** 场次所在城市。 */
  city: string
  /** 场次日期的 MM/DD 格式，由 show_date 派生。 */
  dateSlash: string
  /** 场次标签，如 DAY1 或安可场标签。 */
  dayLabel: string
  /** 场次在 shows 表中的 id。 */
  id: number
  /** 场次日期，YYYY-MM-DD 格式；场次列表跨多个年份，MM/DD 不足以区分。 */
  showDate: string
  /** 场次子主题。 */
  subTheme: string
  /** 巡演名称。 */
  tourName: string
  /** 场次场馆。 */
  venue: string
  /** 版本名称。 */
  versionName: string
}

export interface GuestShow {
  /** 从场次 guests JSON 数组解析出的嘉宾名；这里只包含至少有一位嘉宾的场次。 */
  guests: string[]
  /** 当前用户是否选择过该嘉宾场次；通过判断场次 id 是否存在于 selectedShows 集合中得到。 */
  isVisited: boolean
  /** 嘉宾卡片使用的精简场次信息，复制自完整 Show 记录。 */
  show: SummaryShowInfo
  /** 嘉宾场次日期，YYYY-MM-DD 格式，用于按时间聚合与展示。 */
  showDate: string
}

export interface GuestStats {
  /** 所有包含嘉宾的巡演场次；继承巡演快照日期排序，并为每场标记 isVisited。 */
  guestShows: GuestShow[]
}

export interface SummaryData {
  /**
   * 按演出日期排序的完整场次目录。
   *
   * 由单次巡演快照读取计算，用于 Overview 时间线、City 地球在未选择场次时的兜底城市，
   * 以及嘉宾场次统计。
   */
  allShows: Show[]
  /**
   * 地球城市标记列表。
   *
   * 始终由 allShows 中的全部城市去重计算，用户选中场次覆盖的城市标记
   * isVisited = true。只有能在 CITY_COORDINATES 中匹配到经纬度的城市会被返回。
   */
  cityMarkers: CityMarker[]
  /**
   * 选中场次的时长统计（「时长统计」卡）。
   *
   * 每场时长为 showEndTime - showStartTime 的分钟差（end <= start 视为跨夜
   * +1440，结果超出 (0, 480] 视为脏数据按缺失处理）；缺开/散场时间的场次按
   * FALLBACK_SHOW_MINUTES（180 分钟）计入 totalMinutes，但不进 entries 列表。
   */
  durationStats: DurationStats
  /**
   * 嘉宾相关场次统计。
   *
   * 基于 allShows 过滤出 guests 数组非空的场次，再根据场次 id 是否出现在
   * selectedShows 中标记用户是否到场。
   */
  guestStats: GuestStats
  /**
   * Round-trip distance in kilometers from the user's browser location to each
   * distinct visited city. Null means the user did not provide a valid location.
   */
  mileage: number | null
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
   * 口径：歌曲或串烧拆分后的歌曲，且 section = 'request'（点歌）或 section LIKE
   * 'encore_%'（安可），再按场次 subTheme 排除主题固定曲；主歌单
   * （section = 'main'）不计入。
   */
  randomSongStats: RandomSongStats
  /**
   * 选中场次的冷门随机曲目统计（「最小众歌单」卡）。
   *
   * 与 randomSongStats 同一（已排除主题固定曲的）随机曲目口径，但按用户听到次数升序取最少的几首，
   * 并附上该曲目在全巡演场次中的出现次数与用户第一次听到它的场次落款。
   */
  rareSongStats: RareSongStats
  /**
   * 选中场次的四季随机曲目统计（「四季歌单」卡）。
   *
   * 与 randomSongStats 同一（已排除主题固定曲的）随机曲目口径，按场次日期的
   * 月份分进春夏秋冬四季，各取出现次数最高的一首。
   */
  seasonalSongStats: SeasonalSongStats
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
   * 从 setlist_items 中筛选 show_id 属于请求场次 id 的歌曲记录计算；`medley`
   * 会按加号拆分并去除首尾空白。安可歌曲会被计入；VCR、talking、互动、嘉宾
   * 标记等非歌曲行会被排除。
   */
  songStats: SongStats
  /**
   * 全巡演实际演唱过的去重歌曲，每首附带在所有场次中的出现记录。
   *
   * 统计 item_type = 'song' 与拆分后的 `medley`；匹配时会忽略演出装饰、标点与空白差异。
   * 五月天歌曲排在前，随后是按标题排序的惊喜歌曲；每首歌的 appearances
   * 记录该曲目出现过的场次、在该场所属的歌单段落，以及用户是否听过这场。
   */
  tourSongs: TourSong[]
  /**
   * 用户的出发点坐标：浏览器定位优先，未定位时回退到所选城市／地区中心
   * （geoCoordMap）。City 卡用它在地球上标记用户位置并向去过的城市发射弧线。
   * null 表示没有可用地点，此时 mileage 也为 null。
   */
  travelOrigin: LocationCoordinates | null
}

function buildCityMarkers(allShows: Show[], visitedCities: Set<string>): CityMarker[] {
  const uniqueCities = [...new Set(allShows.map((show) => show.city))]
  const markers: CityMarker[] = []
  for (const cityName of uniqueCities) {
    const coord = CITY_COORDINATES[cityName]
    if (coord) markers.push({ cityName, isVisited: visitedCities.has(cityName), ...coord })
  }
  return markers
}

/** Builds the slim show-card shape shared by guest stats and tour-song appearances. */
function toSummaryShowInfo(show: Show): SummaryShowInfo {
  return {
    id: show.id,
    tourName: show.tourName,
    subTheme: show.subTheme,
    versionName: show.versionName,
    city: show.city,
    venue: show.venue,
    dayLabel: show.dayLabel,
    dateSlash: show.dateSlash,
    showDate: show.showDate,
  }
}

function buildGuestStats(allShows: Show[], selectedShows: Show[]): GuestStats {
  const selectedShowIds = new Set(selectedShows.map((show) => show.id))
  const guestShows = allShows
    .filter((show) => show.guests.length > 0)
    .map(
      (show): GuestShow => ({
        showDate: show.showDate,
        show: toSummaryShowInfo(show),
        guests: show.guests,
        isVisited: selectedShowIds.has(show.id),
      })
    )

  return { guestShows }
}

function hasValidCoordinates(coordinates: LocationCoordinates | null): coordinates is LocationCoordinates {
  return (
    coordinates !== null &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  )
}

function getOriginCoordinates(city: string, coordinates: LocationCoordinates | null): [number, number] | null {
  if (hasValidCoordinates(coordinates)) {
    return [coordinates.longitude, coordinates.latitude]
  }

  return geoCoordMap[city] ?? null
}

/**
 * Whether a setlist row contains one or more performed songs. This includes
 * encore songs and medleys, but excludes vcr/talking/event/special_guest/
 * interaction rows.
 */
function isSong(item: SummarySetlistItem): boolean {
  return item.itemType === 'song' || item.itemType === 'medley'
}

/** How many ranked entries the playlist card shows. */
const RANDOM_SONG_RANK_LIMIT = 10

/**
 * "Random songs" are the non-fixed part of a show: request-section songs and
 * encore-section songs (section = 'request' OR section LIKE 'encore_%'),
 * excluding songs fixed by the show's sub-theme. Main-setlist songs are
 * excluded — they are identical across shows and would drown out the signal.
 */
function isRandomSong(item: SummarySetlistItem, showsById: Map<number, Show>): boolean {
  const show = showsById.get(item.showId)
  return (
    isSong(item) &&
    (item.section === 'request' || item.section.startsWith('encore_')) &&
    !(show && isRandomSongBlacklisted(show.subTheme, item.title))
  )
}

/** How many rare-song "paper slips" the rare-songs card shows (1 hero + 6 small notes). */
const RARE_SONG_RANK_LIMIT = 7

const SONG_DECORATION_PATTERN = /\p{Extended_Pictographic}|\uFE0F/gu
const SONG_FEATURING_SUFFIX_PATTERN = /\s+ft\..*$/iu
const SONG_WHITESPACE_PATTERN = /\s+/g
const MEDLEY_SONG_SEPARATOR_PATTERN = /[+＋]/
const SONG_COMPARISON_NOISE_PATTERN = /[\p{P}\p{Z}]/gu
const SONG_PARENTHESES_PATTERN = /[（(]/
/** Known setlist spelling and event-label variants that belong to 五月天 catalog songs. */
const SONG_TITLE_KEY_ALIASES = new Map<string, string>([
  ['乾杯', '干杯'],
  ['派推动物', '派对动物'],
  ['笑忘歌新年倒数', '笑忘歌'],
])

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

/**
 * Flattens song-bearing setlist rows into individual songs. A regular `song`
 * stays intact; a `medley` splits on either plus sign and discards blank parts.
 */
function expandSongItems(items: SummarySetlistItem[]): SummarySetlistItem[] {
  const songs: SummarySetlistItem[] = []

  for (const item of items) {
    if (!isSong(item)) continue
    if (item.itemType === 'song') {
      songs.push(item)
      continue
    }

    for (const title of item.title.split(MEDLEY_SONG_SEPARATOR_PATTERN)) {
      const trimmedTitle = title.trim()
      if (trimmedTitle) songs.push({ ...item, title: trimmedTitle })
    }
  }

  return songs
}

/** Builds the songs-heard card statistics from the complete in-memory snapshot. */
function buildSongStats(items: SummarySetlistItem[]): SongStats {
  const songs = expandSongItems(items)
  const entries = [...countTitles(songs)].map(([title, count]) => ({ title, count }))
  entries.sort((a, b) => b.count - a.count || compareTitles(a.title, b.title))

  return {
    totalSongs: songs.length,
    topSong: entries[0] ?? null,
  }
}

/** Removes emoji decorations and normalizes whitespace for display. */
function stripSongDecorations(title: string): string {
  return title
    .replace(SONG_DECORATION_PATTERN, '')
    .replace(SONG_FEATURING_SUFFIX_PATTERN, '')
    .replace(SONG_WHITESPACE_PATTERN, ' ')
    .trim()
}

/** Produces a comparison key that ignores punctuation and whitespace differences. */
function getSongTitleKey(title: string): string {
  return stripSongDecorations(title).normalize('NFKC').replace(SONG_COMPARISON_NOISE_PATTERN, '').toLocaleLowerCase()
}

/** Returns a song's main title before its catalog parenthetical subtitle, if present. */
function getSongBaseTitleKey(title: string): string {
  return getSongTitleKey(title.split(SONG_PARENTHESES_PATTERN, 1)[0])
}

/** Applies maintained setlist-title aliases after the general title normalization. */
function getCanonicalSongTitleKey(title: string): string {
  const titleKey = getSongTitleKey(title)
  return SONG_TITLE_KEY_ALIASES.get(titleKey) ?? titleKey
}

/** Normalizes a raw setlist_items.section value into the coarse type an appearance entry reports. */
function getSongSectionType(section: string): TourSongAppearance['sectionType'] {
  if (section === 'request') return 'request'
  if (section.startsWith('encore_')) return 'encore'
  return 'main'
}

/** Builds the flattened full-tour song catalog with 五月天 membership markers and per-show appearances. */
function buildTourSongs(
  items: SummarySetlistItem[],
  showsById: Map<number, Show>,
  selectedShowIds: Set<number>
): TourSong[] {
  const catalogByTitleKey = new Map<string, (typeof songList)[number]>()
  const catalogByBaseTitleKey = new Map<string, (typeof songList)[number]>()
  const matchedSongSlugs = new Set<string>()
  const surpriseSongsByTitleKey = new Map<string, string>()
  const appearancesByKey = new Map<string, TourSongAppearance[]>()

  for (const song of songList) {
    catalogByTitleKey.set(getSongTitleKey(song.title), song)
    const baseTitleKey = getSongBaseTitleKey(song.title)
    if (!catalogByBaseTitleKey.has(baseTitleKey)) catalogByBaseTitleKey.set(baseTitleKey, song)
  }

  for (const item of expandSongItems(items)) {
    const titleKey = getCanonicalSongTitleKey(item.title)
    const song = catalogByTitleKey.get(titleKey) ?? catalogByBaseTitleKey.get(titleKey)
    const appearanceKey = song ? `mayday:${song.slug}` : `surprise:${titleKey}`
    if (song) {
      matchedSongSlugs.add(song.slug)
    } else if (!surpriseSongsByTitleKey.has(titleKey)) {
      surpriseSongsByTitleKey.set(titleKey, stripSongDecorations(item.title))
    }

    const show = showsById.get(item.showId)
    if (!show) continue
    const appearance: TourSongAppearance = {
      show: toSummaryShowInfo(show),
      sectionType: getSongSectionType(item.section),
      isHeard: selectedShowIds.has(item.showId),
    }
    const appearances = appearancesByKey.get(appearanceKey)
    if (appearances) appearances.push(appearance)
    else appearancesByKey.set(appearanceKey, [appearance])
  }

  const maydaySongs = songList
    .filter((song) => matchedSongSlugs.has(song.slug))
    .map(
      (song): TourSong => ({
        title: song.title,
        type: 'mayday',
        appearances: appearancesByKey.get(`mayday:${song.slug}`) ?? [],
      })
    )
  const surpriseSongs = [...surpriseSongsByTitleKey.entries()]
    .sort((a, b) => compareTitles(a[1], b[1]))
    .map(
      ([titleKey, title]): TourSong => ({
        title,
        type: 'surprise',
        appearances: appearancesByKey.get(`surprise:${titleKey}`) ?? [],
      })
    )

  return [...maydaySongs, ...surpriseSongs]
}

/** Builds the playlist-card ranking from the complete in-memory snapshot. */
function buildRandomSongStats(items: SummarySetlistItem[], showsById: Map<number, Show>): RandomSongStats {
  const randomSongs = expandSongItems(items).filter((item) => isRandomSong(item, showsById))
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

/** 春夏秋冬四季的月份划分，与报告页 report-stats.ts 的季节筛选一致。 */
const SEASON_MONTH_GROUPS: readonly (readonly number[])[] = [
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
  [12, 1, 2],
]

/** Maps a YYYY-MM-DD show date onto the fixed spring/summer/autumn/winter index. */
function getSeasonIndex(showDate: string): number {
  const month = Number(showDate.slice(5, 7))
  return SEASON_MONTH_GROUPS.findIndex((months) => months.includes(month))
}

/**
 * Builds the seasonal-playlist card data: the same random-song condition as
 * the playlist ranking, split into the four seasons by show date, each season
 * keeping its single most-heard song (ties broken by title for SSR stability).
 */
function buildSeasonalSongStats(
  items: SummarySetlistItem[],
  selectedShows: Show[],
  showsById: Map<number, Show>
): SeasonalSongStats {
  const countsBySeason = SEASON_MONTH_GROUPS.map(() => new Map<string, number>())
  for (const item of expandSongItems(items)) {
    if (!isRandomSong(item, showsById)) continue
    const show = showsById.get(item.showId)
    if (!show) continue
    const counts = countsBySeason[getSeasonIndex(show.showDate)]
    counts?.set(item.title, (counts.get(item.title) ?? 0) + 1)
  }

  const seasons = countsBySeason.map((counts, seasonIndex) => {
    const top = [...counts]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count || compareTitles(a.title, b.title))[0]

    return {
      showCount: selectedShows.filter((show) => getSeasonIndex(show.showDate) === seasonIndex).length,
      song: top ?? null,
    }
  })

  return { seasons: seasons as SeasonalSongStats['seasons'] }
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
  const randomSongs = expandSongItems(allItems).filter((item) => isRandomSong(item, showsById))
  const tourCounts = countTitles(randomSongs)
  const heardByTitle = new Map<string, { heardCount: number; heardCity: string; heardDate: string }>()

  for (const item of randomSongs) {
    if (!selectedShowIds.has(item.showId)) continue

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

const MINUTES_PER_DAY = 1440

/**
 * Sanity ceiling for a computed show duration in minutes. The longest real
 * show in the catalog runs 252 minutes; anything above this is treated as a
 * data-entry error (e.g. a swapped start/end pair reading as 23 hours).
 */
const MAX_SHOW_DURATION_MINUTES = 480

/**
 * Total-minutes fallback for selected shows whose start/end times were never
 * recorded (~26/163 shows). These shows count toward totalMinutes but are
 * excluded from the per-show entries list.
 */
const FALLBACK_SHOW_MINUTES = 180

/** "HH:MM" clock format; single-digit hours occur in seed data (e.g. "0:44"). */
const CLOCK_PATTERN = /^(\d{1,2}):(\d{2})$/

/** Parses a "HH:MM" clock string into minutes since midnight. */
function parseClockMinutes(value: string | null): number | null {
  if (!value) return null
  const match = CLOCK_PATTERN.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!(Number.isFinite(hours) && Number.isFinite(minutes)) || hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/**
 * Computes a show's real duration in minutes from its recorded start/end
 * clock times. End times at or before the start are treated as past-midnight
 * (+24h); results outside (0, MAX_SHOW_DURATION_MINUTES] are treated as dirty
 * data and reported as unknown.
 */
function getShowDurationMinutes(show: Show): number | null {
  const start = parseClockMinutes(show.showStartTime)
  const end = parseClockMinutes(show.showEndTime)
  if (start === null || end === null) return null

  const diff = end - start
  const duration = diff > 0 ? diff : diff + MINUTES_PER_DAY
  if (duration <= 0 || duration > MAX_SHOW_DURATION_MINUTES) return null
  return duration
}

/** Builds the duration-card statistics from the user's selected shows. */
function buildDurationStats(selectedShows: Show[]): DurationStats {
  const entries: DurationShowEntry[] = []
  let fallbackCount = 0
  let totalMinutes = 0

  for (const show of selectedShows) {
    const durationMinutes = getShowDurationMinutes(show)
    const startMinutes = parseClockMinutes(show.showStartTime)
    if (durationMinutes === null || startMinutes === null) {
      fallbackCount += 1
      totalMinutes += FALLBACK_SHOW_MINUTES
      continue
    }

    totalMinutes += durationMinutes
    entries.push({
      city: show.city,
      dateSlash: show.dateSlash,
      dayLabel: show.dayLabel,
      durationMinutes,
      id: show.id,
      showDate: show.showDate,
      startMinutes,
      themeColor: show.themeColor,
    })
  }

  entries.sort((a, b) => a.showDate.localeCompare(b.showDate))

  return { entries, fallbackCount, totalMinutes }
}

/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula.
 *
 * @param lng1 - The longitude of the first point.
 * @param lat1 - The latitude of the first point.
 * @param lng2 - The longitude of the second point.
 * @param lat2 - The latitude of the second point.
 * @returns The distance between the two points in kilometers, rounded to the nearest integer.
 */
const getDistance = ([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) => {
  const radLat1 = (lat1 * Math.PI) / 180.0
  const radLat2 = (lat2 * Math.PI) / 180.0
  const a = radLat1 - radLat2
  const b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0
  let s = 2 * Math.asin(Math.sqrt(Math.sin(a / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(b / 2) ** 2))
  s *= 6378.137
  s = Math.round(s)
  return s
}

/** Calculates the sum of round trips from the user's location to every distinct visited city. */
function buildMileage(selectedShows: Show[], origin: [number, number] | null): number | null {
  if (!origin) {
    return null
  }

  const cityNames = new Set(selectedShows.map((show) => show.city))
  let mileage = 0

  for (const cityName of cityNames) {
    const cityCoordinates = CITY_COORDINATES[cityName]
    if (!cityCoordinates) continue

    mileage += getDistance(origin, [cityCoordinates.longitude, cityCoordinates.latitude]) * 2
  }

  return mileage
}

/**
 * Single consolidated query for everything the /summary cards need. Called
 * once per /summary mount with the user's selected show ids and optional form
 * location.
 */
export const getSummaryData = createServerFn({ method: 'POST' })
  .validator((request: SummaryRequest) => request)
  .handler(async ({ data: { showIds, city, coordinates } }): Promise<SummaryData> => {
    const db = await getDb()

    const { shows: allShows, setlistItems } = await querySummarySnapshot(db)
    const selectedShowIds = new Set(showIds)
    const selectedShows = allShows.filter((show) => selectedShowIds.has(show.id))
    const selectedShowIdSet = new Set(selectedShows.map((show) => show.id))
    const selectedSetlistItems = setlistItems.filter((item) => selectedShowIdSet.has(item.showId))
    const showsById = new Map(allShows.map((show) => [show.id, show]))

    const visitedCities = new Set(selectedShows.map((show) => show.city))
    const origin = getOriginCoordinates(city, coordinates)

    return {
      allShows,
      selectedShows,
      overview: {
        totalShows: selectedShows.length,
        cityCount: new Set(selectedShows.map((s) => s.city)).size,
        venueCount: new Set(selectedShows.map((s) => s.venue)).size,
      },
      cityMarkers: buildCityMarkers(allShows, visitedCities),
      durationStats: buildDurationStats(selectedShows),
      mileage: buildMileage(selectedShows, origin),
      travelOrigin: origin ? { longitude: origin[0], latitude: origin[1] } : null,
      songStats: buildSongStats(selectedSetlistItems),
      tourSongs: buildTourSongs(setlistItems, showsById, selectedShowIdSet),
      randomSongStats: buildRandomSongStats(selectedSetlistItems, showsById),
      rareSongStats: buildRareSongStats(setlistItems, selectedShowIdSet, showsById),
      seasonalSongStats: buildSeasonalSongStats(selectedSetlistItems, selectedShows, showsById),
      guestStats: buildGuestStats(allShows, selectedShows),
    }
  })
