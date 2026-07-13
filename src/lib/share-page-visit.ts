export const SHARE_PAGE_VISITED_STORAGE_KEY = 'share-page-visited:v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/** Persist that the current browser has opened the share page at least once. */
export function markSharePageVisited(): void {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(SHARE_PAGE_VISITED_STORAGE_KEY, 'true')
  } catch {
    // The shortcut is optional when browser storage is unavailable.
  }
}

/** Return whether the current browser has opened the share page before. */
export function hasVisitedSharePage(): boolean {
  if (!isBrowser()) {
    return false
  }

  try {
    return window.localStorage.getItem(SHARE_PAGE_VISITED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}
