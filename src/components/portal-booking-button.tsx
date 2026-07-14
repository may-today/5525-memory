import { useEffect, useState } from 'react'
import astronaut from '@/assets/logo/astronaut.png'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const PORTAL_LAUNCH_AT = Date.parse('2026-07-17T19:00:00+08:00')

interface PortalCountdownParts {
  days: string
  hours: string
  minutes: string
  seconds: string
}

function splitPortalCountdown(remainingMilliseconds: number): PortalCountdownParts {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMilliseconds / 1000))
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    days: String(Math.floor(remainingSeconds / 86_400)),
    hours: pad(Math.floor((remainingSeconds % 86_400) / 3600)),
    minutes: pad(Math.floor((remainingSeconds % 3600) / 60)),
    seconds: pad(remainingSeconds % 60),
  }
}

/** Mini digital readout for the portal countdown, styled after the warmup page's Doto-font clock. */
function PortalCountdown({ now }: { now: number }) {
  if (now === 0) {
    return <span className="font-geist text-orange-200/40 text-xs tracking-wide">···</span>
  }

  if (now >= PORTAL_LAUNCH_AT) {
    return <span className="font-geist text-orange-100 text-xs tracking-wide">预约开启</span>
  }

  const { days, hours, minutes, seconds } = splitPortalCountdown(PORTAL_LAUNCH_AT - now)
  return (
    <span
      className="flex items-baseline gap-[2px] font-geist text-base text-orange-50 tabular-nums"
      style={{ textShadow: '0 0 10px rgba(249, 115, 22, 0.5)' }}
    >
      <span>{days}</span>
      <span className="text-[9px] text-orange-200/50">天</span>
      <span>{hours}</span>
      <span className="text-orange-200/30">:</span>
      <span>{minutes}</span>
      <span className="text-orange-200/30">:</span>
      <span>{seconds}</span>
    </span>
  )
}

/**
 * Entry point for the "任意门启航版" branch: a bright, warm-toned counterpart to the
 * page's starfield theme. Opens a placeholder sheet until the real booking flow ships.
 */
export function PortalBookingButton() {
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <Sheet open={false}>
      <SheetTrigger className="share-portal-entry group relative flex w-full items-center justify-between gap-3 py-3.5 pr-4 pl-16 text-left">
        <img
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 size-14 opacity-60"
          height={93}
          src={astronaut}
          width={90}
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-[9px] text-orange-200/70 uppercase tracking-[0.3em]">5525「时空旅行报告」</span>
          <span className="font-medium text-sm text-zinc-50">任意门启航版</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <PortalCountdown now={now} />
          <span className="text-[8px] text-orange-200/40 tracking-widest">7/17 19:00</span>
        </span>
      </SheetTrigger>
      <SheetContent className="max-h-[80svh] rounded-t-2xl" side="bottom">
        <SheetHeader className="border-b px-5 pt-6 pb-4">
          <SheetTitle className="text-xl">任意门启航版</SheetTitle>
          <SheetDescription>预约入口即将接入，敬请期待。</SheetDescription>
        </SheetHeader>
        <div className="px-5 py-10 text-center text-muted-foreground text-sm">占位内容</div>
      </SheetContent>
    </Sheet>
  )
}
