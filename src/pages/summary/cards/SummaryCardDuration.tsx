import { useEffect, useRef, useState } from 'react'

import type { DurationShowEntry } from '@/server/summary'
import type { SummaryCardProps } from '../summary-card-props'
import { useSummaryDataContext } from '../summary-data-context'
import type { DurationTunnelInstance } from './duration-tunnel'
import { createDurationTunnel } from './duration-tunnel'

/** Matches FALLBACK_SHOW_MINUTES on the server; only used for the footnote copy. */
const FALLBACK_SHOW_MINUTES = 180

/**
 * Scroll runway height that pins the tunnel hero while the particle story
 * plays out (~1.8 viewports of scrubbing). Collapses under reduced motion.
 */
const RUNWAY_HEIGHT = '280svh'

/**
 * One duration-log line: year + date, city + day label, a dotted leader and
 * the minute count. Mirrors the vinyl card's sleeve-back tracklist language.
 */
function DurationRow({ entry }: { entry: DurationShowEntry }) {
  return (
    <div className="flex items-baseline gap-3">
      <p className="shrink-0 font-mono text-xs text-zinc-600">
        {entry.showDate.slice(0, 4)} {entry.dateSlash}
      </p>
      <p className="min-w-0 shrink truncate text-sm text-zinc-300">
        {entry.city} · {entry.dayLabel}
      </p>
      <div className="min-w-4 flex-1 border-zinc-700/60 border-b border-dotted" />
      <p className="shrink-0 font-geist text-sm text-zinc-100">
        {entry.durationMinutes}
        <span className="text-xs text-zinc-500"> 分钟</span>
      </p>
    </div>
  )
}

export function SummaryCardDuration({ isPaused = false }: SummaryCardProps) {
  const { durationStats } = useSummaryDataContext()
  const { entries, fallbackCount, totalMinutes } = durationStats
  const showCount = entries.length + fallbackCount
  const hasShows = showCount > 0
  const totalHours = Math.round(totalMinutes / 60)

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
        <h3 className="font-bold text-white text-xl">耳机里的少年，已经唱了 25 年。</h3>
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
          <p className="font-wjh text-sm text-zinc-300">穿过漫长星轨，在 5525 的时空里</p>
          <p className="mt-1 font-wjh text-sm text-zinc-300">你与五月天陪伴了</p>
          <p className="mt-4">
            <span className="summary-duration-number text-[64px] leading-none" ref={numberRef}>
              {formattedMinutes}
            </span>
            <span className="ml-2 font-wjh text-lg text-zinc-300">分钟</span>
          </p>
          <p className="mt-4 font-mono text-xs text-zinc-500">
            ≈ {totalHours} 小时 · {showCount} 场
          </p>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-[74%] px-6 text-center">
          <h3 className="font-bold text-white text-xl">时光机还停在原地</h3>
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
            <p>DURATION LOG · 每一场的时长</p>
            <p className="font-geist">{entries.length} 场</p>
          </div>

          <div className="flex flex-col gap-3.5">
            {entries.map((entry) => (
              <DurationRow entry={entry} key={entry.id} />
            ))}
          </div>

          <div className="mt-6 flex items-baseline justify-between border-white/10 border-t pt-4">
            <p className="text-xs text-zinc-500">共 {showCount} 场</p>
            <p className="font-geist text-sm text-zinc-100">
              {formattedMinutes} 分钟 <span className="text-zinc-500">≈ {totalHours} 小时</span>
            </p>
          </div>

          <p className="mt-8 text-xs text-zinc-500">时光机随时待命，这条航线永远可以再飞一遍。</p>
          {fallbackCount > 0 && (
            <p className="mt-1 text-[10px] text-zinc-600">
              另有 {fallbackCount} 场未记录开散场时间，已按 {FALLBACK_SHOW_MINUTES} 分钟计入总数，未在上表列出。
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
