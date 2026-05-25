export type BusinessUserAnalyticsRange = '30d' | '90d' | '180d' | '365d'
export type BusinessUserAnalyticsLocale = 'es' | 'en' | 'pt'

export interface BusinessUserAnalyticsPeriod {
  from: string
  to: string
  range: BusinessUserAnalyticsRange
}

export interface BusinessUserAnalyticsTrendPoint {
  key: string
  label: string
  value: number
  secondaryValue?: number
}

export interface BusinessUserAnalyticsBreakdownItem {
  key: string
  label: string
  value: number
  percentage: number
}

export interface BusinessUserAnalyticsCalendarCell {
  date: string
  dayKey: string
  dayIndex: number
  weekIndex: number
  monthKey: string
  monthLabel: string
  value: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface BusinessUserAnalyticsOverview {
  totalAssigned: number
  inProgressCourses: number
  completedCourses: number
  certificates: number
  averageProgress: number
  completionRate: number
  lessonsCompleted: number
  timeSpentMinutes: number
  activeDays: number
  currentStreak: number
  longestStreak: number
  lastActivityAt: string | null
  qualityScore: number
}
