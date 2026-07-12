import type { CSSProperties } from 'react'

import { songList } from '@/data/song-list'
import { useSummaryDataContext } from '../summary-data-context'

/** Single accent hue for pulled-out (heard) records — this card's exclusive color, unused elsewhere in /summary. */
const WALL_COLOR = '#a78bfa'
/** Gold is reserved for the off-catalog surprise shelf below the Mayday shelf. */
const GOLD_COLOR = '#d9a441'

type ShelfSongState = 'heard' | 'unheard' | 'unsung'

interface ShelfSong {
  isSurprise: boolean
  state: ShelfSongState
  title: string
}

interface ShelfSlot {
  /** Stagger index among heard records across both shelves; -1 when the record stays racked. */
  pullIndex: number
  song: ShelfSong
}

/** Needle pivot and half-sweep of the resonance VU dial, in SVG user units / degrees. */
const VU_PIVOT_X = 110
const VU_PIVOT_Y = 112
const VU_SWEEP_DEG = 50

const VU_TICKS = Array.from({ length: 11 }, (_, i) => i * 10)

/** Point on the dial at `percent` of the sweep (0 = left end, 100 = right end), `radius` from the pivot. */
function vuPoint(percent: number, radius: number): { x: number; y: number } {
  const angle = (((percent / 100) * 2 - 1) * VU_SWEEP_DEG * Math.PI) / 180
  return { x: VU_PIVOT_X + radius * Math.sin(angle), y: VU_PIVOT_Y - radius * Math.cos(angle) }
}

function vuArcPath(fromPercent: number, toPercent: number, radius: number): string {
  const from = vuPoint(fromPercent, radius)
  const to = vuPoint(toPercent, radius)
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} A ${radius} ${radius} 0 0 1 ${to.x.toFixed(1)} ${to.y.toFixed(1)}`
}

/**
 * Amp faceplate with a tube-backlit VU dial: the needle swings from rest,
 * overshoots and settles at the share of the full wall the user has heard;
 * the percent readout fades in while the needle steadies.
 */
function ResonanceMeter({ percent }: { percent: number }) {
  const angleDeg = (percent / 100) * VU_SWEEP_DEG * 2 - VU_SWEEP_DEG
  const needleTip = vuPoint(50, 86)

  return (
    <div className="summary-shelf-frame mt-6">
      <div className="summary-vu-face" style={{ '--vu-angle': `${angleDeg}deg` } as CSSProperties}>
        <svg
          aria-label={`你与五月天的音乐共振频率 ${percent}%`}
          className="mx-auto block w-full max-w-[280px]"
          role="img"
          viewBox="0 0 220 122"
        >
          <defs>
            <radialGradient cx="50%" cy="106%" id="vu-backlight" r="108%">
              <stop offset="0%" stopColor="#78430f" />
              <stop offset="45%" stopColor="#432508" />
              <stop offset="100%" stopColor="#1d1106" />
            </radialGradient>
          </defs>
          <rect fill="url(#vu-backlight)" height="114" rx="7" stroke="rgba(255,214,156,0.14)" width="216" x="2" y="4" />
          <ellipse cx={VU_PIVOT_X} cy={VU_PIVOT_Y + 4} fill="#ff9d3f" opacity="0.18" rx="76" ry="30" />
          <path d={vuArcPath(0, 80, 92)} fill="none" stroke="#e8cfa0" strokeOpacity="0.75" strokeWidth="1.5" />
          <path d={vuArcPath(80, 100, 92)} fill="none" stroke="#e0603f" strokeWidth="2.5" />
          {VU_TICKS.map((tick) => {
            const isMajor = tick % 50 === 0
            const outer = vuPoint(tick, 92)
            const inner = vuPoint(tick, isMajor ? 82 : 87)
            return (
              <line
                key={tick}
                stroke={tick >= 80 ? '#e0603f' : '#e8cfa0'}
                strokeOpacity={isMajor ? 0.9 : 0.5}
                strokeWidth={isMajor ? 1.5 : 1}
                x1={outer.x}
                x2={inner.x}
                y1={outer.y}
                y2={inner.y}
              />
            )
          })}
          {[0, 50, 100].map((tick) => {
            const pos = vuPoint(tick, 70)
            return (
              <text
                className="font-geist"
                fill="#e8cfa0"
                fillOpacity="0.8"
                fontSize="9"
                key={tick}
                textAnchor="middle"
                x={pos.x}
                y={pos.y + 3}
              >
                {tick}
              </text>
            )
          })}
          <text
            className="summary-vu-readout font-geist"
            fill="#ffd9a0"
            fontSize="21"
            fontWeight="600"
            textAnchor="middle"
            x={VU_PIVOT_X}
            y="92"
          >
            {percent}%
          </text>
          <line
            className="summary-vu-needle"
            stroke="#f6e7c8"
            strokeLinecap="round"
            strokeWidth="2"
            x1={VU_PIVOT_X}
            x2={needleTip.x}
            y1={VU_PIVOT_Y}
            y2={needleTip.y}
          />
          <circle cx={VU_PIVOT_X} cy={VU_PIVOT_Y} fill="#14100c" r="6.5" stroke="rgba(232,207,160,0.35)" strokeWidth="1" />
        </svg>
        <p className="mt-2 text-center text-[#b99a6f] text-[11px] tracking-wide">你与五月天的音乐共振频率</p>
      </div>
    </div>
  )
}

const STATE_SPINE_CLASS: Record<ShelfSongState, string> = {
  heard: 'summary-shelf-spine-heard summary-shelf-spine-pulled',
  unheard: 'summary-shelf-spine-unheard',
  unsung: 'summary-shelf-spine-unsung',
}

const STATE_GOLD_SPINE_CLASS: Record<ShelfSongState, string> = {
  heard: 'summary-shelf-spine-gold-heard summary-shelf-spine-pulled',
  unheard: 'summary-shelf-spine-gold-unheard',
  unsung: 'summary-shelf-spine-gold-unheard',
}

/**
 * One vinyl sleeve seen spine-on: vertical-rl song title on a thin slat.
 * Heard records light up and pull out of the rack; the inner span owns the
 * writing mode so the flex wrapper can center the title across the spine.
 */
function RecordSpine({ slot }: { slot: ShelfSlot }) {
  const { song, pullIndex } = slot
  const stateClass = song.isSurprise ? STATE_GOLD_SPINE_CLASS[song.state] : STATE_SPINE_CLASS[song.state]

  return (
    <span
      className={`summary-shelf-spine ${stateClass} ${song.isSurprise ? 'w-[17px] shrink-0' : ''}`}
      style={pullIndex >= 0 ? ({ '--i': pullIndex } as CSSProperties) : undefined}
      title={song.isSurprise ? `${song.title} · 非五月天曲目` : song.title}
    >
      <span className="summary-shelf-spine-title">{song.title}</span>
    </span>
  )
}

function LegendSpine({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block h-4 w-[3px] rounded-[1px] ${className}`} />
}

export function SummaryCardSongWall() {
  const { overview, tourSongs } = useSummaryDataContext()

  const tourSongByTitle = new Map(tourSongs.map((song) => [song.title, song]))

  const sungShelf: ShelfSong[] = []
  const unsungShelf: ShelfSong[] = []
  for (const song of songList) {
    const tourSong = tourSongByTitle.get(song.title)
    if (!tourSong) {
      unsungShelf.push({ title: song.title, isSurprise: false, state: 'unsung' })
      continue
    }
    const isHeard = tourSong.appearances.some((a) => a.isHeard)
    sungShelf.push({ title: song.title, isSurprise: false, state: isHeard ? 'heard' : 'unheard' })
  }
  // Records never sung on this tour sink to the end of the Mayday shelf.
  const maydayShelf = [...sungShelf, ...unsungShelf]

  const surpriseShelf: ShelfSong[] = tourSongs
    .filter((song) => song.type === 'surprise')
    .map((song) => ({
      title: song.title,
      isSurprise: true,
      state: song.appearances.some((a) => a.isHeard) ? 'heard' : 'unheard',
    }))

  // One pull-out wave travels across the Mayday shelf, then down into the gold shelf.
  let pullCount = 0
  const toSlots = (songs: ShelfSong[]): ShelfSlot[] =>
    songs.map((song) => ({ song, pullIndex: song.state === 'heard' ? pullCount++ : -1 }))
  const maydaySlots = toSlots(maydayShelf)
  const surpriseSlots = toSlots(surpriseShelf)

  const totalMayday = maydayShelf.length
  const totalSurprise = surpriseShelf.length
  const heardTotal = pullCount
  const totalRecords = totalMayday + totalSurprise
  const resonancePercent = totalRecords > 0 ? Math.round((heardTotal / totalRecords) * 100) : 0

  return (
    <div
      className="flex h-svh flex-col bg-zinc-950"
      style={{ '--wall-color': WALL_COLOR, '--wall-gold': GOLD_COLOR } as CSSProperties}
    >
      <div className="shrink-0 px-6 pt-6">
        <h3 className="font-bold text-white text-xl">曲库内外，这是你的 5525 岁月留声机。</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24" data-scroll-container>
        <p className="text-sm text-zinc-400 leading-relaxed">
          五月天曲库收录 <span className="font-geist text-zinc-100">{totalMayday}</span> 首作品，全巡演里还唱过{' '}
          <span className="font-geist text-zinc-100">{totalSurprise}</span> 首曲库外的歌——
          <span className="font-geist text-zinc-100">{totalMayday + totalSurprise}</span> 张唱片里，你亲耳听过的{' '}
          <span className="font-geist text-zinc-100">{heardTotal}</span> 张，已经替你从架上抽了出来。
        </p>

        <ResonanceMeter percent={resonancePercent} />

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <LegendSpine className="bg-[var(--wall-color)] shadow-[0_0_6px_rgba(167,139,250,0.7)]" />
            你听过，已抽出
          </span>
          <span className="flex items-center gap-1.5">
            <LegendSpine className="bg-[#2b2420] ring-1 ring-white/15" />
            演唱过，你没赶上
          </span>
          <span className="flex items-center gap-1.5">
            <LegendSpine className="bg-[#1c1c1e] ring-1 ring-white/5" />
            全巡演未演唱
          </span>
          <span className="flex items-center gap-1.5">
            <LegendSpine className="bg-[var(--wall-gold)]" />
            曲库外曲目
          </span>
        </div>

        <div className="mt-8 mb-3 flex items-baseline justify-between text-xs text-zinc-500">
          <p>五月天曲库</p>
          <p className="font-geist">{totalMayday}</p>
        </div>
        <div className="summary-shelf-frame">
          <div className="summary-shelf-inner">
            <div className="summary-shelf-bed summary-shelf-grid">
              {maydaySlots.map((slot) => (
                <RecordSpine key={slot.song.title} slot={slot} />
              ))}
            </div>
          </div>
        </div>

        {surpriseShelf.length > 0 && (
          <>
            <div className="mt-8 mb-3 flex items-baseline justify-between text-xs text-zinc-500">
              <p>曲库外的意外惊喜</p>
              <p className="font-geist">{totalSurprise}</p>
            </div>
            <div className="summary-shelf-frame">
              <div className="summary-shelf-inner summary-space-scroller overflow-x-auto overflow-y-hidden">
                <div className="summary-shelf-bed summary-shelf-rowtrack">
                  {surpriseSlots.map((slot) => (
                    <RecordSpine key={slot.song.title} slot={slot} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <p className="mt-8 text-xs text-zinc-500">
          {overview.totalShows > 0
            ? '这个架子会一直留在这里，等你未来听过更多歌，再回来抽出它们。'
            : '选好你去过的场次，属于你的唱片会开始一张一张从架上抽出来。'}
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">
          口径：曲库外曲目为全巡演歌单中未匹配到五月天曲库的曲目；「你听过」以选中场次为准，全巡演状态按全部已收录场次计。每张唱片的场次列表、类型与专辑信息将在后续版本展开。
        </p>
      </div>
    </div>
  )
}
