import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

interface LaunchGateEnv {
  STATS_OPEN_AT?: string
}

/** Server-authoritative open state for the time-gated stats flow. */
export interface LaunchGateStatus {
  isOpen: boolean
  /** Open time as an ISO 8601 string (UTC). */
  opensAt: string
  /** Open time in epoch milliseconds, for countdown math. */
  opensAtMs: number
  /** Server clock at response time, used to correct client clock skew. */
  serverNow: number
}

/** Fallback when STATS_OPEN_AT is missing or unparsable. */
const DEFAULT_STATS_OPEN_AT = '2026-07-13T00:00:00+08:00'

function parseOpensAtMs(value: string | undefined): number {
  const ms = value ? Date.parse(value) : Number.NaN
  return Number.isNaN(ms) ? Date.parse(DEFAULT_STATS_OPEN_AT) : ms
}

/**
 * Reads the configured open time and compares it against the server clock.
 * The client clock is never trusted for the open/closed decision.
 */
export const getLaunchGate = createServerFn({ method: 'GET' }).handler(async (): Promise<LaunchGateStatus> => {
  const worker = (await import('cloudflare:workers')) as { env: LaunchGateEnv }
  const opensAtMs = parseOpensAtMs(worker.env.STATS_OPEN_AT)
  const serverNow = Date.now()
  return {
    isOpen: serverNow >= opensAtMs,
    opensAt: new Date(opensAtMs).toISOString(),
    opensAtMs,
    serverNow,
  }
})

// Once the gate has been observed open it can never close again (time only
// moves forward), so a positive result is cached to skip the round trip on
// every subsequent navigation.
let hasSeenGateOpen = false

/**
 * Route guard for the time-gated stats flow: redirects to /warmup until the
 * configured open time is reached. Use from a route's beforeLoad.
 */
export async function ensureStatsOpen(): Promise<void> {
  if (hasSeenGateOpen) return
  const gate = await getLaunchGate()
  if (gate.isOpen) {
    hasSeenGateOpen = true
    return
  }
  throw redirect({ to: '/warmup' })
}
