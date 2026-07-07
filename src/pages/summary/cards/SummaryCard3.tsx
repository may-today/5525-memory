import { useSummaryDataContext } from '../summary-data-context'

export function SummaryCard3() {
  const { songStats } = useSummaryDataContext()

  return (
    <div className="flex min-h-svh flex-col p-6">
      <p className="mb-4 text-muted-foreground text-xs uppercase tracking-widest">03 / 歌曲回顾</p>
      <h3 className="mb-8 font-bold text-2xl">你听了哪些歌？</h3>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-muted p-5">
          <p className="text-muted-foreground text-xs">总歌曲数</p>
          <p className="mt-1 font-bold text-4xl">{songStats.totalSongs}</p>
        </div>
        <div className="rounded-xl bg-muted p-5">
          <p className="text-muted-foreground text-xs">最常出现的歌</p>
          <p className="mt-1 font-bold text-2xl">
            {songStats.topSong ? `${songStats.topSong.title} · ${songStats.topSong.count}` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
