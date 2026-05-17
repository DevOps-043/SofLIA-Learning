import type { Database } from '@/core/supabase/database.types'

import type { StudyPlan, StudySession } from './study-planner.types'

type StudySessionRow = Database['public']['Tables']['study_sessions']['Row']
type StudyPlanRow = Database['public']['Tables']['study_plans']['Row']

export function toDailyStudyMinutes(goalHoursPerWeek: number | null) {
  if (!goalHoursPerWeek) {
    return null
  }

  return Math.round((goalHoursPerWeek * 60) / 7)
}

export function toGoalHoursPerWeek(dailyStudyMinutes?: number) {
  if (!dailyStudyMinutes) {
    return 7
  }

  return Math.max(1, Math.round((dailyStudyMinutes * 7) / 60))
}

export function mapStudySession(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    user_id: row.user_id,
    plan_id: row.plan_id,
    course_id: row.course_id,
    title: row.title,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status as StudySession['status'],
    notes: row.notes,
    external_event_id: row.external_event_id,
    calendar_provider: row.calendar_provider,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function mapStudyPlan(row: StudyPlanRow): StudyPlan {
  const today = new Date().toISOString().slice(0, 10)

  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_ids?.[0] ?? null,
    title: row.name,
    start_date: row.start_date ?? '',
    end_date: row.end_date ?? '',
    daily_study_minutes: toDailyStudyMinutes(row.goal_hours_per_week),
    is_active: row.end_date ? row.end_date >= today : true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
