import type { CSSProperties } from 'react'

import { songList } from '@/data/song-list'
import { useSummaryDataContext } from '../summary-data-context'

/** Single accent hue for lit (heard) tiles — unused elsewhere in /summary, reads as an aged brass plaque. */
const WALL_COLOR = '#a78bfa'

type WallSongState = 'heard' | 'unheard' | 'unsung'

interface WallSong {
  isSurprise: boolean
  state: WallSongState
  title: string
}

const STATE_TILE_CLASS: Record<WallSongState, string> = {
  heard: 'summary-wall-tile-heard border-transparent text-white',
  unheard: 'border-transparent bg-zinc-800/70 text-zinc-300',
  unsung: 'border-dashed border-zinc-800 text-zinc-600',
}

function SongTile({ song }: { song: WallSong }) {
  return (
    <span
      className={`summary-wall-tile relative inline-block max-w-40 rounded-md border px-2.5 py-1.5 text-xs ${STATE_TILE_CLASS[song.state]}`}
      title={song.isSurprise ? `${song.title} · 非五月天曲目` : song.title}
    >
      <span className="block truncate">{song.title}</span>
      {song.isSurprise && <span aria-hidden className="summary-wall-tile-tag" />}
    </span>
  )
}

function LegendDot({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block size-2.5 rounded-full ${className}`} />
}

export function SummaryCardSongWall() {
  const { overview, tourSongs } = useSummaryDataContext()

  const tourSongByTitle = new Map(tourSongs.map((song) => [song.title, song]))

  const maydayWall: WallSong[] = songList.map((song) => {
    const tourSong = tourSongByTitle.get(song.title)
    const isInTour = Boolean(tourSong)
    const isHeard = tourSong ? tourSong.appearances.some((a) => a.isHeard) : false
    let state: WallSongState = 'unsung'
    if (isHeard) state = 'heard'
    else if (isInTour) state = 'unheard'
    return { title: song.title, isSurprise: false, state }
  })

  const surpriseWall: WallSong[] = tourSongs
    .filter((song) => song.type === 'surprise')
    .map((song) => ({
      title: song.title,
      isSurprise: true,
      state: song.appearances.some((a) => a.isHeard) ? 'heard' : 'unheard',
    }))

  const totalMayday = maydayWall.length
  const totalSurprise = surpriseWall.length
  const heardTotal = maydayWall.filter((s) => s.state === 'heard').length + surpriseWall.filter((s) => s.state === 'heard').length

  return (
    <div className="flex h-svh flex-col bg-zinc-950" style={{ '--wall-color': WALL_COLOR } as CSSProperties}>
      <div className="shrink-0 px-6 pt-6">
        <h3 className="font-bold text-white text-xl">曲库内外，这是完整的 5525 音乐墙。</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24" data-scroll-container>
        <p className="text-sm text-zinc-400 leading-relaxed">
          五月天曲库收录 <span className="font-geist text-zinc-100">{totalMayday}</span> 首作品，全巡演里还唱过{' '}
          <span className="font-geist text-zinc-100">{totalSurprise}</span> 首曲库外的歌——
          <span className="font-geist text-zinc-100">{totalMayday + totalSurprise}</span> 首里，你亲耳听过了{' '}
          <span className="font-geist text-zinc-100">{heardTotal}</span> 首。
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <LegendDot className="bg-[var(--wall-color)]" />
            你听过
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot className="bg-zinc-700" />
            演唱过，你没赶上
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot className="border border-zinc-700 border-dashed" />
            全巡演未演唱
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot className="bg-sky-400" />
            曲库外曲目
          </span>
        </div>

        <div className="mt-8 mb-3 flex items-baseline justify-between border-white/10 border-t pt-4 text-xs text-zinc-500">
          <p>五月天曲库</p>
          <p className="font-geist">{totalMayday}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {maydayWall.map((song) => (
            <SongTile key={song.title} song={song} />
          ))}
        </div>

        {surpriseWall.length > 0 && (
          <>
            <div className="mt-8 mb-3 flex items-baseline justify-between border-white/10 border-t pt-4 text-xs text-zinc-500">
              <p>曲库外的意外惊喜</p>
              <p className="font-geist">{totalSurprise}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {surpriseWall.map((song) => (
                <SongTile key={song.title} song={song} />
              ))}
            </div>
          </>
        )}

        <p className="mt-8 text-xs text-zinc-500">
          {overview.totalShows > 0
            ? '这面墙会一直留在这里，等你未来听过更多歌，再回来点亮它们。'
            : '选好你去过的场次，墙上的歌会开始为你一首一首点亮。'}
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">
          口径：曲库外曲目为全巡演歌单中未匹配到五月天曲库的曲目；「你听过」以选中场次为准，全巡演状态按全部已收录场次计。每首歌的场次列表、类型与专辑信息将在后续版本展开。
        </p>
      </div>
    </div>
  )
}
