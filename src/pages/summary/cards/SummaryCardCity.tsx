import { useSelector } from '@tanstack/react-store'
import type { Arc, Marker } from 'cobe'
import createGlobe from 'cobe'
import { type CSSProperties, useEffect, useMemo, useRef } from 'react'

import { concertStore } from '@/stores/concert-store'
import type { SummaryCardProps } from '../summary-card-props'
import { useSummaryDataContext } from '../summary-data-context'

/** cobe marker id reserved for the user's departure point. */
const ORIGIN_MARKER_ID = 'user-origin'

/** 蓝色电波 / 星轨的强调色（rgb 56,189,248 归一化），呼应「那一角蓝色的海」。 */
const ARC_COLOR: [number, number, number] = [0.22, 0.74, 0.97]

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
  const profileCity = useSelector(concertStore, (s) => s.profile.city)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPausedRef = useRef(isPaused)
  const initialMarkerRef = useRef<CityGlobeMarker | null>(null)

  const markers = useMemo<CityGlobeMarker[]>(
    () =>
      cityMarkers.map((c, index) => ({
        id: `city-${index}`,
        location: [c.latitude, c.longitude] as [number, number],
        label: c.cityName,
        isVisited: c.isVisited,
        size: c.isVisited ? 0.05 : 0.03,
        color: c.isVisited ? ARC_COLOR : undefined,
      })),
    [cityMarkers]
  )

  if (initialMarkerRef.current === null && markers[0]) {
    initialMarkerRef.current = markers.find((marker) => marker.isVisited) ?? markers[0]
  }

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

  const departureCity = formatDepartureCity(profileCity)
  const visitedCityCount = markers.filter((marker) => marker.isVisited).length
  let citySummary = '还没有点亮城市坐标，回到上一步选择你去过的场次。'
  if (visitedCityCount > 0) {
    citySummary = `你去了 ${visitedCityCount} 个城市，每一次抵达，都是为那一角蓝色的海。`
    if (travel && mileage !== null) {
      citySummary = `你去了 ${visitedCityCount} 个城市，从${departureCity ?? '家'}出发，跨越 ${mileage.toLocaleString('en-US')} 公里，奔赴每一场相见。`
    }
  }

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || markers.length === 0) return

    const initialMarker = initialMarkerRef.current
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
      arcWidth: 0.8,
      arcHeight: 0.22,
    })

    function animate() {
      if (!isPausedRef.current) {
        phi += 0.003
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

  if (markers.length === 0) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        暂无城市数据
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="font-title text-white text-xl leading-snug">你的巡演城市地图</h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{citySummary}</p>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-14">
        <div className="summary-globe-container aspect-square w-full max-w-[42rem]" data-paused={isPaused || undefined}>
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
          {markers.map((marker) => (
            <span
              className="summary-globe-marker-label"
              data-visited={marker.isVisited || undefined}
              key={marker.id}
              style={
                {
                  positionAnchor: `--cobe-${marker.id}`,
                  opacity: `var(--cobe-visible-${marker.id}, 0)`,
                } as CSSProperties
              }
            >
              {marker.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
