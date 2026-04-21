export interface RawStudyPlan {
  ai_generation_metadata?: {
    courseIds?: unknown
  } | null
  created_at?: string | null
  description?: string | null
  end_date?: string | null
  id: string
  name: string
  organization_id?: string | null
  start_date?: string | null
  timezone?: string | null
  updated_at?: string | null
}

export interface RawOrganizationMembershipRow {
  organization_id?: string | null
  organizations?: unknown
  role?: string | null
}

export interface RawCourseRow {
  id: string
  title: string | null
}

export interface RawSessionRow {
  course_id: string | null
  id: string
  metrics?: {
    plannedCourseId?: unknown
    plannedLessons?: Array<{ courseId?: unknown }> | unknown
  } | null
  plan_id: string | null
  start_time: string
  status: string
}

export interface ListedStudyPlan {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  timezone?: string
  createdAt?: string
  updatedAt?: string
  courseIds: string[]
  organizationId?: string
  organizationSlug?: string
  organizationRole?: string
  dashboardDestination?: string
  primaryCourseId?: string
  primaryCourseTitle?: string
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
}
