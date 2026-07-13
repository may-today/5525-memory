import { useSelector } from '@tanstack/react-store'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'

import {
  type Activity,
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
} from '@/components/kibo-ui/contribution-graph'
import { concertStore } from '@/stores/concert-store'
import type { Show } from '@/types'
import { SummaryScrollFadeTop } from '../SummaryScrollFadeTop'
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

/** 巡演子主题配色，与 `/form` 场次选择页保持一致（未知子主题回退场次原 themeColor）。 */
const SUB_THEME_COLORS = {
  '5525': '#f472b6',
  '5525+1': '#38bdf8',
  '5525+2': '#fb923c',
} as const

const SUB_THEME_LEGEND = [
  { label: '5525', color: SUB_THEME_COLORS['5525'] },
  { label: '5525+1', color: SUB_THEME_COLORS['5525+1'] },
  { label: '5525+2', color: SUB_THEME_COLORS['5525+2'] },
] as const

/** 未点亮格子的底色（比 zinc-900 更弱一档，让彩色星图更突出）。 */
const IDLE_FILL = '#161618'
/** 全巡演坐标（你未去过）的着色不透明度——压暗作为背景星图。 */
const TOUR_FILL_OPACITY = 0.4
/** 你去过的坐标的着色不透明度——满色，与暗背景拉开对比。 */
const VISITED_FILL_OPACITY = 1

function getShowColor(show: Show): string {
  return SUB_THEME_COLORS[show.subTheme as keyof typeof SUB_THEME_COLORS] ?? show.themeColor
}

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
  const reportSubmission = useSelector(concertStore, (s) => s.reportSubmission)
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
  // date → 子主题色，供每格按主题着色（同一天只有一场，直接以日期为键）
  const dateColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const show of allShows) {
      map.set(show.showDate, getShowColor(show))
    }
    return map
  }, [allShows])

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount — animation is intentionally a one-shot sequence
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
        const nextShow = selectedSorted[j]
        if (nextShow) {
          setHighlightedDates((prev) => new Set([...prev, nextShow.showDate]))
        }
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
  }, [])

  const totalCount = allShows.length
  const selectedTarget = selectedShowsAtMount.current.length
  // 已点亮的「你去过」坐标数，随第二段动画实时递增
  const selectedLit = highlightedDates.size
  const fellowFanCount = useMemo(() => {
    if (!reportSubmission) return 0
    const fellowFanCounts: number[] = []
    for (const show of selectedShowsAtMount.current) {
      const count = reportSubmission.fellowFansByShowId[show.id] ?? 0
      // The aggregate cannot identify people spanning multiple selected shows,
      // so use the strongest single-show connection instead of summing it.
      fellowFanCounts.push(Math.max(0, count - 1))
    }
    return Math.max(0, ...fellowFanCounts)
  }, [reportSubmission])

  return (
    <div className="flex h-svh flex-col bg-zinc-950">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="font-title text-white text-xl leading-snug">5525 巡演时间轴</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24" data-scroll-container>
        <SummaryScrollFadeTop />
        {/* 引导语：把冰冷的日历翻译成「航道 / 坐标 / 光点」的叙事 */}
        <div className="border-zinc-800/80 border-b pb-6">
          <p className="text-sm text-zinc-400 leading-relaxed">
            5525 的大船在四年的时间航道里，留下了{' '}
            <span className="overview-count text-base">{totalCount}</span> 个坐标。
          </p>
          {selectedTarget > 0 ? (
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              其中的 <span className="overview-count overview-count-lit text-base">{selectedLit}</span>{' '}
              个时间坐标，是你曾亲自奔赴过的、最亮的光点。
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
              还没有点亮任何一个属于你的坐标——回到上一步选好去过的场次，它们会在这张星图里逐一亮起。
            </p>
          )}

          {/* 图例：三个子主题 + 「你去过」发光样例 */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {SUB_THEME_LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color, opacity: 0.55 }}
                />
                <span className="font-mono text-[11px] text-zinc-500">{item.label}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                className="overview-dot-lit size-2.5 rounded-full"
                style={{ backgroundColor: '#fff', ['--dot-color' as string]: '#ffffff' }}
              />
              <span className="font-mono text-[11px] text-zinc-400">你去过</span>
            </span>
          </div>

          {reportSubmission && (
            <p className="mt-5 border-zinc-800/80 border-t pt-4 text-sm text-zinc-400 leading-relaxed">
              你是第 <span className="overview-count overview-count-lit text-base">{reportSubmission.reportNumber}</span>{' '}
              位登记这份巡演回忆的人。
              {fellowFanCount > 0 && (
                <>
                  {' '}在你选中的场次里，最多有{' '}
                  <span className="overview-count overview-count-lit text-base">{fellowFanCount}</span> 位同行者和你看过同一场。
                </>
              )}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-8">
        {YEARS.map((year) => (
          <div key={year}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-sm text-zinc-300">{year}</span>
              <span className="font-mono text-xs text-zinc-500">{yearShowCounts[year]} 场</span>
            </div>
            <ContributionGraph
              blockMargin={4}
              blockRadius={3}
              blockSize={6}
              className="w-full"
              data={yearData[year]}
              fontSize={10}
              labels={{ months: MONTH_LABELS_ZH }}
            >
              <ContributionGraphCalendar
                className="!overflow-visible [&_svg]:h-auto [&_svg]:w-full"
                getActivityOrder={(activity) => (highlightedDates.has(activity.date) ? 1 : 0)}
              >
                {({ activity, dayIndex, weekIndex }) => {
                  const isFuture = activity.date > TODAY
                  const isHighlighted = !isFuture && highlightedDates.has(activity.date)
                  const isLit = !isFuture && litDates.has(activity.date)
                  const themeColor = dateColorMap.get(activity.date)
                  const style: CSSProperties = {
                    transition: isFuture
                      ? 'none'
                      : 'fill 0.4s ease, fill-opacity 0.4s ease, transform 0.4s ease',
                  }
                  if (isFuture) {
                    style.fill = 'transparent'
                  } else if (isHighlighted && themeColor) {
                    // 你去过：满色 + 放大 + 呼吸辉光，成为「最亮的光点」。
                    // 圆点间留有空隙，放大 1.45 仍落在本格内、不与相邻点重合。
                    style.fill = themeColor
                    style.fillOpacity = VISITED_FILL_OPACITY
                    style.transformBox = 'fill-box'
                    style.transformOrigin = 'center'
                    style.transform = 'scale(1.45)'
                    ;(style as Record<string, string>)['--dot-color'] = themeColor
                  } else if (isLit && themeColor) {
                    // 全巡演坐标（你未去过）：子主题色的彩色星图，压暗作为背景
                    style.fill = themeColor
                    style.fillOpacity = TOUR_FILL_OPACITY
                  } else {
                    style.fill = IDLE_FILL
                    style.fillOpacity = 1
                  }
                  return (
                    <ContributionGraphBlock
                      activity={{ ...activity, level: 0 }}
                      className={isHighlighted ? 'overview-dot-lit' : undefined}
                      dayIndex={dayIndex}
                      style={style}
                      weekIndex={weekIndex}
                    />
                  )
                }}
              </ContributionGraphCalendar>
            </ContributionGraph>
          </div>
        ))}
        </div>

        <div className="mt-10 border-zinc-800/80 border-t pt-6">
          {selectedTarget > 0 ? (
            <p className="text-sm text-zinc-400 leading-relaxed">
              {selectedTarget} 个光点，连成了只属于你的 5525 星图——
              <br />
              这一整片时间的海，你都亲自航行过。
            </p>
          ) : (
            <p className="text-sm text-zinc-500 leading-relaxed">
              这张星图，正等着被你的光点点亮。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
