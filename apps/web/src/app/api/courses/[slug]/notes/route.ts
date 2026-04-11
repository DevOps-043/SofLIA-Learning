import { NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { CourseService } from '@/features/courses/services/course.service'
import { NoteService } from '@/features/courses/services/note.service'
import { createClient } from '@/lib/supabase/server'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'

/**
 * GET /api/courses/[slug]/notes
 * Obtiene todas las notas del usuario para el curso completo.
 */
export async function GET(
  _request: Request,
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

    const supabase = await createClient()
    const notes = await NoteService.getNotesByCourseWithClient(
      supabase,
      currentUser.id,
      course.id,
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
