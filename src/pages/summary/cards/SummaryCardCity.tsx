import { useSelector } from '@tanstack/react-store'
import type { Marker } from 'cobe'
import createGlobe from 'cobe'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { concertStore } from '@/stores/concert-store'
import { useSummaryDataContext } from '../summary-data-context'

function formatCoord(value: number, posLabel: string, negLabel: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? posLabel : negLabel}`
}

interface SummaryCardCityProps {
  isPaused?: boolean
}

export function SummaryCardCity({ isPaused = false }: SummaryCardCityProps) {
  const { cityMarkers } = useSummaryDataContext()
  const selectedShows = useSelector(concertStore, (s) => s.selectedShows)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPausedRef = useRef(isPaused)
  const [currentIndex, setCurrentIndex] = useState(0)

  const markers = useMemo(
    () =>
      cityMarkers.map((c) => ({
        id: c.cityName,
        location: [c.latitude, c.longitude] as [number, number],
        label: c.cityName,
        size: 0.03,
      })) as (Marker & { label: string })[],
    [cityMarkers]
  )

  const currentMarker = markers[currentIndex]
  const total = markers.length

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

  const handlePrev = () => setCurrentIndex((i) => (i - 1 + total) % total)
  const handleNext = () => setCurrentIndex((i) => (i + 1) % total)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || markers.length === 0) return

    let phi = 0
    let animationFrame = 0
    const devicePixelRatio = Math.min(window.devicePixelRatio, 1.5)

    const globe = createGlobe(canvas, {
      devicePixelRatio,
      width: 600 * devicePixelRatio,
      height: 600 * devicePixelRatio,
      phi: 0,
      theta: 0.2,
      dark: 1.1,
      diffuse: 1.8,
      baseColor: [1, 1, 1],
      markerColor: [0.3, 0.3, 0.3],
      markerElevation: 0,
      mapSamples: 12_000,
      mapBrightness: 6,
      glowColor: [0.1, 0.1, 0.1],
      markers,
    })

    function animate() {
      if (!isPausedRef.current) {
        phi += 0.003
        globe.update({ phi })
      }
      animationFrame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      globe.destroy()
    }
  }, [markers])

  if (!currentMarker) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-zinc-950 text-zinc-500 text-sm">
        暂无城市数据
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <p className="shrink-0 px-6 pt-6 pb-2 text-muted-foreground text-xs uppercase tracking-widest">
        01 / 场次信息-地图视角
      </p>

      <div className="min-h-0 flex-1">
        <div className="summary-globe-container" data-paused={isPaused || undefined}>
          <canvas className="summary-globe-canvas" ref={canvasRef} />
          <div aria-hidden="true" className="summary-globe-orbit-ring">
            <svg className="summary-globe-orbit-svg" viewBox="0 0 300 300">
              <defs>
                <path d="M 150,150 m -130,0 a 130,130 0 1,0 260,0 a 130,130 0 1,0 -260,0" id="orbitPath" />
              </defs>
              <text className="summary-globe-orbit-text">
                <textPath href="#orbitPath">{'5525 MAYDAY · '.repeat(14)}</textPath>
              </text>
            </svg>
          </div>
          {markers.map((m, i) => (
            <button
              className="summary-globe-marker-label"
              key={m.id}
              onClick={() => setCurrentIndex(i)}
              style={
                {
                  positionAnchor: `--cobe-${m.id}`,
                  opacity: `var(--cobe-visible-${m.id}, 0)`,
                  filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
                } as React.CSSProperties
              }
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="z-20 shrink-0 border-zinc-800 border-t bg-zinc-950 px-6 pt-4 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            aria-label="上一个城市"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            onClick={handlePrev}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-xs text-zinc-500">
            {currentIndex + 1} / {total}
          </span>
          <button
            aria-label="下一个城市"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            onClick={handleNext}
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <h2 className="mb-1 font-bold text-base text-white tracking-tight">{currentMarker.label}</h2>
        <p className="mb-4 font-mono text-xs text-zinc-500">
          {formatCoord(currentMarker.location[0], 'N', 'S')}, {formatCoord(currentMarker.location[1], 'E', 'W')}
        </p>

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
