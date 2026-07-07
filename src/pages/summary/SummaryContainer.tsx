import { useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useSummaryData } from '@/hooks/useSummaryData'
import { SummaryCard1 } from './cards/SummaryCard1'
import { SummaryCard2 } from './cards/SummaryCard2'
import { SummaryCard3 } from './cards/SummaryCard3'
import { SummaryCardCity } from './cards/SummaryCardCity'
import { SummaryCardOverview } from './cards/SummaryCardOverview'
import { SummaryDataContext } from './summary-data-context'

const CARDS = [SummaryCardOverview, SummaryCardCity, SummaryCard1, SummaryCard2, SummaryCard3]

/** Must match the CSS animation duration so the exiting card is cleaned up after it finishes. */
const ANIM_DURATION = 1000

interface AnimState {
  direction: 'forward' | 'backward'
  prevIndex: number
}

export function SummaryContainer() {
  const navigate = useNavigate()
  const { data, ready } = useSummaryData()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animState, setAnimState] = useState<AnimState | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const cardWrapperRef = useRef<HTMLDivElement>(null)
  const isTransitioning = useRef(false)
  const currentIndexRef = useRef(0)

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  function getScrollEl(): HTMLElement | null {
    const el = cardWrapperRef.current?.querySelector('[data-scroll-container]')
    return el ? (el as HTMLElement) : null
  }

  function canAdvanceForward(): boolean {
    const scrollEl = getScrollEl()
    if (!scrollEl) return true
    return scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 10
  }

  function canGoBack(): boolean {
    const scrollEl = getScrollEl()
    if (!scrollEl) return true
    return scrollEl.scrollTop <= 10
  }

  function goForward() {
    const prev = currentIndexRef.current
    setAnimState({ prevIndex: prev, direction: 'forward' })
    setCurrentIndex((i) => i + 1)
    isTransitioning.current = true
    setTimeout(() => {
      setAnimState(null)
      isTransitioning.current = false
    }, ANIM_DURATION + 50)
  }

  function goBack() {
    const prev = currentIndexRef.current
    setAnimState({ prevIndex: prev, direction: 'backward' })
    setCurrentIndex((i) => i - 1)
    isTransitioning.current = true
    setTimeout(() => {
      setAnimState(null)
      isTransitioning.current = false
    }, ANIM_DURATION + 50)
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y
    touchStart.current = null

    if (Math.abs(deltaY) <= Math.abs(deltaX) || Math.abs(deltaY) < 40) return

    if (deltaY < 0 && currentIndex < CARDS.length - 1 && canAdvanceForward()) {
      goForward()
    } else if (deltaY > 0 && currentIndex > 0 && canGoBack()) {
      goBack()
    }
  }

  function handleWheel(e: React.WheelEvent) {
    if (isTransitioning.current || Math.abs(e.deltaY) < 10) return

    if (e.deltaY > 0 && currentIndex < CARDS.length - 1 && canAdvanceForward()) {
      goForward()
    } else if (e.deltaY < 0 && currentIndex > 0 && canGoBack()) {
      goBack()
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTransitioning.current) return
      const idx = currentIndexRef.current

      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && idx < CARDS.length - 1 && canAdvanceForward()) {
        goForward()
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && idx > 0 && canGoBack()) {
        goBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!ready || !data) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isLast = currentIndex === CARDS.length - 1
  const visibleCards = animState
    ? [
        { index: animState.prevIndex, isOutgoing: true },
        { index: currentIndex, isOutgoing: false },
      ]
    : [{ index: currentIndex, isOutgoing: false }]

  return (
    <SummaryDataContext value={data}>
      <div
        className="relative h-svh overflow-hidden"
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
      >
        {visibleCards.map(({ index: cardIndex, isOutgoing }) => {
          const Card = CARDS[cardIndex]
          if (!Card) return null
          let animationClass = ''
          if (animState) {
            if (isOutgoing) {
              animationClass = animState.direction === 'forward' ? 'animate-page-exit-up' : 'animate-page-exit-down'
            } else {
              animationClass = animState.direction === 'forward' ? 'animate-page-enter-up' : 'animate-page-enter-down'
            }
          }

          return (
            <div
              className={`summary-card-layer absolute inset-0 overflow-hidden ${
                isOutgoing ? 'pointer-events-none' : ''
              } ${animationClass}`}
              key={cardIndex}
              ref={isOutgoing ? undefined : cardWrapperRef}
            >
              {cardIndex === 1 ? <SummaryCardCity isPaused={Boolean(animState)} /> : <Card />}
            </div>
          )
        })}

        {/* Floating bottom indicator — rendered above both cards */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-8">
          {isLast ? (
            <Button className="pointer-events-auto" onClick={() => navigate({ to: '/share' })} size="lg">
              生成总结
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground/70 text-xs">滑动探索</span>
              <ChevronDown className="animate-hint-down text-muted-foreground/70" size={16} />
            </div>
          )}
        </div>
      </div>
    </SummaryDataContext>
  )
}
