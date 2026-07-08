import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  clearSelectedShows,
  concertStore,
  hydrateSelectedShows,
  toggleSelectedShow,
} from '@/stores/concert-store'
import type { Show } from '@/types'

const routeApi = getRouteApi('/form')

interface CityGroup {
  city: string
  shows: Show[]
  venue: string
}

function buildCityGroups(allShows: Show[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const show of allShows) {
    const existingGroup = map.get(show.city)
    if (existingGroup) {
      existingGroup.shows.push(show)
    } else {
      map.set(show.city, { city: show.city, venue: show.venue, shows: [show] })
    }
  }
  const groups = Array.from(map.values())
  for (const g of groups) {
    g.shows.sort((a, b) => a.showDate.localeCompare(b.showDate))
  }
  groups.sort((a, b) => a.shows[0].showDate.localeCompare(b.shows[0].showDate))
  return groups
}

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/** Strip city prefix from venue name for compact display */
function getShortVenue(venue: string, city: string): string {
  return venue.startsWith(city) ? venue.slice(city.length) : venue
}

function formatShowDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}

function getDayAbbr(dateStr: string): string {
  return DAY_ABBR[new Date(`${dateStr}T12:00:00`).getDay()]
}

function SubThemeTag({ theme }: { theme: string }) {
  return (
    <span className="inline-flex shrink-0 items-center border border-muted-foreground/40 px-1 py-px text-[9px] text-muted-foreground/60 leading-none tracking-widest">
      {theme}
    </span>
  )
}

export function FormPage() {
  const navigate = useNavigate()
  const allShows = routeApi.useLoaderData()
  const CITY_GROUPS = useMemo(() => buildCityGroups(allShows), [allShows])
  const selectedShows = useSelector(concertStore, (state) => state.selectedShows)
  const selectedIds = useMemo(() => new Set(selectedShows.map((show) => show.id)), [selectedShows])
  const totalCount = selectedShows.length
  const [expandedCities, setExpandedCities] = useState<Set<string>>(() => {
    const lastGroup = CITY_GROUPS.at(-1)
    return new Set(lastGroup ? [lastGroup.city] : [])
  })

  useEffect(() => {
    hydrateSelectedShows(allShows)
  }, [allShows])

  function toggleCity(city: string) {
    setExpandedCities((prev) => {
      const next = new Set(prev)
      if (next.has(city)) {
        next.delete(city)
      } else {
        next.add(city)
      }
      return next
    })
  }

  function handleSubmit() {
    navigate({ to: '/loading' })
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Select Shows</p>
        <h1 className="font-bold font-wjh text-4xl leading-tight">按城市选择</h1>
      </div>

      {/* City accordion list */}
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        {CITY_GROUPS.map((group) => {
          const isExpanded = expandedCities.has(group.city)
          const selectedCount = group.shows.filter((s) => selectedIds.has(s.id)).length
          const shortVenue = getShortVenue(group.venue, group.city)

          return (
            <div className="overflow-hidden border border-border" key={group.city}>
              {/* City header */}
              <button
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-muted/20 active:bg-muted/30"
                onClick={() => toggleCity(group.city)}
                type="button"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-[15px] tracking-wide">{group.city}</span>
                  <span className="text-muted-foreground text-sm">· {shortVenue}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <span className="bg-foreground px-1.5 py-0.5 font-bold text-[10px] text-background tabular-nums leading-none">
                      {selectedCount}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </button>

              {/* Show rows */}
              {isExpanded && (
                <div className="border-border border-t border-dashed">
                  {group.shows.map((show) => {
                    const isSelected = selectedIds.has(show.id)
                    return (
                      <button
                        className="flex w-full items-center gap-3 border-border border-b border-dashed px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/20 active:bg-muted/30"
                        key={show.id}
                        onClick={() => toggleSelectedShow(show)}
                        type="button"
                      >
                        {/* Square checkbox */}
                        <div
                          className={`size-[17px] flex-shrink-0 border transition-colors ${
                            isSelected ? 'border-foreground bg-foreground' : 'border-muted-foreground/50'
                          }`}
                        />

                        {/* Date + subTheme tag */}
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="shrink-0 text-sm tabular-nums">{formatShowDate(show.showDate)}</span>
                          <SubThemeTag theme={show.subTheme} />
                        </div>

                        {/* Day */}
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {getDayAbbr(show.showDate)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 border-border border-t bg-background/95 px-4 pt-3 pb-8 backdrop-blur-sm">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {totalCount === 0 ? '尚未选择场次' : `已选 ${totalCount} 场`}
          </p>
          {totalCount > 0 && (
            <button
              className="shrink-0 text-[11px] text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
              onClick={clearSelectedShows}
              type="button"
            >
              清空
            </button>
          )}
        </div>
        <Button className="w-full" disabled={totalCount === 0} onClick={handleSubmit} size="lg" type="button">
          下一步
        </Button>
      </div>
    </div>
  )
}
