import type { CSSProperties } from 'react'

import type { RareSongEntry } from '@/server/summary'
import { SummaryScrollFadeTop } from '../SummaryScrollFadeTop'
import { useSummaryDataContext } from '../summary-data-context'

/** Single accent hue for the washi tape, seal and spotlight — the brand orange shared with the vinyl card. */
const RARE_COLOR = '#f97316'

/**
 * The hero "drawn request slip": a warm paper note pinned with washi tape,
 * the song title in handwriting, the show it was heard at as the signature
 * line, and — when the song was sung exactly once in the whole tour — a
 * stamped orange seal certifying the one-off.
 */
function HeroNote({ entry }: { entry: RareSongEntry }) {
  return (
    <div className="summary-note summary-note-hero relative w-full max-w-xs px-6 pt-7 pb-6 text-left">
      <div aria-hidden className="summary-note-tape" />
      <p className="text-[10px] text-stone-500 uppercase tracking-widest">
        {entry.heardCity} {entry.heardDateSlash}
      </p>
      <p className="mt-3 font-title text-4xl text-stone-800">{entry.title}</p>
      {entry.tourCount === 1 && (
        <div aria-hidden className="summary-note-seal font-title">
          仅此
          <br />
          一次
        </div>
      )}
    </div>
  )
}

/**
 * One small slip in the collection grid: alternating tilt, handwritten title,
 * and a footer line with where the user heard it plus how rare it was across
 * the whole tour.
 */
function SmallNote({ entry, index }: { entry: RareSongEntry; index: number }) {
  return (
    <div
      className="summary-note relative px-4 pt-4 pb-3"
      style={{ '--i': index + 1, '--note-tilt': `${index % 2 === 0 ? -1.2 : 1.4}deg` } as CSSProperties}
    >
      <p className="truncate font-title text-stone-800 text-xl">{entry.title}</p>
      <p className="mt-2 text-[10px] text-stone-500">
        {entry.heardCity} · 全巡演 <span className="font-geist">×{entry.tourCount}</span>
      </p>
    </div>
  )
}

export function SummaryCardRareSongs() {
  const { allShows, overview, rareSongStats } = useSummaryDataContext()
  const [heroSong, ...smallSongs] = rareSongStats.entries

  if (!heroSong) {
    return (
      <div className="flex h-svh flex-col bg-zinc-950">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-24 text-center">
          <h3 className="font-title text-white text-xl">纸条箱里还是空的</h3>
          <p className="text-sm text-zinc-400">
            {overview.totalShows > 0
              ? '这些场次还没有留下点歌与安可的记录。'
              : '选好你去过的场次，第一张纸条才会被抽出来。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col bg-zinc-950" style={{ '--rare-color': RARE_COLOR } as CSSProperties}>
      <div className="shrink-0 px-6 pt-6 pb-3">
        <h3 className="font-title text-white text-xl leading-snug">全巡演最少被唱的歌，偏偏被你撞见。</h3>
      </div>

      <div className="relative flex-1 overflow-y-auto px-6 pt-1 pb-24" data-scroll-container>
        <SummaryScrollFadeTop />
        <div aria-hidden className="summary-note-spotlight" />

        <div className="relative flex flex-col items-center text-center">
          <p className="mb-6 text-xs text-zinc-500">你的专属曲目</p>
          <HeroNote entry={heroSong} />
          <p className="mt-6 max-w-xs text-sm text-zinc-400 leading-relaxed">
            {heroSong.tourCount === 1 ? (
              <>
                全巡演 <span className="font-geist text-zinc-100">{allShows.length}</span> 场，《{heroSong.title}
                》只响起过这一次——而你，就在台下。
              </>
            ) : (
              <>
                全巡演 <span className="font-geist text-zinc-100">{allShows.length}</span> 场，《{heroSong.title}
                》只响起过 <span className="font-geist text-zinc-100">{heroSong.tourCount}</span> 次——其中{' '}
                <span className="font-geist text-zinc-100">{heroSong.heardCount}</span> 次，你就在台下。
              </>
            )}
          </p>
        </div>

        {smallSongs.length > 0 && (
          <>
            <div className="relative mt-10 mb-4 flex items-baseline justify-between border-white/10 border-t pt-4 text-xs text-zinc-500">
              <p>同样被你收藏的冷门曲</p>
              <p className="font-geist">{smallSongs.length} 首</p>
            </div>
            <div className="relative grid grid-cols-2 gap-x-3 gap-y-4">
              {smallSongs.map((entry, index) => (
                <SmallNote entry={entry} index={index} key={entry.title} />
              ))}
            </div>
          </>
        )}

        <p className="relative mt-8 text-xs text-zinc-500">没被唱够的歌，才最像秘密。这几张纸条，只属于你的耳朵。</p>
        <p className="relative mt-1 text-[10px] text-zinc-600">
          口径：仅统计点歌与安可段落；全巡演次数按全部已收录场次计。
        </p>
      </div>
    </div>
  )
}
