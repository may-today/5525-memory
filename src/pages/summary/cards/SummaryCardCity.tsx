import { useSelector } from '@tanstack/react-store'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getSubThemeColor, SUB_THEME_COLORS } from '@/lib/sub-theme-colors'
import type { CityMarker } from '@/server/summary'
import { concertStore } from '@/stores/concert-store'
import type { SummaryCardProps } from '../summary-card-props'
import { useSummaryDataContext } from '../summary-data-context'

/** 行政区划后缀，从出发城市展示名中去掉（北京市→北京、新疆维吾尔自治区→新疆）。 */
const CITY_SUFFIX_PATTERN = /(?:维吾尔|壮族|回族)?自治区$|特别行政区$|[省市]$/

/** 印章微倾角（deg）：真实护照印章从不端正，按序号循环取固定倾角。 */
const STAMP_ROTATIONS = [-3.5, 2.5, -1.5, 3.5, -2.5, 1.5] as const

/** MRZ 机读行的固定宽度（字符数），不足部分用护照机读区的 `<` 填充符补齐。 */
const MRZ_LINE_LENGTH = 36

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

/** 城市印章的固定微倾角。 */
function getStampRotation(index: number): string {
  return `${STAMP_ROTATIONS[index % STAMP_ROTATIONS.length]}deg`
}

/** 迷你印章的更小倾角：网格里成片出现时只保留轻微手工感。 */
function getMiniStampRotation(index: number): string {
  return `${(STAMP_ROTATIONS[index % STAMP_ROTATIONS.length] ?? 0) * 0.8}deg`
}

/** MRZ 机读行：补齐到固定宽度，内容始终来自真实统计数据而非装饰性乱码。 */
function padMrzLine(text: string): string {
  return text.padEnd(MRZ_LINE_LENGTH, '<').slice(0, MRZ_LINE_LENGTH)
}

/** 子主题在渐变里的固定色序：粉 → 蓝 → 橙 相邻过渡不发灰，未知主题排最后。 */
const SUB_THEME_GRADIENT_ORDER = Object.keys(SUB_THEME_COLORS)

/**
 * 印章墨色序列（「彩虹印台」）：城市覆盖的全部子主题按固定色序映射为主题色并
 * 去重。跨子主题城市（如北京横跨三段巡演）得到多段渐变，单主题城市只有一色。
 */
function getStampInkColors(marker: CityMarker): string[] {
  const orderedThemes = [...marker.subThemes].sort(
    (a, b) =>
      (SUB_THEME_GRADIENT_ORDER.indexOf(a) + 1 || Number.MAX_SAFE_INTEGER) -
      (SUB_THEME_GRADIENT_ORDER.indexOf(b) + 1 || Number.MAX_SAFE_INTEGER)
  )
  const colors = [...new Set(orderedThemes.map((theme) => getSubThemeColor(theme, marker.themeColor)))]
  return colors.length > 0 ? colors : [getSubThemeColor(marker.subTheme, marker.themeColor)]
}

interface CityStampProps {
  index: number
  isPaused: boolean
  /** 该城市页是否已被滑入过视口——到场城市据此触发一次性「盖章」动画。 */
  isStamped: boolean
  marker: CityMarker
}

function CityStamp({ index, isPaused, isStamped, marker }: CityStampProps) {
  const inkColors = getStampInkColors(marker)
  const color = inkColors[0] ?? getSubThemeColor(marker.subTheme, marker.themeColor)
  const ringText = buildRingText(marker)
  const ringPathId = `city-stamp-ring-${index}`
  const inkGradientId = `city-stamp-ink-${index}`
  const hasGradientInk = inkColors.length > 1
  const firstVisitedDate = marker.visitedShowDates[0]
  const extraVisitedCount = marker.visitedShowDates.length - 1

  return (
    <div
      className="city-stamp mx-auto aspect-square w-full max-w-[19rem]"
      data-paused={isPaused || undefined}
      data-stamped={(marker.isVisited && isStamped) || undefined}
      data-visited={marker.isVisited || undefined}
      style={{
        ['--stamp-color' as string]: color,
        ['--stamp-ink' as string]: hasGradientInk ? `url(#${inkGradientId})` : color,
        ['--stamp-rotation' as string]: getStampRotation(index),
      }}
    >
      <svg aria-hidden="true" className="city-stamp-svg" viewBox="0 0 200 200">
        <defs>
          <path d="M 100,100 m -80,0 a 80,80 0 1,0 160,0 a 80,80 0 1,0 -160,0" id={ringPathId} />
          {hasGradientInk && (
            <linearGradient gradientUnits="userSpaceOnUse" id={inkGradientId} x1="34" x2="166" y1="34" y2="166">
              {inkColors.map((inkColor, stopIndex) => (
                <stop key={inkColor} offset={stopIndex / (inkColors.length - 1)} stopColor={inkColor} />
              ))}
            </linearGradient>
          )}
        </defs>
        <circle className="city-stamp-outer-ring" cx="100" cy="100" r="92" />
        <circle className="city-stamp-ticks" cx="100" cy="100" r="87" />
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
  const scrollAnimationRef = useRef<number | null>(null)
  const entryHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasPlayedEntryHintRef = useRef(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [stampedIndexes, setStampedIndexes] = useState<Set<number>>(() => new Set())

  // 去过的城市优先展示，未去过的排在后面；组内维持服务端返回的时间顺序。
  const orderedMarkers = useMemo(() => {
    const visited = cityMarkers.filter((marker) => marker.isVisited)
    const unvisited = cityMarkers.filter((marker) => !marker.isVisited)
    return [...visited, ...unvisited]
  }, [cityMarkers])

  const visitedCityCount = orderedMarkers.filter((marker) => marker.isVisited).length
  const departureCity = formatDepartureCity(profileCity)

  let citySummary: ReactNode = '还没有点亮任何城市，回到上一步选择你去过的场次。'
  if (visitedCityCount > 0) {
    citySummary =
      mileage !== null && mileage > 0 ? (
        <>
          你去了 <span className="overview-count text-base">{visitedCityCount}</span> 个城市，从
          {departureCity ?? '家'}出发，跨越{' '}
          <span className="overview-count text-base">{mileage.toLocaleString('en-US')}</span>{' '}
          公里，奔赴每一场相见。
        </>
      ) : (
        <>
          你去了 <span className="overview-count text-base">{visitedCityCount}</span>{' '}
          个城市，每一枚印章，都是为那一角蓝色的海。
        </>
      )
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

  // 城市页首次滑入即「盖章」：只对到场城市记录一次，之后保持盖章状态不重播。
  useEffect(() => {
    if (activeIndex === 0) return
    const marker = orderedMarkers[activeIndex - 1]
    if (!marker?.isVisited) return
    setStampedIndexes((prev) => {
      if (prev.has(activeIndex)) return prev
      const next = new Set(prev)
      next.add(activeIndex)
      return next
    })
  }, [activeIndex, orderedMarkers])

  /** 取消提示或翻页动画，并恢复容器的横向 snap。 */
  const cancelPassportMotion = useCallback(() => {
    if (entryHintTimeoutRef.current !== null) {
      clearTimeout(entryHintTimeoutRef.current)
      entryHintTimeoutRef.current = null
    }
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }
    if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = ''
  }, [])

  // 切页完成后让护照向右轻探再归位，提示首页后面还有可横滑展开的城市页。
  // 用户已开始操作、容器已不在首页或系统要求减少动态效果时不再打扰。
  useEffect(() => {
    const scroller = scrollerRef.current
    if (isPaused || !scroller || hasPlayedEntryHintRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    entryHintTimeoutRef.current = setTimeout(() => {
      entryHintTimeoutRef.current = null
      if (scrollAnimationRef.current !== null || Math.abs(scroller.scrollLeft) > 1) return

      hasPlayedEntryHintRef.current = true
      const start = scroller.scrollLeft
      const distance = Math.min(56, scroller.clientWidth * 0.15)
      const duration = 1000
      const startTime = performance.now()
      scroller.style.scrollSnapType = 'none'

      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration)
        // sin² 从 0 平滑探到峰值后回到 0，首尾速度均为 0。
        const offsetProgress = Math.sin(Math.PI * progress) ** 2
        scroller.scrollLeft = start + distance * offsetProgress
        if (progress < 1) {
          scrollAnimationRef.current = requestAnimationFrame(step)
        } else {
          scroller.scrollLeft = start
          scrollAnimationRef.current = null
          scroller.style.scrollSnapType = ''
        }
      }
      scrollAnimationRef.current = requestAnimationFrame(step)
    }, 450)

    return cancelPassportMotion
  }, [cancelPassportMotion, isPaused])

  // 清理未完成的提示 / 翻页动画，避免卸载后继续写 scrollLeft。
  useEffect(
    () => () => {
      if (entryHintTimeoutRef.current !== null) clearTimeout(entryHintTimeoutRef.current)
      if (scrollAnimationRef.current !== null) cancelAnimationFrame(scrollAnimationRef.current)
      if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = ''
    },
    []
  )

  /**
   * 平滑翻页到指定卡片。不用原生 smooth scrollIntoView：Chrome 在
   * `scroll-snap-type: x mandatory` 容器上会把进行中的 smooth 滚动中途取消
   * （实测停在非 snap 位置），改用 RAF 自绘缓动并在动画期间临时关掉 snap；
   * reduced-motion 下瞬时跳转。
   */
  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current
    if (!scroller) return
    cancelPassportMotion()

    const target = index * scroller.clientWidth
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scroller.scrollLeft = target
      return
    }

    const start = scroller.scrollLeft
    const distance = target - start
    if (distance === 0) return
    // 跨的页数越多时长越长，封顶 700ms，翻远页不至于拖沓。
    const duration = Math.min(700, 320 + (Math.abs(distance) / scroller.clientWidth) * 60)
    const startTime = performance.now()
    scroller.style.scrollSnapType = 'none'

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - (1 - progress) ** 3
      scroller.scrollLeft = start + distance * eased
      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(step)
      } else {
        scrollAnimationRef.current = null
        scroller.style.scrollSnapType = ''
      }
    }
    scrollAnimationRef.current = requestAnimationFrame(step)
  }

  if (orderedMarkers.length === 0) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        暂无城市数据
      </div>
    )
  }

  const activeMarker = activeIndex > 0 ? orderedMarkers[activeIndex - 1] : undefined
  // 环境光：护照首页用全站蓝，已盖章城市用其主题色，未盖章城市保持无光的中性灰。
  let ambientColor = '#38bdf8'
  if (activeMarker) {
    ambientColor = activeMarker.isVisited
      ? getSubThemeColor(activeMarker.subTheme, activeMarker.themeColor)
      : '#52525b'
  }

  return (
    <div className="relative isolate flex h-svh flex-col overflow-hidden bg-zinc-950">
      <div
        aria-hidden="true"
        className="city-passport-ambient -z-10"
        style={{ ['--city-ambient' as string]: ambientColor }}
      />

      <header className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="font-title text-white text-xl leading-snug">你的巡演护照</h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{citySummary}</p>
      </header>

      <div
        className="city-passport-scroller flex min-h-0 flex-1 items-center"
        onPointerDown={cancelPassportMotion}
        onWheel={cancelPassportMotion}
        ref={scrollerRef}
      >
        {/* 护照首页：全部城市的印章总览，翻开护照先看到自己的收集进度 */}
        <div className="city-passport-item shrink-0" data-city-passport-item={0}>
          <div className="mx-auto flex w-full max-w-[21rem] flex-col items-center px-6">
            <p className="city-passport-eyebrow font-mono">MAYDAY #5525 · TOUR PASSPORT</p>
            <p className="mt-4 font-geist text-4xl leading-none">
              <span className="city-passport-count">{String(visitedCityCount).padStart(2, '0')}</span>
              <span className="city-passport-count-total"> / {orderedMarkers.length}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {visitedCityCount > 0 ? '座城市已盖章' : '还没有盖下第一枚城市印章'}
            </p>

            <div className="mt-7 grid w-full grid-cols-5 gap-2.5">
              {orderedMarkers.map((marker, index) => {
                const inkColors = getStampInkColors(marker)
                return (
                  <button
                    aria-label={`翻到 ${marker.cityName}`}
                    className="city-mini-stamp"
                    data-visited={marker.isVisited || undefined}
                    key={marker.cityName}
                    onClick={() => scrollToIndex(index + 1)}
                    style={{
                      ['--stamp-color' as string]: inkColors[0],
                      ['--mini-rotation' as string]: getMiniStampRotation(index),
                      ['--i' as string]: index,
                      // 跨子主题城市的迷你章底色用同一份「彩虹印台」渐变；描边
                      // 与辉光保持首色，小尺寸下渐变描边只会糊掉。
                      ...(marker.isVisited && inkColors.length > 1
                        ? {
                            background: `linear-gradient(135deg, ${inkColors
                              .map((inkColor) => `color-mix(in srgb, ${inkColor} 14%, transparent)`)
                              .join(', ')})`,
                          }
                        : undefined),
                    }}
                    type="button"
                  >
                    <span className="city-mini-stamp-name">{marker.cityName}</span>
                  </button>
                )
              })}
            </div>

            <div aria-hidden="true" className="city-passport-mrz mt-8 font-mono">
              <p>{padMrzLine('P<5525MAYDAY<WORLD<TOUR<PASSPORT')}</p>
              <p>
                {padMrzLine(
                  `V${String(visitedCityCount).padStart(2, '0')}<OF<${orderedMarkers.length}<CITIES${
                    mileage !== null && mileage > 0 ? `<KM<${mileage}` : ''
                  }`
                )}
              </p>
            </div>
          </div>
        </div>

        {orderedMarkers.map((marker, index) => {
          const markerColor = getSubThemeColor(marker.subTheme, marker.themeColor)
          return (
            <div className="city-passport-item shrink-0" data-city-passport-item={index + 1} key={marker.cityName}>
              <CityStamp
                index={index}
                isPaused={isPaused}
                isStamped={stampedIndexes.has(index + 1)}
                marker={marker}
              />
              <div className="mt-7 px-10 text-center">
                <p className="text-sm text-zinc-200 tracking-wide">{marker.venue}</p>
                <p
                  className="mt-1.5 text-xs"
                  style={
                    marker.isVisited
                      ? { color: `color-mix(in srgb, ${markerColor} 62%, #a1a1aa)` }
                      : undefined
                  }
                >
                  <span className={marker.isVisited ? undefined : 'text-zinc-600'}>
                    {[marker.subTheme, marker.versionName].filter(Boolean).join(' · ')}
                  </span>
                </p>
                {!marker.isVisited && <p className="mt-3 text-xs text-zinc-600">未解锁 · 等待你的下一次奔赴</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* pb-20 给 SummaryContainer 底部悬浮的「滑动探索」引导让位，避免与 dots 重叠 */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-6 pt-4 pb-20">
        <button
          aria-label="翻到护照首页"
          className="city-passport-dot city-passport-dot-index"
          data-active={activeIndex === 0 || undefined}
          onClick={() => scrollToIndex(0)}
          type="button"
        />
        {orderedMarkers.map((marker, index) => (
          <button
            aria-label={`跳转到 ${marker.cityName}`}
            className="city-passport-dot"
            data-active={index + 1 === activeIndex || undefined}
            data-visited={marker.isVisited || undefined}
            key={marker.cityName}
            onClick={() => scrollToIndex(index + 1)}
            style={{
              ['--dot-color' as string]: marker.isVisited
                ? getSubThemeColor(marker.subTheme, marker.themeColor)
                : '#a1a1aa',
            }}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}
