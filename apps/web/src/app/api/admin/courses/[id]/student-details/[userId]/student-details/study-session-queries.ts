import { SupabaseClient } from '@supabase/supabase-js'
import { StudySessionRow } from './types'

export async function getStudySessionsForCourseContext(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  lessonIds: string[],
): Promise<StudySessionRow[]> {
  // The OR filter collects sessions that: (a) match the course, (b) have no course (general
  // planning sessions), or (c) belong to a lesson in this course.
  // courseId and lessonIds come from trusted DB lookups — no injection risk.
  let query = supabase.from('study_sessions').select('*').eq('user_id', userId)
  query =
    lessonIds.length > 0
      ? query.or(`course_id.eq.${courseId},course_id.is.null,lesson_id.in.(${lessonIds.join(',')})`)
      : query.or(`course_id.eq.${courseId},course_id.is.null`)

  const { data } = await query.order('start_time', { ascending: false })
  return (data as StudySessionRow[]) ?? []
}
