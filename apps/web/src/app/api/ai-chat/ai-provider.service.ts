import {
  calculateCost,
  logAIUsage,
} from '@/lib/ai/usage-monitor'
import type { AiTurn } from '@/lib/ai/providers'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '@/lib/ai/providers/ai-text-gateway.server'
import { logger } from '../../../lib/utils/logger'
import {
  LANGUAGE_CONFIG,
  type SupportedLanguage,
} from './services/language-detection.service'
import { sanitizeAssistantResponse } from './services/response-sanitizer.service'

export interface AiProviderMetadata {
  completionCostUsd?: number
  completionTokens?: number
  costUsd?: number
  modelUsed?: string
  promptCostUsd?: number
  promptTokens?: number
  responseTimeMs?: number
  tokensUsed?: number
}

export async function callGemini(
  message: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId: string | null = null,
  isSystemMessage = false,
): Promise<{ response: string; metadata?: AiProviderMetadata }> {
  // Se comprueba la credencial del proveedor CONFIGURADO para el propósito, no
  // la de Gemini: si un administrador cambia SofLIA a un modelo de OpenAI, la
  // clave que debe existir es la de OpenAI.
  if (!(await isAiPurposeAvailable('lia_general'))) {
    throw new Error('AI provider API key not configured')
  }

  const history: AiTurn[] = conversationHistory
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      parts: [{ text: msg.content, type: 'text' as const }],
      role: msg.role === 'assistant' ? 'assistant' : 'user',
    }))

  const prompt = isSystemMessage
    ? `Instruccion interna de SofLIA:\n${message}`
    : message

  // Modelo, proveedor, tokens, temperatura y nivel de razonamiento provienen del
  // propósito `lia_general`, administrable desde el panel de superadmin.
  const result = await generateAiText({
    circuitBreakerName: 'gemini-ai-chat',
    history,
    prompt,
    purpose: 'lia_general',
    systemInstruction: systemPrompt,
  })

  const modelName = result.model

  logger.info('[SofLIA] Mensaje procesado', {
    messageLength: message.length,
    model: modelName,
    provider: result.provider,
  })

  const promptTokens = result.usage?.inputTokens || 0
  const completionTokens = result.usage?.outputTokens || 0
  const totalTokens = result.usage?.totalTokens || 0
  const estimatedCost = calculateCost(promptTokens, completionTokens, modelName)
  const promptCost = calculateCost(promptTokens, 0, modelName)
  const completionCost = calculateCost(0, completionTokens, modelName)

  if (userId) {
    logAIUsage({
      completionTokens,
      estimatedCost,
      model: modelName,
      promptTokens,
      timestamp: new Date(),
      totalTokens,
      userId,
    })
  }

  return {
    response: result.text,
    metadata: {
      completionCostUsd: completionCost,
      completionTokens,
      costUsd: estimatedCost,
      modelUsed: modelName,
      promptCostUsd: promptCost,
      promptTokens,
      tokensUsed: totalTokens,
    },
  }
}

export function generateAIResponse(
  _message: string,
  _context: string,
  _history: Array<{ role: string; content: string }>,
  _contextPrompt: string,
  language: SupportedLanguage = 'es',
): string {
  const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.es
  return config.fallback
}

export function sanitizeProviderResponse(content: string): string {
  return sanitizeAssistantResponse(content)
}
