'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  fade?: boolean
  fadeAmount?: number
  pauseOnHover?: boolean
}

export function Marquee({
  children,
  className,
  duration = 20,
  pauseOnHover = false,
  direction = 'left',
  fade = true,
  fadeAmount = 10,
  ...props
}: MarqueeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = React.useState(false)

  const items = React.Children.toArray(children)
  const isVertical = direction === 'up' || direction === 'down'

  return (
    <>
      <style>
        {`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-reverse {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes scroll-y {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-50%);
          }
        }

        @keyframes scroll-y-reverse {
          from {
            transform: translateY(-50%);
          }
          to {
            transform: translateY(0);
          }
        }

        .marquee-scroller {
          display: flex;
          animation: ${
            isVertical
              ? direction === 'up'
                ? 'scroll-y'
                : 'scroll-y-reverse'
              : direction === 'left'
                ? 'scroll'
                : 'scroll-reverse'
          } ${duration}s linear infinite;
        }

        .marquee-scroller.paused {
          animation-play-state: paused;
        }
      `}
      </style>
      <div
        className={cn('flex w-full overflow-hidden', isVertical && 'flex-col', className)}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        ref={containerRef}
        style={{
          ...(fade && {
            maskImage: isVertical
              ? `linear-gradient(to bottom, transparent 0%, black ${fadeAmount}%, black ${
                  100 - fadeAmount
                }%, transparent 100%)`
              : `linear-gradient(to right, transparent 0%, black ${fadeAmount}%, black ${
                  100 - fadeAmount
                }%, transparent 100%)`,
            WebkitMaskImage: isVertical
              ? `linear-gradient(to bottom, transparent 0%, black ${fadeAmount}%, black ${
                  100 - fadeAmount
                }%, transparent 100%)`
              : `linear-gradient(to right, transparent 0%, black ${fadeAmount}%, black ${
                  100 - fadeAmount
                }%, transparent 100%)`,
          }),
        }}
        {...props}
      >
        <div className={cn('marquee-scroller flex shrink-0', isVertical && 'flex-col', isPaused && 'paused')}>
          {items.map((item, index) => (
            <div className={cn('flex shrink-0', isVertical && 'w-full')} key={`first-${index}`}>
              {item}
            </div>
          ))}
          {items.map((item, index) => (
            <div className={cn('flex shrink-0', isVertical && 'w-full')} key={`second-${index}`}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
