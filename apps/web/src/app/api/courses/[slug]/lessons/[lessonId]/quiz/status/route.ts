import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { fetchRequiredLessonQuizStatus } from '@/features/courses/services/quiz/required-quiz-status.service'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/quiz/status
 * Verifica el estado de los quizzes obligatorios de una leccion.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const supabase = await createClient()
    const organizationId =
      request.nextUrl.searchParams.get('orgId')?.trim() || null

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 },
      )
    }

    const enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
      organizationId,
    )

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estas inscrito en este curso' },
        { status: 404 },
      )
    }

    const quizStatus = await fetchRequiredLessonQuizStatus(supabase, {
      enrollmentId: enrollment.enrollment_id,
      lessonId,
      userId: currentUser.id,
    })

    return NextResponse.json(quizStatus)
  } catch (error) {
    techDebtLogger.error(
      'Error en GET /api/courses/[slug]/lessons/[lessonId]/quiz/status:',
      error,
    )
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
