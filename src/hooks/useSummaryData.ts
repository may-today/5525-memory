import { useEffect, useState } from 'react'
import type { SummaryData } from '@/server/summary'
import { getSummaryData } from '@/server/summary'
import {
  concertStore,
  getPersistedConcertProfile,
  getPersistedShowIds,
} from '@/stores/concert-store'

/** Reads showIds from the store first, then the localStorage persistence snapshot. */
function resolveInitialShowIds(): number[] {
  const storeIds = concertStore.state.selectedShows.map((show) => show.id)
  if (storeIds.length > 0) return storeIds

  return getPersistedShowIds()
}

/** Reads the form location from the live store, with localStorage as the hard-refresh fallback. */
function resolveInitialLocation() {
  const profile = concertStore.state.profile
  return profile.coordinates || profile.city ? profile : getPersistedConcertProfile()
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
    const location = resolveInitialLocation()

    getSummaryData({ data: { showIds, city: location.city, coordinates: location.coordinates } }).then((result) => {
      if (cancelled) return
      // Hydrate the profile alongside selectedShows so cards (e.g. the City
      // card's departure copy) survive a hard refresh on /summary.
      concertStore.setState((state) => ({ ...state, profile: location, selectedShows: result.selectedShows }))
      setData(result)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, ready: data !== null }
}
