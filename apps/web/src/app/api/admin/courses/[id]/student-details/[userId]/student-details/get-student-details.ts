import { SupabaseClient } from '@supabase/supabase-js'
import { buildLiaMetrics } from './conversation-metrics'
import { getStudentCourseProgressData } from './course-progress-queries'
import { getCourseStructureIds } from './course-structure'
import { getStudentEnrollment } from './enrollment'
import { getLiaQueryData } from './lia-queries'
import { buildStudentDetailsResponse } from './response-builder'
import { buildStudySessionMetrics } from './study-session-metrics'
import { getStudySessionsForCourseContext } from './study-session-queries'

export async function getStudentDetailsData(
  supabase: SupabaseClient,
  courseId: string,
  userId: string,
) {
  const enrollment = await getStudentEnrollment(supabase, courseId, userId)
  if (!enrollment) return null

  const structure = await getCourseStructureIds(supabase, courseId)
  const [liaData, studySessions, progressData] = await Promise.all([
    getLiaQueryData(supabase, userId),
    getStudySessionsForCourseContext(supabase, userId, courseId, structure.lessonIds),
    getStudentCourseProgressData(
      supabase,
      userId,
      enrollment.enrollment_id,
      structure.moduleIds,
      structure.lessonIds,
      structure.activityIds,
    ),
  ])

  const liaMetrics = buildLiaMetrics(liaData.liaConversations, liaData.liaMessages, liaData.liaFeedback)
  const studySessionMetrics = buildStudySessionMetrics(
    studySessions,
    courseId,
    structure.lessonIds,
    progressData.lessonProgress,
  )

  return buildStudentDetailsResponse(enrollment, liaMetrics, studySessionMetrics, progressData)
}
