import {
  AI_PROVIDER_KEY_MISSING_ERROR,
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
  _context: string,
  language: SupportedLanguage,
): SupportedLanguage {
  return language
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
  const assistantLanguage = resolveAssistantLanguage(context, language)

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
    // Una credencial ausente no es una degradacion del proveedor. Devolver aqui
    // la respuesta local haria creer al usuario que el modelo configurado
    // respondio, justo cuando nunca se realizo ninguna llamada externa.
    if (
      error instanceof Error
      && error.message === AI_PROVIDER_KEY_MISSING_ERROR
    ) {
      throw error
    }

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
