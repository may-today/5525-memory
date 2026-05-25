export interface ConcertFormData {
  showIds: number[]
}

export interface Show {
  /** 场次ID */
  id: number
  /** 巡演名称 */
  tourName: string
  /** 巡演城市 */
  city: string
  /** 场馆 */
  venue: string
  /** 演出日期 */
  showDate: string
  /** 场次标签，如「DAY1」「安可场」 */
  dayLabel: string
  /** 海报 URL */
  posterUrl: string
  /** 歌单长图 URL */
  playlistImg: string
  /** 演出阵容 */
  lineup: string[]
  /** 嘉宾列表 */
  guests: string[]
  /** 全场舞台特效（冷焰火/烟花/无人机/安可大球等） */
  globalEffects: GlobalEffect[]
  /** 子主题，如「5525回到1999」 */
  subTheme: string
  /** 版本名称 */
  versionName: string
  /** 歌单贡献者 */
  contributor: string | null
  /** 实际开场时间（HH:MM） */
  showStartTime: string
  /** 散场时间 */
  showEndTime: null | string
  /** 主题色 */
  themeColor: string
  /** 是否打碟/灯光场 */
  isLighted: number
  /** 是否官宣 */
  isAnnounced: number
  /** C端歌单是否展示 */
  setlistVisible: number
  /** 是否隐藏 */
  isHidden: number
  /** 巡演类型ID */
  tourTypeId: number
  /** 歌单曲目数量 */
  setlistCount: number
  /** 演出日期（同 showDate） */
  date: string
  /** 演出日期（MM/DD 格式） */
  dateSlash: string
}

type GlobalEffect = {
  kind: 'stage_note'
  text: string
} | {
  kind: 'encore_ball'
  label: string
  colors: string[]
  presetId: number
  presetName: string
}