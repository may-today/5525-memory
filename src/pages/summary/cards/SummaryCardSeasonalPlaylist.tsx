import { useSummaryDataContext } from '../summary-data-context'

const SEASONS = ['春', '夏', '秋', '冬'] as const

/**
 * A four-season shelf for the user's random songs. This first version provides
 * the presentation structure; seasonal play counts will replace the ordered
 * fallback songs once that aggregation is available.
 */
export function SummaryCardSeasonalPlaylist() {
  const { overview, randomSongStats } = useSummaryDataContext()
  const { entries } = randomSongStats

  if (entries.length === 0) {
    return (
      <div className="flex h-svh flex-col bg-zinc-950">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-24 text-center">
          <h3 className="font-title text-white text-xl">四季歌单还没写下第一首歌</h3>
          <p className="text-sm text-zinc-400">
            {overview.totalShows > 0
              ? '这些场次还没有留下点歌与安可的记录。'
              : '选好你去过的场次，四季会慢慢长出属于你的歌。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col bg-zinc-950 px-6 pt-6 pb-24">
      <div className="shrink-0">
        <p className="text-xs text-zinc-500">你的四季歌单</p>
        <h3 className="mt-2 font-title text-white text-xl leading-snug">每一个季节，都有一首歌留在耳边。</h3>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 py-8">
        {SEASONS.map((season, index) => {
          const song = entries[index]

          return (
            <div
              className="flex min-h-0 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              key={season}
            >
              <p className="font-title text-3xl text-zinc-500">{season}</p>
              <p className="font-title text-2xl text-white leading-snug">{song?.title ?? '尚未收录'}</p>
            </div>
          )
        })}
      </div>

      <p className="shrink-0 text-xs text-zinc-600">四季最高频歌曲统计即将补上；当前先展示你的随机曲目。</p>
    </div>
  )
}
