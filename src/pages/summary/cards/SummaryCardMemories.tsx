import { ImageIcon } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import type { Show } from '@/types'
import { useSummaryDataContext } from '../summary-data-context'

interface MemoryEntry {
  /** One-line caption shown under the photo. Placeholder until real data lands. */
  caption: string
  /** True when the entry is demo content rendered because the user picked no shows. */
  isSample: boolean
  show: Show
  /** Long-form memorable text (e.g. a talking excerpt). Placeholder until real data lands. */
  talking: string
}

/** How many catalog shows to borrow as demo entries when nothing is selected. */
const SAMPLE_ENTRY_COUNT = 3

/** Placeholder captions cycled by entry index until real memory data exists. */
const PLACEHOLDER_CAPTIONS = [
  '这里会放上那晚你最想留住的一张照片。',
  '也许是烟花亮起的瞬间，也许是散场后的人海。',
  '一张来自现场的照片，正在等待被放进来。',
  '灯牌、彩带、大合唱——总有一帧属于这里。',
]

/** Placeholder long-form texts cycled by entry index until real memory data exists. */
const PLACEHOLDER_TALKINGS = [
  '这里将是一段值得回味的长文字——可能是当晚让全场安静下来的那段 talking，也可能是安可前的那句约定。真实数据接入后，这段占位文字会被替换。',
  '「谢谢你们来看我们，也谢谢你们让我们看见你们。」类似这样的话，那一晚一定说过不止一句。等回忆数据就位，这里会还原当晚的原话。',
  '有些话只有在现场听过的人才懂。这段占位文字先替它守着位置，等它被完整记录下来的那天。',
  '从第一声鼓点到最后一颗大球落下，中间发生过太多值得写下来的事。这里会挑出最值得回味的那一段。',
]

/**
 * Builds one memory entry per attended show, ordered chronologically. Falls
 * back to the first few catalog shows (flagged as samples) when the user has
 * not selected any show, so the gallery layout is still explorable.
 */
function buildMemoryEntries(selectedShows: Show[], allShows: Show[]): MemoryEntry[] {
  const isSample = selectedShows.length === 0
  const source = isSample
    ? allShows.slice(0, SAMPLE_ENTRY_COUNT)
    : [...selectedShows].sort((a, b) => a.showDate.localeCompare(b.showDate))

  return source.map((show, index) => ({
    caption: PLACEHOLDER_CAPTIONS[index % PLACEHOLDER_CAPTIONS.length] as string,
    isSample,
    show,
    talking: PLACEHOLDER_TALKINGS[index % PLACEHOLDER_TALKINGS.length] as string,
  }))
}

function MemoryBlock({ entry, index }: { entry: MemoryEntry; index: number }) {
  const { show } = entry
  const ghostNumber = String(index + 1).padStart(2, '0')

  return (
    <article
      className="summary-memory-entry relative"
      data-parallax
      style={{ '--memory-color': show.themeColor } as React.CSSProperties}
    >
      <span aria-hidden="true" className="summary-memory-ghost font-geist">
        {ghostNumber}
      </span>
      <span aria-hidden="true" className="summary-memory-glow" />

      <header className="relative">
        <p className="summary-memory-date font-bold font-geist text-4xl">{show.dateSlash}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
          <span className="font-semibold text-sm text-zinc-200">{show.city}</span>
          <span aria-hidden="true">·</span>
          <span>{show.venue}</span>
          <span aria-hidden="true">·</span>
          <span>{show.dayLabel}</span>
          {entry.isSample && (
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500">示例</span>
          )}
        </div>
        {show.subTheme && <p className="mt-1 text-xs text-zinc-500 italic">{show.subTheme}</p>}
      </header>

      <div className="summary-memory-photo relative mt-6">
        <div
          className={`summary-memory-photo-frame relative flex aspect-[4/3] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 ${
            index % 2 === 0 ? '-rotate-1' : 'rotate-1'
          }`}
        >
          <ImageIcon className="text-white/40" size={28} />
          <p className="text-white/50 text-xs tracking-widest">回忆照片 · 即将放入</p>
        </div>
        <p className="summary-memory-caption mt-4 pl-3 text-sm text-zinc-400 leading-relaxed">{entry.caption}</p>
      </div>

      <blockquote className="summary-memory-quote relative mt-10">
        <span aria-hidden="true" className="summary-memory-quote-mark font-title">
          「
        </span>
        <p className="relative text-base text-zinc-200 leading-loose">{entry.talking}</p>
        <footer className="mt-3 text-right text-xs text-zinc-600">—— 当晚的 talking · 占位</footer>
      </blockquote>
    </article>
  )
}

export function SummaryCardMemories() {
  const { allShows, selectedShows } = useSummaryDataContext()
  const entries = useMemo(() => buildMemoryEntries(selectedShows, allShows), [selectedShows, allShows])
  const scrollerRef = useRef<HTMLDivElement>(null)
  const hasSamplesOnly = entries[0]?.isSample ?? true

  // Scroll-driven parallax: each rAF writes the entry's viewport-centered
  // progress into --parallax; decorative layers translate at different rates.
  // Skipped entirely under prefers-reduced-motion (CSS also zeroes transforms).
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId = 0
    const update = () => {
      rafId = 0
      const viewportHeight = scroller.clientHeight
      if (viewportHeight === 0) return
      for (const entry of scroller.querySelectorAll<HTMLElement>('[data-parallax]')) {
        const rect = entry.getBoundingClientRect()
        const progress = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight
        entry.style.setProperty('--parallax', Math.max(-1, Math.min(1, progress)).toFixed(4))
      }
    }
    const scheduleUpdate = () => {
      if (rafId === 0) rafId = requestAnimationFrame(update)
    }

    scroller.addEventListener('scroll', scheduleUpdate, { passive: true })
    update()
    return () => {
      scroller.removeEventListener('scroll', scheduleUpdate)
      if (rafId !== 0) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-zinc-950">
      <div aria-hidden="true" className="summary-space-stars" />
      <div aria-hidden="true" className="summary-space-stars summary-space-stars-twinkle" />

      <div
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        data-scroll-container
        ref={scrollerRef}
      >
        <header className="px-6 pt-6 pb-20">
          <h3 className="font-bold text-3xl text-white leading-snug">
            有些瞬间，
            <br />
            散场后还亮着。
          </h3>
          <p className="mt-3 text-sm text-zinc-400">
            {hasSamplesOnly
              ? '你还没有选择场次，先看看回忆长廊的样子。'
              : `往下滑，重访你走过的 ${entries.length} 个夜晚。`}
          </p>
        </header>

        <div className="flex flex-col gap-28 px-6">
          {entries.map((entry, index) => (
            <MemoryBlock entry={entry} index={index} key={entry.show.id} />
          ))}
        </div>

        <p className="px-6 pt-28 pb-32 text-center text-xs text-zinc-500">这些夜晚不会重来，但可以随时回放。</p>
      </div>
    </div>
  )
}
