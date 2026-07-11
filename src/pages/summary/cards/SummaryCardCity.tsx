import { useSelector } from '@tanstack/react-store'
import type { Arc, Marker } from 'cobe'
import createGlobe from 'cobe'
import { useEffect, useMemo, useRef, useState } from 'react'

import { concertStore } from '@/stores/concert-store'
import type { SummaryCardProps } from '../summary-card-props'
import { useSummaryDataContext } from '../summary-data-context'

function formatCoord(value: number, posLabel: string, negLabel: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? posLabel : negLabel}`
}

/** cobe marker id reserved for the user's departure point. */
const ORIGIN_MARKER_ID = 'user-origin'

/** 蓝色电波 / 星轨的强调色（rgb 56,189,248 归一化），呼应「那一角蓝色的海」。 */
const ARC_COLOR: [number, number, number] = [0.22, 0.74, 0.97]

/** Milliseconds of unpaused globe time before the travel copy fades in. */
const COPY_REVEAL_DELAY = 600

interface TravelStory {
  /** 出发点 [lat, lng]，来自 getSummaryData 的 travelOrigin。 */
  origin: [number, number]
  /** 每座去过的城市的 [lat, lng]，即弧线的目标端点。 */
  targets: [number, number][]
}

/** cobe camera phi that puts the given longitude front and center (matches the cobe focus recipe). */
function phiForLongitude(longitude: number): number {
  return Math.PI * 1.5 - (longitude * Math.PI) / 180
}

/** Wraps an angle difference into [-π, π] so a focus rotation takes the shortest path. */
function normalizeAngleDiff(diff: number): number {
  const wrapped = diff % (2 * Math.PI)
  if (wrapped > Math.PI) return wrapped - 2 * Math.PI
  if (wrapped < -Math.PI) return wrapped + 2 * Math.PI
  return wrapped
}

/** Per-frame easing factor while the globe rotates toward a selected city. */
const FOCUS_EASING = 0.08
/** Angular distance below which a focus rotation snaps to its target and ambient spin resumes. */
const FOCUS_SNAP_EPSILON = 0.004

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

interface CityGlobeMarker extends Marker {
  /** 用户选中的场次是否覆盖该城市；高亮标记、标签样式与星轨目标都由它决定。 */
  isVisited: boolean
  /** 城市展示名，也用作 cobe marker 的 CSS anchor id。 */
  label: string
}

export function SummaryCardCity({ isPaused = false }: SummaryCardProps) {
  const { cityMarkers, mileage, travelOrigin, selectedShows: summarySelectedShows } = useSummaryDataContext()
  const selectedShows = useSelector(concertStore, (s) => s.selectedShows)
  const profileCity = useSelector(concertStore, (s) => s.profile.city)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stripRef = useRef<HTMLDivElement | null>(null)
  const isPausedRef = useRef(isPaused)
  // 初始聚焦用户去过的第一座城市；一场未选时回落到第一座巡演城市。
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(
      0,
      cityMarkers.findIndex((c) => c.isVisited)
    )
  )
  const initialIndexRef = useRef(currentIndex)
  /** 胶片条点选城市后地球要转向的目标 phi；null 表示恢复自转。 */
  const focusPhiRef = useRef<number | null>(null)
  const [isCopyVisible, setIsCopyVisible] = useState(false)

  const markers = useMemo<CityGlobeMarker[]>(
    () =>
      cityMarkers.map((c) => ({
        location: [c.latitude, c.longitude] as [number, number],
        label: c.cityName,
        isVisited: c.isVisited,
        size: c.isVisited ? 0.05 : 0.03,
        color: c.isVisited ? ARC_COLOR : undefined,
      })),
    [cityMarkers]
  )

  /** 星轨叙事仅在有出发点、有正里程且至少有一座去过的城市能落到地球上时启用。 */
  const travel = useMemo<TravelStory | null>(() => {
    if (!travelOrigin || mileage === null || mileage <= 0) return null
    const targets = markers.filter((m) => m.isVisited).map((m) => m.location)
    if (summarySelectedShows.length === 0 || targets.length === 0) return null
    return {
      origin: [travelOrigin.latitude, travelOrigin.longitude],
      targets,
    }
  }, [travelOrigin, mileage, summarySelectedShows, markers])

  const currentMarker = markers[currentIndex]
  const total = markers.length
  const departureCity = formatDepartureCity(profileCity)

  const showsInCurrentCity = useMemo(
    () =>
      currentMarker
        ? selectedShows
            .filter((s) => s.city === currentMarker.label)
            .slice()
            .sort((a, b) => a.showDate.localeCompare(b.showDate))
        : [],
    [selectedShows, currentMarker]
  )

  const handleSelectCity = (index: number) => {
    setCurrentIndex(index)
    const marker = markers[index]
    if (marker) focusPhiRef.current = phiForLongitude(marker.location[1])
  }

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // 当前城市变化时把它的胶片滚到条中央；首次（挂载定位）瞬时，之后平滑。
  const isFirstStripScrollRef = useRef(true)
  useEffect(() => {
    const chip = stripRef.current?.querySelectorAll('.summary-city-chip')[currentIndex]
    chip?.scrollIntoView({
      behavior: isFirstStripScrollRef.current ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
    isFirstStripScrollRef.current = false
  }, [currentIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || markers.length === 0) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const initialMarker = markers[initialIndexRef.current]
    let phi = travel
      ? phiForLongitude(travel.origin[1])
      : phiForLongitude(initialMarker ? initialMarker.location[1] : 0)
    let animationFrame = 0
    const devicePixelRatio = Math.min(window.devicePixelRatio, 1.5)

    const globeMarkers: Marker[] = travel
      ? [...markers, { id: ORIGIN_MARKER_ID, location: travel.origin, size: 0.05, color: ARC_COLOR }]
      : markers
    const arcs: Arc[] = travel ? travel.targets.map((to) => ({ from: travel.origin, to })) : []

    const globe = createGlobe(canvas, {
      devicePixelRatio,
      width: 600 * devicePixelRatio,
      height: 600 * devicePixelRatio,
      phi,
      theta: 0.2,
      dark: 1.1,
      diffuse: 1.8,
      baseColor: [1, 1, 1],
      markerColor: [0.3, 0.3, 0.3],
      markerElevation: 0,
      mapSamples: 12_000,
      mapBrightness: 6,
      glowColor: [0.1, 0.1, 0.1],
      markers: globeMarkers,
      arcs,
      arcColor: ARC_COLOR,
      arcWidth: 1.1,
      arcHeight: 0.22,
    })

    if (prefersReducedMotion && travel) setIsCopyVisible(true)

    // This clock only advances while the card is not paused, so the copy fades
    // in shortly after the page transition settles instead of mid-slide.
    let elapsed = 0
    let lastTime = performance.now()
    let isCopyRevealed = !travel || prefersReducedMotion

    function animate(now: number) {
      const delta = now - lastTime
      lastTime = now

      if (!isPausedRef.current) {
        elapsed += delta
        const focusPhi = focusPhiRef.current
        if (focusPhi === null) {
          phi += 0.003
        } else {
          // Ease toward the selected city along the shortest path, then resume ambient spin.
          const diff = normalizeAngleDiff(focusPhi - phi)
          if (Math.abs(diff) < FOCUS_SNAP_EPSILON) {
            phi = focusPhi
            focusPhiRef.current = null
          } else {
            phi += diff * FOCUS_EASING
          }
        }
        if (!isCopyRevealed && elapsed >= COPY_REVEAL_DELAY) {
          isCopyRevealed = true
          setIsCopyVisible(true)
        }
        globe.update({ phi })
      }
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
      globe.destroy()
    }
  }, [markers, travel])

  if (!currentMarker) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        暂无城市数据
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <div className="summary-globe-container" data-paused={isPaused || undefined}>
          <canvas className="summary-globe-canvas" ref={canvasRef} />
          <div aria-hidden="true" className="summary-globe-orbit-ring">
            <svg aria-hidden="true" className="summary-globe-orbit-svg" viewBox="0 0 300 300">
              <defs>
                <path d="M 150,150 m -130,0 a 130,130 0 1,0 260,0 a 130,130 0 1,0 -260,0" id="orbitPath" />
              </defs>
              <text className="summary-globe-orbit-text">
                <textPath href="#orbitPath">{'5525 MAYDAY · '.repeat(14)}</textPath>
              </text>
            </svg>
          </div>
          {travel && (
            <div
              aria-hidden="true"
              className="summary-globe-origin-pulse"
              style={
                {
                  positionAnchor: `--cobe-${ORIGIN_MARKER_ID}`,
                  opacity: `var(--cobe-visible-${ORIGIN_MARKER_ID}, 0)`,
                } as React.CSSProperties
              }
            />
          )}
        </div>

        {travel && mileage !== null && (
          <div className="summary-globe-travel-copy px-6 pt-1" data-visible={isCopyVisible || undefined}>
            <p className="summary-travel-line font-wjh text-sm text-white leading-relaxed">
              那一天，你从{departureCity ?? '家'}出发，跨越了{' '}
              <span className="summary-travel-distance">{mileage.toLocaleString('en-US')}</span>
              {' 公里，只为了奔赴那一角蓝色的海。'}
            </p>
            <p className="summary-travel-line mt-1.5 font-wjh text-xs text-zinc-400 leading-relaxed">
              你走过的所有路，都变成了舞台上亮起的逆风光。
            </p>
          </div>
        )}
      </div>

      <div className="z-20 shrink-0 border-zinc-800 border-t bg-zinc-950 px-6 pt-4 pb-8">
        <div className="summary-city-strip -mx-6 mb-4 px-6" ref={stripRef}>
          {markers.map((m, i) => (
            <button
              className="summary-city-chip"
              data-active={i === currentIndex || undefined}
              data-visited={m.isVisited || undefined}
              key={m.label}
              onClick={() => handleSelectCity(i)}
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-baseline justify-between">
          <p className="font-mono text-xs text-zinc-500">
            <span className="font-bold font-sans text-sm text-white tracking-tight">{currentMarker.label}</span>
            {' · '}
            {formatCoord(currentMarker.location[0], 'N', 'S')}, {formatCoord(currentMarker.location[1], 'E', 'W')}
          </p>
          <span className="font-mono text-xs text-zinc-600">
            {String(currentIndex + 1).padStart(2, '0')} / {total}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg bg-zinc-900 p-3">
            <p className="mb-1 text-xs text-zinc-500 uppercase tracking-widest">你在这里的场次</p>
            {showsInCurrentCity.length === 0 ? (
              <p className="mt-1 font-mono text-sm text-zinc-600">—</p>
            ) : (
              <div className="mt-1 flex flex-col gap-1">
                {showsInCurrentCity.map((show) => (
                  <p className="font-mono text-sm text-white" key={show.id}>
                    {show.dateSlash} · {show.dayLabel}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
