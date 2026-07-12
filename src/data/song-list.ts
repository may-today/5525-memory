import SongData from './song-data.json'

interface SongMeta {
  meta: {
    year?: number
    album?: string
    lyricist?: string
    composer?: string
    banlam: boolean
    length?: number
    showTitle?: string
    customIndex?: string
  }
  slug: string
  title: string
}

export const songList: SongMeta[] = SongData.map((song) => ({
  title: song.title,
  slug: song.slug,
  meta: song.meta,
}))
