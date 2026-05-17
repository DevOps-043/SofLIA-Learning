import type { CourseTimeEstimationTarget } from '../courseTimeEstimation.types'
import type { TimeRange } from './ranges'
import {
  estimateDocumentDuration,
  estimateLinkDuration,
  estimateQuizDuration,
  estimateReadingDuration,
} from './duration-reading'
import {
  estimateAiChatDuration,
  estimateDiscussionDuration,
  estimateExerciseDuration,
  estimateReflectionDuration,
} from './duration-interactive'
import type { TargetRuleSignals } from './signals'

interface DurationInput {
  range: TimeRange
  signals: TargetRuleSignals
  target: CourseTimeEstimationTarget
}

export interface DurationEstimate {
  deterministicMinutes: number
  rationale: string
}

export function estimateTargetDuration(input: DurationInput): DurationEstimate {
  switch (input.target.targetType) {
    case 'quiz':
      return estimateQuizDuration(input)
    case 'reading':
      return estimateReadingDuration(input)
    case 'pdf':
    case 'document':
      return estimateDocumentDuration(input)
    case 'link':
      return estimateLinkDuration(input)
    case 'exercise':
      return estimateExerciseDuration(input)
    case 'reflection':
      return estimateReflectionDuration(input)
    case 'discussion':
      return estimateDiscussionDuration(input)
    case 'ai_chat':
      return estimateAiChatDuration(input)
  }
}

export type DurationStrategyInput = DurationInput
