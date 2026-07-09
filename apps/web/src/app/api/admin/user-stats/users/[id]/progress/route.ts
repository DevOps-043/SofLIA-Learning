import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import {
  buildDialogueMinutesByLesson,
  getEstimatedLessonMinutes,
  getLessonTrackingMinutes,
  isCompletedStudyStatus,
  resolveStudyMinutes,
  type DialogueSessionTimeRow,
  type LessonTrackingTimeRow,
} from '../../../study-time'

interface ProgressCourseRow {
  id: string
  title?: string | null
  level?: string | null
  thumbnail_url?: string | null
}

interface ProgressLessonRow {
  lesson_id: string
  lesson_title?: string | null
  lesson_order_index?: number | null
  module_id?: string | null
  duration_seconds?: number | null
  total_duration_minutes?: number | null
}

type UserLessonProgressRow = {
  completed_at?: string | null
  course_lessons?: ProgressLessonRow | null
  enrollment_id: string
  is_completed?: boolean | null
  lesson_id: string
  lesson_status?: string | null
  quiz_completed?: boolean | null
  quiz_passed?: boolean | null
  time_spent_minutes?: number | null
  video_progress_percentage?: number | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId } = await params
    const supabase = createAdminClient()

    // Fetch enrollments, certificates, progress, tracking, and SofLIA dialogue
    // sessions (real per-user active time) in parallel
    const [
      enrollmentsRes,
      certificatesRes,
      lessonProgressRes,
      lessonTrackingRes,
      dialogueSessionsRes,
    ] = await Promise.all([
      supabase
        .from('user_course_enrollments')
        .select('enrollment_id, course_id, enrollment_status, overall_progress_percentage, enrolled_at, completed_at, courses(id, title, level, thumbnail_url)')
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false }),
      supabase
        .from('user_course_certificates')
        .select('course_id, issued_at')
        .eq('user_id', userId),
      supabase
        .from('user_lesson_progress')
        .select('enrollment_id, lesson_id, lesson_status, video_progress_percentage, time_spent_minutes, quiz_completed, quiz_passed, is_completed, completed_at, course_lessons(lesson_id, lesson_title, lesson_order_index, module_id, duration_seconds, total_duration_minutes)')
        .eq('user_id', userId),
      supabase
        .from('lesson_tracking')
        .select('user_id, lesson_id, status, started_at, completed_at, t_lesson_minutes, t_video_minutes, t_materials_minutes')
        .eq('user_id', userId),
      // soflia_dialogue_sessions is service_role-only via RLS and not present
      // in the generated Database type, hence fromLoose instead of .from().
      fromLoose<DialogueSessionTimeRow>(supabase, 'soflia_dialogue_sessions')
        .select('lesson_id, active_seconds')
        .eq('user_id', userId),
    ])

    if (enrollmentsRes.error) {
      logger.error('Failed to fetch admin user progress enrollments', {
        error: enrollmentsRes.error.message,
        userId,
      })
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    const progressDataError = certificatesRes.error || lessonProgressRes.error || lessonTrackingRes.error
    if (progressDataError) {
      logger.error('Failed to fetch admin user progress detail data', {
        error: progressDataError.message,
        userId,
      })
      return NextResponse.json({ error: 'Failed to fetch progress details' }, { status: 500 })
    }

    if (dialogueSessionsRes.error) {
      // No es fatal: el tiempo real de dialogo es un enriquecimiento, no un
      // requisito para mostrar el progreso. Se degrada al estimado estatico.
      logger.error('Failed to fetch admin user dialogue sessions', {
        error: dialogueSessionsRes.error.message,
        userId,
      })
    }

    const enrollments = enrollmentsRes.data || []
    const certificates = certificatesRes.data || []
    const lessonProgress = (lessonProgressRes.data || []) as UserLessonProgressRow[]
    const lessonTracking = (lessonTrackingRes.data || []) as LessonTrackingTimeRow[]
    const dialogueSessions = (dialogueSessionsRes.data || []) as DialogueSessionTimeRow[]
    const dialogueMinutesByLesson = buildDialogueMinutesByLesson(dialogueSessions)

    // Build certificate lookup
    const certMap = new Map<string, string>()
    for (const cert of certificates) {
      certMap.set(cert.course_id, cert.issued_at)
    }

    // Build lesson progress lookup by enrollment
    const lessonsByEnrollment = new Map<string, UserLessonProgressRow[]>()
    for (const lp of lessonProgress) {
      const list = lessonsByEnrollment.get(lp.enrollment_id) || []
      list.push(lp)
      lessonsByEnrollment.set(lp.enrollment_id, list)
    }

    const trackingByLesson = new Map<string, LessonTrackingTimeRow[]>()
    for (const tracking of lessonTracking) {
      const list = trackingByLesson.get(tracking.lesson_id) || []
      list.push(tracking)
      trackingByLesson.set(tracking.lesson_id, list)
    }

    // Build response
    const courses = enrollments.map(enrollment => {
      const course = enrollment.courses as ProgressCourseRow | null
      const enrollmentLessons = lessonsByEnrollment.get(enrollment.enrollment_id) || []

      const lessons = enrollmentLessons
        .map(lp => {
          const lesson = lp.course_lessons as ProgressLessonRow | null
          const trackingMinutes = (trackingByLesson.get(lp.lesson_id) || []).reduce(
            (sum, tracking) => sum + getLessonTrackingMinutes(tracking),
            0,
          )
          const timeSpentMinutes = resolveStudyMinutes({
            completed:
              lp.is_completed === true ||
              Boolean(lp.completed_at) ||
              isCompletedStudyStatus(lp.lesson_status),
            estimatedMinutes: getEstimatedLessonMinutes(lesson),
            progressMinutes: Number(lp.time_spent_minutes) || 0,
            realDialogueMinutes: dialogueMinutesByLesson.get(lp.lesson_id) || 0,
            trackingMinutes,
          })

          return {
            lessonId: lp.lesson_id,
            lessonTitle: lesson?.lesson_title || 'Lección desconocida',
            orderIndex: lesson?.lesson_order_index || 0,
            status: lp.lesson_status || 'not_started',
            videoProgress: Number(lp.video_progress_percentage) || 0,
            timeSpentMinutes,
            quizCompleted: lp.quiz_completed || false,
            quizPassed: lp.quiz_passed || false,
          }
        })
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const totalStudyMinutes = lessons.reduce((sum, lesson) => sum + lesson.timeSpentMinutes, 0)

      return {
        enrollmentId: enrollment.enrollment_id,
        courseId: enrollment.course_id,
        courseTitle: course?.title || 'Curso desconocido',
        courseLevel: course?.level || 'beginner',
        thumbnailUrl: course?.thumbnail_url || null,
        enrollmentStatus: enrollment.enrollment_status || 'active',
        overallProgress: Number(enrollment.overall_progress_percentage) || 0,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        totalStudyMinutes,
        hasCertificate: certMap.has(enrollment.course_id),
        certificateIssuedAt: certMap.get(enrollment.course_id) || null,
        lessons,
      }
    })

    return NextResponse.json({ courses })
  } catch (error) {
    logger.error('Unexpected error in admin user stats progress route', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
