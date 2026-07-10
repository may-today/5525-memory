import { createFileRoute } from '@tanstack/react-router'

import { SharePage } from '@/pages/SharePage'
import { ensureStatsOpen } from '@/server/launch-gate'

export const Route = createFileRoute('/share')({
  beforeLoad: () => ensureStatsOpen(),
  component: SharePage,
})
