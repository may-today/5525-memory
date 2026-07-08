import { Store } from '@tanstack/store'

import type { Show } from '@/types'

export const CONCERT_FORM_STORAGE_KEY = 'concert-form-data:v1'

export interface ConcertState {
  selectedShows: Show[]
}

interface PersistedConcertSelection {
  showIds?: number[]
}

export const concertStore = new Store<ConcertState>({
  selectedShows: [],
})

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readPersistedShowIds(): number[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(CONCERT_FORM_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as PersistedConcertSelection
    return Array.isArray(parsed.showIds) ? parsed.showIds.filter((id) => Number.isInteger(id)) : []
  } catch {
    return []
  }
}

function persistSelectedShows(selectedShows: Show[]): void {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(
      CONCERT_FORM_STORAGE_KEY,
      JSON.stringify({ showIds: selectedShows.map((show) => show.id) })
    )
  } catch {
    // Persistence is best-effort; the in-memory store remains authoritative.
  }
}

concertStore.subscribe((state) => {
  persistSelectedShows(state.selectedShows)
})

/** Hydrate selected shows from localStorage using the loaded show catalog. */
export function hydrateSelectedShows(allShows: Show[]): void {
  const persistedIds = new Set(readPersistedShowIds())
  if (persistedIds.size === 0) {
    return
  }

  const selectedShows = allShows.filter((show) => persistedIds.has(show.id))
  concertStore.setState(() => ({ selectedShows }))
}

/** Add or remove a show from the global concert selection. */
export function toggleSelectedShow(show: Show): void {
  concertStore.setState((state) => {
    const isSelected = state.selectedShows.some((selectedShow) => selectedShow.id === show.id)

    return {
      selectedShows: isSelected
        ? state.selectedShows.filter((selectedShow) => selectedShow.id !== show.id)
        : [...state.selectedShows, show],
    }
  })
}

/** Clear the global concert selection. */
export function clearSelectedShows(): void {
  concertStore.setState(() => ({ selectedShows: [] }))
}

/** Read persisted show IDs from localStorage. */
export function getPersistedShowIds(): number[] {
  return readPersistedShowIds()
}
