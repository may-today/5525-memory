import { createFileRoute } from '@tanstack/react-router'

import { CoverPage } from '@/pages/CoverPage'
import { ensureStatsOpen } from '@/server/launch-gate'

export const Route = createFileRoute('/')({
  beforeLoad: () => ensureStatsOpen(),
  component: CoverPage,
})
