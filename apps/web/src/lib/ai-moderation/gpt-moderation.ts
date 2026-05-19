import { AI_MODERATION_ENABLED, OPENAI_MODEL, openai } from './config'
import { buildGPTModerationUserPrompt } from './gpt-user-prompt'
import { parseGPTAnalysis } from './gpt-analysis'
import { GPT_MODERATION_SYSTEM_PROMPT } from './gpt-system-prompt'
import {
  CIRCUIT_BREAKER_DEFAULTS,
  executeWithCircuitBreaker,
} from '@/lib/resilience/circuit-breaker'
import {
  createDisabledResult,
  createErrorResult,
  requiresHumanReview,
} from './moderation-result'
import type { AIModerationContext, AIModerationResult } from './types'

export async function analyzeContentWithGPT(
  content: string,
  context?: AIModerationContext,
): Promise<AIModerationResult> {
  const startTime = Date.now()
  const moderationClient = openai

  if (!AI_MODERATION_ENABLED || !moderationClient) {
    return createDisabledResult(startTime)
  }

  try {
    const completion = await executeWithCircuitBreaker(
      'openai-content-moderation',
      () => moderationClient.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: GPT_MODERATION_SYSTEM_PROMPT },
          { role: 'user', content: buildGPTModerationUserPrompt(content, context) },
        ],
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
      CIRCUIT_BREAKER_DEFAULTS.openai,
    )

    const responseText = completion.choices[0]?.message?.content || '{}'
    return parseGPTAnalysis(
      responseText,
      Date.now() - startTime,
      requiresHumanReview,
    )
  } catch (error) {
    return createErrorResult(startTime, 'Error en moderacion GPT', error)
  }
}
