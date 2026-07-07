import { useEffect, useState } from 'react'
import { getSummaryData } from '@/server/summary'
import type { SummaryData } from '@/server/summary'
import { concertStore } from '@/stores/concert-store'

const STORAGE_KEY = 'concert-form-data:v1'

/** Reads the showIds to fetch stats for: the store if already populated (normal /form -> /loading -> /summary flow), otherwise the sessionStorage snapshot written by FormPage (hard refresh on /summary). */
function resolveInitialShowIds(): number[] {
  const storeIds = concertStore.state.selectedShows.map((show) => show.id)
  if (storeIds.length > 0) return storeIds

  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as { showIds?: number[] }
    return parsed.showIds ?? []
  } catch {
    return []
  }
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
      concertStore.setState(() => ({ selectedShows: result.selectedShows }))
      setData(result)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, ready: data !== null }
}
