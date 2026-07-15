import type { CSSProperties } from 'react'

import type { RandomSongEntry } from '@/server/summary'
import { SummaryScrollFadeTop } from '../SummaryScrollFadeTop'
import { useSummaryDataContext } from '../summary-data-context'

/** Single accent hue for the vinyl label and hero glow — the brand orange shared with the Overview card. */
const PLAYLIST_COLOR = '#f97316'

/**
 * The spinning "time-pressed vinyl" signature element. The groove texture is
 * rotationally symmetric, so the etched credit ring is what makes the rotation
 * visible; the sheen layer stays still to read as a fixed light source.
 */
function VinylDisc() {
  return (
    <div aria-hidden className="summary-vinyl h-52 w-52">
      <div className="summary-vinyl-disc">
        <svg aria-hidden className="absolute inset-0 h-full w-full" role="presentation" viewBox="0 0 100 100">
          <defs>
            <path d="M 50 27 a 23 23 0 1 1 0 46 a 23 23 0 1 1 0 -46" id="summary-vinyl-etch-path" />
          </defs>
          <text className="summary-vinyl-etch" fontSize="4.2">
            <textPath href="#summary-vinyl-etch-path">
              MAYDAY #5525 · SIDE A · MEMORY PRESS · ONE-OFF SETLIST ·
            </textPath>
          </text>
        </svg>
        <div className="summary-vinyl-label">
          <div className="summary-vinyl-hole" />
          <p className="absolute inset-x-0 top-[63%] text-center font-geist text-[8px] text-orange-950">5525</p>
        </div>
      </div>
      <div className="summary-vinyl-sheen" />
    </div>
  )
}

/**
 * One sleeve-back track line: side-A track number, title, a dotted leader and
 * the play count. Counts wear ink (zinc), the brand orange stays on the vinyl
 * label and hero glow only.
 */
function TrackRow({ entry, index }: { entry: RandomSongEntry; index: number }) {
  const isTop = index === 0

  return (
    <div className="summary-playlist-row flex items-baseline gap-3" style={{ '--i': index } as CSSProperties}>
      <p className="w-7 shrink-0 font-geist text-xs text-zinc-600">A{index + 1}</p>
      <p className={`min-w-0 shrink truncate text-sm ${isTop ? 'font-bold text-white' : 'text-zinc-300'}`}>
        {entry.title}
      </p>
      <div className="min-w-4 flex-1 border-zinc-700/60 border-b border-dotted" />
      <p className="shrink-0 font-geist text-sm text-zinc-100">
        <span className="text-zinc-500">×</span>
        {entry.count}
      </p>
    </div>
  )
}

export function SummaryCardPlaylist() {
  const { overview, randomSongStats } = useSummaryDataContext()
  const { entries, totalPlays, uniqueCount } = randomSongStats
  const topSong = entries[0]

  if (!topSong) {
    return (
      <div className="flex h-svh flex-col bg-zinc-950">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-24 text-center">
          <h3 className="font-title text-white text-xl">你的黑胶还是一张空白母盘</h3>
          <p className="text-sm text-zinc-400">
            {overview.totalShows > 0
              ? '这些场次还没有留下点歌与安可的记录。'
              : '选好你去过的场次，点歌与安可会替你刻下第一道纹。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col bg-zinc-950" style={{ '--playlist-color': PLAYLIST_COLOR } as CSSProperties}>
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h3 className="font-title text-white text-xl leading-snug">点歌与安可，替你压成一张时光黑胶。</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24" data-scroll-container>
        <SummaryScrollFadeTop />
        <div className="mb-10 flex flex-col items-center text-center">
          <VinylDisc />
          <p className="mt-8 text-xs text-zinc-500">你的常驻曲</p>
          <p className="summary-playlist-hero mt-2 font-title text-4xl">{topSong.title}</p>
          <p className="mt-3 max-w-xs text-sm text-zinc-400 leading-relaxed">
            你去过的 <span className="font-geist text-zinc-100">{overview.totalShows}</span> 场里，点歌与安可一共响起{' '}
            <span className="font-geist text-zinc-100">{totalPlays}</span> 次、
            <span className="font-geist text-zinc-100">{uniqueCount}</span> 首不重样——而它出现了{' '}
            <span className="font-geist text-zinc-100">{topSong.count}</span> 次，是这张唱片上刻得最深的一道纹。
          </p>
        </div>

        <div className="mb-4 flex items-baseline justify-between border-white/10 border-t pt-4 text-xs text-zinc-500">
          <p>SIDE A · 出现次数</p>
          <p className="font-geist">TOP {entries.length}</p>
        </div>
        <div className="flex flex-col gap-3.5">
          {entries.map((entry, index) => (
            <TrackRow entry={entry} index={index} key={entry.title} />
          ))}
        </div>

        <p className="mt-8 text-xs text-zinc-500">随机曲目从不彩排重逢，这份歌单只可能属于你。</p>
        <p className="mt-1 text-[10px] text-zinc-600">口径：统计点歌与安可段落，主题固定曲不计入。</p>
      </div>
    </div>
  )
}
