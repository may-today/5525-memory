import { createFileRoute } from '@tanstack/react-router'

import { ReportPage } from '@/pages/report/ReportPage'
import { ensureStatsOpen } from '@/server/launch-gate'

export const Route = createFileRoute('/data-station')({
  beforeLoad: () => ensureStatsOpen(),
  component: ReportPage,
})
