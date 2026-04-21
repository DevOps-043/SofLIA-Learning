import type {
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
  TimeBlock,
} from '../../../../../features/study-planner/types/user-context.types'

export interface AnalyzeCalendarRequest {
  startDate?: string
  endDate?: string
  preferredDays?: number[]
  minSessionMinutes?: number
  maxSessionMinutes?: number
}

export interface RecommendedCalendarSlot {
  date: string
  slot: TimeBlock
  suitability: 'excellent' | 'good' | 'fair'
  reason: string
}

export interface AnalyzeCalendarResponse {
  success: boolean
  data?: {
    events: CalendarEvent[]
    liaAnalysis: SofLIAAvailabilityAnalysis
    recommendedSlots: RecommendedCalendarSlot[]
  }
  error?: string
}

export interface CalendarAnalysisConfig {
  minSessionMinutes: number
  maxSessionMinutes: number
  preferredDays: number[]
}
