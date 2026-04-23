import { LiaLogger } from '@/lib/analytics/lia-logger'
import { calculateCost } from '@/lib/openai/usage-monitor'
import { logger } from '@/lib/utils/logger'
import type {
  NanoBananaCompletionResult,
  NanoBananaConversationTracking,
} from './types'

export async function startNanoBananaConversation(userId: string | null) {
  if (!userId) {
    return { conversationId: null, liaLogger: null, userId: null } satisfies NanoBananaConversationTracking
  }

  try {
    const liaLogger = new LiaLogger(userId)
    const conversationId = await liaLogger.startConversation({ contextType: 'general' })
    return { conversationId, liaLogger, userId }
  } catch (error) {
    console.warn('[NanaBanana] Failed to start LIA conversation — analytics will be skipped', error)
    return { conversationId: null, liaLogger: null, userId }
  }
}

export async function logNanoBananaConversationMessages(params: {
  tracking: NanoBananaConversationTracking
  userMessage: string
  assistantMessage: string
  completion: NanoBananaCompletionResult
}) {
  const { tracking, userMessage, assistantMessage, completion } = params
  if (!tracking.liaLogger || !tracking.conversationId || !completion.usage) return

  try {
    await tracking.liaLogger.logMessage('user', userMessage, false)
    await tracking.liaLogger.logMessage('assistant', assistantMessage, false, {
      modelUsed: completion.model,
      tokensUsed: completion.usage.total_tokens,
      costUsd: calculateCost(completion.usage.prompt_tokens, completion.usage.completion_tokens, completion.model),
      responseTimeMs: completion.responseTime,
    })
  } catch (error) {
    console.warn('[NanoBanana] Failed to log conversation messages — analytics incomplete', error)
  }
}
