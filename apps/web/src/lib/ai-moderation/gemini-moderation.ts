import { generateAiText } from '@/lib/ai/providers/ai-text-gateway.server'

import { AI_MODERATION_ENABLED } from './config'
import { parseAIAnalysis } from './ai-analysis'
import { buildAIModerationUserPrompt } from './ai-user-prompt'
import { buildAiModerationSystemPrompt } from './ai-system-prompt'
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
    const result = await generateAiText({
      circuitBreakerName: 'gemini-content-moderation',
      prompt: (dialect) => buildAIModerationUserPrompt(dialect, content, context),
      purpose: 'ai_moderation',
      systemInstruction: buildAiModerationSystemPrompt,
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
