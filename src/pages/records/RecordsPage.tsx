import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ListMusic } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Show } from '@/types'
import { SetlistImageOverlay } from './SetlistImageOverlay'

const routeApi = getRouteApi('/records')

/** 巡演子主题配色，与 /form 场次选择页、Overview 星图、SharePoster 保持一致。 */
const SUB_THEME_COLORS: Record<string, string> = {
  '5525': '#f472b6',
  '5525+1': '#38bdf8',
  '5525+2': '#fb923c',
}

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/** 连续且城市、场馆、子主题、版本都相同的场次聚成的一个「驻站」。 */
interface TourStop {
  city: string
  /** 全航线内的零基站序，跨年份连续编号。 */
  index: number
  shows: Show[]
  subTheme: string
  venue: string
  versionName: string
}

interface YearGroup {
  stops: TourStop[]
  year: string
}

function getDayAbbr(dateStr: string): string {
  return DAY_ABBR[new Date(`${dateStr}T12:00:00`).getDay()]
}

function getStopColor(stop: TourStop): string {
  return SUB_THEME_COLORS[stop.subTheme] ?? stop.shows[0].themeColor
}

/** 把按日期排序的全部场次折成驻站，再按驻站首演年份分组。 */
function buildYearGroups(allShows: Show[]): YearGroup[] {
  const stops: TourStop[] = []
  for (const show of allShows) {
    const lastStop = stops.at(-1)
    const canJoinLastStop =
      lastStop !== undefined &&
      lastStop.city === show.city &&
      lastStop.venue === show.venue &&
      lastStop.subTheme === show.subTheme &&
      lastStop.versionName === show.versionName
    if (canJoinLastStop) {
      lastStop.shows.push(show)
    } else {
      stops.push({
        city: show.city,
        index: stops.length,
        shows: [show],
        subTheme: show.subTheme,
        venue: show.venue,
        versionName: show.versionName,
      })
    }
  }

  const groups: YearGroup[] = []
  for (const stop of stops) {
    const year = stop.shows[0].showDate.slice(0, 4)
    const lastGroup = groups.at(-1)
    if (lastGroup && lastGroup.year === year) {
      lastGroup.stops.push(stop)
    } else {
      groups.push({ stops: [stop], year })
    }
  }
  return groups
}

export function RecordsPage() {
  const navigate = useNavigate()
  const allShows = routeApi.useLoaderData()
  const [activeShow, setActiveShow] = useState<Show | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const yearGroups = useMemo(() => buildYearGroups(allShows), [allShows])
  const cityCount = useMemo(() => new Set(allShows.map((show) => show.city)).size, [allShows])
  const firstYear = allShows[0]?.showDate.slice(0, 4)
  const lastYear = allShows.at(-1)?.showDate.slice(0, 4)

  // 驻站随滚动逐个显现；挂载后（首帧绘制前）才隐藏，无 JS 或 reduced-motion 时保持全部可见。
  useLayoutEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const stops = Array.from(timeline.querySelectorAll<HTMLElement>('.records-stop'))
    for (const stop of stops) stop.classList.add('records-stop-pending')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('records-stop-in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    for (const stop of stops) observer.observe(stop)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-md px-6 pb-24">
        <header className="flex items-center pt-[max(1.25rem,env(safe-area-inset-top))]">
          <button
            aria-label="返回"
            className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-200"
            onClick={() => navigate({ to: '/share' })}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>
        </header>

        <div className="mt-8">
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">Tour Archive · 全航线日志</p>
          <h1 className="mt-2 font-title text-2xl">5525 巡回记录</h1>
          <p className="mt-4 text-sm text-zinc-400 leading-6">
            从 <span className="records-num">{firstYear}</span> 到 <span className="records-num">{lastYear}</span>，5525
            的大船一共靠过 <span className="records-num">{cityCount}</span> 座城市，留下{' '}
            <span className="records-num">{allShows.length}</span> 场航行记录。翻开任何一场，都能看到那一晚唱过的歌。
          </p>
        </div>

        <div ref={timelineRef}>
          {yearGroups.map((group) => (
            <section key={group.year}>
              <h2 className="records-year mt-14 mb-10 select-none">{group.year}</h2>
              <ol className="flex flex-col gap-14">
                {group.stops.map((stop, stopIndex) => {
                  const nextStop = group.stops[stopIndex + 1]
                  const railStyle = {
                    '--records-color': getStopColor(stop),
                    '--records-next-color': nextStop ? getStopColor(nextStop) : 'transparent',
                  } as CSSProperties
                  const chipLabel = [stop.subTheme, stop.versionName].filter(Boolean).join(' · ')
                  return (
                    <li className="records-stop relative pl-9" key={stop.shows[0].id} style={railStyle}>
                      <header>
                        <p className="records-stop-no font-geist">NO.{String(stop.index + 1).padStart(2, '0')} 站</p>
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                          <h3 className="font-title text-xl leading-none">{stop.city}</h3>
                          {chipLabel && <span className="records-chip">{chipLabel}</span>}
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-500">{stop.venue}</p>
                      </header>
                      <ul className="mt-3 flex flex-col divide-y divide-white/5">
                        {stop.shows.map((show) => (
                          <li className="flex items-center gap-3 py-2.5" key={show.id}>
                            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                              <span className="font-geist text-sm text-zinc-100 tracking-wide">{show.dateSlash}</span>
                              <span className="text-[10px] text-zinc-600">
                                {getDayAbbr(show.showDate)}
                                {show.showStartTime && ` · ${show.showStartTime}`}
                              </span>
                              <span className="text-xs text-zinc-400">{show.dayLabel}</span>
                            </div>
                            {show.playlistImg ? (
                              <button
                                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-100"
                                onClick={() => setActiveShow(show)}
                                type="button"
                              >
                                <ListMusic className="size-3" />
                                查看歌单
                              </button>
                            ) : (
                              <span className="shrink-0 px-2.5 py-1 text-xs text-zinc-700">歌单暂缺</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>

        <p className="mt-16 text-center text-xs text-zinc-600">航行日志到这里先告一段落。</p>
      </div>

      {activeShow && <SetlistImageOverlay onClose={() => setActiveShow(null)} show={activeShow} />}
    </div>
  )
}
