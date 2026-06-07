export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface SessionTimeValidation extends ValidationResult {
  minSessionMinutes: number
  maxSessionMinutes: number
  recommendedMinutes: number
}

export interface B2BAssignment {
  course_id: string
  course_title?: string | null
  due_date: string | null
  status: string
  completion_percentage: number
}

export interface B2BDeadlineValidation extends ValidationResult {
  canMeetDeadline: boolean
  requiredWeeklyMinutes: number
  proposedWeeklyMinutes: number
  daysRemaining: number
  deadlineDate: Date | null
}

export interface ScheduleValidation extends ValidationResult {
  totalWeeklyMinutes: number
  sessionsPerWeek: number
  canFitMinSession: boolean
}

export interface BreakSchedule {
  sessionDurationMinutes: number
  breakAfterMinutes: number
  breakDurationMinutes: number
}
