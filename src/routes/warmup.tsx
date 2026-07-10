import { createFileRoute, redirect } from '@tanstack/react-router'

import { WarmupPage } from '@/pages/WarmupPage'
import { getLaunchGate } from '@/server/launch-gate'

export const Route = createFileRoute('/warmup')({
  loader: async () => {
    const gate = await getLaunchGate()
    // Reverse guard: once the stats flow is open the warmup page retires.
    if (gate.isOpen) throw redirect({ to: '/' })
    return gate
  },
  component: WarmupPage,
})
