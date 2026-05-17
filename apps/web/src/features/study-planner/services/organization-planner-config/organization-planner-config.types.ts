export interface OrganizationPlannerConfig {
  workStartTime: string
  workEndTime: string
  workDays: number[]
  maxLessonsPerDay: number
  maxSessionMinutes: number
  timezone: string
  defaultCourseStartOffsetDays: number
  defaultCourseDurationDays: number
}

export interface OrganizationHoliday {
  id: string
  date: string
  name: string
  type: 'official' | 'internal'
  isRecurring: boolean
}

export interface PlanningWindow {
  startDate: Date
  endDate: Date
  dueDate?: Date
}
