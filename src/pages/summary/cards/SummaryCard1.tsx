import { useSummaryDataContext } from '../summary-data-context'

export function SummaryCard1() {
  const { overview } = useSummaryDataContext()

  return (
    <div className="flex h-svh flex-col">
      <div className="shrink-0 px-6 pt-6">
        <p className="mb-4 text-muted-foreground text-xs uppercase tracking-widest">01 / 场次回顾</p>
        <h3 className="font-bold text-2xl">你参加了几场？</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24" data-scroll-container>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-muted p-5">
            <p className="text-muted-foreground text-xs">总场次</p>
            <p className="mt-1 font-bold text-4xl">{overview.totalShows}</p>
          </div>
          <div className="rounded-xl bg-muted p-5">
            <p className="text-muted-foreground text-xs">城市</p>
            <p className="mt-1 font-bold text-4xl">{overview.cityCount}</p>
          </div>
          {/* Extra content to demonstrate in-page vertical scroll */}
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, index is the item identity
            <div className="rounded-xl bg-muted p-5 opacity-40" key={i}>
              <p className="text-muted-foreground text-xs">统计项 {i + 1}</p>
              <p className="mt-1 font-semibold text-2xl">—</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
