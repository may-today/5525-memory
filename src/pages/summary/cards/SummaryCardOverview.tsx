import { useSelector } from '@tanstack/react-store'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  type Activity,
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
} from '@/components/kibo-ui/contribution-graph'
import { concertStore } from '@/stores/concert-store'
import type { Show } from '@/types'
import { useSummaryDataContext } from '../summary-data-context'

const YEARS = ['2023', '2024', '2025', '2026'] as const
type Year = (typeof YEARS)[number]

const TODAY = new Date().toISOString().slice(0, 10)

const YEAR_END: Record<Year, string> = {
  '2023': '2023-12-31',
  '2024': '2024-12-31',
  '2025': '2025-12-31',
  '2026': '2026-12-31',
}

const MONTH_LABELS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const SHOWS_PER_TICK = 4
const LIT_TICK_MS = 60

function buildYearData(year: Year, allShows: Show[]): Activity[] {
  const startDate = `${year}-01-01`
  const endDate = YEAR_END[year]
  const showActivities = allShows.reduce<Activity[]>((acc, s) => {
    if (s.showDate.startsWith(year)) {
      acc.push({ date: s.showDate, count: 1, level: 0 })
    }
    return acc
  }, [])

  const seenDates = new Set<string>()
  const unique: Activity[] = []

  for (const a of [
    { date: startDate, count: 0, level: 0 as const },
    ...showActivities,
    { date: endDate, count: 0, level: 0 as const },
  ]) {
    if (!seenDates.has(a.date)) {
      seenDates.add(a.date)
      unique.push(a)
    }
  }

  return unique.sort((a, b) => a.date.localeCompare(b.date))
}

export function SummaryCardOverview() {
  const { allShows } = useSummaryDataContext()
  const selectedShows = useSelector(concertStore, (s) => s.selectedShows)
  const [litShowCount, setLitShowCount] = useState(0)
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set())
  // Snapshot selectedShows at mount time so the animation sequences run once
  // on entry and are not affected by store updates while the card is visible.
  const selectedShowsAtMount = useRef(selectedShows)
  const yearData = useMemo(
    () => Object.fromEntries(YEARS.map((y) => [y, buildYearData(y, allShows)])) as Record<Year, Activity[]>,
    [allShows]
  )
  const yearShowCounts = useMemo(
    () =>
      Object.fromEntries(YEARS.map((y) => [y, allShows.filter((s) => s.showDate.startsWith(y)).length])) as Record<
        Year,
        number
      >,
    [allShows]
  )
  const litDates = useMemo(
    () => new Set(allShows.slice(0, litShowCount).map((show) => show.showDate)),
    [litShowCount, allShows]
  )

  useEffect(() => {
    const litInterval = setInterval(() => {
      setLitShowCount((count) => {
        const nextCount = Math.min(count + SHOWS_PER_TICK, allShows.length)
        if (nextCount === allShows.length) clearInterval(litInterval)
        return nextCount
      })
    }, LIT_TICK_MS)

    // Read the mount-time snapshot — stable ref, no stale closure issue.
    const selectedSorted = selectedShowsAtMount.current.toSorted((a, b) =>
      a.showDate.localeCompare(b.showDate)
    )
    let j = 0
    // Track highlight interval in a local variable so the cleanup closure
    // always reads the correct, final ID rather than a ref that may have changed.
    let highlightInterval: ReturnType<typeof setInterval> | null = null

    const highlightTimeout = setTimeout(() => {
      if (selectedSorted.length === 0) {
        return
      }
      highlightInterval = setInterval(() => {
        if (j >= selectedSorted.length) {
          if (highlightInterval) {
            clearInterval(highlightInterval)
            highlightInterval = null
          }
          return
        }
        const date = selectedSorted[j]!.showDate
        setHighlightedDates((prev) => new Set([...prev, date]))
        j++
      }, 120)
    }, 3000)

    return () => {
      clearInterval(litInterval)
      clearTimeout(highlightTimeout)
      if (highlightInterval) {
        clearInterval(highlightInterval)
        highlightInterval = null
      }
    }
  }, []) // runs once on mount — animation is intentionally a one-shot sequence

  return (
    <div className="flex h-svh flex-col bg-zinc-950">
      <div className="shrink-0 px-6 pt-8 pb-4">
        <p className="mb-2 text-muted-foreground text-xs uppercase tracking-widest">00 / 场次概览</p>
        <h1 className="font-bold text-2xl text-white tracking-tight">5525 巡演时间轴</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24" data-scroll-container>
        <div className="flex flex-col gap-8">
        {YEARS.map((year) => (
          <div key={year}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-sm text-zinc-300">{year}</span>
              <span className="font-mono text-xs text-zinc-500">{yearShowCounts[year]} 场</span>
            </div>
            <ContributionGraph
              blockMargin={2}
              blockRadius={2}
              blockSize={8}
              className="w-full"
              data={yearData[year]!}
              fontSize={10}
              labels={{ months: MONTH_LABELS_ZH }}
            >
              <ContributionGraphCalendar className="overflow-x-hidden [&_svg]:h-auto [&_svg]:w-full">
                {({ activity, dayIndex, weekIndex }) => {
                  const isFuture = activity.date > TODAY
                  const isHighlighted = !isFuture && highlightedDates.has(activity.date)
                  const isLit = !isFuture && litDates.has(activity.date)
                  let fill: string
                  let filter: string
                  if (isFuture) {
                    fill = 'transparent'
                    filter = 'none'
                  } else if (isHighlighted) {
                    fill = '#fde047'
                    filter = 'drop-shadow(0 0 4px #fde04799)'
                  } else if (isLit) {
                    fill = '#f97316'
                    filter = 'none'
                  } else {
                    fill = '#27272a'
                    filter = 'none'
                  }
                  return (
                    <ContributionGraphBlock
                      activity={{ ...activity, level: 0 }}
                      dayIndex={dayIndex}
                      style={{
                        fill,
                        filter,
                        transition: isFuture ? 'none' : 'fill 0.4s ease, filter 0.4s ease',
                      }}
                      weekIndex={weekIndex}
                    />
                  )
                }}
              </ContributionGraphCalendar>
            </ContributionGraph>
          </div>
        ))}
        </div>

        {selectedShows.length > 0 && (
          <div className="mt-8 border-zinc-800 border-t pt-6">
            <p className="font-mono text-xs text-zinc-500">
              <span className="font-bold text-sm text-yellow-300">{selectedShows.length}</span>
              <span className="ml-1 text-zinc-400">场属于你</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
