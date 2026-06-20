import { useSelector } from '@tanstack/react-store'
import { useEffect, useRef, useState } from 'react'

import {
  type Activity,
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
} from '@/components/kibo-ui/contribution-graph'
import { concertStore } from '@/stores/concert-store'
import type { Show } from '@/types'
import showsRaw from '../../../../data/shows.json'

const YEARS = ['2023', '2024', '2025', '2026'] as const
type Year = (typeof YEARS)[number]

const ALL_SHOWS = (showsRaw as unknown as Show[])
  .filter((s) => !s.isHidden)
  .sort((a, b) => a.showDate.localeCompare(b.showDate))

const YEAR_END: Record<Year, string> = {
  '2023': '2023-12-31',
  '2024': '2024-12-31',
  '2025': '2025-12-31',
  '2026': '2026-07-12',
}

const MONTH_LABELS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function buildYearData(year: Year): Activity[] {
  const startDate = `${year}-01-01`
  const endDate = YEAR_END[year]
  const showActivities = ALL_SHOWS.filter((s) => s.showDate.startsWith(year)).map(
    (s): Activity => ({ date: s.showDate, count: 1, level: 0 })
  )

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

const YEAR_DATA: Record<Year, Activity[]> = Object.fromEntries(YEARS.map((y) => [y, buildYearData(y)])) as Record<
  Year,
  Activity[]
>

const YEAR_SHOW_COUNTS: Record<Year, number> = Object.fromEntries(
  YEARS.map((y) => [y, ALL_SHOWS.filter((s) => s.showDate.startsWith(y)).length])
) as Record<Year, number>

export function SummaryCardOverview() {
  const selectedShows = useSelector(concertStore, (s) => s.selectedShows)
  const [litDates, setLitDates] = useState<Set<string>>(new Set())
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set())
  const highlightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let i = 0
    const litInterval = setInterval(() => {
      if (i >= ALL_SHOWS.length) {
        clearInterval(litInterval)
        return
      }
      const date = ALL_SHOWS[i]!.showDate
      setLitDates((prev) => new Set([...prev, date]))
      i++
    }, 15)

    const selectedSorted = [...selectedShows].sort((a, b) => a.showDate.localeCompare(b.showDate))
    let j = 0

    const highlightTimeout = setTimeout(() => {
      if (selectedSorted.length === 0) {
        return
      }
      highlightIntervalRef.current = setInterval(() => {
        if (j >= selectedSorted.length) {
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current)
            highlightIntervalRef.current = null
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
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current)
        highlightIntervalRef.current = null
      }
    }
  }, []) // intentionally captured at mount

  return (
    <div className="flex min-h-svh flex-col bg-zinc-950 px-6 py-8">
      <p className="mb-2 shrink-0 text-muted-foreground text-xs uppercase tracking-widest">00 / 场次概览</p>
      <h1 className="mb-8 font-bold text-2xl text-white tracking-tight">5525 巡演时间轴</h1>

      <div className="flex flex-col gap-8">
        {YEARS.map((year) => (
          <div key={year}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-sm text-zinc-300">{year}</span>
              <span className="font-mono text-xs text-zinc-500">{YEAR_SHOW_COUNTS[year]} 场</span>
            </div>
            <ContributionGraph
              blockMargin={2}
              blockRadius={2}
              blockSize={8}
              data={YEAR_DATA[year]!}
              fontSize={10}
              labels={{ months: MONTH_LABELS_ZH }}
            >
              <ContributionGraphCalendar>
                {({ activity, dayIndex, weekIndex }) => {
                  const isHighlighted = highlightedDates.has(activity.date)
                  const isLit = litDates.has(activity.date)
                  let fill: string
                  let filter: string
                  if (isHighlighted) {
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
                        transition: 'fill 0.4s ease, filter 0.4s ease',
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
  )
}
