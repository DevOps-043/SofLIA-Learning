import { generateGeminiText } from '@/lib/gemini/client'

import { AI_MODERATION_ENABLED, AI_MODERATION_MODEL } from './config'
import { parseAIAnalysis } from './ai-analysis'
import { buildAIModerationUserPrompt } from './ai-user-prompt'
import { AI_MODERATION_SYSTEM_PROMPT } from './ai-system-prompt'
import {
  createDisabledResult,
  createErrorResult,
  requiresHumanReview,
} from './moderation-result'
import type { AIModerationContext, AIModerationResult } from './types'

export async function analyzeContentWithGemini(
  content: string,
  context?: AIModerationContext,
): Promise<AIModerationResult> {
  const startTime = Date.now()

  if (!AI_MODERATION_ENABLED) {
    return createDisabledResult(startTime)
  }

  try {
    const result = await generateGeminiText({
      circuitBreakerName: 'gemini-content-moderation',
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.1,
      },
      model: AI_MODERATION_MODEL,
      prompt: buildAIModerationUserPrompt(content, context),
      systemInstruction: AI_MODERATION_SYSTEM_PROMPT,
    })

    const analysis = parseAIAnalysis(
      result.text || '{}',
      Date.now() - startTime,
      requiresHumanReview,
    )

    return {
      ...analysis,
      categories: [...new Set(analysis.categories)],
    }
  } catch (error) {
    return createErrorResult(startTime, 'Error en moderacion Gemini', error)
  }
}

export const analyzeContentWithAI = analyzeContentWithGemini
