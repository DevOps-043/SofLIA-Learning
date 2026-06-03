import {
  calculateCost,
  logAIUsage,
} from '@/lib/ai/usage-monitor'
import {
  generateGeminiText,
  getGeminiApiKey,
  resolveGeminiModel,
} from '@/lib/gemini/client'
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
  if (!getGeminiApiKey()) {
    throw new Error('Gemini API key not configured')
  }

  const modelName = resolveGeminiModel(process.env.GEMINI_MODEL, 'gemini-3.5-flash')
  const history = conversationHistory
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }],
    }))

  const prompt = isSystemMessage
    ? `Instruccion interna de SofLIA:\n${message}`
    : message

  logger.info('[Gemini] Enviando mensaje de SofLIA', {
    model: modelName,
    messageLength: message.length,
  })

  const result = await generateGeminiText({
    circuitBreakerName: 'gemini-ai-chat',
    generationConfig: {
      maxOutputTokens: Number.parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10),
      temperature: Number.parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    },
    history,
    model: modelName,
    prompt,
    systemInstruction: systemPrompt,
  })

  const promptTokens = result.usage?.promptTokenCount || 0
  const completionTokens = result.usage?.candidatesTokenCount || 0
  const totalTokens = result.usage?.totalTokenCount || 0
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
