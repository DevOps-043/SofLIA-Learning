import type { StudyPlanConfig } from '../../../../features/study-planner/types/user-context.types'

export function formatDateOnly(isoDate: string | undefined): string | null {
  if (!isoDate) {
    return null
  }

  const date = new Date(isoDate)
  return date.toISOString().split('T')[0]
}

export function buildStudyPlanInsertPayload(params: {
  config: StudyPlanConfig
  userId: string
  userType?: string
  organizationId: string | null
}) {
  return {
    user_id: params.userId,
    name: params.config.name,
    description: params.config.description,
    goal_hours_per_week: params.config.goalHoursPerWeek,
    start_date: formatDateOnly(params.config.startDate),
    end_date: formatDateOnly(params.config.endDate),
    timezone: params.config.timezone,
    preferred_days: params.config.preferredDays,
    preferred_time_blocks: params.config.preferredTimeBlocks,
    generation_mode: params.config.generationMode,
    preferred_session_type: params.config.preferredSessionType,
    learning_route_id: params.config.learningRouteId,
    user_type: params.userType,
    organization_id: params.organizationId,
    ai_generation_metadata: {
      userType: params.userType,
      organizationId: params.organizationId,
      courseIds: params.config.courseIds,
      minSessionMinutes: params.config.minSessionMinutes,
      maxSessionMinutes: params.config.maxSessionMinutes,
      breakDurationMinutes: params.config.breakDurationMinutes,
      calendarAnalyzed: params.config.calendarAnalyzed,
      calendarProvider: params.config.calendarProvider,
      sofLiaAvailabilityAnalysis: params.config.sofLiaAvailabilityAnalysis,
      sofLiaTimeAnalysis: params.config.sofLiaTimeAnalysis,
      generatedAt: new Date().toISOString(),
    },
  }
}

export function buildStudyPreferencesPayload(params: {
  config: StudyPlanConfig
  preferredTimeOfDay: string
  userId: string
}) {
  return {
    user_id: params.userId,
    timezone: params.config.timezone,
    preferred_time_of_day: params.preferredTimeOfDay,
    preferred_days: params.config.preferredDays,
    daily_target_minutes: Math.round(
      (params.config.goalHoursPerWeek * 60) / (params.config.preferredDays.length || 5),
    ),
    weekly_target_minutes: params.config.goalHoursPerWeek * 60,
    preferred_session_type: params.config.preferredSessionType,
    updated_at: new Date().toISOString(),
  }
}
