export function SummaryCard2() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <p className="text-muted-foreground mb-4 text-xs uppercase tracking-widest">02 / 里程追踪</p>
      <h3 className="mb-8 text-2xl font-bold">你走了多远？</h3>

      <div className="flex flex-col gap-4">
        <div className="bg-muted rounded-xl p-5">
          <p className="text-muted-foreground text-xs">总里程（估算）</p>
          <p className="mt-1 text-4xl font-bold">— km</p>
        </div>
        <div className="bg-muted rounded-xl p-5">
          <p className="text-muted-foreground text-xs">最远城市</p>
          <p className="mt-1 text-4xl font-bold">—</p>
        </div>
      </div>
    </div>
  )
}
