import { EventType, type StreamChunk } from '@tanstack/ai'

import { ReportCardSchema, type ReportCardData } from '@/pages/report/report-schema'

const JSON_FENCE_RE = /```(?:json)?\s*([\s\S]*?)\s*```/i

/** 从模型文本中提取 JSON 对象；兼容模型偶尔包一层 ```json 代码块的情况。 */
function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(JSON_FENCE_RE)
  const candidate = fenced?.[1] ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end < start) {
    throw new Error('Model response did not contain a JSON object.')
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

/** 只把工具调用相关事件透传给前端，普通文本会先被服务端收集并校验。 */
function isForwardedAgentEvent(chunk: StreamChunk): boolean {
  return (
    chunk.type === EventType.RUN_STARTED ||
    chunk.type === EventType.TOOL_CALL_START ||
    chunk.type === EventType.TOOL_CALL_ARGS ||
    chunk.type === EventType.TOOL_CALL_END ||
    chunk.type === EventType.TOOL_CALL_RESULT
  )
}

/**
 * OpenAI-compatible provider 兼容层。
 *
 * DeepSeek 等兼容端可能不支持 provider 原生 `response_format`。因此服务端让模型输出
 * JSON 文本，收集完成后用 `ReportCardSchema` 校验，再合成为 TanStack AI 客户端认识的
 * structured-output SSE 事件。这样前端仍然可以沿用 `useChat({ outputSchema })`。
 */
export async function* createValidatedReportStream(
  source: AsyncIterable<StreamChunk>,
  model: string,
  runId: string,
  threadId: string
): AsyncIterable<StreamChunk> {
  let rawText = ''
  let messageId = `report-${Date.now()}`

  for await (const chunk of source) {
    if (chunk.type === EventType.TEXT_MESSAGE_START) {
      messageId = chunk.messageId
      continue
    }

    if (chunk.type === EventType.TEXT_MESSAGE_CONTENT) {
      rawText += chunk.delta
      continue
    }

    if (chunk.type === EventType.TEXT_MESSAGE_END || chunk.type === EventType.RUN_FINISHED) {
      continue
    }

    if (chunk.type === EventType.RUN_ERROR) {
      yield chunk
      return
    }

    if (isForwardedAgentEvent(chunk)) {
      yield chunk
    }
  }

  const timestamp = Date.now()
  let card: ReportCardData
  try {
    card = ReportCardSchema.parse(extractJsonObject(rawText))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Report card validation failed.'
    yield {
      type: EventType.RUN_ERROR,
      runId,
      threadId,
      model,
      timestamp,
      message,
      error: { message },
    }
    return
  }

  const raw = JSON.stringify(card)
  yield {
    type: EventType.CUSTOM,
    name: 'structured-output.start',
    value: { messageId },
    model,
    timestamp,
  }
  yield {
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role: 'assistant',
    model,
    timestamp,
  }
  yield {
    type: EventType.TEXT_MESSAGE_CONTENT,
    messageId,
    delta: raw,
    model,
    timestamp,
  }
  yield {
    type: EventType.TEXT_MESSAGE_END,
    messageId,
    model,
    timestamp,
  }
  yield {
    type: EventType.CUSTOM,
    name: 'structured-output.complete',
    value: { object: card, raw, messageId },
    model,
    timestamp,
  }
  yield {
    type: EventType.RUN_FINISHED,
    runId,
    threadId,
    model,
    timestamp,
    finishReason: 'stop',
  }
}
