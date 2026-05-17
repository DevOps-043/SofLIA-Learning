import { NextRequest, NextResponse } from 'next/server'

import { NoteService } from '@/features/courses/services/note.service'

import { CourseService } from '@/features/courses/services/course.service'

import { SessionService } from '@/features/auth/services/session.service'

import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * DELETE /api/courses/[slug]/lessons/[lessonId]/notes/[noteId]
 * Elimina una nota
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string; noteId: string }> }
) {
  try {
    const { slug, noteId } = await params

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

    await NoteService.deleteNote(currentUser.id, noteId)

    return NextResponse.json({ success: true })
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
