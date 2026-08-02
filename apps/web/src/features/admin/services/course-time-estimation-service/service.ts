import { logger } from '@/lib/logger'
import { analyzeTimeEstimationTarget } from '../courseTimeEstimation.rules'
import { isAiPurposeAvailable } from '@/lib/ai/providers/ai-text-gateway.server'
import { AI_BATCH_SIZE } from './config'
import { buildFallbackResult } from './fallback'
import { reviewChunkWithGemini } from './gemini-review'
import { chunkArray } from './utils'
import type {
  CourseTimeEstimationTarget,
  TimeEstimationAnalysis,
  TimeEstimationResult,
} from '../courseTimeEstimation.types'

export class CourseTimeEstimationService {
  static analyzeTargets(
    targets: CourseTimeEstimationTarget[],
  ): TimeEstimationAnalysis[] {
    return targets.map(analyzeTimeEstimationTarget)
  }

  static async estimateTargets(
    courseTitle: string,
    targets: CourseTimeEstimationTarget[],
    userId?: string,
  ): Promise<TimeEstimationResult[]> {
    const analyses = this.analyzeTargets(targets)
    const resultsById = createFallbackResults(analyses)

    const isAiAvailable = await isAiPurposeAvailable('course_time_estimation')
    if (!isAiAvailable || analyses.length === 0) {
      warnMissingAiCredentials(courseTitle, analyses.length, isAiAvailable)
      return resolveResults(analyses, resultsById)
    }

    for (const chunk of chunkArray(analyses, AI_BATCH_SIZE)) {
      await reviewChunk(courseTitle, chunk, resultsById, userId)
    }

    return resolveResults(analyses, resultsById)
  }
}

function createFallbackResults(analyses: TimeEstimationAnalysis[]) {
  return new Map(
    analyses.map((analysis) => [analysis.target.id, buildFallbackResult(analysis)]),
  )
}

function resolveResults(
  analyses: TimeEstimationAnalysis[],
  resultsById: Map<string, TimeEstimationResult>,
) {
  return analyses.map((analysis) => {
    return resultsById.get(analysis.target.id) ?? buildFallbackResult(analysis)
  })
}

function warnMissingAiCredentials(
  courseTitle: string,
  targetCount: number,
  isAiAvailable: boolean,
) {
  if (targetCount === 0 || isAiAvailable) return

  logger.warn(
    'Course time estimation is using deterministic fallback: el proveedor de IA configurado no tiene credenciales',
    { courseTitle, targetCount },
  )
}

async function reviewChunk(
  courseTitle: string,
  chunk: TimeEstimationAnalysis[],
  resultsById: Map<string, TimeEstimationResult>,
  userId?: string,
) {
  try {
    const reviewedChunk = await reviewChunkWithGemini(courseTitle, chunk, userId)
    reviewedChunk.forEach((result, targetId) => resultsById.set(targetId, result))
  } catch (error) {
    logger.error(
      'Falling back to deterministic course time estimates after Gemini review failure',
      error,
      { courseTitle, purpose: 'course_time_estimation', targetCount: chunk.length },
    )

    chunk.forEach((analysis) => {
      resultsById.set(
        analysis.target.id,
        buildFallbackResult(analysis, 'gemini-fallback'),
      )
    })
  }
}
