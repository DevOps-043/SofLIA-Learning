import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/[orgSlug]/business/courses/[id]/analytics
 * Obtiene análisis detallado de un curso específico para la organización
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id: courseId } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el curso existe y está activo
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url, category, level')
      .eq('id', courseId)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      return NextResponse.json({
        success: false,
        error: 'Curso no encontrado'
      }, { status: 404 })
    }

    // Obtener usuarios de la organización
    const { data: orgUsers } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')

    const orgUserIds = orgUsers?.map(ou => ou.user_id).filter(Boolean) || []

    if (orgUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        course: course,
        stats: {
          total_assigned: 0, total_enrolled: 0, completed: 0,
          in_progress: 0, not_started: 0, average_progress: 0,
          average_time_minutes: 0, completion_rate: 0
        },
        engagement: {
          total_sessions: 0, average_session_duration: 0,
          retention_rate: 0, active_learners: 0
        },
        performance: {
          average_rating: 0, total_reviews: 0, average_completion_time_days: 0
        },
        progress_distribution: [],
        engagement_by_user: [],
        dropoff_analysis: { dropoff_points: [], average_dropoff_percentage: 0 }
      })
    }

    // Obtener asignaciones del curso
    const { data: assignments } = await supabase
      .from('organization_course_assignments')
      .select('user_id, status, completion_percentage')
      .eq('course_id', courseId)
      .in('user_id', orgUserIds)

    // Obtener enrollments del curso
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('user_course_enrollments')
      .select(`
        user_id,
        enrollment_status,
        overall_progress_percentage,
        enrolled_at,
        started_at,
        completed_at,
        last_accessed_at
      `)
      .eq('course_id', courseId)
      .in('user_id', orgUserIds)

    if (enrollmentsError) {
      logger.error('Error fetching enrollments:', enrollmentsError)
    }

    // Calcular estadísticas básicas
    const totalAssigned = assignments?.length || 0
    const totalEnrolled = enrollments?.length || 0
    const completed = enrollments?.filter(e => e.enrollment_status === 'completed').length || 0
    const inProgress = enrollments?.filter(e =>
      e.enrollment_status === 'active' &&
      (e.overall_progress_percentage || 0) > 0 &&
      (e.overall_progress_percentage || 0) < 100
    ).length || 0
    const notStarted = enrollments?.filter(e =>
      e.enrollment_status === 'active' &&
      (e.overall_progress_percentage || 0) === 0
    ).length || 0

    const progressValues = enrollments
      ?.map(e => e.overall_progress_percentage || 0)
      .filter(p => p > 0) || []
    const averageProgress = progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0

    const timeValues = enrollments
      ?.filter(e => e.started_at && e.last_accessed_at)
      .map(e => {
        const start = new Date(e.started_at).getTime()
        const last = new Date(e.last_accessed_at).getTime()
        return Math.max(0, (last - start) / (1000 * 60))
      }) || []
    const averageTimeMinutes = timeValues.length > 0
      ? Math.round(timeValues.reduce((a, b) => a + b, 0) / timeValues.length)
      : 0

    const completionRate = totalEnrolled > 0
      ? Math.round((completed / totalEnrolled) * 100)
      : 0

    const totalSessions = enrollments?.length || 0
    const activeLearners = enrollments?.filter(e => {
      if (!e.last_accessed_at) return false
      const daysSinceAccess = (Date.now() - new Date(e.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceAccess <= 7
    }).length || 0

    const averageSessionDuration = averageTimeMinutes > 0
      ? Math.round(averageTimeMinutes / totalSessions)
      : 0

    const retentionRate = totalEnrolled > 0
      ? Math.round((activeLearners / totalEnrolled) * 100)
      : 0

    const { data: reviews } = await supabase
      .from('course_reviews')
      .select('rating')
      .eq('course_id', courseId)

    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0

    const completionTimes = enrollments
      ?.filter(e => e.completed_at && e.started_at)
      .map(e => {
        const start = new Date(e.started_at).getTime()
        const comp = new Date(e.completed_at).getTime()
        return (comp - start) / (1000 * 60 * 60 * 24)
      }) || []
    const averageCompletionTimeDays = completionTimes.length > 0
      ? Math.round((completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) * 10) / 10
      : 0

    const progressDistribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 }
    ]

    enrollments?.forEach(enrollment => {
      const progress = enrollment.overall_progress_percentage || 0
      if (progress <= 20) progressDistribution[0].count++
      else if (progress <= 40) progressDistribution[1].count++
      else if (progress <= 60) progressDistribution[2].count++
      else if (progress <= 80) progressDistribution[3].count++
      else progressDistribution[4].count++
    })

    const engagementByUser = (enrollments || []).map(enrollment => {
      const enrolledDate = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : new Date()
      const lastAccessDate = enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at) : enrolledDate
      const daysActive = Math.max(0, Math.floor((lastAccessDate.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)))

      return {
        user_id: enrollment.user_id,
        progress_percentage: enrollment.overall_progress_percentage || 0,
        days_active: daysActive,
        status: enrollment.enrollment_status
      }
    })

    const { data: lessonProgress } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed, progress_percentage')
      .in('user_id', orgUserIds)
      .eq('course_id', courseId)

    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, order_index, module_id')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    const dropoffPoints: Array<{ lesson_id: string; lesson_title: string; dropoff_count: number }> = []
    if (lessons && lessonProgress) {
      lessons.forEach(lesson => {
        const lessonProgresses = lessonProgress.filter(lp => lp.lesson_id === lesson.lesson_id)
        const notCompleted = lessonProgresses.filter(lp => !lp.is_completed && (lp.progress_percentage || 0) < 50).length
        if (notCompleted > 0) {
          dropoffPoints.push({
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title || 'Lección sin título',
            dropoff_count: notCompleted
          })
        }
      })
    }

    const sortedDropoffPoints = dropoffPoints
      .sort((a, b) => b.dropoff_count - a.dropoff_count)
      .slice(0, 5)

    const averageDropoffPercentage = enrollments && enrollments.length > 0
      ? Math.round((sortedDropoffPoints.reduce((sum, p) => sum + p.dropoff_count, 0) / enrollments.length) * 100)
      : 0

    return NextResponse.json({
      success: true,
      course: course,
      stats: {
        total_assigned: totalAssigned,
        total_enrolled: totalEnrolled,
        completed: completed,
        in_progress: inProgress,
        not_started: notStarted,
        average_progress: averageProgress,
        average_time_minutes: averageTimeMinutes,
        completion_rate: completionRate
      },
      engagement: {
        total_sessions: totalSessions,
        average_session_duration: averageSessionDuration,
        retention_rate: retentionRate,
        active_learners: activeLearners
      },
      performance: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: reviews?.length || 0,
        average_completion_time_days: averageCompletionTimeDays
      },
      progress_distribution: progressDistribution,
      engagement_by_user: engagementByUser,
      dropoff_analysis: {
        dropoff_points: sortedDropoffPoints,
        average_dropoff_percentage: averageDropoffPercentage
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/courses/[id]/analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
