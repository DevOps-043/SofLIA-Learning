import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface CourseProgress {
  label: string
  progress: number
  students: number
}

interface AssignmentRow {
  course_id: string
  user_id: string | null
  completion_percentage: number | null
  course?: {
    id: string
    title: string
  } | null
}

interface EnrollmentRow {
  course_id: string
  user_id: string
  overall_progress_percentage: number | null
  courses?: {
    id: string
    title: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada',
        },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    const [
      { data: orgUsers },
      { data: assignments, error: assignmentsError },
    ] = await Promise.all([
      supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active'),
      supabase
        .from('organization_course_assignments')
        .select(`
          course_id,
          user_id,
          completion_percentage,
          course:courses!inner (
            id,
            title
          )
        `)
        .eq('organization_id', organizationId)
        .returns<AssignmentRow[]>(),
    ])

    if (assignmentsError) {
      logger.error('Error fetching course assignments:', assignmentsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener asignaciones de cursos',
          courses: [],
        },
        { status: 500 }
      )
    }

    const activeUserIds = (orgUsers || [])
      .map((u) => u.user_id)
      .filter((id): id is string => Boolean(id))

    let enrollmentsData: EnrollmentRow[] = []
    if (activeUserIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('user_course_enrollments')
        .select(`
          course_id,
          user_id,
          overall_progress_percentage,
          courses (
            id,
            title
          )
        `)
        .in('user_id', activeUserIds)
        .returns<EnrollmentRow[]>()

      enrollmentsData = enrollments || []
    }

    // Map: key `${userId}:${courseId}` -> { courseTitle, progress }
    const userCourseProgressMap = new Map<string, { courseId: string; courseTitle: string; progress: number }>()

    assignments?.forEach((assignment) => {
      if (!assignment.course_id || !assignment.user_id) return
      const key = `${assignment.user_id}:${assignment.course_id}`
      const title = assignment.course?.title || 'Curso sin título'
      const progress = Math.min(100, Math.max(0, assignment.completion_percentage || 0))

      userCourseProgressMap.set(key, { courseId: assignment.course_id, courseTitle: title, progress })
    })

    enrollmentsData.forEach((enrollment) => {
      if (!enrollment.course_id || !enrollment.user_id) return
      const key = `${enrollment.user_id}:${enrollment.course_id}`
      const title = enrollment.courses?.title || 'Curso sin título'
      const progress = Math.min(100, Math.max(0, Number(enrollment.overall_progress_percentage) || 0))

      const existing = userCourseProgressMap.get(key)
      if (existing) {
        existing.progress = Math.max(existing.progress, progress)
      } else {
        userCourseProgressMap.set(key, { courseId: enrollment.course_id, courseTitle: title, progress })
      }
    })

    // Agrupar por curso
    const courseMap = new Map<string, { title: string; progressSum: number; students: number }>()

    for (const record of userCourseProgressMap.values()) {
      if (!courseMap.has(record.courseId)) {
        courseMap.set(record.courseId, {
          title: record.courseTitle,
          progressSum: 0,
          students: 0,
        })
      }
      const courseData = courseMap.get(record.courseId)!
      courseData.progressSum += record.progress
      courseData.students += 1
    }

    const courses: CourseProgress[] = Array.from(courseMap.values()).map((course) => ({
      label: course.title,
      progress: course.students > 0 ? Math.round(course.progressSum / course.students) : 0,
      students: course.students,
    }))

    courses.sort((a, b) => b.students - a.students)

    return NextResponse.json({
      success: true,
      courses: courses.slice(0, 10),
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/dashboard/progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener resumen de progreso',
        courses: [],
      },
      { status: 500 }
    )
  }
}
