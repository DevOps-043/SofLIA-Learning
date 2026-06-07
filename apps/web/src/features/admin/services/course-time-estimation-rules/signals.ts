import { normalizeActivityConfig } from '@/features/courses/types/activity-config'
import { countWords } from '@/lib/utils/readingTime'
import type {
  CourseTimeEstimationTarget,
  TimeEstimationConfidence,
  TimeEstimationSignals,
  TimeEstimationTargetType,
} from '../courseTimeEstimation.types'
import { getQuizQuestions } from './quiz'
import { getTargetPlainText, parsePromptList } from './text'

export interface TargetRuleSignals extends TimeEstimationSignals {
  fieldCount: number
  hasExternalTool: boolean
  plainText: string
  promptCount: number
  questionCount: number
  requireEvidence: boolean
}

export function buildConfidence(
  targetType: TimeEstimationTargetType,
  wordCount: number,
  questionCount: number,
): TimeEstimationConfidence {
  if (targetType === 'quiz' && questionCount > 0) return 'high'

  if (
    (targetType === 'reading' ||
      targetType === 'pdf' ||
      targetType === 'document') &&
    wordCount > 0
  ) {
    return 'high'
  }

  return wordCount >= 40 ? 'medium' : 'low'
}

export function buildTargetRuleSignals(
  target: CourseTimeEstimationTarget,
): TargetRuleSignals {
  const activityConfig = normalizeActivityConfig(target.activityConfig)
  const plainText = getTargetPlainText(target)
  const submission = activityConfig && 'submission' in activityConfig
    ? activityConfig.submission
    : null
  const toolTask = activityConfig && 'toolTask' in activityConfig
    ? activityConfig.toolTask
    : null
  const fieldCount =
    activityConfig?.interactionType === 'inline_answers'
      ? activityConfig.submission.fields.length
      : 0
  const checklistItemCount =
    activityConfig?.interactionType === 'checklist'
      ? activityConfig.submission.checklistItems.length
      : 0

  return {
    plainText,
    questionCount: getQuizQuestions(target.content).length,
    promptCount: parsePromptList(target.aiPrompts).length,
    wordCount: countWords(plainText),
    fieldCount,
    checklistItemCount,
    requireEvidence:
      Boolean(submission?.requireEvidence) ||
      Boolean(target.requiresSofliaValidation),
    hasExternalTool:
      Boolean(toolTask?.toolKey) || Boolean(target.externalUrl),
    plainTextExcerpt:
      plainText.length > 800 ? `${plainText.slice(0, 797)}...` : plainText,
  }
}
