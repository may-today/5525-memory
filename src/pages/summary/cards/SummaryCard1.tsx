export function SummaryCard1() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <p className="text-muted-foreground mb-4 text-xs uppercase tracking-widest">01 / 场次回顾</p>
      <h3 className="mb-8 text-2xl font-bold">你参加了几场？</h3>

      <div className="flex flex-col gap-4">
        <div className="bg-muted rounded-xl p-5">
          <p className="text-muted-foreground text-xs">总场次</p>
          <p className="mt-1 text-4xl font-bold">—</p>
        </div>
        <div className="bg-muted rounded-xl p-5">
          <p className="text-muted-foreground text-xs">城市</p>
          <p className="mt-1 text-4xl font-bold">—</p>
        </div>
        {/* Extra content to demonstrate in-page vertical scroll */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-xl p-5 opacity-40">
            <p className="text-muted-foreground text-xs">统计项 {i + 1}</p>
            <p className="mt-1 text-2xl font-semibold">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
