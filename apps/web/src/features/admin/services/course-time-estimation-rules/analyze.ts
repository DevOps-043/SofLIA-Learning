import type {
  CourseTimeEstimationTarget,
  TimeEstimationAnalysis,
} from '../courseTimeEstimation.types'
import { estimateTargetDuration } from './duration'
import { getTargetRange } from './ranges'
import { buildConfidence, buildTargetRuleSignals } from './signals'

export function analyzeTimeEstimationTarget(
  target: CourseTimeEstimationTarget,
): TimeEstimationAnalysis {
  const range = getTargetRange(target.targetType)
  const signals = buildTargetRuleSignals(target)
  const duration = estimateTargetDuration({ range, signals, target })

  return {
    target,
    deterministicMinutes: duration.deterministicMinutes,
    minMinutes: range.min,
    maxMinutes: range.max,
    confidence: buildConfidence(
      target.targetType,
      signals.wordCount,
      signals.questionCount,
    ),
    rationale: duration.rationale,
    signals: {
      questionCount: signals.questionCount,
      promptCount: signals.promptCount,
      wordCount: signals.wordCount,
      fieldCount: signals.fieldCount,
      checklistItemCount: signals.checklistItemCount,
      requireEvidence: signals.requireEvidence,
      hasExternalTool: signals.hasExternalTool,
      plainTextExcerpt: signals.plainTextExcerpt,
    },
  }
}
