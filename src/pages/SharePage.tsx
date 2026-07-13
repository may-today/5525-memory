import { Link, useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { toPng } from 'html-to-image'
import { ArrowRight, Copy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import wmbkQr from '@/assets/logo/wmbk-qr.webp'
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
import { markSharePageVisited } from '@/lib/share-page-visit'
import { encodeShowPasscode } from '@/lib/show-passcode'
import { concertStore, getPersistedShowIndexes } from '@/stores/concert-store'
import { SharePoster } from './share/SharePoster'

export function SharePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const selectedShowIndexes = useSelector(concertStore, (state) => state.selectedShows.map((show) => show.showIndex))
  const nickname = useSelector(concertStore, (state) => state.profile.nickname)
  const passcodeInputRef = useRef<HTMLInputElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const [restoredShowIndexes, setRestoredShowIndexes] = useState<number[]>([])
  const [isSavingImage, setIsSavingImage] = useState(false)
  const { data, ready } = useSummaryData()

  useEffect(() => {
    markSharePageVisited()
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

  /** Renders the poster DOM at double density and saves the resulting PNG locally. */
  async function savePosterImage() {
    const poster = posterRef.current
    if (!poster || isSavingImage) return

    setIsSavingImage(true)
    try {
      await document.fonts?.ready
      const dataUrl = await toPng(poster, {
        cacheBust: true,
        height: poster.offsetHeight,
        pixelRatio: 2,
        width: poster.offsetWidth,
      })
      const anchor = document.createElement('a')
      anchor.download = `5525-memory-${passcode ?? 'poster'}.png`
      anchor.href = dataUrl
      anchor.click()
      toast({ title: '图片已保存', description: '这份星轨纪念品已经生成。' })
    } catch {
      toast({
        title: '图片生成失败',
        description: '请检查网络后重试，或使用浏览器的截图功能保存海报。',
        variant: 'destructive',
      })
    } finally {
      setIsSavingImage(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col p-6">
      <div className="mb-5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Final Stop</p>
        <h2 className="mt-1.5 font-semibold font-title text-xl">时空旅行纪念品</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {ready && data ? (
          <SharePoster nickname={nickname} ref={posterRef} shows={data.selectedShows} signatureSong={signatureSong} />
        ) : (
          <div className="mx-auto flex aspect-[5/7] w-full max-w-sm items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950">
            <p className="animate-pulse text-sm text-zinc-500">正在绘制你的星域…</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          className="w-full"
          disabled={!data || data.selectedShows.length === 0 || isSavingImage}
          onClick={savePosterImage}
          size="lg"
          variant="starlight"
        >
          {isSavingImage ? '正在保存图片…' : '保存图片'}
        </Button>
        <Sheet>
          <SheetTrigger disabled={!passcode} render={<Button className="w-full" size="lg" variant="glass" />}>
            将场次保存到...
          </SheetTrigger>
          <SheetContent className="max-h-[80svh] rounded-t-2xl" side="bottom">
            <SheetHeader className="border-b px-5 pt-6 pb-4">
              <SheetTitle className="text-xl">保存场次口令</SheetTitle>
              <SheetDescription>复制口令，粘贴到其他支持的应用，即可永久保存你的回忆。</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-5 py-5">
              <Input aria-label="场次保存口令" readOnly ref={passcodeInputRef} value={passcode ?? ''} />
              <p className="text-muted-foreground text-xs">口令只记录你选中的场次，不包含昵称、位置或其他个人资料。</p>
              <section aria-labelledby="supported-apps-title" className="mt-2 w-full border bg-muted/40 p-4">
                <p className="text-muted-foreground text-xs" id="supported-apps-title">
                  目前支持的应用
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <img
                    alt="五迷百科小程序二维码"
                    className="size-20 rounded-md"
                    height={300}
                    src={wmbkQr}
                    width={300}
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="font-medium text-sm">小程序 五迷百科</h3>
                    <p className="text-muted-foreground text-xs leading-5">
                      属于WMLS的五月天数据库：五月天演唱会歌单/公益数据/唱片标记/获奖记录，五迷自定义物料生成
                    </p>
                  </div>
                </div>
              </section>
              <p className="text-muted-foreground/50 text-xs leading-5">
                口令算法已{' '}
                <a className="underline" href="https://github.com/wmbkapp/5525-memory" rel="noopener" target="_blank">
                  开源
                </a>{' '}
                ，可以快速接入并连接到你的应用。
              </p>
            </div>
            <SheetFooter className="flex flex-col gap-4 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Button className="w-full" onClick={copyPasscode} size="lg" variant="starlight">
                <Copy data-icon="inline-start" />
                复制口令
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <button
          className="share-plan-entry group mt-1 flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => navigate({ to: '/data-station' })}
          type="button"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em]">Special Project · 特别企划</span>
            <span className="font-medium text-sm text-zinc-100">5525数据电台 · 你的专属报告</span>
          </span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 shrink-0 text-zinc-500 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-200"
          />
        </button>
        <Link className="mt-2 text-center text-muted-foreground text-sm underline underline-offset-4" to="/">
          重新回顾
        </Link>
      </div>
    </div>
  )
}
