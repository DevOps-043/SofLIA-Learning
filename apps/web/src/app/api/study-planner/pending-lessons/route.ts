import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'
import { loadPendingLessonsForCourse } from './pending-lessons-course-lessons.service'
import { loadUserCourseSources } from './pending-lessons-sources.service'
import type { PendingLessonWithModule } from './pending-lessons.types'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseIdParam = searchParams.get('courseId')
    const requireCourseId = searchParams.get('requireCourseId') === 'true'
    const supabase = await createClient()

    if (requireCourseId && !courseIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'courseId es requerido para consultar pendientes en contexto de curso',
        },
        { status: 400 },
      )
    }

    const allCourseSources = await loadUserCourseSources({
      currentUserId: currentUser.id,
      supabase,
    })

    if (!allCourseSources.length) {
      return NextResponse.json({
        success: true,
        totalPendingLessons: 0,
        courses: [],
        allPendingLessons: [],
      })
    }

    const coursesToProcess = courseIdParam
      ? allCourseSources.filter((course) => course.course_id === courseIdParam)
      : allCourseSources

    if (courseIdParam && !coursesToProcess.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso no encontrado o no autorizado para este usuario',
        },
        { status: 404 },
      )
    }

    const coursesWithLessons = await Promise.all(
      coursesToProcess.map((courseSource) =>
        loadPendingLessonsForCourse({
          courseSource,
          currentUserId: currentUser.id,
          supabase,
        }),
      ),
    )

    const validCourses = coursesWithLessons.filter((course) => course !== null)
    const totalPendingLessons = validCourses.reduce(
      (sum, course) => sum + (course?.pendingCount || 0),
      0,
    )
    const allPendingLessons = validCourses.flatMap((course) =>
      (course?.pendingLessons || []).map((lesson: PendingLessonWithModule) => ({
        ...lesson,
        courseId: course?.courseId,
        courseTitle: course?.courseTitle,
      })),
    )

    return NextResponse.json({
      success: true,
      userId: currentUser.id,
      totalPendingLessons,
      courses: validCourses,
      allPendingLessons,
    })
  } catch (error) {
    logger.error('Error en pending-lessons:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
