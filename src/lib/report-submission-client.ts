import { registerReportSubmission } from '@/server/report-submissions'
import { concertStore, saveReportSubmission } from '@/stores/concert-store'

const REPORT_REGISTRATION_ATTEMPTS = 3

let activeRegistration: Promise<void> | null = null

/** Delays a retry without blocking rendering or navigation. */
function waitForRetry(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt + Math.random() * 150))
}

/**
 * Attempts to durably register the locally persisted report without delaying
 * the user journey. Concurrent callers share one idempotent request sequence.
 */
export function flushPendingReportSubmission(): Promise<void> {
  if (concertStore.state.reportSubmission) return Promise.resolve()
  if (activeRegistration) return activeRegistration

  const { reportSubmissionId, selectedShows } = concertStore.state
  if (!reportSubmissionId || selectedShows.length === 0) return Promise.resolve()

  activeRegistration = (async () => {
    const showIds = selectedShows.map((show) => show.id)
    for (let attempt = 0; attempt < REPORT_REGISTRATION_ATTEMPTS; attempt++) {
      try {
        const stats = await registerReportSubmission({ data: { showIds, submissionId: reportSubmissionId } })
        saveReportSubmission(stats)
        return
      } catch {
        if (attempt < REPORT_REGISTRATION_ATTEMPTS - 1) await waitForRetry(attempt)
      }
    }
  })().finally(() => {
    activeRegistration = null
  })

  return activeRegistration
}
