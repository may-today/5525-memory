import { createFileRoute } from '@tanstack/react-router'

import { LoadingPage } from '@/pages/LoadingPage'
import { ensureStatsOpen } from '@/server/launch-gate'

export const Route = createFileRoute('/loading')({
  beforeLoad: () => ensureStatsOpen(),
  component: LoadingPage,
})
