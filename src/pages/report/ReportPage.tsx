import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { ArrowUp, Check, ChevronLeft, LoaderCircle, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { concertStore, getPersistedShowIds } from '@/stores/concert-store'
import { ReportCard } from './ReportCard'
import { REPORT_GREETING, REPORT_SUGGESTIONS, type ReportCardData, ReportCardSchema } from './report-schema'

interface UserTextPart {
  content: string
  type: 'text'
}

interface StructuredReportPart {
  data?: ReportCardData
  errorMessage?: string
  partial?: Partial<ReportCardData>
  status: 'complete' | 'error' | 'streaming'
  type: 'structured-output'
}

interface ToolCallPart {
  name: string
  state: string
  type: 'tool-call'
}

function getUserText(parts: readonly unknown[]): string {
  return parts
    .filter(
      (part): part is UserTextPart =>
        typeof part === 'object' && part !== null && (part as { type?: unknown }).type === 'text'
    )
    .map((part) => part.content)
    .join('')
}

function getStructuredPart(parts: readonly unknown[]): StructuredReportPart | undefined {
  return parts.find(
    (part): part is StructuredReportPart =>
      typeof part === 'object' && part !== null && (part as { type?: unknown }).type === 'structured-output'
  )
}

function getToolCallParts(parts: readonly unknown[]): ToolCallPart[] {
  return parts.filter(
    (part): part is ToolCallPart =>
      typeof part === 'object' && part !== null && (part as { type?: unknown }).type === 'tool-call'
  )
}

function resolvePartialCard(part: StructuredReportPart): ReportCardData | null {
  const parsed = ReportCardSchema.safeParse(part.data ?? part.partial)
  return parsed.success ? parsed.data : null
}

function toolLabel(name: string): string {
  if (name === 'get_attendance_overview') return '读取你的演出选择…'
  if (name === 'rank_cities') return '按城市聚合场次…'
  if (name === 'rank_songs') return '统计歌曲出现次数…'
  if (name === 'song_timeline') return '整理歌曲相遇时间线…'
  if (name === 'rank_guests') return '统计同场嘉宾…'
  return '检索 5525 数据…'
}

function isToolComplete(state: string): boolean {
  return state === 'complete' || state === 'output-available'
}

/** Tool-backed computation checklist shown while a card is generated. */
function ThinkingSteps({ steps, tools }: { steps: string[]; tools: ToolCallPart[] }) {
  const displaySteps = steps.length > 0 ? steps : tools.map((tool) => toolLabel(tool.name))
  if (displaySteps.length === 0) {
    return (
      <div className="report-msg-in flex items-center gap-2">
        <span aria-hidden="true" className="report-thinking-dot" />
        <p className="text-xs text-zinc-200">正在调谐 5525 数据电台…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {displaySteps.map((step, index) => {
        const tool = tools[index]
        const isComplete = tool ? isToolComplete(tool.state) : index < displaySteps.length - 1
        const isActive = !isComplete
        return (
          <div className="report-msg-in flex items-center gap-2" key={step}>
            {isComplete ? (
              <Check aria-hidden="true" className="size-3 text-zinc-500" />
            ) : (
              <span aria-hidden="true" className="report-thinking-dot" />
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
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedShows = useSelector(concertStore, (state) => state.selectedShows)
  const selectedShowIds = useMemo(
    () => (selectedShows.length > 0 ? selectedShows.map((show) => show.id) : getPersistedShowIds()),
    [selectedShows]
  )
  const connection = useMemo(
    () =>
      fetchServerSentEvents('/api/report-chat', {
        body: { showIds: selectedShowIds },
      }),
    [selectedShowIds]
  )
  const { error, isLoading, messages, sendMessage, stop } = useChat({
    connection,
    outputSchema: ReportCardSchema,
  })

  // Keep the newest message and each streaming update in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })

  async function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || isLoading) return

    setDraft('')
    await sendMessage(trimmed)
  }

  let serial = 0

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
          <div className="report-msg-in max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-zinc-900/60 px-4 py-3">
            <p className="text-sm text-zinc-200 leading-relaxed">{REPORT_GREETING}</p>
          </div>

          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div className="report-msg-in flex justify-end" key={message.id}>
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-sm text-zinc-100">
                    {getUserText(message.parts)}
                  </p>
                </div>
              )
            }

            if (message.role === 'assistant') {
              const structuredPart = getStructuredPart(message.parts)
              const toolParts = getToolCallParts(message.parts)
              const card = structuredPart ? resolvePartialCard(structuredPart) : null

              if (card) {
                serial += 1
                return (
                  <div key={message.id}>
                    <ReportCard card={card} serial={serial} />
                  </div>
                )
              }

              return (
                <div
                  className="report-msg-in max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-zinc-900/60 px-4 py-3"
                  key={message.id}
                >
                  <ThinkingSteps steps={structuredPart?.partial?.steps ?? []} tools={toolParts} />
                  {structuredPart?.status === 'error' && (
                    <p className="mt-3 text-red-300 text-xs">{structuredPart.errorMessage ?? '卡片生成失败'}</p>
                  )}
                </div>
              )
            }

            return null
          })}

          {error && (
            <div className="report-msg-in max-w-[85%] rounded-2xl rounded-bl-md border border-red-400/20 bg-red-950/30 px-4 py-3">
              <p className="text-red-200 text-sm leading-relaxed">数据电台暂时没有接通。请确认服务端 AI 配置后再试。</p>
            </div>
          )}
        </div>
      </div>

      <footer className="relative shrink-0 px-4 pt-2 pb-6">
        <div className="report-chip-row mb-3 flex gap-2 overflow-x-auto">
          {REPORT_SUGGESTIONS.map((suggestion) => (
            <button
              className="shrink-0 rounded-full border border-white/15 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300 transition-colors active:bg-zinc-800 disabled:opacity-40"
              disabled={isLoading}
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
            aria-label={isLoading ? '停止' : '发送'}
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-zinc-950 transition-opacity disabled:opacity-30"
            disabled={!(isLoading || draft.trim())}
            onClick={(event) => {
              if (!isLoading) return
              event.preventDefault()
              stop()
            }}
            type="submit"
          >
            {isLoading ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                <Square aria-hidden="true" className="absolute size-1.5 fill-current" />
              </>
            ) : (
              <ArrowUp className="size-4" />
            )}
          </button>
        </form>
      </footer>
    </div>
  )
}
