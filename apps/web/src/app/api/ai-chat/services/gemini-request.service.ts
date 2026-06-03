import {
  callGemini,
  generateAIResponse,
} from '../ai-provider.service'
import { logger } from '../../../../lib/utils/logger'
import { sanitizeAssistantResponse } from './response-sanitizer.service'
import type { SupportedLanguage } from './language-detection.service'

export interface AiResponseMetadata {
  tokensUsed?: number
  promptTokens?: number
  completionTokens?: number
  costUsd?: number
  promptCostUsd?: number
  completionCostUsd?: number
  modelUsed?: string
  responseTimeMs?: number
}

interface GenerateAiChatResponseParams {
  message: string
  context: string
  language: SupportedLanguage
  contextPrompt: string
  conversationHistory: Array<{ role: string; content: string }>
  userId: string | null
  isSystemMessage: boolean
  hasCourseContext: boolean
}

export interface GenerateAiChatResponseResult {
  response: string
  metadata?: AiResponseMetadata
}

function resolveAssistantLanguage(
  context: string,
  language: SupportedLanguage,
): SupportedLanguage {
  return context === 'study-planner' || context === 'study-planner-availability'
    ? 'es'
    : language
}

export function shouldUseGeminiForContext(
  _context: string,
  googleApiKey?: string,
) {
  return Boolean(googleApiKey)
}

export async function generateAiChatResponse({
  message,
  context,
  language,
  contextPrompt,
  conversationHistory,
  userId,
  isSystemMessage,
}: GenerateAiChatResponseParams): Promise<GenerateAiChatResponseResult> {
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const assistantLanguage = resolveAssistantLanguage(context, language)

  if (!shouldUseGeminiForContext(context, googleApiKey)) {
    logger.warn('No hay GEMINI_API_KEY configurada, usando fallback')

    return {
      response: sanitizeAssistantResponse(
        generateAIResponse(
          message,
          context,
          conversationHistory,
          contextPrompt,
          assistantLanguage,
        ),
      ),
    }
  }

  try {
    const startedAt = Date.now()
    const result = await callGemini(
      message,
      contextPrompt,
      conversationHistory,
      userId,
      isSystemMessage,
    )

    return {
      response: sanitizeAssistantResponse(result.response),
      metadata: result.metadata
        ? {
            ...result.metadata,
            responseTimeMs: Date.now() - startedAt,
          }
        : {
            responseTimeMs: Date.now() - startedAt,
          },
    }
  } catch (error) {
    logger.error('Error con proveedor de IA, usando fallback:', error)

    return {
      response: sanitizeAssistantResponse(
        generateAIResponse(
          message,
          context,
          conversationHistory,
          contextPrompt,
          assistantLanguage,
        ),
      ),
    }
  }
}
