import { createContext, useContext } from 'react'
import type { SummaryData } from '@/server/summary'

export const SummaryDataContext = createContext<SummaryData | null>(null)

/** Only ever rendered once useSummaryData has resolved, so this never returns null in practice. */
export function useSummaryDataContext(): SummaryData {
  const data = useContext(SummaryDataContext)
  if (!data) {
    throw new Error('useSummaryDataContext must be used within a SummaryDataContext provider once data has loaded')
  }
  return data
}
