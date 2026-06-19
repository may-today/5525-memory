import { createFileRoute } from '@tanstack/react-router'

import { LoadingPage } from '@/pages/LoadingPage'

export const Route = createFileRoute('/loading')({
  component: LoadingPage,
})
