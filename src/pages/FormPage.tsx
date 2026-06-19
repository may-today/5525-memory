import { useMemo, useState } from "react"
import { useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import type { Show } from "@/types"
import showsRaw from "../../data/shows.json"

const allShows = (showsRaw as unknown as Show[]).filter(s => !s.isHidden)

interface CityGroup {
  city: string
  venue: string
  shows: Show[]
}

function buildCityGroups(): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const show of allShows) {
    if (!map.has(show.city)) {
      map.set(show.city, { city: show.city, venue: show.venue, shows: [] })
    }
    map.get(show.city)!.shows.push(show)
  }
  const groups = Array.from(map.values())
  for (const g of groups) {
    g.shows.sort((a, b) => a.showDate.localeCompare(b.showDate))
  }
  groups.sort((a, b) => a.shows[0].showDate.localeCompare(b.shows[0].showDate))
  return groups
}

const CITY_GROUPS = buildCityGroups()

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

/** Strip city prefix from venue name for compact display */
function getShortVenue(venue: string, city: string): string {
  return venue.startsWith(city) ? venue.slice(city.length) : venue
}

function formatShowDate(dateStr: string): string {
  return dateStr.replace(/-/g, ".")
}

function getDayAbbr(dateStr: string): string {
  return DAY_ABBR[new Date(dateStr + "T12:00:00").getDay()]
}

function SubThemeTag({ theme }: { theme: string }) {
  return (
    <span className="inline-flex items-center border border-muted-foreground/40 text-muted-foreground/60 px-1 py-px text-[9px] leading-none tracking-widest shrink-0">
      {theme}
    </span>
  )
}

export function FormPage() {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [expandedCities, setExpandedCities] = useState<Set<string>>(
    () => new Set(CITY_GROUPS.length > 0 ? [CITY_GROUPS[CITY_GROUPS.length - 1].city] : [])
  )

  function toggleShow(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCity(city: string) {
    setExpandedCities(prev => {
      const next = new Set(prev)
      if (next.has(city)) next.delete(city)
      else next.add(city)
      return next
    })
  }

  const { totalCount, primaryCity } = useMemo(() => {
    const totalCount = selectedIds.size
    if (totalCount === 0) return { totalCount: 0, primaryCity: "" }

    const cityCountMap = new Map<string, number>()
    for (const show of allShows) {
      if (selectedIds.has(show.id)) {
        cityCountMap.set(show.city, (cityCountMap.get(show.city) ?? 0) + 1)
      }
    }
    let maxCount = 0
    let primaryCity = ""
    for (const [city, count] of cityCountMap) {
      if (count > maxCount) {
        maxCount = count
        primaryCity = city
      }
    }
    return { totalCount, primaryCity }
  }, [selectedIds])

  function handleSubmit() {
    sessionStorage.setItem(
      "concert-form-data",
      JSON.stringify({ showIds: Array.from(selectedIds) })
    )
    navigate({ to: "/loading" })
  }

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
          Select Shows
        </p>
        <h1 className="font-wjh text-4xl font-bold leading-tight">按城市选择</h1>
      </div>

      {/* City accordion list */}
      <div className="flex-1 px-4 pb-4 flex flex-col gap-2">
        {CITY_GROUPS.map(group => {
          const isExpanded = expandedCities.has(group.city)
          const selectedCount = group.shows.filter(s => selectedIds.has(s.id)).length
          const shortVenue = getShortVenue(group.venue, group.city)

          return (
            <div key={group.city} className="border border-border overflow-hidden">
              {/* City header */}
              <button
                type="button"
                onClick={() => toggleCity(group.city)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/20 active:bg-muted/30 transition-colors"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-[15px] tracking-wide">{group.city}</span>
                  <span className="text-muted-foreground text-sm">· {shortVenue}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <span className="text-[10px] font-bold bg-foreground text-background px-1.5 py-0.5 leading-none tabular-nums">
                      {selectedCount}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                </div>
              </button>

              {/* Show rows */}
              {isExpanded && (
                <div className="border-t border-dashed border-border">
                  {group.shows.map(show => {
                    const isSelected = selectedIds.has(show.id)
                    return (
                      <button
                        key={show.id}
                        type="button"
                        onClick={() => toggleShow(show.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-dashed border-border last:border-b-0 hover:bg-muted/20 active:bg-muted/30 transition-colors"
                      >
                        {/* Square checkbox */}
                        <div
                          className={`size-[17px] flex-shrink-0 border transition-colors ${
                            isSelected
                              ? "bg-foreground border-foreground"
                              : "border-muted-foreground/50"
                          }`}
                        />

                        {/* Date + subTheme tag */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm tabular-nums shrink-0">
                            {formatShowDate(show.showDate)}
                          </span>
                          <SubThemeTag theme={show.subTheme} />
                        </div>

                        {/* Day · Time */}
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {getDayAbbr(show.showDate)} · {show.showStartTime}
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
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-3 pb-8">
        <p className="text-[11px] text-muted-foreground mb-2.5 tabular-nums">
          {totalCount === 0
            ? "尚未选择场次"
            : `已选 ${totalCount} 场${primaryCity ? ` · ${primaryCity}` : ""}`}
        </p>
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={totalCount === 0}
          onClick={handleSubmit}
        >
          下一步
        </Button>
      </div>
    </div>
  )
}
