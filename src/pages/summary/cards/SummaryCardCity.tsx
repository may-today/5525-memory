import type { Marker } from 'cobe'
import createGlobe from 'cobe'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const showcaseDefaultMarkers = [
  {
    id: 'taoyuan',
    location: [24.99, 121.3],
    label: '桃园',
    size: 0.03,
  },
  {
    id: 'singapore',
    location: [1.21, 103.49],
    label: '新加坡',
    size: 0.03,
  },
  {
    id: 'sydney',
    location: [-33.51, 151.12],
    label: '悉尼',
    size: 0.03,
  },
  {
    id: 'lasvegas',
    location: [36.17, -115.14],
    label: '拉斯维加斯',
    size: 0.03,
  },
  {
    id: 'tianjin',
    location: [39.08, 117.2],
    label: '天津',
    size: 0.03,
  },
  {
    id: 'hongkong',
    location: [22.32, 114.17],
    label: '香港',
    size: 0.03,
  },
  {
    id: 'hangzhou',
    location: [30.16, 120.12],
    label: '杭州',
    size: 0.03,
  },
  {
    id: 'herbin',
    location: [45.75, 126.64],
    label: '哈尔滨',
    size: 0.03,
  },
  {
    id: 'taipei',
    location: [25.02, 121.33],
    label: '台北',
    size: 0.03,
  },
  {
    id: 'beijing',
    location: [39.92, 116.36],
    label: '北京',
    size: 0.03,
  },
  {
    id: 'shanghai',
    location: [31.22, 121.48],
    label: '上海',
    size: 0.03,
  },
  {
    id: 'guiyang',
    location: [26.34, 106.42],
    label: '贵阳',
    size: 0.03,
  },
  {
    id: 'changsha',
    location: [28.11, 112.58],
    label: '长沙',
    size: 0.03,
  },
  {
    id: 'zhengzhou',
    location: [34.45, 113.38],
    label: '郑州',
    size: 0.03,
  },
  {
    id: 'xiamen',
    location: [24.46, 118.1],
    label: '厦门',
    size: 0.03,
  },
  {
    id: 'guangzhou',
    location: [23.16, 113.23],
    label: '广州',
    size: 0.03,
  },
  {
    id: 'taizhong',
    location: [24.08, 120.4],
    label: '台中',
    size: 0.03,
  },
] as (Marker & { label: string })[]

function formatCoord(value: number, posLabel: string, negLabel: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? posLabel : negLabel}`
}

export function SummaryCardCity() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentMarker = showcaseDefaultMarkers[currentIndex]
  const total = showcaseDefaultMarkers.length

  const handlePrev = () => setCurrentIndex((i) => (i - 1 + total) % total)
  const handleNext = () => setCurrentIndex((i) => (i + 1) % total)

  useEffect(() => {
    let phi = 0

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0.2,
      dark: 1.1,
      diffuse: 1.8,
      baseColor: [1, 1, 1],
      markerColor: [0.3, 0.3, 0.3],
      markerElevation: 0,
      mapSamples: 16_000,
      mapBrightness: 6,
      glowColor: [0.1, 0.1, 0.1],
      markers: showcaseDefaultMarkers,
    })

    function animate() {
      phi += 0.003
      globe.update({ phi })
      requestAnimationFrame(animate)
    }
    animate()

    return () => {
      globe.destroy()
    }
  }, [])

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <p className="shrink-0 px-6 pt-6 pb-2 text-muted-foreground text-xs uppercase tracking-widest">
        01 / 场次信息-地图视角
      </p>

      <div className="min-h-0 flex-1">
        <div className="summary-globe-container">
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
          {showcaseDefaultMarkers.map((m, i) => (
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
          {/* <div className="rounded-lg bg-zinc-900 p-3">
						<p className="mb-1 text-xs tracking-widest text-zinc-500 uppercase">
							纬度
						</p>
						<p className="font-mono text-sm text-white">
							{formatCoord(currentMarker.location[0], "N", "S")}
						</p>
					</div>
					<div className="rounded-lg bg-zinc-900 p-3">
						<p className="mb-1 text-xs tracking-widest text-zinc-500 uppercase">
							经度
						</p>
						<p className="font-mono text-sm text-white">
							{formatCoord(currentMarker.location[1], "E", "W")}
						</p>
					</div> */}
          <div className="rounded-lg bg-zinc-900 p-3">
            <p className="mb-1 text-xs text-zinc-500 uppercase tracking-widest">PLACEHOLDER</p>
            <div className="h-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
