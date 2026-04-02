import { z } from 'zod'
import type { ChatRequest } from './types'

const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000).optional(),
  conversationHistory: z.array(conversationMessageSchema).optional(),
  activePlanId: z.string().trim().min(1).optional(),
  trigger: z.enum(['user_message', 'proactive_init']).optional(),
})

export interface ParsedDashboardChatRequest {
  message?: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  activePlanId?: string
  trigger: 'user_message' | 'proactive_init'
  isProactiveInit: boolean
}

export interface DashboardChatRequestError {
  error: string
  status: number
}

export function parseDashboardChatRequest(
  payload: ChatRequest,
): {
  data?: ParsedDashboardChatRequest
  error?: DashboardChatRequestError
} {
  const parsed = chatRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      error: {
        error: parsed.error.issues[0]?.message || 'Payload invalido',
        status: 400,
      },
    }
  }

  const trigger = parsed.data.trigger || 'user_message'
  const conversationHistory = parsed.data.conversationHistory || []
  const isProactiveInit =
    trigger === 'proactive_init' ||
    (!parsed.data.message && conversationHistory.length === 0)

  if (!isProactiveInit && !parsed.data.message?.trim()) {
    return {
      error: {
        error: 'Mensaje requerido',
        status: 400,
      },
    }
  }

  return {
    data: {
      message: parsed.data.message,
      conversationHistory,
      activePlanId: parsed.data.activePlanId,
      trigger,
      isProactiveInit,
    },
  }
}

export function buildGeminiChatHistory(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
) {
  const chatHistory = conversationHistory.slice(-10).map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.content }],
  }))

  while (chatHistory.length > 0 && chatHistory[0]?.role === 'model') {
    chatHistory.shift()
  }

  return chatHistory
}
