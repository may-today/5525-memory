import { useEffect, useMemo, useRef, useState } from 'react'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { DurationShowEntry } from '@/server/summary'
import type { SummaryCardProps } from '../summary-card-props'
import { useSummaryDataContext } from '../summary-data-context'
import type { DurationTunnelInstance } from './duration-tunnel'
import { createDurationTunnel } from './duration-tunnel'

/**
 * Scroll runway height that pins the tunnel hero while the particle story
 * plays out (~1.8 viewports of scrubbing). Collapses under reduced motion.
 */
const RUNWAY_HEIGHT = '280svh'

/** Longest-show rows rendered inline on the card; the rest live in the sheet. */
const MAX_TOP_ENTRIES = 10

/** Shared clock axis for a batch of timeline rows, in minutes since midnight. */
interface TimelineAxis {
  /** Axis end, ceiled to the hour after the latest散场 (may exceed 1440 past midnight). */
  max: number
  /** Axis start, floored to the hour of the earliest开场. */
  min: number
}

/** Formats minutes-since-midnight as a wall clock, folding past-midnight back into 00–23. */
function formatClock(minutes: number) {
  const hours = String(Math.floor(minutes / 60) % 24).padStart(2, '0')
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`
}

/** Builds the shared hour axis covering every entry's start→end range. */
function buildTimelineAxis(entries: DurationShowEntry[]): TimelineAxis {
  let earliest = Number.POSITIVE_INFINITY
  let latest = 0
  for (const entry of entries) {
    earliest = Math.min(earliest, entry.startMinutes)
    latest = Math.max(latest, entry.startMinutes + entry.durationMinutes)
  }

  const min = Math.floor(earliest / 60) * 60
  const max = Math.max(Math.ceil(latest / 60) * 60, min + 60)
  return { max, min }
}

/** Bars narrower than this (percent of the track) skip the in-bar clock labels. */
const MIN_LABEL_BAR_PERCENT = 30

/** 6-digit hex color, with or without the leading #. */
const HEX_COLOR_PATTERN = /^#?([0-9a-f]{6})$/i

/** Picks a readable ink (near-black or white) for text sitting on the theme color. */
function getBarInkColor(themeColor: string): string {
  const match = HEX_COLOR_PATTERN.exec(themeColor.trim())
  if (!match) return 'rgba(255,255,255,0.92)'
  const hex = match[1]
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const luminance = 0.299 * red + 0.587 * green + 0.114 * blue
  return luminance > 150 ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.92)'
}

/**
 * One timeline row: date + city label, a range bar from开场 to散场 on the
 * shared clock axis, and the minute total on the right.
 */
function DurationTimelineRow({ axis, entry }: { axis: TimelineAxis; entry: DurationShowEntry }) {
  const range = axis.max - axis.min
  const left = ((entry.startMinutes - axis.min) / range) * 100
  const width = (entry.durationMinutes / range) * 100
  const inkColor = getBarInkColor(entry.themeColor)

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0">
        <p className="font-mono text-[10px] text-zinc-600">
          {entry.showDate.slice(0, 4)} {entry.dateSlash}
        </p>
        <p className="truncate text-xs text-zinc-300">
          {entry.city} · {entry.dayLabel}
        </p>
      </div>
      <div className="relative h-3.5 flex-1 rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 flex items-center justify-between overflow-hidden rounded-full px-1.5"
          style={{ backgroundColor: entry.themeColor, left: `${left}%`, width: `${width}%` }}
          title={`${formatClock(entry.startMinutes)} – ${formatClock(entry.startMinutes + entry.durationMinutes)}`}
        >
          {width >= MIN_LABEL_BAR_PERCENT && (
            <>
              <span className="font-mono text-[9px] leading-none" style={{ color: inkColor }}>
                {formatClock(entry.startMinutes)}
              </span>
              <span className="font-mono text-[9px] leading-none" style={{ color: inkColor }}>
                {formatClock(entry.startMinutes + entry.durationMinutes)}
              </span>
            </>
          )}
        </div>
      </div>
      <p className="w-11 shrink-0 text-right font-geist text-sm text-zinc-100">
        {entry.durationMinutes}
        <span className="text-[10px] text-zinc-500"> 分</span>
      </p>
    </div>
  )
}

/**
 * Range-bar chart of show durations on a common clock axis, so开场/散场
 * times line up vertically across shows for comparison.
 */
function DurationTimeline({ entries }: { entries: DurationShowEntry[] }) {
  const axis = buildTimelineAxis(entries)

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <DurationTimelineRow axis={axis} entry={entry} key={entry.id} />
      ))}
    </div>
  )
}

export function SummaryCardDuration({ isPaused = false }: SummaryCardProps) {
  const { durationStats, songStats } = useSummaryDataContext()
  const { entries, fallbackCount, totalMinutes } = durationStats
  const showCount = entries.length + fallbackCount
  const hasShows = showCount > 0
  const totalHours = Math.round(totalMinutes / 60)

  const topEntries = useMemo(
    () =>
      [...entries]
        .sort((a, b) => b.durationMinutes - a.durationMinutes || a.showDate.localeCompare(b.showDate))
        .slice(0, MAX_TOP_ENTRIES),
    [entries]
  )

  const scrollerRef = useRef<HTMLDivElement>(null)
  const runwayRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const engineRef = useRef<DurationTunnelInstance | null>(null)
  const isPausedRef = useRef(isPaused)

  const [isNumberVisible, setIsNumberVisible] = useState(false)
  const [isIntroVisible, setIsIntroVisible] = useState(true)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  const formattedMinutes = String(totalMinutes)

  useEffect(() => {
    isPausedRef.current = isPaused
    engineRef.current?.setPaused(isPaused)
  }, [isPaused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const engine = createDurationTunnel({
      canvas,
      numberEl: numberRef.current,
      onHandoffChange: setIsNumberVisible,
      onIntroChange: setIsIntroVisible,
      totalMinutes,
    })
    engineRef.current = engine
    engine.setPaused(isPausedRef.current)

    if (prefersReducedMotion) {
      // Static idle tunnel, number readable immediately, no scroll story.
      engine.renderStaticFrame()
      setIsReducedMotion(true)
      setIsNumberVisible(true)
      return () => {
        engineRef.current = null
        engine.destroy()
      }
    }

    const scroller = scrollerRef.current
    const runway = runwayRef.current
    const handleScroll = () => {
      if (!(scroller && runway)) return
      const track = runway.offsetHeight - scroller.clientHeight
      engine.setTargetProgress(track > 0 ? scroller.scrollTop / track : 0)
    }
    scroller?.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      scroller?.removeEventListener('scroll', handleScroll)
      engineRef.current = null
      engine.destroy()
    }
  }, [totalMinutes])

  const hero = (
    <div className="relative h-svh">
      <div aria-hidden className="summary-duration-aurora" />
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />

      <div
        className="summary-duration-intro pointer-events-none absolute inset-x-0 top-0 px-6 pt-6"
        data-hidden={!isIntroVisible || undefined}
      >
        <h3 className="font-title text-white text-xl leading-snug">耳机里的少年，已经唱了 25 年。</h3>
        <p className="mt-2 text-sm text-zinc-400">这一趟疯狂世界，你又是何时跳上了这班列车？</p>
        {hasShows && (
          <p className="mt-2 text-sm text-zinc-500">拉开时光机的舱门，轻轻往下拨动，开启你的 5525 穿梭航线。</p>
        )}
      </div>

      {hasShows ? (
        <div
          className="summary-duration-hero-copy pointer-events-none absolute inset-x-0 top-[58%] -translate-y-1/2 px-6 text-center"
          data-visible={isNumberVisible || undefined}
        >
          <p className="text-sm text-zinc-300">穿过漫长星轨，在 5525 的时空里</p>
          <p className="mt-1 text-sm text-zinc-300">你与五月天陪伴了</p>
          <p className="mt-4">
            <span className="summary-duration-number text-[64px] leading-none" ref={numberRef}>
              {formattedMinutes}
            </span>
            <span className="ml-2 text-lg text-zinc-300">分钟</span>
          </p>
          <p className="mt-4 font-mono text-xs text-zinc-500">唱过 {songStats.totalSongs} 首歌</p>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-[74%] px-6 text-center">
          <h3 className="font-title text-white text-xl">时光机还停在原地</h3>
          <p className="mt-3 text-sm text-zinc-400">选好你去过的场次，属于你的穿梭航线才会亮起。</p>
        </div>
      )}
    </div>
  )

  if (!hasShows) {
    return <div className="relative flex h-svh flex-col overflow-hidden bg-zinc-950">{hero}</div>
  }

  return (
    <div className="flex h-svh flex-col bg-zinc-950">
      <div className="flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container ref={scrollerRef}>
        <section ref={runwayRef} style={{ height: isReducedMotion ? '100svh' : RUNWAY_HEIGHT }}>
          <div className="sticky top-0 h-svh overflow-hidden">{hero}</div>
        </section>

        <section className="px-6 pb-28">
          <div className="mb-4 flex items-baseline justify-between border-white/10 border-t pt-4 text-xs text-zinc-500">
            <p>你的时长记录</p>
            <p className="font-geist">TOP {topEntries.length}</p>
          </div>

          {topEntries.length > 0 && (
            <>
              <DurationTimeline entries={topEntries} />

              <Sheet>
                <SheetTrigger className="mt-6 w-full rounded-lg border border-white/10 py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100">
                  查看全部 {entries.length} 场
                </SheetTrigger>
                <SheetContent
                  className="max-h-[85svh] rounded-t-2xl border-white/10 bg-zinc-950 text-zinc-100"
                  data-summary-gesture-exempt
                  side="bottom"
                >
                  <SheetHeader className="border-white/10 border-b px-5 pt-6 pb-4">
                    <SheetTitle className="font-title text-xl text-zinc-100">每一场的时长</SheetTitle>
                    <SheetDescription className="text-zinc-500">
                      按场次日期排列 · 共 {entries.length} 场
                    </SheetDescription>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                    <DurationTimeline entries={entries} />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}

          <div className="mt-6 flex items-baseline justify-between border-white/10 border-t pt-4">
            <p className="text-xs text-zinc-500">共 {showCount} 场</p>
            <p className="font-geist text-sm text-zinc-100">
              {formattedMinutes} 分钟 <span className="text-zinc-500">≈ {totalHours} 小时</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
