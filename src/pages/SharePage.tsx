import { useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { Copy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useSummaryData } from '@/hooks/useSummaryData'
import { encodeShowPasscode } from '@/lib/show-passcode'
import { concertStore, getPersistedShowIndexes } from '@/stores/concert-store'
import { SharePoster } from './share/SharePoster'

export function SharePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const selectedShowIndexes = useSelector(concertStore, (state) => state.selectedShows.map((show) => show.showIndex))
  const nickname = useSelector(concertStore, (state) => state.profile.nickname)
  const passcodeInputRef = useRef<HTMLInputElement>(null)
  const [restoredShowIndexes, setRestoredShowIndexes] = useState<number[]>([])
  const { data, ready } = useSummaryData()

  useEffect(() => {
    setRestoredShowIndexes(getPersistedShowIndexes())
  }, [])

  const passcode = useMemo(() => {
    const showIndexes = selectedShowIndexes.length > 0 ? selectedShowIndexes : restoredShowIndexes
    return showIndexes.length > 0 ? encodeShowPasscode(showIndexes) : null
  }, [restoredShowIndexes, selectedShowIndexes])

  const signatureSong = useMemo(() => {
    if (!data) return null

    const residentSong = data.randomSongStats.entries[0]
    if (residentSong) return { isRandomPick: true, title: residentSong.title }
    if (data.songStats.topSong) return { isRandomPick: false, title: data.songStats.topSong.title }
    return null
  }, [data])

  async function copyPasscode() {
    if (!passcode) return

    try {
      await navigator.clipboard.writeText(passcode)
    } catch {
      passcodeInputRef.current?.select()
      if (!document.execCommand('copy')) {
        toast({ title: '复制失败', description: '请长按口令后手动复制。', variant: 'destructive' })
        return
      }
    }

    toast({ title: '口令已复制', description: '把它粘贴到其他小程序，即可保存这份回忆。' })
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col p-6">
      <div className="mb-5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Final Stop · 终点站</p>
        <h2 className="mt-1.5 font-semibold text-xl">这趟时空旅行的纪念品</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {ready && data ? (
          <SharePoster
            nickname={nickname}
            passcode={passcode}
            shows={data.selectedShows}
            signatureSong={signatureSong}
          />
        ) : (
          <div className="mx-auto flex aspect-[5/7] w-full max-w-sm items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
            <p className="animate-pulse text-sm text-zinc-500">正在绘制你的星域…</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button className="w-full" disabled size="lg">
          保存图片
        </Button>
        <Button className="w-full" disabled size="lg" variant="outline">
          分享
        </Button>
        <Sheet>
          <SheetTrigger disabled={!passcode} render={<Button className="w-full" size="lg" variant="outline" />}>
            将场次保存到...
          </SheetTrigger>
          <SheetContent className="max-h-[80svh] rounded-t-2xl" side="bottom">
            <SheetHeader className="border-b px-5 pt-6 pb-4">
              <SheetTitle className="text-xl">保存场次口令</SheetTitle>
              <SheetDescription>复制口令，粘贴到其他小程序，即可永久保存你的回忆。</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-5 py-5">
              <Input aria-label="场次保存口令" readOnly ref={passcodeInputRef} value={passcode ?? ''} />
              <p className="text-muted-foreground text-xs">口令只记录你选中的场次，不包含昵称、位置或其他个人资料。</p>
            </div>
            <SheetFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Button className="w-full" onClick={copyPasscode} size="lg">
                <Copy data-icon="inline-start" />
                复制口令
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Button className="w-full" onClick={() => navigate({ to: '/report' })} size="lg" variant="outline">
          你的专属报告
        </Button>
        <button
          className="mt-2 text-center text-muted-foreground text-sm underline underline-offset-4"
          onClick={() => navigate({ to: '/summary' })}
          type="button"
        >
          返回总结
        </button>
      </div>
    </div>
  )
}
