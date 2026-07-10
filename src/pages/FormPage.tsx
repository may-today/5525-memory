import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { geoCoordMap } from '@/data/geo-coord'
import {
  clearSelectedShows,
  concertStore,
  hydrateConcertProfile,
  hydrateSelectedShows,
  toggleSelectedShow,
  updateConcertProfile,
} from '@/stores/concert-store'
import type { Show } from '@/types'

const routeApi = getRouteApi('/form')

interface CityGroup {
  city: string
  shows: Show[]
  venue: string
}

type FormStep = 'profile' | 'shows'

const LOCATION_NONE = '不透露'
const LOCATION_OTHER = '其他国家或地区'
const LOCATION_OPTIONS = Object.keys(geoCoordMap)

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

function formatCoordinates(coordinates: { latitude: number; longitude: number }): string {
  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
}

function getLocationSelectValue(city: string): string {
  if (!city) {
    return LOCATION_NONE
  }

  if (city === LOCATION_OTHER) {
    return LOCATION_OTHER
  }

  return LOCATION_OPTIONS.includes(city) ? city : LOCATION_OTHER
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
  const { toast } = useToast()
  const { gate, shows: allShows } = routeApi.useLoaderData()
  const CITY_GROUPS = useMemo(() => buildCityGroups(allShows), [allShows])
  const profile = useSelector(concertStore, (state) => state.profile)
  const selectedShows = useSelector(concertStore, (state) => state.selectedShows)
  const selectedIds = useMemo(() => new Set(selectedShows.map((show) => show.id)), [selectedShows])
  const totalCount = selectedShows.length
  const [step, setStep] = useState<FormStep>('profile')
  const [expandedCities, setExpandedCities] = useState<Set<string>>(() => {
    const lastGroup = CITY_GROUPS.at(-1)
    return new Set(lastGroup ? [lastGroup.city] : [])
  })
  const [isLocating, setIsLocating] = useState(false)
  const [supportsGeolocation, setSupportsGeolocation] = useState(false)

  useEffect(() => {
    hydrateConcertProfile()
    hydrateSelectedShows(allShows)
  }, [allShows])

  useEffect(() => {
    setSupportsGeolocation(typeof navigator !== 'undefined' && 'geolocation' in navigator)
  }, [])

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
    if (!gate.isOpen) {
      // The store already mirrors every change into localStorage, so "saving"
      // only needs to confirm and send the user back to the countdown.
      toast({
        description: '开放后回来，直接生成你的时空旅行报告。',
        title: '已保存你的选择',
      })
      navigate({ to: '/warmup' })
      return
    }
    navigate({ to: '/loading' })
  }

  function handleLocationCityChange(value: string) {
    if (value === LOCATION_NONE || value === LOCATION_OTHER) {
      updateConcertProfile({ city: value === LOCATION_OTHER ? LOCATION_OTHER : '', coordinates: null })
      return
    }

    updateConcertProfile({
      city: value,
      coordinates: null,
    })
  }

  function handleLocate() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      toast({
        description: '请改用城市选择，或在支持定位的浏览器中打开。',
        title: '浏览器定位不可用',
        variant: 'destructive',
      })
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateConcertProfile({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        })
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        const errorMessages: Record<number, string> = {
          [error.PERMISSION_DENIED]: '浏览器定位未开启',
          [error.POSITION_UNAVAILABLE]: '定位信息不可用',
          [error.TIMEOUT]: '定位请求超时',
        }
        toast({
          description: '请改用城市选择，或稍后重试定位。',
          title: errorMessages[error.code] ?? '获取定位失败',
          variant: 'destructive',
        })
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    )
  }

  if (step === 'profile') {
    return (
      <div className="flex min-h-svh flex-col">
        <div className="px-5 pt-8 pb-5">
          <p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Base Info</p>
          <h1 className="font-bold font-wjh text-4xl leading-tight">先认识你</h1>
        </div>

        <div className="flex flex-1 flex-col gap-8 px-5 pb-4">
          <div className="space-y-3">
            <label className="block font-bold text-[15px] tracking-wide" htmlFor="nickname">
              怎么称呼你（可选）？
            </label>
            <Input
              className="h-12 w-full border border-border bg-background px-3 text-base outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
              id="nickname"
              maxLength={24}
              onChange={(event) => updateConcertProfile({ nickname: event.target.value })}
              placeholder="请输入昵称"
              type="text"
              value={profile.nickname}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-[15px] tracking-wide" htmlFor="location-city">
                你的城市（可选）？
              </label>
              <p className="mt-1 text-[11px] text-muted-foreground">选择后可用于后续距离相关回顾</p>
            </div>
            <Select
              disabled={Boolean(profile.coordinates)}
              onValueChange={(value) => handleLocationCityChange(value ?? LOCATION_NONE)}
              value={getLocationSelectValue(profile.city)}
            >
              <SelectTrigger className="h-12 w-full bg-background text-base data-[size=default]:h-12" id="location-city">
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={LOCATION_NONE}>不透露</SelectItem>
                  <SelectItem value={LOCATION_OTHER}>其他国家或地区</SelectItem>
                  {LOCATION_OPTIONS.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                disabled={isLocating}
                onClick={handleLocate}
                size="sm"
                type="button"
                variant={profile.coordinates ? 'default' : 'outline'}
              >
                {isLocating ? '定位中...' : '使用我的定位'}
              </Button>
              {!supportsGeolocation && (
                <span className="text-[11px] text-muted-foreground">当前浏览器可能不支持定位</span>
              )}
              {profile.coordinates && (
                <>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatCoordinates(profile.coordinates)}
                  </span>
                  <button
                    className="text-[11px] text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
                    onClick={() => updateConcertProfile({ coordinates: null })}
                    type="button"
                  >
                    清除定位
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-border border-t bg-background/95 px-4 pt-3 pb-8 backdrop-blur-sm">
          <Button className="w-full" onClick={() => setStep('shows')} size="lg" type="button">
            继续
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Select Shows</p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-bold font-wjh text-4xl leading-tight">按城市选择</h1>
          <button
            className="shrink-0 pb-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
            onClick={() => setStep('profile')}
            type="button"
          >
            返回
          </button>
        </div>
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
          {gate.isOpen ? '下一步' : '保存，开放后生成'}
        </Button>
      </div>
    </div>
  )
}
