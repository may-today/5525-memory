import { useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { useEffect, useMemo, useState } from 'react'

import { flushPendingReportSubmission } from '@/lib/report-submission-client'
import { concertStore, getPersistedShowIds } from '@/stores/concert-store'

/** 每个字符的打印间隔；串场总时长由文案长度推导而来。 */
const TYPE_CHAR_MS = 80
const LINE_ONE_AT_MS = 900
const LINE_GAP_MS = 400
const LINE_ONE = '时空穿梭机已锁定坐标'
const FOOTER_QUOTE = '宇宙很大，但总有几个坐标，为你连成线。'
/** reduced-motion 下全部文案立即可见，停留一拍后离场。 */
const REDUCED_MOTION_EXIT_MS = 2600

interface TicketLineSegment {
  isCount?: boolean
  text: string
}

/** 判断当前访问者是否声明了减少动效偏好。 */
function hasReducedMotionPreference(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function LoadingPage() {
  const navigate = useNavigate()
  const storeShowCount = useSelector(concertStore, (state) => state.selectedShows.length)
  const [persistedShowCount, setPersistedShowCount] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  // 正常流程由表单页带着 store 进来；硬刷新时回退到 localStorage 里的选择。
  const showCount = storeShowCount > 0 ? storeShowCount : persistedShowCount

  const lineTwoSegments = useMemo<TicketLineSegment[]>(() => {
    if (showCount <= 0) {
      return [{ text: '正在载入你的时空记忆……' }]
    }
    return [{ text: '正在载入你的 ' }, { isCount: true, text: String(showCount) }, { text: ' 场时空记忆……' }]
  }, [showCount])

  const lineTwoLength = useMemo(
    () => lineTwoSegments.reduce((total, segment) => total + segment.text.length, 0),
    [lineTwoSegments]
  )

  // 打印时刻表：第一行 → 停顿 → 第二行 → 票根 → 尾注 → 离场。
  const lineOneDoneAtMs = LINE_ONE_AT_MS + LINE_ONE.length * TYPE_CHAR_MS
  const lineTwoAtMs = lineOneDoneAtMs + LINE_GAP_MS
  const lineTwoDoneAtMs = lineTwoAtMs + lineTwoLength * TYPE_CHAR_MS
  const stubAtMs = lineTwoDoneAtMs + 300
  const quoteAtMs = lineTwoDoneAtMs + 600
  const exitAtMs = quoteAtMs + 2000

  useEffect(() => {
    void flushPendingReportSubmission()
    setPersistedShowCount(getPersistedShowIds().length)
    setIsReducedMotion(hasReducedMotionPreference())
  }, [])

  useEffect(() => {
    if (isReducedMotion) {
      return
    }
    const startedAt = performance.now()
    const intervalId = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt)
    }, TYPE_CHAR_MS / 2)
    return () => window.clearInterval(intervalId)
  }, [isReducedMotion])

  useEffect(() => {
    const timerId = window.setTimeout(
      () => {
        void navigate({ to: '/summary' })
      },
      isReducedMotion ? REDUCED_MOTION_EXIT_MS : exitAtMs
    )
    return () => window.clearTimeout(timerId)
  }, [navigate, isReducedMotion, exitAtMs])

  const effectiveElapsedMs = isReducedMotion ? Number.POSITIVE_INFINITY : elapsedMs
  const lineOneVisibleChars = Math.min(
    LINE_ONE.length,
    Math.max(0, Math.floor((effectiveElapsedMs - LINE_ONE_AT_MS) / TYPE_CHAR_MS))
  )
  const lineTwoVisibleChars = Math.min(
    lineTwoLength,
    Math.max(0, Math.floor((effectiveElapsedMs - lineTwoAtMs) / TYPE_CHAR_MS))
  )
  const isLineOneDone = lineOneVisibleChars >= LINE_ONE.length
  const isStubVisible = effectiveElapsedMs >= stubAtMs
  const isQuoteVisible = effectiveElapsedMs >= quoteAtMs

  let remainingChars = lineTwoVisibleChars
  const lineTwoRendered = lineTwoSegments.map((segment) => {
    const shownText = segment.text.slice(0, Math.max(0, remainingChars))
    remainingChars -= segment.text.length
    return segment.isCount ? (
      <span className="loading-count" key={segment.text}>
        {shownText}
      </span>
    ) : (
      <span key={segment.text}>{shownText}</span>
    )
  })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-8">
      <p className="sr-only" role="status">
        {LINE_ONE}，{lineTwoSegments.map((segment) => segment.text).join('')}
      </p>

      <div aria-hidden className="loading-ticket w-full max-w-[320px]">
        <div className="px-6 pt-6 pb-7">
          <div className="flex items-baseline justify-between text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
            <span>Mayday 5525</span>
            <span>Time Transit</span>
          </div>
          <div className="mt-9 space-y-3 font-title text-sm text-zinc-200 leading-relaxed">
            <p className="h-6">
              {LINE_ONE.slice(0, lineOneVisibleChars)}
              {!(isReducedMotion || isLineOneDone) && <span className="loading-cursor" />}
            </p>
            <p className="h-6">
              {lineTwoRendered}
              {!isReducedMotion && isLineOneDone && <span className="loading-cursor" />}
            </p>
          </div>
        </div>
        <div className="loading-ticket-perforation" />
        <div
          className="loading-fade flex items-center justify-between px-6 py-4"
          data-visible={isStubVisible || undefined}
        >
          <span className="font-geist text-[10px] text-zinc-500 tracking-[0.2em]">5525 · REPLAY</span>
          <div className="loading-ticket-barcode" />
        </div>
      </div>

      <p className="loading-fade mt-12 text-xs text-zinc-600" data-visible={isQuoteVisible || undefined}>
        {FOOTER_QUOTE}
      </p>
    </div>
  )
}
