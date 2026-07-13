import { useMemo } from 'react'

import type { GuestShow } from '@/server/summary'
import { getGuestAvatar } from '../guest-avatars'
import { useSummaryDataContext } from '../summary-data-context'

interface GuestEncounter {
  city: string
  dateSlash: string
  showDate: string
}

/** Fixed planet color for all guest encounters — Show themeColor is no longer part of SummaryShowInfo. */
const PLANET_COLOR = '#f97316'

interface GuestPlanet {
  encounters: GuestEncounter[]
  name: string
}

/** Planet diameters (px) cycled by column index. */
const SLOT_SIZE = [96, 72, 84, 64, 104, 76, 88, 68]

/** Vertical offsets cycled by column index — scatters planets into a loose constellation band. */
const SLOT_Y = ['4svh', '30svh', '14svh', '36svh', '2svh', '24svh', '10svh', '32svh']

/** Diameter of the zero-state "band planet". */
const BAND_PLANET_SIZE = 160

/** Show the horizontal-scroll hint once the field is likely to overflow a phone viewport. */
const SCROLL_HINT_MIN_PLANETS = 4

/**
 * Aggregates visited guest shows into one planet per guest, deterministically
 * ordered by first-encounter date (ties broken by name) so slot assignment is
 * stable across renders and SSR.
 */
function buildGuestPlanets(guestShows: GuestShow[]): GuestPlanet[] {
  const planetsByName = new Map<string, GuestPlanet>()
  for (const guestShow of guestShows) {
    if (!guestShow.isVisited) continue
    for (const name of guestShow.guests) {
      const encounter: GuestEncounter = {
        city: guestShow.show.city,
        dateSlash: guestShow.show.dateSlash,
        showDate: guestShow.showDate,
      }
      const existing = planetsByName.get(name)
      if (existing) {
        existing.encounters.push(encounter)
      } else {
        planetsByName.set(name, { name, encounters: [encounter] })
      }
    }
  }

  const planets = [...planetsByName.values()]
  for (const planet of planets) {
    planet.encounters.sort((a, b) => a.showDate.localeCompare(b.showDate))
  }
  planets.sort(
    (a, b) =>
      (a.encounters[0]?.showDate ?? '').localeCompare(b.encounters[0]?.showDate ?? '') ||
      a.name.localeCompare(b.name, 'zh')
  )
  return planets
}

function SpaceBackground() {
  return (
    <>
      <div aria-hidden="true" className="summary-space-bg" />
      <div aria-hidden="true" className="summary-space-stars" />
      <div aria-hidden="true" className="summary-space-stars summary-space-stars-twinkle" />
      <div aria-hidden="true" className="summary-space-shooting-star" />
    </>
  )
}

function PlanetRow({ index, planet }: { index: number; planet: GuestPlanet }) {
  const first = planet.encounters[0]
  if (!first) return null
  const size = SLOT_SIZE[index % SLOT_SIZE.length]
  const isFar = index % 3 === 1
  const dateLabel = planet.encounters.length > 1 ? `${first.dateSlash} ×${planet.encounters.length}` : first.dateSlash

  return (
    <div
      className={`summary-guest-planet-row flex shrink-0 flex-col items-center gap-2 ${
        isFar ? 'summary-guest-planet-row--far' : ''
      }`}
      style={{ '--i': index, marginTop: SLOT_Y[index % SLOT_Y.length] } as React.CSSProperties}
    >
      <div
        className="summary-guest-planet"
        style={{ '--planet-size': `${size}px`, '--planet-color': PLANET_COLOR } as React.CSSProperties}
      >
        <img alt={`嘉宾 ${planet.name}`} height={size} src={getGuestAvatar(planet.name)} width={size} />
        <span aria-hidden="true" className="summary-guest-planet-shade" />
        {index % 3 === 2 && <span aria-hidden="true" className="summary-guest-planet-ring" />}
      </div>
      <p className="max-w-36 break-words text-center font-bold text-sm text-white">{planet.name}</p>
      <p className="font-mono text-xs text-zinc-500">
        {dateLabel} · {first.city}
      </p>
    </div>
  )
}

export function SummaryCardGuests() {
  const { guestStats } = useSummaryDataContext()
  const planets = useMemo(() => buildGuestPlanets(guestStats.guestShows), [guestStats.guestShows])

  if (planets.length === 0) {
    return (
      <div className="relative flex h-svh flex-col overflow-hidden bg-zinc-950">
        <SpaceBackground />
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-6 pb-24">
          <div
            className="summary-guest-planet summary-guest-planet-row"
            style={
              {
                '--i': 0,
                '--planet-size': `${BAND_PLANET_SIZE}px`,
                '--planet-color': PLANET_COLOR,
              } as React.CSSProperties
            }
          >
            <img alt="五月天" height={BAND_PLANET_SIZE} src={getGuestAvatar('五月天')} width={BAND_PLANET_SIZE} />
            <span aria-hidden="true" className="summary-guest-planet-shade" />
            <span aria-hidden="true" className="summary-guest-planet-ring" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 font-title text-white text-xl">你没有撞见特别嘉宾</h3>
            <p className="text-sm text-zinc-400">但台上的五个人，已经是一颗足够完整的星球。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-zinc-950">
      <SpaceBackground />
      <h3 className="relative shrink-0 px-6 pt-6 font-title text-white text-xl leading-snug">
        在 5525 的多重宇宙里，有些星球你只撞见过一次。
      </h3>
      <p className="relative mt-2 shrink-0 px-6 text-sm text-zinc-400">今年，有 {planets.length} 位嘉宾与你同场。</p>
      {planets.length >= SCROLL_HINT_MIN_PLANETS && (
        <p className="relative mt-1 shrink-0 px-6 text-xs text-zinc-600">向左滑动，探索更多星球 →</p>
      )}

      <div className="relative min-h-0 flex-1">
        <div className="summary-space-scroller h-full overflow-x-auto overflow-y-hidden">
          <div className="flex h-full w-max min-w-full items-start justify-center gap-10 px-12 pt-6">
            {planets.map((planet, index) => (
              <PlanetRow index={index} key={planet.name} planet={planet} />
            ))}
          </div>
        </div>
      </div>

      <p className="relative shrink-0 px-6 pb-24 text-xs text-zinc-500">
        这些跨次元碰撞，让属于你的那一场五月天，永远不会被复制。
      </p>
    </div>
  )
}
