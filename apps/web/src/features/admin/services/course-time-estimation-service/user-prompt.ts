import {
  GLOBAL_MAX_MINUTES,
  GLOBAL_MIN_MINUTES,
} from './config'
import { parsePromptList } from './prompt-utils'
import type { TimeEstimationAnalysis } from '../courseTimeEstimation.types'

export function buildUserPrompt(
  courseTitle: string,
  analyses: TimeEstimationAnalysis[],
): string {
  return JSON.stringify({
    courseTitle,
    task:
      'Define un tiempo estimado razonable por item y devuelve solo JSON valido.',
    items: analyses.map((analysis) => ({
      targetId: analysis.target.id,
      kind: analysis.target.kind,
      targetType: analysis.target.targetType,
      lessonTitle: analysis.target.lessonTitle,
      moduleTitle: analysis.target.moduleTitle,
      title: analysis.target.title,
      description: analysis.target.description,
      contentPreview: analysis.signals.plainTextExcerpt,
      promptPreview: parsePromptList(analysis.target.aiPrompts).slice(0, 5),
      heuristicMinutes: analysis.deterministicMinutes,
      heuristicConfidence: analysis.confidence,
      heuristicRationale: analysis.rationale,
      requiresSofliaValidation: Boolean(
        analysis.target.requiresSofliaValidation,
      ),
      allowedRangeMinutes: {
        min: GLOBAL_MIN_MINUTES,
        max: GLOBAL_MAX_MINUTES,
      },
      signals: analysis.signals,
    })),
  })
}
