import { createFileRoute } from '@tanstack/react-router'

const GOATCOUNTER_COUNT_URL = 'https://ddiu8081.goatcounter.com/count'

async function forwardCountRequest(request: Request): Promise<Response> {
  const upstreamUrl = new URL(GOATCOUNTER_COUNT_URL)
  upstreamUrl.search = new URL(request.url).search

  const response = await fetch(upstreamUrl, {
    body: request.method === 'POST' ? request.body : undefined,
    headers: request.method === 'POST' ? { 'Content-Type': request.headers.get('Content-Type') ?? 'text/plain' } : undefined,
    method: request.method,
  })

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': response.headers.get('Content-Type') ?? 'text/plain',
    },
  })
}

export const Route = createFileRoute('/scripts/gc')({
  server: {
    handlers: {
      GET: ({ request }) => forwardCountRequest(request),
      POST: ({ request }) => forwardCountRequest(request),
    },
  },
})
