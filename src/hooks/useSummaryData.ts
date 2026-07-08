import { useEffect, useState } from 'react'
import type { SummaryData } from '@/server/summary'
import { getSummaryData } from '@/server/summary'
import { concertStore, getPersistedShowIds } from '@/stores/concert-store'

/** Reads showIds from the store first, then the localStorage persistence snapshot. */
function resolveInitialShowIds(): number[] {
  const storeIds = concertStore.state.selectedShows.map((show) => show.id)
  if (storeIds.length > 0) return storeIds

  return getPersistedShowIds()
}

/**
 * Fetches all /summary card data in a single request and writes the resolved
 * selectedShows back into concertStore — this also closes the gap where a
 * hard refresh on /summary used to leave concertStore empty.
 */
export function useSummaryData(): { data: SummaryData | null; ready: boolean } {
  const [data, setData] = useState<SummaryData | null>(null)

  useEffect(() => {
    let cancelled = false
    const showIds = resolveInitialShowIds()

    getSummaryData({ data: showIds }).then((result) => {
      if (cancelled) return
      concertStore.setState((state) => ({ ...state, selectedShows: result.selectedShows }))
      setData(result)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, ready: data !== null }
}
