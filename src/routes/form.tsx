import { createFileRoute } from '@tanstack/react-router'

import { FormPage } from '@/pages/FormPage'
import { getLaunchGate } from '@/server/launch-gate'
import { getAllShows } from '@/server/shows'

export const Route = createFileRoute('/form')({
  loader: async () => {
    const [shows, gate] = await Promise.all([getAllShows(), getLaunchGate()])
    return { gate, shows }
  },
  component: FormPage,
})
