import type {
  CourseInfo,
  StudyPlanConfig,
  StudySession,
} from '../types/user-context.types'

export interface PlanSummaryProps {
  config: StudyPlanConfig
  sessions: StudySession[]
  courses: CourseInfo[]
  onEdit?: () => void
  onConfirm?: () => void
  onCancel?: () => void
  isLoading?: boolean
  warnings?: string[]
  errors?: string[]
}

export interface PlanSummaryStats {
  estimatedWeeks: number
  preferredDaysFormatted: string
  totalHours: number
  totalSessions: number
}
