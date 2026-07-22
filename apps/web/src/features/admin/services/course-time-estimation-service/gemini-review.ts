import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { buildManagedGenerationConfig } from '@/lib/ai/model-settings/generation-config'
import {
  GLOBAL_MAX_MINUTES,
  GLOBAL_MIN_MINUTES,
  getGeminiApiKey,
} from './config'
import { parseGeminiResponse } from './gemini-response'
import { buildSystemPrompt } from './system-prompt'
import { buildUserPrompt } from './user-prompt'
import { clamp, normalizeConfidence } from './utils'
import type {
  TimeEstimationAnalysis,
  TimeEstimationResult,
} from '../courseTimeEstimation.types'

export async function reviewChunkWithGemini(
  courseTitle: string,
  analyses: TimeEstimationAnalysis[],
  userId?: string,
): Promise<Map<string, TimeEstimationResult>> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return new Map()
  }

  const settings = await getAiModelSettings('course_time_estimation')
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: settings.model,
    generationConfig: buildManagedGenerationConfig(settings, {
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseMimeType: 'application/json',
    }),
  })
  const result = await model.generateContent([
    { text: buildSystemPrompt() },
    { text: buildUserPrompt(courseTitle, analyses) },
  ])

  logger.info('Gemini reviewed course time estimation batch', {
    courseTitle,
    model: settings.model,
    targetCount: analyses.length,
    userId,
  })

  const rawContent = result.response.text()
  if (!rawContent) {
    throw new Error('Gemini returned an empty estimation payload')
  }

  const reviewedItems = parseGeminiResponse(rawContent).items || []
  const analysisById = new Map(analyses.map((analysis) => [analysis.target.id, analysis]))
  const results = new Map<string, TimeEstimationResult>()

  for (const item of reviewedItems) {
    const resultItem = buildReviewedResult(item, analysisById)
    if (resultItem) {
      results.set(resultItem.targetId, resultItem)
    }
  }

  return results
}

function buildReviewedResult(
  item: { targetId?: unknown; estimatedMinutes?: unknown; confidence?: unknown; rationale?: unknown },
  analysisById: Map<string, TimeEstimationAnalysis>,
): TimeEstimationResult | null {
  if (typeof item.targetId !== 'string') return null

  const analysis = analysisById.get(item.targetId)
  const minutes =
    typeof item.estimatedMinutes === 'number'
      ? item.estimatedMinutes
      : Number(item.estimatedMinutes)

  if (!analysis || !Number.isFinite(minutes)) return null

  return {
    targetId: analysis.target.id,
    kind: analysis.target.kind,
    lessonId: analysis.target.lessonId,
    estimatedMinutes: clamp(Math.round(minutes), GLOBAL_MIN_MINUTES, GLOBAL_MAX_MINUTES),
    source: 'gemini',
    confidence: normalizeConfidence(item.confidence),
    rationale:
      typeof item.rationale === 'string' && item.rationale.trim().length > 0
        ? item.rationale.trim()
        : analysis.rationale,
  }
}
