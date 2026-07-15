import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { coverIdMap, getCoverImg } from '@/data/cover'
import { songList } from '@/data/song-list'
import { useSummaryDataContext } from '../summary-data-context'

interface AlbumStation {
  heardCount: number
  name: string
  totalCount: number
  year: number | undefined
}

/** Builds the nine official-album timeline stations from the music-wall listening state. */
function getAlbumStations(heardSongTitles: Set<string>): AlbumStation[] {
  return Object.keys(coverIdMap).map((name) => {
    const songs = songList.filter((song) => song.meta.album === name)
    const heardCount = songs.filter((song) => heardSongTitles.has(song.title)).length

    return { name, year: songs[0]?.meta.year, heardCount, totalCount: songs.length }
  })
}

/**
 * One album station on the chronology line: a huge ghost year behind the
 * cover (horizontal parallax), the cover developing from grayscale into color
 * by heard ratio, the album name and counts, and a node sitting on the line.
 */
function TimelineStation({ index, station }: { index: number; station: AlbumStation }) {
  const progress = station.totalCount > 0 ? station.heardCount / station.totalCount : 0
  const percent = Math.round(progress * 100)
  const isBelow = index % 2 === 1
  let unlockState = 'locked'
  if (progress === 1) {
    unlockState = 'full'
  } else if (progress > 0) {
    unlockState = 'partial'
  }

  return (
    <li
      aria-label={`《${station.name}》（${station.year} 年），已在现场听过 ${station.heardCount} / ${station.totalCount} 首，解锁 ${percent}%`}
      className="summary-tl-station"
      data-side={isBelow ? 'below' : 'above'}
      data-timeline-station
      data-unlock={unlockState}
      style={{ '--i': index, '--tl-progress': progress } as CSSProperties}
    >
      <span aria-hidden className="summary-tl-ghost font-geist">
        {station.year}
      </span>

      <div aria-hidden className="summary-tl-body">
        <img
          alt=""
          className="summary-tl-cover"
          height={88}
          loading="lazy"
          src={getCoverImg(station.name)}
          width={88}
        />
        <p className="summary-tl-name font-title">{station.name}</p>
        <p className="summary-tl-count">
          已听 <span className="font-title">{station.heardCount}</span>
          <span className="text-zinc-600"> / {station.totalCount}</span>
          <span className="summary-tl-percent font-title"> · {percent}%</span>
        </p>
        {unlockState === 'full' && <p className="summary-tl-complete">已完整解锁</p>}
      </div>

      <span aria-hidden className="summary-tl-stem" />
      <span aria-hidden className="summary-tl-node" />
      <span aria-hidden className="summary-tl-year font-geist">
        {station.year}
      </span>
    </li>
  )
}

/**
 * The nine-album "chronology line": one thin timeline running left to right
 * from the 1999 debut album to 2016's 自传, each album hanging on it as a
 * station. Unlock progress is expressed by the cover itself developing from
 * grayscale into full color — the user's live experience colors the
 * discography in. Horizontal scroll drives a subtle parallax on the ghost
 * years; heard state shares the music wall's exact tour appearance definition.
 */
export function SummaryCardAlbumProgress() {
  const { tourSongs } = useSummaryDataContext()
  const heardSongTitles = new Set(
    tourSongs.filter((song) => song.appearances.some((appearance) => appearance.isHeard)).map((song) => song.title)
  )
  const stations = getAlbumStations(heardSongTitles)
  const heardCount = stations.reduce((sum, station) => sum + station.heardCount, 0)
  const totalCount = stations.reduce((sum, station) => sum + station.totalCount, 0)
  const firstYear = stations[0]?.year
  const lastYear = stations.at(-1)?.year

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [isDeveloped, setIsDeveloped] = useState(false)

  // The one-off "develop" moment: after the line has drawn in, flip a single
  // state so every cover transitions (staggered in CSS) from grayscale to its
  // own progress color. Reduced motion reveals the final state immediately.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsDeveloped(true)
      return
    }
    const timer = setTimeout(() => setIsDeveloped(true), 900)
    return () => clearTimeout(timer)
  }, [])

  // Horizontal parallax: each rAF writes the station's viewport-centered
  // progress into --tl-par; the ghost year translates against the scroll so it
  // lags behind like a background layer. Skipped under prefers-reduced-motion.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId = 0
    const update = () => {
      rafId = 0
      const scrollerRect = scroller.getBoundingClientRect()
      if (scrollerRect.width === 0) return
      const scrollerCenter = scrollerRect.left + scrollerRect.width / 2
      for (const station of scroller.querySelectorAll<HTMLElement>('[data-timeline-station]')) {
        const rect = station.getBoundingClientRect()
        const progress = (rect.left + rect.width / 2 - scrollerCenter) / scrollerRect.width
        station.style.setProperty('--tl-par', Math.max(-1, Math.min(1, progress)).toFixed(4))
      }
    }
    const scheduleUpdate = () => {
      if (rafId === 0) rafId = requestAnimationFrame(update)
    }

    scroller.addEventListener('scroll', scheduleUpdate, { passive: true })
    update()
    return () => {
      scroller.removeEventListener('scroll', scheduleUpdate)
      if (rafId !== 0) cancelAnimationFrame(rafId)
    }
  }, [])

  const overallPercent = totalCount > 0 ? Math.round((heardCount / totalCount) * 100) : 0

  return (
    <div className="summary-tl-card flex h-svh flex-col bg-zinc-950" data-developed={isDeveloped || undefined}>
      <div className="shrink-0 px-6 pt-6">
        <h3 className="font-title text-white text-xl leading-snug">九张专辑，解锁成你的五月天。</h3>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          从 <span className="font-geist text-zinc-200">{firstYear}</span> 的《第一张创作专辑》，到{' '}
          <span className="font-geist text-zinc-200">{lastYear}</span> 的《自传》，九张专辑共{' '}
          <span className="font-geist text-zinc-200">{totalCount}</span> 首歌。
          {heardCount > 0 ? (
            <>
              你已在现场听过其中 <span className="font-geist text-sky-300">{heardCount}</span> 首。
            </>
          ) : (
            <>选好你去过的场次，这条年表才会开始显影。</>
          )}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <p className="shrink-0 text-[10px] text-zinc-500 tracking-wider">年表点亮</p>
          <div
            aria-label={`九张专辑整体解锁 ${overallPercent}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={overallPercent}
            className="summary-tl-meter"
            role="progressbar"
          >
            <div className="summary-tl-meter-fill" style={{ width: `${overallPercent}%` }} />
          </div>
          <p className="shrink-0 font-geist text-sky-300 text-xs">{overallPercent}%</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="summary-space-scroller summary-tl-scroller overflow-x-auto" ref={scrollerRef}>
          <ol aria-label="九张正式专辑解锁年表" className="summary-tl-strip">
            {stations.map((station, index) => (
              <TimelineStation index={index} key={station.name} station={station} />
            ))}
          </ol>
        </div>
      </div>

      <p className="shrink-0 px-6 pb-24 text-[10px] text-zinc-600">
        口径：以九张正式专辑收录曲为分母；仅在你到场的巡演场次中听过，封面才会显出颜色。
      </p>
    </div>
  )
}
