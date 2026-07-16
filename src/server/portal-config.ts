import { createServerFn } from '@tanstack/react-start'

const MEMOIR_CONFIG_URL = 'https://mayday.bandchina.com/api/memoir-config/public'
const ISO_TIME_ZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/i

interface MemoirConfigResponse {
  code?: unknown
  data?: {
    memoir_open_at?: unknown
  }
}

/** Validated open time returned by the public memoir configuration endpoint. */
export interface PortalOpenTime {
  opensAtMs: number
}

function parseMemoirOpenAt(value: string): number {
  const normalized = ISO_TIME_ZONE_SUFFIX.test(value) ? value : `${value}+08:00`
  const opensAtMs = Date.parse(normalized)
  if (Number.isNaN(opensAtMs)) {
    throw new Error('The memoir configuration returned an invalid open time.')
  }
  return opensAtMs
}

/**
 * Reads the public memoir configuration through the app server because the
 * upstream endpoint does not allow cross-origin browser requests.
 */
export const getPortalOpenTime = createServerFn({ method: 'GET' }).handler(async (): Promise<PortalOpenTime> => {
  const response = await fetch(MEMOIR_CONFIG_URL, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`The memoir configuration request failed with status ${response.status}.`)
  }

  const payload = (await response.json()) as MemoirConfigResponse
  const openAt = payload.data?.memoir_open_at
  if (payload.code !== 0 || typeof openAt !== 'string' || openAt.trim().length === 0) {
    throw new Error('The memoir configuration did not include an open time.')
  }

  return { opensAtMs: parseMemoirOpenAt(openAt.trim()) }
})
