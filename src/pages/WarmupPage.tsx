import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import MaydayIcon from '@/assets/mayday.svg'
import { Marquee } from '@/components/marquee'
import { Button } from '@/components/ui/button'
import { TextureOverlay } from '@/components/ui/texture-overlay'

const routeApi = getRouteApi('/warmup')

interface CountdownParts {
  days: string
  hours: string
  minutes: string
  seconds: string
}

/** The open date is announced in Beijing time regardless of viewer locale. */
const OPEN_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
})

function splitCountdown(remainingMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    days: pad(Math.floor(totalSeconds / 86_400)),
    hours: pad(Math.floor((totalSeconds % 86_400) / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  }
}

function CountdownUnit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="font-geist text-5xl text-foreground tabular-nums sm:text-6xl"
        style={{ textShadow: '0 0 28px rgba(249, 115, 22, 0.5)' }}
      >
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground tracking-[0.3em]">{label}</span>
    </div>
  )
}

export function WarmupPage() {
  const navigate = useNavigate()
  const gate = routeApi.useLoaderData()
  // The first render (SSR and hydration) derives from the server clock so both
  // sides agree; ticking starts client-side with the skew-corrected clock.
  const [now, setNow] = useState(gate.serverNow)

  useEffect(() => {
    const clockOffset = gate.serverNow - Date.now()
    const tick = () => setNow(Date.now() + clockOffset)
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [gate.serverNow])

  const remainingMs = gate.opensAtMs - now
  const isCountdownDone = remainingMs <= 0
  const countdown = splitCountdown(remainingMs)
  const openDateLabel = OPEN_DATE_FORMATTER.format(gate.opensAtMs).replace(/\//g, '.')

  return (
    <div className="flex min-h-svh flex-col items-stretch justify-stretch">
      <div className="relative flex flex-1 flex-col items-center justify-center gap-10 px-5 py-12">
        <TextureOverlay className="invert" opacity={0.2} texture="grid" />

        <p className="relative text-[10px] text-muted-foreground uppercase tracking-[0.4em]">Opens Soon · 限时开启</p>

        <div className="relative flex items-start gap-3 sm:gap-5">
          <CountdownUnit label="天" value={countdown.days} />
          <span className="pt-1 font-geist text-4xl text-muted-foreground/50 sm:text-5xl">:</span>
          <CountdownUnit label="时" value={countdown.hours} />
          <span className="pt-1 font-geist text-4xl text-muted-foreground/50 sm:text-5xl">:</span>
          <CountdownUnit label="分" value={countdown.minutes} />
          <span className="pt-1 font-geist text-4xl text-muted-foreground/50 sm:text-5xl">:</span>
          <CountdownUnit label="秒" value={countdown.seconds} />
        </div>

        <p className="relative text-muted-foreground text-xs tracking-widest">{openDateLabel} 正式开启</p>
      </div>

      <div className="border-t py-1 font-geist">
        <Marquee>
          <div className="mx-1 flex flex-row items-baseline gap-2">
            <div>MAYDAY 5525</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
            <div>MAYDAY 5525+1</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
            <div>MAYDAY 5525+2</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
          </div>
        </Marquee>
      </div>

      <div className="relative flex flex-col items-start gap-2 border-t px-5 py-6">
        <p className="text-muted-foreground text-sm">五月天「5525 回到那一天」</p>
        <h1 className="mb-4 font-extrabold font-wjh text-4xl">
          {isCountdownDone ? (
            <>
              时空舱门
              <br />
              已经开启
            </>
          ) : (
            <>
              你的时空旅行
              <br />
              即将开始
            </>
          )}
        </h1>
        {isCountdownDone ? (
          <Button className="w-full" onClick={() => navigate({ to: '/' })} size="lg" type="button">
            进入你的时空旅行报告
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <>
            <Button className="w-full" onClick={() => navigate({ to: '/form' })} size="lg" type="button">
              先填好你去过的场次
              <ArrowRight className="size-4" />
            </Button>
            <p className="mt-1 text-[11px] text-muted-foreground">选择会保存在这台设备上，开放后回来直接生成报告。</p>
          </>
        )}
      </div>
    </div>
  )
}
