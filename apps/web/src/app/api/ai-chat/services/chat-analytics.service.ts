import { logger } from '@/lib/utils/logger'
import type { SofLIALogger } from '@/lib/analytics/lia-logger'
import type { AiResponseMetadata } from './openai-request.service'

interface AnalyticsPromiseResult {
  liaLogger: SofLIALogger | null
  conversationId: string | null
}

interface ScheduleAiChatAnalyticsParams {
  analyticsPromise: Promise<AnalyticsPromiseResult>
  message: string
  response: string
  isSystemMessage: boolean
  responseMetadata?: AiResponseMetadata
  userId?: string
}

export function scheduleAiChatAnalyticsLogging({
  analyticsPromise,
  message,
  response,
  isSystemMessage,
  responseMetadata,
  userId,
}: ScheduleAiChatAnalyticsParams) {
  analyticsPromise
    .then(async ({ liaLogger, conversationId }) => {
      if (!liaLogger || !conversationId || isSystemMessage) {
        return
      }

      try {
        await liaLogger.logMessage(
          'user',
          message,
          false,
          responseMetadata
            ? {
                tokensUsed: responseMetadata.promptTokens,
                costUsd: responseMetadata.promptCostUsd,
                modelUsed: responseMetadata.modelUsed,
              }
            : undefined,
        )

        await liaLogger.logMessage(
          'assistant',
          response,
          false,
          responseMetadata
            ? {
                tokensUsed: responseMetadata.completionTokens,
                costUsd: responseMetadata.completionCostUsd,
                modelUsed: responseMetadata.modelUsed,
                responseTimeMs: responseMetadata.responseTimeMs,
              }
            : undefined,
        )
      } catch (error) {
        logger.error('Error registrando analytics del chat:', {
          error: error instanceof Error ? error.message : error,
          conversationId,
          userId,
        })
      }
    })
    .catch((error) => {
      logger.error('Error resolviendo analytics del chat:', error)
    })
}

export async function resolveAiChatConversationId(
  analyticsPromise: Promise<AnalyticsPromiseResult>,
  fallbackConversationId: string | null,
) {
  let conversationId = fallbackConversationId

  try {
    const analyticsResult = await Promise.race([
      analyticsPromise,
      new Promise<AnalyticsPromiseResult>((resolve) =>
        setTimeout(() => resolve({ liaLogger: null, conversationId: null }), 100),
      ),
    ])

    if (analyticsResult.conversationId && !conversationId) {
      conversationId = analyticsResult.conversationId
    }
  } catch (error) {
    logger.warn('resolveAiChatConversationId timed out or failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return conversationId || undefined
  }

  return conversationId || undefined
}
