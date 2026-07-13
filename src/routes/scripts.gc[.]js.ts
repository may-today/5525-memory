import { createFileRoute } from '@tanstack/react-router'

const GOATCOUNTER_SCRIPT_URL = 'https://gc.zgo.at/count.js'

export const Route = createFileRoute('/scripts/gc.js')({
  server: {
    handlers: {
      GET: async () => {
        const response = await fetch(GOATCOUNTER_SCRIPT_URL)

        if (!response.ok) {
          return new Response('Analytics script is temporarily unavailable.', {
            status: response.status,
          })
        }

        return new Response(response.body, {
          headers: {
            'Cache-Control': 'public, max-age=3600',
            'Content-Type': response.headers.get('Content-Type') ?? 'application/javascript',
          },
        })
      },
    },
  },
})
