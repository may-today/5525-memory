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

/** Anonymous report registration details; no profile or location data is included. */
export interface ReportSubmissionStats {
  fellowFansByShowId: Record<number, number>
  reportNumber: number
  submissionId: string
}

export interface ConcertState {
  profile: ConcertProfile
  reportSubmission: ReportSubmissionStats | null
  reportSubmissionId: string | null
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
  reportSubmission?: ReportSubmissionStats | null
  reportSubmissionId?: string | null
  showIds?: number[]
  showIndexes?: number[]
}

const DEFAULT_PROFILE: ConcertProfile = {
  city: '',
  coordinates: null,
  nickname: '',
}

const SUBMISSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const concertStore = new Store<ConcertState>({
  profile: DEFAULT_PROFILE,
  reportSubmission: null,
  reportSubmissionId: null,
  selectedShows: [],
})

let isHydratingConcertState = false

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/** Create an RFC 4122 version 4 UUID in browsers without crypto.randomUUID. */
function createAnonymousSubmissionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
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
        reportSubmission: state.reportSubmission,
        reportSubmissionId: state.reportSubmissionId,
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
  const persistedReport = readPersistedReportSubmission(persistedIds)
  hydrateConcertStore(
    (state) => ({
      ...state,
      reportSubmission: persistedReport?.stats ?? null,
      reportSubmissionId: persistedReport?.submissionId ?? null,
      selectedShows,
    }),
    true
  )
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
      reportSubmission: null,
      reportSubmissionId: null,
      selectedShows: isSelected
        ? state.selectedShows.filter((selectedShow) => selectedShow.id !== show.id)
        : [...state.selectedShows, show],
    }
  })
}

/** Clear the global concert selection. */
export function clearSelectedShows(): void {
  concertStore.setState((state) => ({ ...state, reportSubmission: null, reportSubmissionId: null, selectedShows: [] }))
}

/** Replace the global concert selection with a validated set of shows. */
export function replaceSelectedShows(selectedShows: Show[]): void {
  concertStore.setState((state) => ({
    ...state,
    reportSubmission: null,
    reportSubmissionId: null,
    selectedShows,
  }))
}

/** Persist the server-confirmed anonymous registration associated with the current selection. */
export function saveReportSubmission(reportSubmission: ReportSubmissionStats): void {
  concertStore.setState((state) => ({ ...state, reportSubmission, reportSubmissionId: reportSubmission.submissionId }))
}

/** Reuse the stable idempotency key if this exact selection already has one. */
export function getOrCreateReportSubmissionId(): string {
  const existingId = concertStore.state.reportSubmissionId
  if (existingId) return existingId

  const reportSubmissionId = createAnonymousSubmissionId()
  concertStore.setState((state) => ({ ...state, reportSubmissionId }))
  return reportSubmissionId
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

/** Restores a report result only when it belongs to the persisted selection. */
function readPersistedReportSubmission(showIds: Set<number>): { stats: ReportSubmissionStats | null; submissionId: string } | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(CONCERT_FORM_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedConcertSelection
    const persistedShowIds = new Set(parsed.showIds ?? [])
    if (persistedShowIds.size !== showIds.size || [...persistedShowIds].some((showId) => !showIds.has(showId))) return null

    const submissionId = parsed.reportSubmissionId ?? parsed.reportSubmission?.submissionId
    if (typeof submissionId !== 'string' || !isSubmissionId(submissionId)) return null

    const stats = parsed.reportSubmission
    if (!(stats && Number.isInteger(stats.reportNumber)) || stats.reportNumber < 1) {
      return { stats: null, submissionId }
    }
    return { stats, submissionId }
  } catch {
    return null
  }
}

/** Validates the UUID shape without depending on a browser crypto API during hydration. */
function isSubmissionId(value: string): boolean {
  return SUBMISSION_ID_PATTERN.test(value)
}
