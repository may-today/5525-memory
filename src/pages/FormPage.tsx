import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast'
import { geoCoordMap } from '@/data/geo-coord'
import { getCityIcon } from '@/lib/city-icon'
import { flushPendingReportSubmission } from '@/lib/report-submission-client'
import { decodeShowPasscode } from '@/lib/show-passcode'
import {
  clearSelectedShows,
  concertStore,
  getOrCreateReportSubmissionId,
  hydrateConcertProfile,
  hydrateSelectedShows,
  replaceSelectedShows,
  toggleSelectedShow,
  updateConcertProfile,
} from '@/stores/concert-store'
import type { Show } from '@/types'

const routeApi = getRouteApi('/form')

interface CityGroup {
  city: string
  shows: Show[]
}

type FormStep = 'profile' | 'shows'

const LOCATION_NONE = '不透露'
const LOCATION_OTHER = '其他国家或地区'
const LOCATION_OPTIONS = Object.keys(geoCoordMap)
const FORM_SHOW_THEME_COLORS = {
  '5525': '#f472b6',
  '5525+1': '#38bdf8',
  '5525+2': '#fb923c',
} as const

function buildCityGroups(allShows: Show[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const show of allShows) {
    const existingGroup = map.get(show.city)
    if (existingGroup) {
      existingGroup.shows.push(show)
    } else {
      map.set(show.city, { city: show.city, shows: [show] })
    }
  }
  const groups = Array.from(map.values())
  for (const g of groups) {
    g.shows.sort((a, b) => a.showDate.localeCompare(b.showDate))
  }
  groups.sort(
    (a, b) =>
      b.shows.length - a.shows.length || a.shows[0].showDate.localeCompare(b.shows[0].showDate)
  )
  return groups
}

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

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

function padStopNumber(value: number): string {
  return String(value).padStart(2, '0')
}

function getFormShowThemeColor(show: Show): string {
  return FORM_SHOW_THEME_COLORS[show.subTheme as keyof typeof FORM_SHOW_THEME_COLORS] ?? show.themeColor
}

function SubThemeTag({ theme }: { theme: string }) {
  return (
    <span className="form-show-tag inline-flex shrink-0 items-center border border-muted-foreground/40 px-1 py-px text-[9px] text-muted-foreground/60 leading-none tracking-widest">
      {theme}
    </span>
  )
}

interface FormStepHeaderProps {
  action?: ReactNode
  eyebrow: string
  step: 1 | 2
  subtitle?: string
  title: ReactNode
}

/** 旅程登记页头：eyebrow + Doto 步骤号 + 标题 + 两段式步骤进度。 */
function FormStepHeader({ action, eyebrow, step, subtitle, title }: FormStepHeaderProps) {
  return (
    <div className="px-5 pt-8 pb-6">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{eyebrow}</p>
        <p className="font-geist text-muted-foreground text-xs tabular-nums">{padStopNumber(step)} / 02</p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-bold font-title text-4xl leading-tight">{title}</h1>
        {action}
      </div>
      {subtitle && <p className="mt-2 text-[11px] text-muted-foreground">{subtitle}</p>}
      <div className="mt-5 flex gap-1.5">
        {([1, 2] as const).map((segment) => (
          <div
            className={clsx(
              'h-0.5 flex-1 transition-all duration-500',
              segment <= step ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.55)]' : 'bg-border'
            )}
            key={segment}
          />
        ))}
      </div>
    </div>
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
  const selectedCityCount = useMemo(() => new Set(selectedShows.map((show) => show.city)).size, [selectedShows])
  const totalCount = selectedShows.length
  const [step, setStep] = useState<FormStep>('profile')
  const [expandedCities, setExpandedCities] = useState<Set<string>>(() => {
    const lastGroup = CITY_GROUPS.at(-1)
    return new Set(lastGroup ? [lastGroup.city] : [])
  })
  const [isLocating, setIsLocating] = useState(false)
  const [supportsGeolocation, setSupportsGeolocation] = useState(false)
  const [isPasscodeSheetOpen, setIsPasscodeSheetOpen] = useState(false)
  const [passcode, setPasscode] = useState('')

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
      getOrCreateReportSubmissionId()
      void flushPendingReportSubmission()
      toast({
        description: '开放后回来，查看你的时空旅行报告。',
        title: '已保存',
      })
      navigate({ to: '/warmup' })
      return
    }
    getOrCreateReportSubmissionId()
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

  function handleImportPasscode() {
    const showIndexes = decodeShowPasscode(passcode.trim())
    if (!showIndexes || showIndexes.length === 0) {
      toast({
        description: '请粘贴以 5525- 开头的有效场次口令。',
        title: '口令无法识别',
        variant: 'destructive',
      })
      return
    }

    const showsByIndex = new Map(allShows.map((show) => [show.showIndex, show]))
    const importedShows: Show[] = []
    for (const showIndex of showIndexes) {
      const show = showsByIndex.get(showIndex)
      if (!show) {
        toast({
          description: '这个口令包含当前场次目录中不存在的场次，未替换原有选择。',
          title: '口令不适用于当前目录',
          variant: 'destructive',
        })
        return
      }
      importedShows.push(show)
    }

    replaceSelectedShows(importedShows)
    setExpandedCities(new Set(importedShows.map((show) => show.city)))
    setIsPasscodeSheetOpen(false)
    setPasscode('')
    toast({
      description: '已替换当前已选场次，昵称与出发地不会变更。',
      title: `已导入 ${importedShows.length} 场`,
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
      <div className="form-page form-step-in flex min-h-svh flex-col" key="profile">
        <FormStepHeader
          eyebrow="Passenger"
          step={1}
          subtitle="都可以跳过——但填了，报告会更像你。"
          title={
            <>
              出发之前，
              <br />
              先认识你
            </>
          }
        />

        <div className="flex flex-1 flex-col gap-8 px-5 pb-4">
          <div className="space-y-3">
            <label className="flex items-baseline justify-between gap-3" htmlFor="nickname">
              <span className="font-bold text-[15px] tracking-wide">怎么称呼你？</span>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.25em]">Optional</span>
            </label>
            <Input
              className="h-12 w-full rounded-none border border-border bg-background px-3 text-base outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
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
              <label className="flex items-baseline justify-between gap-3" htmlFor="location-city">
                <span className="font-bold text-[15px] tracking-wide">你从哪里出发？</span>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.25em]">Optional</span>
              </label>
              <p className="mt-1 text-[11px] text-muted-foreground">用于计算你奔赴每座城市的距离</p>
            </div>
            <Select
              disabled={Boolean(profile.coordinates)}
              onValueChange={(value) => handleLocationCityChange(value ?? LOCATION_NONE)}
              value={getLocationSelectValue(profile.city)}
            >
              <SelectTrigger
                className="h-12 w-full bg-background text-base data-[size=default]:h-12"
                id="location-city"
              >
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
                variant={profile.coordinates ? 'starlight' : 'glass'}
              >
                {isLocating ? '定位中...' : '使用我的定位'}
              </Button>
              {!supportsGeolocation && (
                <span className="text-[11px] text-muted-foreground">当前浏览器可能不支持定位</span>
              )}
              {profile.coordinates && (
                <>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
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
          <Button className="w-full" onClick={() => setStep('shows')} size="lg" type="button" variant="starlight">
            继续
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page form-step-in flex min-h-svh flex-col" key="shows">
      <FormStepHeader
        action={
          <div className="flex shrink-0 items-center gap-3 pb-1">
            <Sheet onOpenChange={setIsPasscodeSheetOpen} open={isPasscodeSheetOpen}>
              <SheetTrigger render={<Button size="xs" type="button" variant="glass" />}>导入口令</SheetTrigger>
              <SheetContent className="max-h-[80svh] rounded-t-2xl" side="bottom">
                <SheetHeader className="border-b px-5 pt-6 pb-4">
                  <SheetTitle className="text-xl">导入场次口令</SheetTitle>
                  <SheetDescription>粘贴其他应用保存的 5525 场次口令，即可恢复已选场次。</SheetDescription>
                </SheetHeader>
                <div className="px-5 py-5">
                  <label className="flex flex-col gap-2" htmlFor="show-passcode">
                    <span className="font-medium text-sm">场次口令</span>
                    <Input
                      autoCapitalize="none"
                      autoCorrect="off"
                      id="show-passcode"
                      onChange={(event) => setPasscode(event.target.value)}
                      placeholder="5525-..."
                      spellCheck={false}
                      value={passcode}
                    />
                  </label>
                  <p className="mt-3 text-muted-foreground text-xs leading-5">
                    导入会替换当前已选场次，不会变更昵称、出发地或定位。
                  </p>
                </div>
                <SheetFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <Button
                    className="w-full"
                    disabled={!passcode.trim()}
                    onClick={handleImportPasscode}
                    size="lg"
                    type="button"
                    variant="starlight"
                  >
                    导入并替换场次
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <button
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
              onClick={() => setStep('profile')}
              type="button"
            >
              返回
            </button>
          </div>
        }
        eyebrow="Time Coordinates"
        step={2}
        subtitle={`按场次数量排列 · 共 ${CITY_GROUPS.length} 座城市 ${allShows.length} 场`}
        title="你去过哪几场？"
      />

      {/* City accordion list — cities are ordered by show count, then first-show date. */}
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        {CITY_GROUPS.map((group) => {
          const isExpanded = expandedCities.has(group.city)
          const selectedCount = group.shows.filter((s) => selectedIds.has(s.id)).length

          return (
            <div className="overflow-hidden border border-border" key={group.city}>
              {/* City header */}
              <button
                className="flex h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-muted/20 active:bg-muted/30"
                onClick={() => toggleCity(group.city)}
                type="button"
              >
                <div className="-ml-2 flex flex-1 items-center gap-1.5">
                  <img alt={group.city} className="size-10" height="40" src={getCityIcon(group.city)} width="40" />
                  <span className="font-bold font-title text-base tracking-wide">{group.city}</span>
                  <span className="text-muted-foreground text-xs">· 共 {group.shows.length} 场</span>
                </div>
                {selectedCount > 0 && (
                  <span className="bg-sky-400 px-1.5 py-0.5 font-bold text-sky-950 text-xs tabular-nums leading-none">
                    {selectedCount}
                  </span>
                )}
                <ChevronDown
                  className={clsx(
                    'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                    !isExpanded && '-rotate-90'
                  )}
                />
              </button>

              {/* Show rows */}
              {isExpanded && (
                <div className="form-rows-in border-border border-t border-dashed">
                  {group.shows.map((show) => {
                    const isSelected = selectedIds.has(show.id)
                    return (
                      <button
                        className="form-show-row flex w-full items-center gap-3 border-border border-b border-dashed px-4 py-2.5 text-left last:border-b-0"
                        data-selected={isSelected || undefined}
                        key={show.id}
                        onClick={() => toggleSelectedShow(show)}
                        style={{ '--show-color': getFormShowThemeColor(show) } as CSSProperties}
                        type="button"
                      >
                        {/* Square checkbox — lights up in the show's own themeColor */}
                        <span className="form-show-check flex size-[17px] flex-shrink-0 items-center justify-center">
                          <Check className="form-show-check-icon size-3 text-zinc-950" strokeWidth={3.5} />
                        </span>

                        {/* Date + subTheme tag */}
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="form-show-date shrink-0 text-muted-foreground text-sm tabular-nums transition-colors">
                            {formatShowDate(show.showDate)}
                          </span>
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
          {totalCount === 0 ? (
            <p className="text-[11px] text-muted-foreground">尚未选择场次</p>
          ) : (
            <p className="flex items-baseline gap-1 text-[11px] text-muted-foreground">
              已选
              <span className="form-selected-count text-base tabular-nums leading-none">{totalCount}</span>场 ·{' '}
              {selectedCityCount} 座城市
            </p>
          )}
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
        <Button
          className="w-full"
          disabled={totalCount === 0}
          onClick={handleSubmit}
          size="lg"
          type="button"
          variant="starlight"
        >
          {gate.isOpen ? '下一步' : '保存，开放后生成'}
        </Button>
      </div>
    </div>
  )
}
