import type { CSSProperties } from 'react'

import type { ReportCardData, ReportRankEntry, ReportTimelineEntry } from './report-schema'

/**
 * Ranked horizontal bars. Single series, so no legend: the hero answer names
 * it. Bars share one accent hue; values wear ink, not the series color.
 */
function RankBlock({ entries }: { entries: ReportRankEntry[] }) {
  const max = Math.max(...entries.map((entry) => entry.value), 1)

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry, index) => (
        <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3" key={entry.label}>
          <p className="truncate text-xs text-zinc-300">{entry.label}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="report-bar h-full rounded-full"
              style={
                {
                  '--i': index,
                  width: `${(entry.value / max) * 100}%`,
                  background: 'var(--report-color)',
                  opacity: index === 0 ? 1 : 0.55,
                } as CSSProperties
              }
            />
          </div>
          <p className="w-4 text-right font-geist text-sm text-zinc-100">{entry.value}</p>
        </div>
      ))}
    </div>
  )
}

/** Vertical date timeline — every encounter with the queried song. */
function TimelineBlock({ entries }: { entries: ReportTimelineEntry[] }) {
  return (
    <div className="report-timeline flex flex-col gap-3">
      {entries.map((entry) => (
        <div className="flex items-baseline gap-3" key={`${entry.date}-${entry.city}`}>
          <span aria-hidden="true" className="report-timeline-dot" />
          <p className="font-geist text-sm text-zinc-100">{entry.date}</p>
          <p className="text-xs text-zinc-400">{entry.city}</p>
          {entry.note && <p className="text-[10px] text-zinc-500">· {entry.note}</p>}
        </div>
      ))}
    </div>
  )
}

/**
 * A generated report card — a printed "data receipt" for one question.
 * The thermal-print reveal lives on the wrapper class `report-card-print`.
 */
export function ReportCard({ card }: { card: ReportCardData }) {
  return (
    <div
      className="report-card-print relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 p-5"
      style={{ '--report-color': card.themeColor } as CSSProperties}
    >
      <div aria-hidden="true" className="report-card-glow" />

      <div className="relative">
        <h3 className="font-wjh text-lg text-white">{card.question}</h3>

        <div className="mt-5 mb-6">
          <p className="text-xs text-zinc-400">{card.heroLabel}</p>
          <p className="report-hero mt-1 flex items-baseline gap-2">
            <span className={card.isHeroNumeric ? 'font-geist text-6xl' : 'font-wjh text-4xl'}>{card.heroValue}</span>
            {card.heroUnit && <span className="font-geist text-xl text-zinc-300">{card.heroUnit}</span>}
          </p>
        </div>

        {card.rank && <RankBlock entries={card.rank} />}
        {card.timeline && <TimelineBlock entries={card.timeline} />}

        <div className="mt-6 flex items-center justify-between gap-4 border-white/15 border-t border-dashed pt-3">
          <p className="text-[10px] text-zinc-500">{card.footnote}</p>
          <p className="shrink-0 rounded-sm border border-white/10 px-1.5 py-0.5 text-[9px] text-zinc-500">实时统计</p>
        </div>
      </div>
    </div>
  )
}
