import { NextRequest, NextResponse } from 'next/server'
import { NoteService } from '@/features/courses/services/note.service'
import { CourseService } from '@/features/courses/services/course.service'
import { SessionService } from '@/features/auth/services/session.service'
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers'

/**
 * GET /api/courses/[slug]/notes/stats
 * Obtiene estadísticas de notas para un curso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Obtener usuario autenticado usando el sistema de sesiones personalizado
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener el curso por slug para obtener el courseId
    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const stats = await NoteService.getNotesStats(currentUser.id, course.id)

    // ⚡ OPTIMIZACIÓN: Agregar cache headers (datos dinámicos - 30 segundos)
    return withCacheHeaders(
      NextResponse.json(stats),
      cacheHeaders.dynamic
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

