import { useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useSummaryData } from '@/hooks/useSummaryData'
import { flushPendingReportSubmission } from '@/lib/report-submission-client'
import { SummaryCardCity } from './cards/SummaryCardCity'
import { SummaryCardDuration } from './cards/SummaryCardDuration'
import { SummaryCardGuests } from './cards/SummaryCardGuests'
import { SummaryCardAlbumProgress } from './cards/SummaryCardAlbumProgress'
import { SummaryCardMemories } from './cards/SummaryCardMemories'
import { SummaryCardOverview } from './cards/SummaryCardOverview'
import { SummaryCardPlaylist } from './cards/SummaryCardPlaylist'
import { SummaryCardRareSongs } from './cards/SummaryCardRareSongs'
import { SummaryCardSongWall } from './cards/SummaryCardSongWall'
import type { SummaryCardProps } from './summary-card-props'
import { SummaryDataContext } from './summary-data-context'

const CARDS: React.ComponentType<SummaryCardProps>[] = [
  SummaryCardOverview,
  SummaryCardDuration,
  SummaryCardCity,
  SummaryCardSongWall,
  SummaryCardAlbumProgress,
  SummaryCardPlaylist,
  SummaryCardRareSongs,
  SummaryCardGuests,
  SummaryCardMemories,
]

/** Must match the CSS animation duration so the exiting card is cleaned up after it finishes. */
const ANIM_DURATION = 1000

interface AnimState {
  direction: 'forward' | 'backward'
  prevIndex: number
}

/** Returns whether an event started inside an overlay that owns its own gestures. */
function isInsideGestureExemptOverlay(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-summary-gesture-exempt]') !== null
}

export function SummaryContainer() {
  const navigate = useNavigate()
  const { data, ready } = useSummaryData()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animState, setAnimState] = useState<AnimState | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const cardWrapperRef = useRef<HTMLDivElement>(null)
  const isTransitioning = useRef(false)
  const currentIndexRef = useRef(0)

  useEffect(() => {
    void flushPendingReportSubmission()
  }, [data])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const getScrollEl = useCallback((): HTMLElement | null => {
    const el = cardWrapperRef.current?.querySelector('[data-scroll-container]')
    return el ? (el as HTMLElement) : null
  }, [])

  const canAdvanceForward = useCallback((): boolean => {
    const scrollEl = getScrollEl()
    if (!scrollEl) return true
    return scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 10
  }, [getScrollEl])

  const canGoBack = useCallback((): boolean => {
    const scrollEl = getScrollEl()
    if (!scrollEl) return true
    return scrollEl.scrollTop <= 10
  }, [getScrollEl])

  const goForward = useCallback(() => {
    const prev = currentIndexRef.current
    setAnimState({ prevIndex: prev, direction: 'forward' })
    setCurrentIndex((i) => i + 1)
    isTransitioning.current = true
    setTimeout(() => {
      setAnimState(null)
      isTransitioning.current = false
    }, ANIM_DURATION + 50)
  }, [])

  const goBack = useCallback(() => {
    const prev = currentIndexRef.current
    setAnimState({ prevIndex: prev, direction: 'backward' })
    setCurrentIndex((i) => i - 1)
    isTransitioning.current = true
    setTimeout(() => {
      setAnimState(null)
      isTransitioning.current = false
    }, ANIM_DURATION + 50)
  }, [])

  function handleTouchStart(e: React.TouchEvent) {
    if (isInsideGestureExemptOverlay(e.target)) {
      touchStart.current = null
      return
    }

    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (isInsideGestureExemptOverlay(e.target)) return
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
    if (isInsideGestureExemptOverlay(e.target)) return
    if (isTransitioning.current || Math.abs(e.deltaY) < 10) return

    if (e.deltaY > 0 && currentIndex < CARDS.length - 1 && canAdvanceForward()) {
      goForward()
    } else if (e.deltaY < 0 && currentIndex > 0 && canGoBack()) {
      goBack()
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isDetailOpen || isTransitioning.current) return
      const idx = currentIndexRef.current

      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && idx < CARDS.length - 1 && canAdvanceForward()) {
        goForward()
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && idx > 0 && canGoBack()) {
        goBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canAdvanceForward, canGoBack, goForward, goBack, isDetailOpen])

  if (!(ready && data)) {
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
              <Card isPaused={Boolean(animState)} onDetailOpenChange={setIsDetailOpen} />
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
            <div
              aria-hidden={isDetailOpen}
              className={`flex flex-col items-center gap-1 transition-opacity duration-150 ${
                isDetailOpen ? 'invisible opacity-0' : ''
              }`}
            >
              <span className="text-muted-foreground/70 text-xs">滑动探索</span>
              <ChevronDown className="animate-hint-down text-muted-foreground/70" size={16} />
            </div>
          )}
        </div>
      </div>
    </SummaryDataContext>
  )
}
