import { useSelector } from '@tanstack/react-store'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getSubThemeColor } from '@/lib/sub-theme-colors'
import type { CityMarker } from '@/server/summary'
import { concertStore } from '@/stores/concert-store'
import type { SummaryCardProps } from '../summary-card-props'
import { useSummaryDataContext } from '../summary-data-context'

/** 行政区划后缀，从出发城市展示名中去掉（北京市→北京、新疆维吾尔自治区→新疆）。 */
const CITY_SUFFIX_PATTERN = /(?:维吾尔|壮族|回族)?自治区$|特别行政区$|[省市]$/

/**
 * 出发城市的展示名：去掉行政区划后缀；「不透露」「其他国家或地区」或空值返回
 * null，文案退化为「你从家出发」。
 */
function formatDepartureCity(city: string): string | null {
  if (!city || city === '不透露' || city === '其他国家或地区') return null
  return city.replace(CITY_SUFFIX_PATTERN, '')
}

/** 印章环形文字：子主题 · 版本名 · 场馆，沿圆周重复到足够覆盖一圈。 */
function buildRingText(marker: CityMarker): string {
  const label = [marker.subTheme, marker.versionName, marker.venue].filter(Boolean).join(' · ')
  if (!label) return ''
  return `${label} · `.repeat(6)
}

interface CityStampProps {
  index: number
  isPaused: boolean
  marker: CityMarker
}

function CityStamp({ index, isPaused, marker }: CityStampProps) {
  const color = getSubThemeColor(marker.subTheme, marker.themeColor)
  const ringText = buildRingText(marker)
  const ringPathId = `city-stamp-ring-${index}`
  const firstVisitedDate = marker.visitedShowDates[0]
  const extraVisitedCount = marker.visitedShowDates.length - 1

  return (
    <div
      className="city-stamp mx-auto aspect-square w-full max-w-[19rem]"
      data-paused={isPaused || undefined}
      data-visited={marker.isVisited || undefined}
      style={{ ['--stamp-color' as string]: color }}
    >
      <svg aria-hidden="true" className="city-stamp-svg" viewBox="0 0 200 200">
        <defs>
          <path d="M 100,100 m -80,0 a 80,80 0 1,0 160,0 a 80,80 0 1,0 -160,0" id={ringPathId} />
        </defs>
        <text className="city-stamp-ring-text">
          <textPath href={`#${ringPathId}`}>{ringText}</textPath>
        </text>
        <circle className="city-stamp-inner-ring" cx="100" cy="100" r="68" />
        <circle className="city-stamp-body" cx="100" cy="100" r="58" />
      </svg>

      <div className="city-stamp-center">
        <p className="city-stamp-name font-title">{marker.cityName}</p>
      </div>

      {marker.isVisited && firstVisitedDate && (
        <div className="city-stamp-postmark">
          <span className="city-stamp-postmark-date font-geist">{firstVisitedDate}</span>
          {extraVisitedCount > 0 && <span className="city-stamp-postmark-extra">及另外 {extraVisitedCount} 场</span>}
        </div>
      )}
    </div>
  )
}

export function SummaryCardCity({ isPaused = false }: SummaryCardProps) {
  const { cityMarkers, mileage } = useSummaryDataContext()
  const profileCity = useSelector(concertStore, (s) => s.profile.city)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // 去过的城市优先展示，未去过的排在后面；组内维持服务端返回的时间顺序。
  const orderedMarkers = useMemo(() => {
    const visited = cityMarkers.filter((marker) => marker.isVisited)
    const unvisited = cityMarkers.filter((marker) => !marker.isVisited)
    return [...visited, ...unvisited]
  }, [cityMarkers])

  const visitedCityCount = orderedMarkers.filter((marker) => marker.isVisited).length
  const departureCity = formatDepartureCity(profileCity)

  let citySummary = '还没有点亮任何城市，回到上一步选择你去过的场次。'
  if (visitedCityCount > 0) {
    citySummary = `你去了 ${visitedCityCount} 个城市，每一枚印章，都是为那一角蓝色的海。`
    if (mileage !== null && mileage > 0) {
      citySummary = `你去了 ${visitedCityCount} 个城市，从${departureCity ?? '家'}出发，跨越 ${mileage.toLocaleString('en-US')} 公里，奔赴每一场相见。`
    }
  }

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || orderedMarkers.length === 0) return

    const items = Array.from(scroller.querySelectorAll<HTMLElement>('[data-city-passport-item]'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number(entry.target.getAttribute('data-city-passport-item'))
          if (!Number.isNaN(index)) setActiveIndex(index)
        }
      },
      { root: scroller, threshold: 0.6 }
    )
    for (const item of items) observer.observe(item)
    return () => observer.disconnect()
  }, [orderedMarkers])

  function scrollToIndex(index: number) {
    const item = scrollerRef.current?.querySelector<HTMLElement>(`[data-city-passport-item="${index}"]`)
    item?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  if (orderedMarkers.length === 0) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        暂无城市数据
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-zinc-950">
      <header className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="font-title text-white text-xl leading-snug">你的巡演护照</h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{citySummary}</p>
      </header>

      <div className="city-passport-scroller flex min-h-0 flex-1 items-center" ref={scrollerRef}>
        {orderedMarkers.map((marker, index) => (
          <div className="city-passport-item shrink-0" data-city-passport-item={index} key={marker.cityName}>
            <CityStamp index={index} isPaused={isPaused} marker={marker} />
            <div className="mt-6 px-10 text-center">
              <p className="text-sm text-zinc-300">{marker.venue}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {[marker.subTheme, marker.versionName].filter(Boolean).join(' · ')}
              </p>
              {!marker.isVisited && <p className="mt-3 text-xs text-zinc-600">未解锁 · 等待你的下一次奔赴</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-6 pt-4 pb-8">
        {orderedMarkers.map((marker, index) => (
          <button
            aria-label={`跳转到 ${marker.cityName}`}
            className="city-passport-dot"
            data-active={index === activeIndex || undefined}
            data-visited={marker.isVisited || undefined}
            key={marker.cityName}
            onClick={() => scrollToIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}
