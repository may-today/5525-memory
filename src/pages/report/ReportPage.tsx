import { useNavigate } from '@tanstack/react-router'
import { ArrowUp, Check, ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ReportCard } from './ReportCard'
import { REPORT_GREETING, REPORT_SUGGESTIONS, type ReportCardData, resolveReportCard } from './report-mock'

/** Milliseconds between two fake computation steps lighting up. */
const STEP_INTERVAL_MS = 800

/** Pause after the last step before the card prints. */
const PRINT_DELAY_MS = 500

interface ChatMessage {
  card?: ReportCardData
  id: number
  kind: 'agent-card' | 'agent-text' | 'thinking' | 'user'
  serial?: number
  steps?: string[]
  /** For thinking messages: how many steps have completed. */
  stepsDone?: number
  text?: string
}

/** Staggered fake-computation checklist shown while a card is "generated". */
function ThinkingSteps({ steps, stepsDone }: { steps: string[]; stepsDone: number }) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, index) => {
        if (index > stepsDone) return null
        const isActive = index === stepsDone
        return (
          <div className="report-msg-in flex items-center gap-2" key={step}>
            {isActive ? (
              <span aria-hidden="true" className="report-thinking-dot" />
            ) : (
              <Check aria-hidden="true" className="size-3 text-zinc-500" />
            )}
            <p className={`text-xs ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`}>{step}</p>
          </div>
        )
      })}
    </div>
  )
}

export function ReportPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, kind: 'agent-text', text: REPORT_GREETING }])
  const [draft, setDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const nextIdRef = useRef(1)
  const askCountRef = useRef(0)

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers) clearTimeout(timer)
    }
  }, [])

  // Keep the newest message (and each thinking step) in view.
  useEffect(() => {
    if (messages.length === 0) return
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  /** Appends the user question, plays the fake steps, then prints the card. */
  function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || isGenerating) return

    const card = resolveReportCard(trimmed, askCountRef.current)
    const serial = askCountRef.current + 1
    askCountRef.current = serial
    const userId = nextIdRef.current++
    const thinkingId = nextIdRef.current++
    const cardId = nextIdRef.current++

    setDraft('')
    setIsGenerating(true)
    setMessages((prev) => [
      ...prev,
      { id: userId, kind: 'user', text: trimmed },
      { id: thinkingId, kind: 'thinking', steps: card.steps, stepsDone: 0 },
    ])

    for (let step = 1; step <= card.steps.length; step++) {
      timersRef.current.push(
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((message) => (message.id === thinkingId ? { ...message, stepsDone: step } : message))
          )
        }, step * STEP_INTERVAL_MS)
      )
    }
    timersRef.current.push(
      setTimeout(
        () => {
          setMessages((prev) => [...prev, { card, id: cardId, kind: 'agent-card', serial }])
          setIsGenerating(false)
        },
        card.steps.length * STEP_INTERVAL_MS + PRINT_DELAY_MS
      )
    )
  }

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-zinc-950">
      <div aria-hidden="true" className="summary-space-bg" />
      <div aria-hidden="true" className="summary-space-stars" />

      <header className="relative flex shrink-0 items-center gap-3 px-4 pt-5 pb-3">
        <button
          aria-label="返回"
          className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400"
          onClick={() => navigate({ to: '/share' })}
          type="button"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">5525 Data Station</p>
          <h2 className="font-bold text-sm text-white">你的专属报告</h2>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4" ref={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            if (message.kind === 'user') {
              return (
                <div className="report-msg-in flex justify-end" key={message.id}>
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-sm text-zinc-100">
                    {message.text}
                  </p>
                </div>
              )
            }
            if (message.kind === 'thinking') {
              return (
                <div
                  className="report-msg-in max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-zinc-900/60 px-4 py-3"
                  key={message.id}
                >
                  <ThinkingSteps steps={message.steps ?? []} stepsDone={message.stepsDone ?? 0} />
                </div>
              )
            }
            if (message.kind === 'agent-card') {
              return (
                <div key={message.id}>
                  {message.card && <ReportCard card={message.card} serial={message.serial ?? 1} />}
                </div>
              )
            }
            return (
              <div
                className="report-msg-in max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-zinc-900/60 px-4 py-3"
                key={message.id}
              >
                <p className="text-sm text-zinc-200 leading-relaxed">{message.text}</p>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="relative shrink-0 px-4 pt-2 pb-6">
        <div className="report-chip-row mb-3 flex gap-2 overflow-x-auto">
          {REPORT_SUGGESTIONS.map((suggestion) => (
            <button
              className="shrink-0 rounded-full border border-white/15 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300 transition-colors active:bg-zinc-800 disabled:opacity-40"
              disabled={isGenerating}
              key={suggestion}
              onClick={() => ask(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2 rounded-full border border-white/15 bg-zinc-900/80 py-1.5 pr-1.5 pl-4"
          onSubmit={(event) => {
            event.preventDefault()
            ask(draft)
          }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            enterKeyHint="send"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="问一个关于你这一年的统计…"
            value={draft}
          />
          <button
            aria-label="发送"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-zinc-950 transition-opacity disabled:opacity-30"
            disabled={isGenerating || !draft.trim()}
            type="submit"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
