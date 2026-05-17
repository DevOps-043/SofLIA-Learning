import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type {
  BusinessUserStatsActivityCompletionRecord,
  BusinessUserStatsLessonProgressRecord,
} from './completion.records'

export function fetchLessonProgressRows(
  supabase: BusinessUserStatsSupabaseClient,
  userId: string,
) {
  return supabase
    .from('user_lesson_progress')
    .select(`
      progress_id,
      lesson_status,
      is_completed,
      time_spent_minutes,
      completed_at,
      started_at,
      enrollment_id,
      lesson_id,
      quiz_progress_percentage,
      quiz_completed,
      quiz_passed,
      video_progress_percentage,
      required_activities_completed,
      required_activities_total,
      user_course_enrollments!inner (
        course_id,
        courses (
          id,
          title
        )
      )
    `)
    .eq('user_id', userId)
}

export function fetchActivityCompletionRows(
  supabase: BusinessUserStatsSupabaseClient,
  userId: string,
) {
  return supabase
    .from('lia_activity_completions')
    .select(`
      completion_id,
      activity_id,
      status,
      completed_steps,
      total_steps,
      time_to_complete_seconds,
      attempts_to_complete,
      completed_at,
      lesson_activities (
        activity_id,
        activity_title,
        activity_type,
        lesson_id,
        course_lessons (
          lesson_id,
          module_id,
          course_modules (
            module_id,
            course_id
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
}

export function toLessonProgressRecords(data: unknown): BusinessUserStatsLessonProgressRecord[] {
  return (data || []) as BusinessUserStatsLessonProgressRecord[]
}

export function toActivityCompletionRecords(data: unknown): BusinessUserStatsActivityCompletionRecord[] {
  return (data || []) as BusinessUserStatsActivityCompletionRecord[]
}
