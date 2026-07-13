import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { songList } from '@/data/song-list'
import type { TourSong, TourSongAppearance } from '@/server/summary'
import { SummaryScrollFadeTop } from '../SummaryScrollFadeTop'
import { useSummaryDataContext } from '../summary-data-context'

/** Single accent hue for pulled-out (heard) records — this card's exclusive color, unused elsewhere in /summary. */
const WALL_COLOR = '#a78bfa'
/** Gold is reserved for the off-catalog surprise shelf below the Mayday shelf. */
const GOLD_COLOR = '#d9a441'

type ShelfSongState = 'heard' | 'unheard' | 'unsung'

interface ShelfSong {
  /** 曲库专辑名，用于封套底部的出版信息行；曲库外曲目无此信息。 */
  album?: string
  isSurprise: boolean
  state: ShelfSongState
  title: string
  /** 该曲目的全巡演出现记录；曲库内但全巡演未唱的曲目为 null。 */
  tourSong: TourSong | null
  /** 曲库收录年份。 */
  year?: number
}

interface ShelfSlot {
  /** Stagger index among heard records across both shelves; -1 when the record stays racked. */
  pullIndex: number
  song: ShelfSong
}

/** A record the user pulled off the shelf: its slot plus the spine's viewport rect for the FLIP flight. */
interface TakenRecord {
  originRect: DOMRect
  slot: ShelfSlot
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
    <div className="summary-vu-face" style={{ '--vu-angle': `${angleDeg}deg` } as CSSProperties}>
      <svg
        aria-label={`你与五月天的音乐共振频率 ${percent}%`}
        className="mx-auto block w-full max-w-80"
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
        <circle
          cx={VU_PIVOT_X}
          cy={VU_PIVOT_Y}
          fill="#14100c"
          r="6.5"
          stroke="rgba(232,207,160,0.35)"
          strokeWidth="1"
        />
      </svg>
      <p className="mt-2 text-center text-[#b99a6f] text-[11px] tracking-wide">你与五月天的音乐共振频率</p>
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

const STATE_SLEEVE_CLASS: Record<ShelfSongState, string> = {
  heard: 'summary-record-sleeve-heard',
  unheard: 'summary-record-sleeve-unheard',
  unsung: 'summary-record-sleeve-unsung',
}

const STATE_GOLD_SLEEVE_CLASS: Record<ShelfSongState, string> = {
  heard: 'summary-record-sleeve-gold-heard',
  unheard: 'summary-record-sleeve-gold-unheard',
  unsung: 'summary-record-sleeve-gold-unheard',
}

const SECTION_BADGE_LABEL: Record<TourSongAppearance['sectionType'], string | null> = {
  main: null,
  request: '点歌',
  encore: '安可',
}

/**
 * One vinyl sleeve seen spine-on: vertical-rl song title on a thin slat.
 * Heard records light up and pull out of the rack; the inner span owns the
 * writing mode so the flex wrapper can center the title across the spine.
 * Clicking hands the slot and the spine's viewport rect to the detail overlay;
 * a taken spine stays hidden in place so the rack keeps an empty slot.
 */
function RecordSpine({
  isTaken,
  onSelect,
  slot,
}: {
  isTaken: boolean
  onSelect: (slot: ShelfSlot, originRect: DOMRect) => void
  slot: ShelfSlot
}) {
  const { song, pullIndex } = slot
  const stateClass = song.isSurprise ? STATE_GOLD_SPINE_CLASS[song.state] : STATE_SPINE_CLASS[song.state]
  const style: CSSProperties = {
    ...(pullIndex >= 0 ? ({ '--i': pullIndex } as CSSProperties) : undefined),
    ...(isTaken ? { visibility: 'hidden' } : undefined),
  }

  return (
    <button
      className={`summary-shelf-spine cursor-pointer ${stateClass} ${song.isSurprise ? 'w-[17px] shrink-0' : ''}`}
      onClick={(event) => onSelect(slot, event.currentTarget.getBoundingClientRect())}
      style={style}
      title={song.isSurprise ? `${song.title} · 非五月天曲目` : song.title}
      type="button"
    >
      <span className="summary-shelf-spine-title">{song.title}</span>
    </button>
  )
}

function formatShowDate(showDate: string): string {
  return showDate.replaceAll('-', '.')
}

/**
 * The encounter story: one data-built sentence about when (or whether)
 * the user and this song met live during the tour.
 */
function EncounterStory({ song }: { song: ShelfSong }) {
  const appearances = song.tourSong?.appearances ?? []

  if (appearances.length === 0) {
    return <p className="text-sm text-zinc-400 leading-relaxed">这一轮巡演，它一直安静地躺在架上，没有被唱起。</p>
  }

  const heardAppearances = appearances.filter((appearance) => appearance.isHeard)
  if (heardAppearances.length === 0) {
    return (
      <p className="text-sm text-zinc-400 leading-relaxed">
        全巡演它响起过 <span className="font-geist text-zinc-100">{appearances.length}</span>{' '}
        次，只是你们还没有在现场遇上。
      </p>
    )
  }

  const first = heardAppearances[0]
  return (
    <p className="text-sm text-zinc-300 leading-relaxed">
      <span className="font-geist text-zinc-100">{formatShowDate(first.show.showDate)}</span> 的{first.show.city}
      ，你们第一次在现场相遇。
      {heardAppearances.length > 1 ? (
        <>
          之后你们又重逢了 <span className="font-geist text-zinc-100">{heardAppearances.length - 1}</span> 次。
        </>
      ) : (
        '那一晚的版本，只属于在场的你们。'
      )}
    </p>
  )
}

/** Maps the sleeve element's resting rect back onto the spine's rect for the FLIP flight. */
function toFlipTransform(originRect: DOMRect, targetRect: DOMRect): string {
  const dx = originRect.left + originRect.width / 2 - (targetRect.left + targetRect.width / 2)
  const dy = originRect.top + originRect.height / 2 - (targetRect.top + targetRect.height / 2)
  const sx = originRect.width / targetRect.width
  const sy = originRect.height / targetRect.height
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
}

function hasReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Runs `callback` exactly once when the animation finishes. Hidden documents
 * never dispatch WAAPI finish events (Chrome ties them to rendering), so a
 * timeout slightly past the duration guarantees the state transition anyway.
 * Returns a cleanup that clears the fallback timer.
 */
function settleAnimation(animation: Animation, timeoutMs: number, callback: () => void): () => void {
  let hasSettled = false
  const settle = () => {
    if (hasSettled) return
    hasSettled = true
    callback()
  }
  animation.onfinish = settle
  const timer = window.setTimeout(settle, timeoutMs)
  return () => window.clearTimeout(timer)
}

/**
 * Full-screen detail for a pulled record: the sleeve FLIPs from the spine's
 * rack position to center screen (WAAPI, transform-only), the vinyl disc
 * peeks out once settled, and the panel below lists every tour appearance
 * with the user's attended shows highlighted. Closing flies the sleeve back.
 */
function RecordDetailOverlay({
  onClose,
  originRect,
  slot,
}: {
  onClose: () => void
  originRect: DOMRect
  slot: ShelfSlot
}) {
  const { song } = slot
  const sleeveRef = useRef<HTMLDivElement>(null)
  const [isSettled, setIsSettled] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closingRef = useRef(false)

  const appearances = song.tourSong?.appearances ?? []
  const heardCount = appearances.filter((appearance) => appearance.isHeard).length

  useLayoutEffect(() => {
    const sleeve = sleeveRef.current
    if (!sleeve || hasReducedMotion()) {
      setIsSettled(true)
      return
    }
    const animation = sleeve.animate(
      [
        { borderRadius: '2px', transform: toFlipTransform(originRect, sleeve.getBoundingClientRect()) },
        { borderRadius: '6px', transform: 'none' },
      ],
      { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    )
    const clearSettle = settleAnimation(animation, 650, () => setIsSettled(true))
    return () => {
      clearSettle()
      animation.cancel()
    }
  }, [originRect])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setIsClosing(true)
    setIsSettled(false)

    const sleeve = sleeveRef.current
    if (!sleeve || hasReducedMotion()) {
      window.setTimeout(onClose, 200)
      return
    }
    // Cancel a still-running opening flight so the rect below is the resting one.
    for (const running of sleeve.getAnimations()) running.cancel()
    const animation = sleeve.animate(
      [
        { borderRadius: '6px', transform: 'none' },
        { borderRadius: '2px', transform: toFlipTransform(originRect, sleeve.getBoundingClientRect()) },
      ],
      { duration: 420, easing: 'cubic-bezier(0.5, 0, 0.65, 0.25)', fill: 'forwards' }
    )
    settleAnimation(animation, 540, onClose)
  }, [onClose, originRect])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [requestClose])

  const sleeveClass = song.isSurprise ? STATE_GOLD_SLEEVE_CLASS[song.state] : STATE_SLEEVE_CLASS[song.state]
  const sleeveMeta = song.isSurprise
    ? '曲库之外 · 意外惊喜'
    : `${song.album ? `《${song.album}》` : '五月天'}${song.year ? ` · ${song.year}` : ''}`

  // Deduplicate row keys: a song can in principle repeat within one show's same section.
  const seenRowKeys = new Map<string, number>()
  const appearanceRows = appearances.map((appearance) => {
    const base = `${appearance.show.id}:${appearance.sectionType}`
    const occurrence = (seenRowKeys.get(base) ?? 0) + 1
    seenRowKeys.set(base, occurrence)
    return { appearance, key: occurrence > 1 ? `${base}:${occurrence}` : base }
  })

  return (
    <div
      aria-label={`${song.title} 唱片详情`}
      aria-modal="true"
      className={`summary-record-overlay ${isClosing ? 'summary-record-overlay-closing' : ''}`}
      data-summary-gesture-exempt
      role="dialog"
      style={{ '--record-color': song.isSurprise ? GOLD_COLOR : WALL_COLOR } as CSSProperties}
    >
      <button aria-label="把唱片放回架上" className="summary-record-backdrop" onClick={requestClose} type="button" />
      <div className="pointer-events-none relative flex h-full flex-col px-6 pt-10 pb-8">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className={`summary-record-stage ${isSettled ? 'summary-record-stage-settled' : ''}`}>
            <div aria-hidden className="summary-record-disc" />
            <div className={`summary-record-sleeve ${sleeveClass}`} ref={sleeveRef}>
              <div className="summary-record-sleeve-content flex h-full flex-col p-4">
                <p className="text-[9px] tracking-[0.22em] opacity-70">MAYDAY #5525</p>
                <p className="mt-auto font-title text-2xl leading-snug">{song.title}</p>
                <p className="mt-2 text-[10px] tracking-wide opacity-75">{sleeveMeta}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-record-info pointer-events-auto mx-auto w-full max-w-sm">
          <EncounterStory song={song} />

          {appearances.length > 0 && (
            <>
              <div className="mt-5 mb-2 flex items-baseline justify-between text-[11px] text-zinc-500">
                <p>唱过的场次</p>
                <p className="font-geist">
                  {heardCount} / {appearances.length}
                </p>
              </div>
              <ul className="max-h-[30svh] overflow-y-auto overscroll-contain rounded-lg border border-white/8">
                {appearanceRows.map(({ appearance, key }) => {
                  const badge = SECTION_BADGE_LABEL[appearance.sectionType]
                  return (
                    <li
                      className={`summary-record-show-row flex items-center gap-3 px-3 py-2 ${
                        appearance.isHeard ? 'summary-record-show-row-heard' : 'text-zinc-500'
                      }`}
                      key={key}
                    >
                      <span className="font-geist text-[11px] tabular-nums">
                        {formatShowDate(appearance.show.showDate)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs">
                        {appearance.show.city} {appearance.show.dayLabel}
                      </span>
                      {badge && <span className="summary-record-section-badge">{badge}</span>}
                      {appearance.isHeard && <span className="summary-record-here-badge">你在场</span>}
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          <button
            className="mt-5 w-full cursor-pointer rounded-lg border border-white/10 py-2.5 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
            onClick={requestClose}
            type="button"
          >
            把唱片放回架上
          </button>
        </div>
      </div>
    </div>
  )
}

export function SummaryCardSongWall() {
  const { tourSongs } = useSummaryDataContext()
  const [takenRecord, setTakenRecord] = useState<TakenRecord | null>(null)

  const tourSongByTitle = new Map(tourSongs.map((song) => [song.title, song]))

  const sungShelf: ShelfSong[] = []
  const unsungShelf: ShelfSong[] = []
  for (const song of songList) {
    const tourSong = tourSongByTitle.get(song.title)
    const catalogMeta = { album: song.meta.album, year: song.meta.year }
    if (!tourSong) {
      unsungShelf.push({ ...catalogMeta, title: song.title, isSurprise: false, state: 'unsung', tourSong: null })
      continue
    }
    const isHeard = tourSong.appearances.some((a) => a.isHeard)
    sungShelf.push({
      ...catalogMeta,
      title: song.title,
      isSurprise: false,
      state: isHeard ? 'heard' : 'unheard',
      tourSong,
    })
  }
  // Records never sung on this tour sink to the end of the Mayday shelf.
  const maydayShelf = [...sungShelf, ...unsungShelf]

  const surpriseShelf: ShelfSong[] = tourSongs
    .filter((song) => song.type === 'surprise')
    .map((song) => ({
      title: song.title,
      isSurprise: true,
      state: song.appearances.some((a) => a.isHeard) ? 'heard' : 'unheard',
      tourSong: song,
    }))

  // One pull-out wave travels across the Mayday shelf, then down into the gold shelf.
  let pullCount = 0
  const toSlots = (songs: ShelfSong[]): ShelfSlot[] =>
    songs.map((song) => ({ song, pullIndex: song.state === 'heard' ? pullCount++ : -1 }))
  const maydaySlots = toSlots(maydayShelf)
  const surpriseSlots = toSlots(surpriseShelf)

  const totalMayday = maydayShelf.length
  const totalSurprise = surpriseShelf.length
  const sungMaydayCount = sungShelf.length
  const heardMaydayCount = sungShelf.filter((song) => song.state === 'heard').length
  const resonancePercent = sungMaydayCount > 0 ? Math.round((heardMaydayCount / sungMaydayCount) * 100) : 0

  const handleSelect = (slot: ShelfSlot, originRect: DOMRect) => setTakenRecord({ slot, originRect })

  /** The taken record's spine stays hidden in place, leaving an empty slot in the rack. */
  const isSlotTaken = (slot: ShelfSlot): boolean =>
    takenRecord !== null &&
    takenRecord.slot.song.title === slot.song.title &&
    takenRecord.slot.song.isSurprise === slot.song.isSurprise

  return (
    <div
      className="flex h-svh flex-col bg-zinc-950"
      style={{ '--wall-color': WALL_COLOR, '--wall-gold': GOLD_COLOR } as CSSProperties}
    >
      <div className="shrink-0 px-6 pt-6 pb-3">
        <h3 className="font-title text-white text-xl leading-snug">曲库内外，这是你的 5525 岁月留声机。</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-1 pb-24" data-scroll-container>
        <SummaryScrollFadeTop />
        <p className="text-sm text-zinc-400 leading-relaxed">
          五月天曲库收录 <span className="font-geist text-zinc-100">{totalMayday}</span> 首作品，全巡演里还唱过{' '}
          <span className="font-geist text-zinc-100">{totalSurprise}</span> 首曲库外的歌—— 五月天曲库里实际唱过的{' '}
          <span className="font-geist text-zinc-100">{sungMaydayCount}</span> 首里，你亲耳听过的{' '}
          <span className="font-geist text-zinc-100">{heardMaydayCount}</span> 首，已经替你从架上抽了出来。
        </p>

        <ResonanceMeter percent={resonancePercent} />

        <div className="mt-8 mb-3 flex items-baseline justify-between text-xs text-zinc-500">
          <p>五月天曲库</p>
          <p className="font-geist">{totalMayday}</p>
        </div>
        <div className="summary-shelf-frame">
          <div className="summary-shelf-inner">
            <div className="summary-shelf-bed summary-shelf-grid">
              {maydaySlots.map((slot) => (
                <RecordSpine isTaken={isSlotTaken(slot)} key={slot.song.title} onSelect={handleSelect} slot={slot} />
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
                    <RecordSpine
                      isTaken={isSlotTaken(slot)}
                      key={slot.song.title}
                      onSelect={handleSelect}
                      slot={slot}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <p className="mt-6 text-[10px] text-zinc-600">点一下唱片，看看你们的相遇故事。</p>
      </div>

      {takenRecord && (
        <RecordDetailOverlay
          onClose={() => setTakenRecord(null)}
          originRect={takenRecord.originRect}
          slot={takenRecord.slot}
        />
      )}
    </div>
  )
}
