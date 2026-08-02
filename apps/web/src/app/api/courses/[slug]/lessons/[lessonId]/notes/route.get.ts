import { NextRequest, NextResponse } from 'next/server'

import { NoteService } from '@/features/courses/services/note.service'

import { CourseService } from '@/features/courses/services/course.service'

import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/notes
 * Obtiene todas las notas de un usuario para una lección específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params

    // Obtener usuario autenticado usando el sistema de sesiones personalizado
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el curso existe (opcional, para validación)
    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const notes = await NoteService.getNotesByLesson(currentUser.id, lessonId)

    return NextResponse.json(notes)
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
