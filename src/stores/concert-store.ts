import { Store } from '@tanstack/store'

import type { Show } from '@/types'

export interface ConcertState {
  selectedShows: Show[]
}

export const concertStore = new Store<ConcertState>({
  selectedShows: [],
})

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

/** Remove all shows from the global concert selection. */
export function clearSelectedShows(): void {
  concertStore.setState(() => ({ selectedShows: [] }))
}
