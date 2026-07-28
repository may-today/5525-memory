import { Check, Compass } from 'lucide-react'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SUMMARY_CARDS } from './summary-cards'

interface SummaryQuickNavProps {
  currentIndex: number
  isOpen: boolean
  /** Jumps the deck to a card. Called with the sheet already closing. */
  onJump: (index: number) => void
  onOpenChange: (isOpen: boolean) => void
}

/**
 * Floating compass button pinned to the bottom-right of `/summary`, opening a bottom
 * sheet that lists every statistics card so any of them can be reached in one tap.
 *
 * The trigger carries `data-summary-gesture-exempt` so tapping it never flips the card
 * underneath; the sheet content carries it too, so its own scrolling stays internal.
 */
export function SummaryQuickNav({ currentIndex, isOpen, onJump, onOpenChange }: SummaryQuickNavProps) {
  function handleSelect(index: number) {
    onOpenChange(false)
    if (index !== currentIndex) onJump(index)
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={isOpen}>
      <SheetTrigger
        aria-label="打开航线图，跳到其他统计页"
        className="summary-quicknav-fab absolute right-5 bottom-8 z-20 flex size-11 items-center justify-center rounded-full"
        data-summary-gesture-exempt
      >
        <Compass className="size-[18px]" />
      </SheetTrigger>

      <SheetContent
        className="max-h-[72svh] rounded-t-2xl border-white/10 bg-zinc-950 text-zinc-100"
        data-summary-gesture-exempt
        side="bottom"
      >
        <SheetHeader className="shrink-0 border-white/10 border-b px-5 pt-6 pb-4">
          <SheetTitle className="font-title text-xl text-zinc-100">航线图</SheetTitle>
        </SheetHeader>

        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {SUMMARY_CARDS.map((card, index) => {
            const isCurrent = index === currentIndex

            return (
              <li key={card.title}>
                <button
                  aria-current={isCurrent ? 'page' : undefined}
                  className="summary-quicknav-item group flex w-full items-center gap-3.5 px-3 py-3 text-left"
                  data-current={isCurrent || undefined}
                  onClick={() => handleSelect(index)}
                  type="button"
                >
                  <span aria-hidden="true" className="summary-quicknav-index shrink-0 font-geist text-xs">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="summary-quicknav-title font-medium font-title text-sm leading-none">
                      {card.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 leading-4">{card.description}</span>
                  </span>
                  {isCurrent && <Check aria-label="当前所在站" className="size-3.5 shrink-0 text-sky-400" />}
                </button>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
