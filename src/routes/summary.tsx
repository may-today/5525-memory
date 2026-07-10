import { createFileRoute } from '@tanstack/react-router'

import { SummaryContainer } from '@/pages/summary/SummaryContainer'
import { ensureStatsOpen } from '@/server/launch-gate'

export const Route = createFileRoute('/summary')({
  beforeLoad: () => ensureStatsOpen(),
  component: SummaryContainer,
})
