import { SummaryCardAlbumProgress } from './cards/SummaryCardAlbumProgress'
import { SummaryCardCity } from './cards/SummaryCardCity'
import { SummaryCardDuration } from './cards/SummaryCardDuration'
import { SummaryCardGuests } from './cards/SummaryCardGuests'
import { SummaryCardOverview } from './cards/SummaryCardOverview'
import { SummaryCardPlaylist } from './cards/SummaryCardPlaylist'
import { SummaryCardRareSongs } from './cards/SummaryCardRareSongs'
import { SummaryCardRecords } from './cards/SummaryCardRecords'
import { SummaryCardSeasonalPlaylist } from './cards/SummaryCardSeasonalPlaylist'
import { SummaryCardSongWall } from './cards/SummaryCardSongWall'
import type { SummaryCardProps } from './summary-card-props'

export interface SummaryCardEntry {
  Component: React.ComponentType<SummaryCardProps>
  /** One line telling the reader what this card is about, shown in the quick-jump sheet. */
  description: string
  /** Short label for the quick-jump sheet — not the card's own in-page headline. */
  title: string
}

/**
 * The ordered `/summary` deck. Both the swipe container and the quick-jump sheet read
 * from this single list, so a new card only has to be declared once.
 */
export const SUMMARY_CARDS: SummaryCardEntry[] = [
  {
    Component: SummaryCardOverview,
    description: '四年航道上的全部坐标，你亲自奔赴过哪几个',
    title: '巡演时间轴',
  },
  {
    Component: SummaryCardDuration,
    description: '穿过星轨，你与五月天一起走过多少分钟',
    title: '时光机隧道',
  },
  {
    Component: SummaryCardCity,
    description: '每一座到过的城市，盖成一枚护照印章',
    title: '你的巡演护照',
  },
  {
    Component: SummaryCardSongWall,
    description: '现场听过的每一首歌，砌成一面留声墙',
    title: '岁月留声机',
  },
  {
    Component: SummaryCardAlbumProgress,
    description: '从 1999 到 2016，九张专辑被你解锁了多少',
    title: '专辑解锁进度',
  },
  {
    Component: SummaryCardPlaylist,
    description: '点歌与安可，压成一张只属于你的黑胶',
    title: '你的专属歌单',
  },
  {
    Component: SummaryCardRareSongs,
    description: '全巡演最少被唱的歌，偏偏被你撞见',
    title: '最小众歌单',
  },
  {
    Component: SummaryCardSeasonalPlaylist,
    description: '春夏秋冬，各有一首留在耳边的歌',
    title: '四季歌单',
  },
  {
    Component: SummaryCardGuests,
    description: '与你同场的嘉宾，是宇宙里擦身而过的星球',
    title: '同场的嘉宾',
  },
  {
    Component: SummaryCardRecords,
    description: '整轮巡演的完整场次与歌单时间轴',
    title: '5525 巡回记录',
  },
]
