import type { AIModerationResult } from './types'

interface AIAnalysisPayload {
  isInappropriate?: unknown
  confidence?: unknown
  categories?: unknown
  reasoning?: unknown
}

export function parseAIAnalysis(
  responseText: string,
  processingTimeMs: number,
  requiresHumanReview: (isInappropriate: boolean, confidence: number) => boolean,
): AIModerationResult {
  const payload = JSON.parse(responseText.trim().replace(/^```json\s*|\s*```$/g, '')) as AIAnalysisPayload
  const isInappropriate = payload.isInappropriate === true
  const confidence =
    typeof payload.confidence === 'number' ? payload.confidence : 0
  const categories = Array.isArray(payload.categories)
    ? payload.categories.filter((category): category is string => {
        return typeof category === 'string'
      })
    : []

  return {
    isInappropriate,
    confidence,
    categories,
    reasoning:
      typeof payload.reasoning === 'string'
        ? payload.reasoning
        : 'Sin razon proporcionada',
    requiresHumanReview: requiresHumanReview(isInappropriate, confidence),
    processingTimeMs,
  }
}
