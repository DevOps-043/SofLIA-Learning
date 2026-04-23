import { SupabaseClient } from '@supabase/supabase-js'
import { ActivityProgressRow, LessonProgressRow, ModuleProgressRow, NoteRow, StudentCourseProgressData } from './types'

export async function getStudentCourseProgressData(
  supabase: SupabaseClient,
  userId: string,
  enrollmentId: string | null | undefined,
  moduleIds: string[],
  lessonIds: string[],
  activityIds: string[],
): Promise<StudentCourseProgressData> {
  const [completedActivities, moduleProgress, lessonProgress, userNotes] = await Promise.all([
    getCompletedActivities(supabase, userId, activityIds),
    getModuleProgress(supabase, userId, moduleIds),
    getLessonProgress(supabase, userId, enrollmentId, lessonIds),
    getUserNotes(supabase, userId, lessonIds),
  ])

  return { completedActivities, moduleProgress, lessonProgress, userNotes }
}

async function getCompletedActivities(supabase: SupabaseClient, userId: string, activityIds: string[]): Promise<ActivityProgressRow[]> {
  if (activityIds.length === 0) return []
  const { data } = await supabase
    .from('user_activity_progress')
    .select('activity_id, completed_at, time_spent_seconds')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .in('activity_id', activityIds)
  return (data as ActivityProgressRow[]) ?? []
}

// NOTE: The nested select `course_modules:module_id(...)` is resolved by PostgREST
// as a single SQL JOIN — not a N+1. The `select('*')` for user_module_progress columns
// is intentionally broad here; restrict it once the frontend's consumed columns are confirmed.
async function getModuleProgress(supabase: SupabaseClient, userId: string, moduleIds: string[]): Promise<ModuleProgressRow[]> {
  if (moduleIds.length === 0) return []
  const { data } = await supabase
    .from('user_module_progress')
    .select(`*, course_modules:module_id (module_id, module_title, module_order)`)
    .eq('user_id', userId)
    .in('module_id', moduleIds)
  return (data as ModuleProgressRow[]) ?? []
}

async function getLessonProgress(
  supabase: SupabaseClient,
  userId: string,
  enrollmentId: string | null | undefined,
  lessonIds: string[],
) {
  if (lessonIds.length === 0 || !enrollmentId) return [] as LessonProgressRow[]
  const { data } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at, time_spent_seconds, time_spent_minutes')
    .eq('user_id', userId)
    .eq('enrollment_id', enrollmentId)
    .in('lesson_id', lessonIds)
  return (data as LessonProgressRow[]) ?? []
}

async function getUserNotes(supabase: SupabaseClient, userId: string, lessonIds: string[]): Promise<NoteRow[]> {
  if (lessonIds.length === 0) return []
  const { data } = await supabase
    .from('user_lesson_notes')
    .select('note_id, created_at')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
  return (data as NoteRow[]) ?? []
}
