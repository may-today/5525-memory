import type { CSSProperties } from 'react'
import { useSummaryDataContext } from '../summary-data-context'

interface SeasonFieldMeta {
  /** 季节主色：锚在象限外角的最亮一池，也是季节字与次数的字色。 */
  color: string
  /** 季节深色：沉在朝向屏幕中心的对角，四个象限的深色在画面中心相遇。 */
  colorDepth: string
  /** 季节第二色：晕在纵向邻角，与主色相融出这个季节的色温。 */
  colorWash: string
  /** 光场锚定的象限外角；顺时针 春左上 → 夏右上 → 秋右下 → 冬左下，编码一年的循环。 */
  corner: 'bl' | 'br' | 'tl' | 'tr'
  /** 季节名。 */
  name: string
}

/** DOM 顺序保持春夏秋冬（朗读顺序即季节顺序），秋冬经 grid-area 换到下排对角位。 */
const SEASON_FIELDS: SeasonFieldMeta[] = [
  { name: '春', color: '#fda4af', colorWash: '#86efac', colorDepth: '#f0abfc', corner: 'tl' },
  { name: '夏', color: '#5eead4', colorWash: '#38bdf8', colorDepth: '#818cf8', corner: 'tr' },
  { name: '秋', color: '#fbbf24', colorWash: '#fb923c', colorDepth: '#fb7185', corner: 'br' },
  { name: '冬', color: '#a5b4fc', colorWash: '#bae6fd', colorDepth: '#6366f1', corner: 'bl' },
]

/**
 * The seasonal playlist as four "light fields": each quadrant is a seasonal
 * gradient blooming from its outer screen corner and fading toward a dark,
 * quiet center, with the season's most-heard random song embedded in the
 * light. Fields fade in clockwise (the cycle of a year) and keep breathing
 * with quarter-phase offsets, like four seasons of the same year.
 */
export function SummaryCardSeasonalPlaylist() {
  const { overview, seasonalSongStats } = useSummaryDataContext()
  const { seasons } = seasonalSongStats
  const hasAnySong = seasons.some((season) => season.song !== null)

  if (!hasAnySong) {
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
    <div className="flex h-svh flex-col bg-zinc-950 pt-6 pb-24">
      <div className="shrink-0 px-6">
        <p className="text-xs text-zinc-500">你的四季歌单</p>
        <h3 className="mt-2 font-title text-white text-xl leading-snug">每一个季节，都有一首歌留在耳边。</h3>
      </div>

      <div className="mx-6 my-4 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 overflow-hidden rounded-2xl border border-white/10">
        {SEASON_FIELDS.map((field, index) => {
          const entry = seasons[index]
          const song = entry?.song ?? null

          return (
            <section
              aria-label={
                song
                  ? `${field.name}：《${song.title}》现场响起 ${song.count} 次`
                  : `${field.name}：还没有属于这个季节的歌`
              }
              className="summary-seasons-field"
              data-corner={field.corner}
              data-empty={song ? undefined : true}
              key={field.name}
              style={
                {
                  '--season-color': field.color,
                  '--season-wash': field.colorWash,
                  '--season-depth': field.colorDepth,
                  '--i': index,
                } as CSSProperties
              }
            >
              <p className="summary-seasons-glyph font-title">{field.name}</p>

              <div className="summary-seasons-song">
                {song ? (
                  <>
                    <p className="summary-seasons-title font-title text-3xl text-white leading-snug">{song.title}</p>
                    <p className="summary-seasons-count">
                      现场响起 <span className="font-title">×{song.count}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {entry && entry.showCount > 0 ? '这个季节没有留下点歌' : '这个季节，你还没有出发'}
                  </p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <p className="shrink-0 px-6 text-[10px] text-zinc-600">
        口径：按场次日期把点歌与安可分进四季，各取响起最多的一首；主歌单不计入。
      </p>
    </div>
  )
}
