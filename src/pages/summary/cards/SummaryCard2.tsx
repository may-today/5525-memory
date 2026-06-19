export function SummaryCard2() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <p className="mb-4 text-muted-foreground text-xs uppercase tracking-widest">02 / 里程追踪</p>
      <h3 className="mb-8 font-bold text-2xl">你走了多远？</h3>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-muted p-5">
          <p className="text-muted-foreground text-xs">总里程（估算）</p>
          <p className="mt-1 font-bold text-4xl">— km</p>
        </div>
        <div className="rounded-xl bg-muted p-5">
          <p className="text-muted-foreground text-xs">最远城市</p>
          <p className="mt-1 font-bold text-4xl">—</p>
        </div>
      </div>
    </div>
  )
}
