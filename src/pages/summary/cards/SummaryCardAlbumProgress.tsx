import { coverIdMap, getCoverImg } from '@/data/cover'
import { songList } from '@/data/song-list'
import { SummaryScrollFadeTop } from '../SummaryScrollFadeTop'
import { useSummaryDataContext } from '../summary-data-context'

interface AlbumProgress {
  heardCount: number
  name: string
  songs: AlbumSongProgress[]
  totalCount: number
}

interface AlbumSongProgress {
  isHeard: boolean
  title: string
}

/** Builds the nine official-album completion records from the music-wall listening state. */
function getAlbumProgresses(heardSongTitles: Set<string>): AlbumProgress[] {
  return Object.keys(coverIdMap).map((name) => {
    const songs = songList
      .filter((song) => song.meta.album === name)
      .map((song) => ({ title: song.title, isHeard: heardSongTitles.has(song.title) }))
    const heardCount = songs.filter((song) => song.isHeard).length

    return { name, songs, heardCount, totalCount: songs.length }
  })
}

/** A nine-album listening ledger whose heard state shares the music wall's exact tour appearance definition. */
export function SummaryCardAlbumProgress() {
  const { tourSongs } = useSummaryDataContext()
  const heardSongTitles = new Set(
    tourSongs.filter((song) => song.appearances.some((appearance) => appearance.isHeard)).map((song) => song.title)
  )
  const albums = getAlbumProgresses(heardSongTitles)
  const heardCount = albums.reduce((sum, album) => sum + album.heardCount, 0)
  const totalCount = albums.reduce((sum, album) => sum + album.totalCount, 0)

  return (
    <div className="flex h-svh flex-col bg-zinc-950">
      <div className="shrink-0 px-6 pt-6 pb-3">
        <h3 className="font-title text-white text-xl leading-snug">九张专辑，解锁成你的五月天。</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-1 pb-24" data-scroll-container>
        <SummaryScrollFadeTop />
        <p className="text-sm text-zinc-400 leading-relaxed">
          岁月留声机里的每一次相遇，都回到它最初被收录的专辑。九张正式专辑共{' '}
          <span className="font-geist text-zinc-100">{totalCount}</span> 首歌，你已在现场听过{' '}
          <span className="font-geist text-zinc-100">{heardCount}</span> 首。
        </p>

        <div className="mt-7 space-y-5">
          {albums.map((album) => {
            const progress = album.totalCount > 0 ? Math.round((album.heardCount / album.totalCount) * 100) : 0

            return (
              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3" key={album.name}>
                <div className="flex gap-4">
                  <img
                    alt={`《${album.name}》专辑封面`}
                    className="h-24 w-24 shrink-0 rounded-md border border-white/10 object-cover shadow-black/30 shadow-lg"
                    height={96}
                    loading="lazy"
                    src={getCoverImg(album.name)}
                    width={96}
                  />
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="font-title text-lg text-zinc-100 leading-tight">{album.name}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-xs text-zinc-500">
                        已听 <span className="font-geist text-zinc-200">{album.heardCount}</span> / {album.totalCount} 首
                      </p>
                      <p className="font-geist text-2xl text-sky-300 leading-none">{progress}%</p>
                    </div>
                    <div
                      aria-label={`《${album.name}》已解锁 ${progress}%`}
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={progress}
                    >
                      <div className="h-full rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.65)]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 border-white/5 border-t pt-3">
                  {album.songs.map((song) => (
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] leading-none ${
                        song.isHeard
                          ? 'border-sky-300/35 bg-sky-400/15 text-sky-100'
                          : 'border-white/8 bg-black/15 text-zinc-600'
                      }`}
                      key={song.title}
                    >
                      {song.title}
                    </span>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <p className="mt-7 text-[10px] text-zinc-600">口径：以九张正式专辑收录曲为分母；仅在你到场的巡演场次中听过，才会解锁。</p>
      </div>
    </div>
  )
}
