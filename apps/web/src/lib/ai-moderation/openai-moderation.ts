import { AI_MODERATION_ENABLED, CONFIDENCE_THRESHOLD, openai } from './config'
import { analyzeContentWithGPT } from './gpt-moderation'
import {
  createDisabledResult,
  createErrorResult,
  requiresHumanReview,
} from './moderation-result'
import type { AIModerationContext, AIModerationResult } from './types'

function getFlaggedCategories(result: {
  categories: Record<string, boolean>
  category_scores: Record<string, number>
}) {
  let maxScore = 0
  const categories: string[] = []

  Object.entries(result.categories).forEach(([category, isFlagged]) => {
    if (!isFlagged) return

    categories.push(category)
    maxScore = Math.max(maxScore, result.category_scores[category] || 0)
  })

  return { categories, maxScore }
}

function mergeGPTAnalysis(
  base: { confidence: number; isInappropriate: boolean; categories: string[] },
  gptAnalysis: AIModerationResult,
) {
  if (gptAnalysis.confidence > base.confidence) {
    base.confidence = gptAnalysis.confidence
    base.isInappropriate = gptAnalysis.isInappropriate
    base.categories.push(...gptAnalysis.categories)
    return
  }

  if (gptAnalysis.isInappropriate && !base.isInappropriate) {
    base.isInappropriate = true
    base.categories.push(...gptAnalysis.categories)
  }
}

export async function analyzeContentWithAI(
  content: string,
  context?: AIModerationContext,
): Promise<AIModerationResult> {
  const startTime = Date.now()

  if (!AI_MODERATION_ENABLED || !openai) {
    return createDisabledResult(startTime)
  }

  try {
    const moderationResponse = await openai.moderations.create({ input: content })
    const result = moderationResponse.results[0]
    const flagged = getFlaggedCategories(result)
    const merged = {
      confidence: flagged.categories.length > 0 ? flagged.maxScore : 0,
      isInappropriate:
        result.flagged && flagged.maxScore >= CONFIDENCE_THRESHOLD,
      categories: flagged.categories,
    }

    try {
      mergeGPTAnalysis(merged, await analyzeContentWithGPT(content, context))
    } catch {
      // OpenAI moderation result remains usable if GPT analysis fails.
    }

    return {
      ...merged,
      categories: [...new Set(merged.categories)],
      reasoning: merged.isInappropriate
        ? `Contenido flaggeado por: ${merged.categories.join(', ')}. Confianza: ${(merged.confidence * 100).toFixed(1)}%`
        : 'Contenido apropiado segun analisis de IA',
      requiresHumanReview: requiresHumanReview(
        merged.isInappropriate,
        merged.confidence,
      ),
      processingTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    return createErrorResult(startTime, 'Error en moderacion AI', error)
  }
}
