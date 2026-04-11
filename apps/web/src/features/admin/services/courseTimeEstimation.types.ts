import type { ActivityConfig } from '@/features/courses/types/activity-config'

export type TimeEstimationTargetKind = 'material' | 'activity'

export type TimeEstimationTargetType =
  | 'pdf'
  | 'link'
  | 'document'
  | 'quiz'
  | 'exercise'
  | 'reading'
  | 'reflection'
  | 'discussion'
  | 'ai_chat'

export type TimeEstimationConfidence = 'low' | 'medium' | 'high'

export type TimeEstimationSource =
  | 'deterministic'
  | 'gemini'
  | 'gemini-fallback'

export interface CourseTimeEstimationTarget {
  id: string
  kind: TimeEstimationTargetKind
  targetType: TimeEstimationTargetType
  lessonId: string
  lessonTitle: string
  moduleId: string | null
  moduleTitle: string | null
  title: string
  description: string | null
  content: unknown
  activityConfig?: ActivityConfig | null
  aiPrompts?: string | null
  externalUrl?: string | null
  fileUrl?: string | null
  requiresSofliaValidation?: boolean
  estimatedTimeMinutes: number | null
}

export interface TimeEstimationSignals {
  questionCount: number
  promptCount: number
  wordCount: number
  fieldCount: number
  checklistItemCount: number
  requireEvidence: boolean
  hasExternalTool: boolean
  plainTextExcerpt: string
}

export interface TimeEstimationAnalysis {
  target: CourseTimeEstimationTarget
  deterministicMinutes: number
  minMinutes: number
  maxMinutes: number
  confidence: TimeEstimationConfidence
  rationale: string
  signals: TimeEstimationSignals
}

export interface TimeEstimationResult {
  targetId: string
  kind: TimeEstimationTargetKind
  lessonId: string
  estimatedMinutes: number
  source: TimeEstimationSource
  confidence: TimeEstimationConfidence
  rationale: string
}
