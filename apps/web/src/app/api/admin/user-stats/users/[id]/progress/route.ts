import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'

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

    // Fetch enrollments, certificates, and lesson progress in parallel
    const [enrollmentsRes, certificatesRes, lessonProgressRes] = await Promise.all([
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
        .select('enrollment_id, lesson_id, lesson_status, video_progress_percentage, time_spent_minutes, quiz_completed, quiz_passed, course_lessons(lesson_id, lesson_title, lesson_order_index, module_id)')
        .eq('user_id', userId),
    ])

    if (enrollmentsRes.error) {
      return NextResponse.json({ error: 'Failed to fetch enrollments', details: enrollmentsRes.error.message }, { status: 500 })
    }

    const enrollments = enrollmentsRes.data || []
    const certificates = certificatesRes.data || []
    const lessonProgress = lessonProgressRes.data || []

    // Build certificate lookup
    const certMap = new Map<string, string>()
    for (const cert of certificates) {
      certMap.set(cert.course_id, cert.issued_at)
    }

    // Build lesson progress lookup by enrollment
    const lessonsByEnrollment = new Map<string, typeof lessonProgress>()
    for (const lp of lessonProgress) {
      const list = lessonsByEnrollment.get(lp.enrollment_id) || []
      list.push(lp)
      lessonsByEnrollment.set(lp.enrollment_id, list)
    }

    // Build response
    const courses = enrollments.map(enrollment => {
      const course = enrollment.courses as ProgressCourseRow | null
      const enrollmentLessons = lessonsByEnrollment.get(enrollment.enrollment_id) || []

      const lessons = enrollmentLessons
        .map(lp => {
          const lesson = lp.course_lessons as ProgressLessonRow | null
          return {
            lessonId: lp.lesson_id,
            lessonTitle: lesson?.lesson_title || 'Lección desconocida',
            orderIndex: lesson?.lesson_order_index || 0,
            status: lp.lesson_status || 'not_started',
            videoProgress: Number(lp.video_progress_percentage) || 0,
            timeSpentMinutes: lp.time_spent_minutes || 0,
            quizCompleted: lp.quiz_completed || false,
            quizPassed: lp.quiz_passed || false,
          }
        })
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const totalStudyMinutes = enrollmentLessons.reduce((sum, lp) => sum + (lp.time_spent_minutes || 0), 0)

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
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
