import type { TFunction } from 'i18next'
import type { LucideIcon } from 'lucide-react'
import type { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export interface ApproachSuggestion {
  approach: 'fast' | 'balanced' | 'long'
  deadline_date: string
  duration_days: number
  duration_weeks: number
  hours_per_week: number
  description: string
  estimated_completion_rate: string
}

export interface LiaDeadlineSuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  orgSlug: string
  onSelectDeadline: (deadline: string, startDate: string, approach: string) => void
}

export type DeadlineStep = 'suggestions' | 'confirm'
export type DeadlineT = TFunction<'business'>
export type BusinessPanelTheme = ReturnType<typeof useBusinessPanelTheme>

export interface ApproachConfig {
  icon: LucideIcon
  color: string
  background: string
}

export type ApproachConfigMap = Record<ApproachSuggestion['approach'], ApproachConfig>
