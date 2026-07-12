import { useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { Copy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast'
import { encodeShowPasscode } from '@/lib/show-passcode'
import { concertStore, getPersistedShowIndexes } from '@/stores/concert-store'

export function SharePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const selectedShowIndexes = useSelector(concertStore, (state) => state.selectedShows.map((show) => show.showIndex))
  const passcodeInputRef = useRef<HTMLInputElement>(null)
  const [restoredShowIndexes, setRestoredShowIndexes] = useState<number[]>([])

  useEffect(() => {
    setRestoredShowIndexes(getPersistedShowIndexes())
  }, [])

  const passcode = useMemo(() => {
    const showIndexes = selectedShowIndexes.length > 0 ? selectedShowIndexes : restoredShowIndexes
    return showIndexes.length > 0 ? encodeShowPasscode(showIndexes) : null
  }, [restoredShowIndexes, selectedShowIndexes])

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
    <div className="flex min-h-svh flex-col p-6">
      <h2 className="mb-6 font-semibold text-xl">你的年度总结</h2>

      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-muted">
        <p className="text-muted-foreground text-sm">总结卡片预览区域</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button className="w-full" disabled size="lg">
          保存图片
        </Button>
        <Button className="w-full" disabled size="lg" variant="outline">
          分享
        </Button>
        <Sheet>
          <SheetTrigger
            disabled={!passcode}
            render={<Button className="w-full" size="lg" variant="outline" />}
          >
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
