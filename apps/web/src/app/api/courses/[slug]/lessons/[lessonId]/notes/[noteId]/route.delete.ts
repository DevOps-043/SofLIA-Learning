import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { CourseService } from '@/features/courses/services/course.service'
import {
  assertNoteLessonScope,
  ChatNoteProvenanceError,
} from '@/features/courses/services/chat-note-provenance.server.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import {
  NoteMutationError,
  NoteService,
} from '@/features/courses/services/note.service'
import { apiError } from '@/lib/api/errors'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string; noteId: string }> },
) {
  try {
    const { slug, lessonId, noteId } = await params

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401)
    }

    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    if (!course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404)
    }

    const organizationId = request.nextUrl.searchParams.get('orgId')
    const enrollment = await resolveCourseEnrollment(
      createAdminClient(),
      currentUser.id,
      course.id,
      organizationId,
    )

    if (!enrollment) {
      return apiError(
        'ENROLLMENT_NOT_FOUND',
        'No tienes acceso a esta nota en este contexto.',
        organizationId ? 403 : 404,
      )
    }

    await assertNoteLessonScope({
      courseId: course.id,
      lessonId,
    })

    await NoteService.deleteNote(currentUser.id, noteId, {
      enrollmentId: enrollment.enrollment_id,
      lessonId,
      organizationId: enrollment.organization_id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NoteMutationError) {
      return apiError(
        error.code === 'READ_ONLY' ? 'NOTE_READ_ONLY' : 'NOTE_NOT_FOUND',
        error.message,
        error.code === 'READ_ONLY' ? 422 : 404,
      )
    }
    if (error instanceof ChatNoteProvenanceError) {
      return apiError('INVALID_NOTE_SCOPE', error.message, 422)
    }
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}
