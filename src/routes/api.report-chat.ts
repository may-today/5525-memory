import { createFileRoute } from '@tanstack/react-router'

import { handleReportChatRequest } from '@/server/report-chat'

export const Route = createFileRoute('/api/report-chat')({
  server: {
    handlers: {
      POST: async ({ request }) => handleReportChatRequest(request),
    },
  },
})
