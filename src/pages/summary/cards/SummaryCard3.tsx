export function SummaryCard3() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <p className="text-muted-foreground mb-4 text-xs uppercase tracking-widest">03 / 歌曲回顾</p>
      <h3 className="mb-8 text-2xl font-bold">你听了哪些歌？</h3>

      <div className="flex flex-col gap-4">
        <div className="bg-muted rounded-xl p-5">
          <p className="text-muted-foreground text-xs">总歌曲数</p>
          <p className="mt-1 text-4xl font-bold">—</p>
        </div>
        <div className="bg-muted rounded-xl p-5">
          <p className="text-muted-foreground text-xs">最常出现的歌</p>
          <p className="mt-1 text-2xl font-bold">—</p>
        </div>
      </div>
    </div>
  )
}
