import { useEffect, useMemo, useRef, useState } from 'react'
import { type SpecialEvent, specialEventList } from '@/data/special-event'
import type { Show } from '@/types'
import { useSummaryDataContext } from '../summary-data-context'

interface MemoryGroup {
  /** All maintained memorable events that happened at this show, in curation order. */
  events: SpecialEvent[]
  show: Show
}

/** Placeholder long-form texts cycled by show index until real talking data exists. */
const PLACEHOLDER_TALKINGS = [
  '这里将是一段值得回味的长文字——可能是当晚让全场安静下来的那段 talking，也可能是安可前的那句约定。真实数据接入后，这段占位文字会被替换。',
  '「谢谢你们来看我们，也谢谢你们让我们看见你们。」类似这样的话，那一晚一定说过不止一句。等回忆数据就位，这里会还原当晚的原话。',
  '有些话只有在现场听过的人才懂。这段占位文字先替它守着位置，等它被完整记录下来的那天。',
  '从第一声鼓点到最后一颗大球落下，中间发生过太多值得写下来的事。这里会挑出最值得回味的那一段。',
]

interface MemoryPageData {
  allGroups: MemoryGroup[]
  selectedGroups: MemoryGroup[]
}

/** Normalizes the maintained event date format to the Show date format. */
function normalizeEventDate(date: string): string {
  return date.replaceAll('.', '-')
}

/**
 * Groups maintained special events by show, in show-date order. A multi-day
 * event is attached only to the earliest matching show in the given list.
 */
function getMemoryGroups(shows: Show[]): MemoryGroup[] {
  const sortedShows = shows.toSorted((a, b) => a.showDate.localeCompare(b.showDate))
  const usedEventIndexes: Set<number> = new Set()
  const groups: MemoryGroup[] = []

  for (const show of sortedShows) {
    const events: SpecialEvent[] = []
    for (let i = 0; i < specialEventList.length; i++) {
      if (usedEventIndexes.has(i)) {
        continue
      }
      const [eventDates, event] = specialEventList[i]
      if (eventDates.map(normalizeEventDate).includes(show.showDate)) {
        events.push(event)
        usedEventIndexes.add(i)
      }
    }
    if (events.length > 0) {
      groups.push({ events, show })
    }
  }

  return groups
}

/**
 * Organizes maintained special events into the all-tour and personally attended
 * show groups.
 */
function getPageData(options: { allShows: Show[]; selectedShows: Show[] }): MemoryPageData {
  const { allShows, selectedShows } = options
  return { allGroups: getMemoryGroups(allShows), selectedGroups: getMemoryGroups(selectedShows) }
}

/** Builds the CDN cover URL for a maintained memorable event. */
function getEventCoverUrl(event: SpecialEvent): string {
  return `//mayday-replay-cdn.ddiu.site/5526-events/${event.noteId}.webp`
}

/** Single-event layout: one photo with ambient echo, alternating alignment. */
function MemorySinglePhoto({ event, isFlipped }: { event: SpecialEvent; isFlipped: boolean }) {
  return (
    <div className="summary-memory-photo relative mt-6">
      <div className={`relative w-[min(70%,270px)] ${isFlipped ? 'ml-auto' : ''}`}>
        <img
          alt=""
          aria-hidden="true"
          className="summary-memory-photo-echo"
          height={4}
          loading="lazy"
          src={getEventCoverUrl(event)}
          width={3}
        />
        <div
          className={`summary-memory-photo-frame relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 ${
            isFlipped ? 'rotate-1' : '-rotate-1'
          }`}
        >
          <img
            alt={event.title}
            className="size-full object-cover"
            height={4}
            loading="lazy"
            src={getEventCoverUrl(event)}
            width={3}
          />
        </div>
        <p
          className={`summary-memory-caption mt-4 font-semibold text-[0.9375rem] text-zinc-100 leading-relaxed ${
            isFlipped ? 'summary-memory-caption-flip pr-3 text-right' : 'pl-3'
          }`}
        >
          {event.title}
        </p>
      </div>
    </div>
  )
}

/**
 * Multi-event layout: a horizontally scrollable filmstrip of the night's
 * moments, each with its own caption. One ambient echo (first cover) washes
 * the whole strip so the block keeps the per-show mood color.
 */
function MemoryFilmstrip({ events }: { events: SpecialEvent[] }) {
  return (
    <div className="summary-memory-photo relative mt-6">
      <img
        alt=""
        aria-hidden="true"
        className="summary-memory-photo-echo"
        height={4}
        loading="lazy"
        src={getEventCoverUrl(events[0])}
        width={3}
      />
      <div className="summary-space-scroller relative -mx-6 flex gap-4 overflow-x-auto px-6 py-2">
        {events.map((event, eventIndex) => (
          <figure className="w-[200px] shrink-0" key={event.noteId}>
            <div
              className={`summary-memory-photo-frame relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 ${
                eventIndex % 2 === 0 ? '-rotate-1' : 'rotate-1'
              }`}
            >
              <img
                alt={event.title}
                className="size-full object-cover"
                height={4}
                loading="lazy"
                src={getEventCoverUrl(event)}
                width={3}
              />
            </div>
            <figcaption className="summary-memory-caption mt-3 pl-3 font-semibold text-sm text-zinc-100 leading-relaxed">
              {event.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function MemoryBlock({ group, index }: { group: MemoryGroup; index: number }) {
  const { events, show } = group
  const ghostNumber = String(index + 1).padStart(2, '0')
  const talking = PLACEHOLDER_TALKINGS[index % PLACEHOLDER_TALKINGS.length]
  const isFlipped = index % 2 === 1

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
        </div>
        {show.subTheme && <p className="mt-1 text-xs text-zinc-500 italic">{show.subTheme}</p>}
      </header>

      {events.length === 1 ? (
        <MemorySinglePhoto event={events[0]} isFlipped={isFlipped} />
      ) : (
        <MemoryFilmstrip events={events} />
      )}

      <blockquote className="summary-memory-quote relative mt-10">
        <span aria-hidden="true" className="summary-memory-quote-mark font-title">
          「
        </span>
        <p className="relative text-base text-zinc-200 leading-loose">{talking}</p>
        <footer className="mt-3 text-right text-xs text-zinc-600">—— 当晚的 talking · 占位</footer>
      </blockquote>
    </article>
  )
}

export function SummaryCardMemories() {
  const { allShows, selectedShows } = useSummaryDataContext()
  const pageData = useMemo(() => getPageData({ allShows, selectedShows }), [allShows, selectedShows])
  const hasSelectedGroups = pageData.selectedGroups.length > 0
  const [scope, setScope] = useState<'all' | 'selected'>(() => (hasSelectedGroups ? 'selected' : 'all'))
  const groups = scope === 'selected' && hasSelectedGroups ? pageData.selectedGroups : pageData.allGroups
  const momentCount = groups.reduce((count, group) => count + group.events.length, 0)
  let intro = `你参加的场次暂未收录专属回忆，先看看全部 ${momentCount} 个难忘瞬间。`
  if (scope === 'selected' && hasSelectedGroups) {
    intro = `往下滑，重访你亲历的 ${groups.length} 个夜晚、${momentCount} 个难忘瞬间。`
  } else if (hasSelectedGroups) {
    intro = `这里收录了整趟巡演的 ${momentCount} 个难忘瞬间。`
  }
  const scrollerRef = useRef<HTMLDivElement>(null)

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
          <div className="mb-6 inline-flex border border-white/10 bg-black/20 p-1 text-xs">
            <button
              aria-pressed={scope === 'selected'}
              className={`px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                scope === 'selected' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
              disabled={!hasSelectedGroups}
              onClick={() => setScope('selected')}
              type="button"
            >
              专属回忆
            </button>
            <button
              aria-pressed={scope === 'all'}
              className={`px-3 py-1.5 transition-colors ${
                scope === 'all' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
              onClick={() => setScope('all')}
              type="button"
            >
              全部回忆
            </button>
          </div>
          <h3 className="font-title text-white text-xl leading-snug">有些瞬间，散场后还亮着。</h3>
          <p className="mt-3 text-sm text-zinc-400">{intro}</p>
        </header>

        <div className="flex flex-col gap-28 px-6">
          {groups.map((group, index) => (
            <MemoryBlock group={group} index={index} key={group.show.id} />
          ))}
        </div>

        <p className="px-6 pt-28 pb-32 text-center text-xs text-zinc-500">这些夜晚不会重来，但可以随时回放。</p>
      </div>
    </div>
  )
}
