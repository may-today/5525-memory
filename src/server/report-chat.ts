import { chat, chatParamsFromRequest, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiCompatibleText } from '@tanstack/ai-openai/compatible'

import { getDb } from './db'
import { createReportSystemPrompt } from './report-prompt'
import { normalizeReportShowIds } from './report-stats'
import { createValidatedReportStream } from './report-stream'
import { createReportTools } from './report-tools'

interface ReportAiEnv {
  REPORT_AI_API_KEY?: string
  REPORT_AI_BASE_URL?: string
  REPORT_AI_MODEL?: string
  REPORT_AI_PROVIDER_NAME?: string
}

interface ReportForwardedProps {
  showIds?: unknown
}

/** 从前端 forwardedProps 里读取并清洗用户已选场次 ID。 */
function parseShowIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return normalizeReportShowIds(value.map((id) => (typeof id === 'string' ? Number(id) : id)).filter((id) => typeof id === 'number'))
}

/** 读取 Cloudflare Workers 环境变量；这些值不会进入客户端 bundle。 */
async function getReportAiEnv(): Promise<ReportAiEnv> {
  const worker = (await import('cloudflare:workers')) as { env: ReportAiEnv }
  return worker.env
}

function createMissingConfigResponse(): Response {
  return new Response('Report AI is not configured. Set REPORT_AI_BASE_URL, REPORT_AI_API_KEY, and REPORT_AI_MODEL.', {
    headers: { 'Cache-Control': 'no-store' },
    status: 500,
  })
}

/** 处理 `/api/report-chat` 的一次 POST 请求。 */
export async function handleReportChatRequest(request: Request): Promise<Response> {
  const env = await getReportAiEnv()
  if (!(env.REPORT_AI_BASE_URL && env.REPORT_AI_API_KEY && env.REPORT_AI_MODEL)) {
    return createMissingConfigResponse()
  }

  const params = await chatParamsFromRequest(request)
  const forwardedProps = params.forwardedProps as ReportForwardedProps
  const showIds = parseShowIds(forwardedProps.showIds)
  const db = await getDb()
  const abortController = new AbortController()
  const source = chat({
    adapter: openaiCompatibleText(env.REPORT_AI_MODEL, {
      apiKey: env.REPORT_AI_API_KEY,
      baseURL: env.REPORT_AI_BASE_URL,
      name: env.REPORT_AI_PROVIDER_NAME ?? 'report-openai-compatible',
    }),
    agentLoopStrategy: maxIterations(8),
    abortController,
    messages: params.messages,
    systemPrompts: [createReportSystemPrompt(showIds.length)],
    tools: createReportTools(db, showIds),
  })
  const stream = createValidatedReportStream(source, env.REPORT_AI_MODEL, params.runId, params.threadId)

  const response = toServerSentEventsResponse(stream, { abortController })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
