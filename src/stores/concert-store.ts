import { Store } from '@tanstack/store'

import type { Show } from '@/types'

export const CONCERT_FORM_STORAGE_KEY = 'concert-form-data:v1'

export interface ConcertProfile {
  city: string
  coordinates: null | {
    latitude: number
    longitude: number
  }
  nickname: string
}

export interface ConcertState {
  profile: ConcertProfile
  selectedShows: Show[]
}

interface PersistedConcertSelection {
  city?: string
  coordinates?: null | {
    latitude?: number
    longitude?: number
  }
  nickname?: string
  profile?: Partial<ConcertProfile>
  showIndexes?: number[]
  showIds?: number[]
}

const DEFAULT_PROFILE: ConcertProfile = {
  city: '',
  coordinates: null,
  nickname: '',
}

export const concertStore = new Store<ConcertState>({
  profile: DEFAULT_PROFILE,
  selectedShows: [],
})

let isHydratingConcertState = false

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

function readPersistedProfile(): ConcertProfile {
  if (!isBrowser()) {
    return DEFAULT_PROFILE
  }

  try {
    const raw = window.localStorage.getItem(CONCERT_FORM_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_PROFILE
    }

    const parsed = JSON.parse(raw) as PersistedConcertSelection
    const source = parsed.profile ?? parsed
    const coordinates =
      source.coordinates &&
      typeof source.coordinates.latitude === 'number' &&
      typeof source.coordinates.longitude === 'number'
        ? {
            latitude: source.coordinates.latitude,
            longitude: source.coordinates.longitude,
          }
        : null

    return {
      city: typeof source.city === 'string' ? source.city : '',
      coordinates,
      nickname: typeof source.nickname === 'string' ? source.nickname : '',
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

function persistConcertState(state: ConcertState): void {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(
      CONCERT_FORM_STORAGE_KEY,
      JSON.stringify({
        profile: state.profile,
        showIndexes: state.selectedShows.map((show) => show.showIndex),
        showIds: state.selectedShows.map((show) => show.id),
      })
    )
  } catch {
    // Persistence is best-effort; the in-memory store remains authoritative.
  }
}

concertStore.subscribe((state) => {
  if (isHydratingConcertState) {
    return
  }

  persistConcertState(state)
})

function hydrateConcertStore(
  updater: (state: ConcertState) => ConcertState,
  shouldPersistAfterHydration = false
): void {
  isHydratingConcertState = true
  try {
    concertStore.setState(updater)
  } finally {
    isHydratingConcertState = false
  }

  if (shouldPersistAfterHydration) {
    persistConcertState(concertStore.state)
  }
}

/** Hydrate selected shows from localStorage using the loaded show catalog. */
export function hydrateSelectedShows(allShows: Show[]): void {
  const persistedIds = new Set(readPersistedShowIds())
  if (persistedIds.size === 0) {
    return
  }

  const selectedShows = allShows.filter((show) => persistedIds.has(show.id))
  hydrateConcertStore((state) => ({ ...state, selectedShows }), true)
}

/** Hydrate profile fields from localStorage. */
export function hydrateConcertProfile(): void {
  const profile = readPersistedProfile()
  hydrateConcertStore((state) => ({ ...state, profile }))
}

/** Update the persisted profile collected before show selection. */
export function updateConcertProfile(profile: Partial<ConcertProfile>): void {
  concertStore.setState((state) => ({
    ...state,
    profile: {
      ...state.profile,
      ...profile,
    },
  }))
}

/** Add or remove a show from the global concert selection. */
export function toggleSelectedShow(show: Show): void {
  concertStore.setState((state) => {
    const isSelected = state.selectedShows.some((selectedShow) => selectedShow.id === show.id)

    return {
      ...state,
      selectedShows: isSelected
        ? state.selectedShows.filter((selectedShow) => selectedShow.id !== show.id)
        : [...state.selectedShows, show],
    }
  })
}

/** Clear the global concert selection. */
export function clearSelectedShows(): void {
  concertStore.setState((state) => ({ ...state, selectedShows: [] }))
}

/** Read persisted show IDs from localStorage. */
export function getPersistedShowIds(): number[] {
  return readPersistedShowIds()
}

/** Read persisted chronological show indexes from localStorage. */
export function getPersistedShowIndexes(): number[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(CONCERT_FORM_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as PersistedConcertSelection
    return Array.isArray(parsed.showIndexes) ? parsed.showIndexes.filter((index) => Number.isInteger(index) && index >= 0) : []
  } catch {
    return []
  }
}

/** Read the profile snapshot persisted by the form, including optional browser coordinates. */
export function getPersistedConcertProfile(): ConcertProfile {
  return readPersistedProfile()
}
