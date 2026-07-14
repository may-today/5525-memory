export interface ConcertFormData {
  showIds: number[]
}

export interface Show {
  /** 巡演城市 */
  city: string
  /** 歌单贡献者 */
  contributor: string | null
  /** 演出日期（同 showDate） */
  date: string
  /** 演出日期（MM/DD 格式） */
  dateSlash: string
  /** 场次标签，如「DAY1」「安可场」 */
  dayLabel: string
  /** 嘉宾列表 */
  guests: string[]
  /** 场次ID */
  id: number
  /** 完整场次目录按日期排序后的零基序号；非正式活动场次会保留其编号位置。 */
  showIndex: number
  /** 歌单长图 URL */
  playlistImg: string
  /** 歌单曲目数量 */
  setlistCount: number
  /** 演出日期 */
  showDate: string
  /** 散场时间 */
  showEndTime: null | string
  /** 实际开场时间（HH:MM） */
  showStartTime: null | string
  /** 子主题，如「5525回到1999」 */
  subTheme: string
  /** 主题色 */
  themeColor: string
  /** 巡演名称 */
  tourName: string
  /** 场馆 */
  venue: string
  /** 版本名称 */
  versionName: string
}
