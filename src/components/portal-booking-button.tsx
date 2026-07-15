import { useEffect, useState } from 'react'
import astronaut from '@/assets/logo/astronaut.png'
import wmbkQr from '@/assets/logo/wmbk-qr.webp'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

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
    return <span className="font-geist text-orange-200 text-xs tracking-wide">···</span>
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
    <Sheet>
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
          <SheetTitle className="font-title text-xl">「时空旅行报告」任意门启航版</SheetTitle>
        </SheetHeader>
        <div className="px-5 py-4 text-muted-foreground text-xs leading-relaxed">
          <p>162 场，925 天，100,400 公里。</p>
          <p>我们在这组庞大的数据里，寻找着你留下的专属坐标。</p>

          <p>而你的故事，现在正是起点。</p>
          <p className="mt-2">Talking 统计 / 公益纪录 / 特别场次 / 观看标签</p>
          <p>你的 任意门启航版 报告现已开放。</p>
          <section aria-labelledby="supported-apps-title" className="mt-4 w-full border bg-muted/40 p-4">
            <div className="flex items-center gap-4">
              <img alt="五迷百科小程序二维码" className="size-20 rounded-md" height={300} src={wmbkQr} width={300} />
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="font-medium text-sm">小程序 五迷百科</h3>
                <p className="text-muted-foreground text-xs leading-5">
                  属于WMLS的五月天数据库：五月天演唱会歌单/公益数据/唱片标记/获奖记录/Talking记录，五迷自定义物料生成
                </p>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
