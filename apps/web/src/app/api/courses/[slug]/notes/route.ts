import { NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { CourseService } from '@/features/courses/services/course.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { NoteService } from '@/features/courses/services/note.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'

/**
 * GET /api/courses/[slug]/notes
 * Obtiene todas las notas del usuario para el curso completo.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const course = await CourseService.getCourseBySlug(slug, currentUser.id)

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 },
      )
    }

    const supabase = createAdminClient()
    const organizationId = new URL(request.url).searchParams.get('orgId')
    const enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
      organizationId,
    )

    if (!enrollment) {
      return withCacheHeaders(NextResponse.json([]), cacheHeaders.private)
    }

    const notes = await NoteService.getNotesByCourseWithClient(
      supabase,
      currentUser.id,
      course.id,
      enrollment.enrollment_id,
    )

    return withCacheHeaders(NextResponse.json(notes), cacheHeaders.private)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message:
          error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
