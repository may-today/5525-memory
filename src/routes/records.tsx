import { createFileRoute } from '@tanstack/react-router'

import { RecordsPage } from '@/pages/records/RecordsPage'
import { ensureStatsOpen } from '@/server/launch-gate'
import { getAllShows } from '@/server/shows'

export const Route = createFileRoute('/records')({
  beforeLoad: () => ensureStatsOpen(),
  loader: () => getAllShows(),
  component: RecordsPage,
})
