import { createFileRoute } from '@tanstack/react-router'

import { SharePage } from '@/pages/SharePage'

export const Route = createFileRoute('/share')({
  component: SharePage,
})
