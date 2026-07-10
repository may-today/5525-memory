import { createFileRoute } from '@tanstack/react-router'

import { ReportPage } from '@/pages/report/ReportPage'
import { ensureStatsOpen } from '@/server/launch-gate'

export const Route = createFileRoute('/report')({
  beforeLoad: () => ensureStatsOpen(),
  component: ReportPage,
})
