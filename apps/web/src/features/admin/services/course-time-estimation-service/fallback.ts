import type {
  TimeEstimationAnalysis,
  TimeEstimationResult,
} from '../courseTimeEstimation.types'

export function buildFallbackResult(
  analysis: TimeEstimationAnalysis,
  source: TimeEstimationResult['source'] = 'deterministic',
): TimeEstimationResult {
  return {
    targetId: analysis.target.id,
    kind: analysis.target.kind,
    lessonId: analysis.target.lessonId,
    estimatedMinutes: analysis.deterministicMinutes,
    source,
    confidence: analysis.confidence,
    rationale: analysis.rationale,
  }
}
