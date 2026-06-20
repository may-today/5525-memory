import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { SummaryCard1 } from './cards/SummaryCard1'
import { SummaryCard2 } from './cards/SummaryCard2'
import { SummaryCard3 } from './cards/SummaryCard3'
import { SummaryCardCity } from './cards/SummaryCardCity'
import { SummaryCardOverview } from './cards/SummaryCardOverview'

const CARDS = [SummaryCardOverview, SummaryCardCity, SummaryCard1, SummaryCard2, SummaryCard3]

export function SummaryContainer() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) {
      return
    }
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y
    touchStart.current = null

    if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 40) {
      return
    }

    if (deltaX < 0 && currentIndex < CARDS.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else if (deltaX > 0 && currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }

  const ActiveCard = CARDS[currentIndex]
  const isLast = currentIndex === CARDS.length - 1

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Swipe capture layer — covers full screen, allows inner scroll */}
      <div className="flex-1 overflow-y-auto" onTouchEnd={handleTouchEnd} onTouchStart={handleTouchStart}>
        <ActiveCard />
      </div>

      {/* Bottom navigation */}
      <div className="flex flex-col items-center gap-4 p-6 pb-8">
        {isLast && (
          <Button className="w-full" onClick={() => navigate({ to: '/share' })} size="lg">
            生成总结
          </Button>
        )}
        <div className="flex gap-2">
          {CARDS.map((_, i) => (
            <button
              aria-label={`跳至第 ${i + 1} 页`}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === currentIndex ? 'w-5 bg-foreground' : 'w-2 bg-muted-foreground/40'
              }`}
              key={i}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
