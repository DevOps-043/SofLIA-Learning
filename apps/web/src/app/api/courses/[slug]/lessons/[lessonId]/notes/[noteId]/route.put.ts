import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

import {
  noteUpdateSchema,
  type NoteUpdateBody,
} from '@/app/api/courses/_schemas'
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
import { enqueueNoteEnrichment } from '@/features/notebook/services/notebook-enrichment.server.service'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { normalizeNoteContentHtml } from '@/lib/notes/generated-note-html'
import { createAdminClient } from '@/lib/supabase/admin'

async function generateNoteTitle(noteContent: string): Promise<string> {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY

    if (!googleApiKey) {
      return 'Nota de estudio'
    }

    const { model: geminiModel } = await getAiModelSettings('lesson_auto_note')
    const genAI = new GoogleGenerativeAI(googleApiKey)
    const model = genAI.getGenerativeModel({ model: geminiModel })
    const plainContent = noteContent.replace(/<[^>]*>?/gm, '').substring(0, 1500)

    const prompt = `Eres un asistente experto en educacion que genera titulos cortos, profesionales y descriptivos para notas de estudio.

Contenido de la nota: "${plainContent}"

Instrucciones:
1. El titulo debe ser muy corto (maximo 5 palabras).
2. Debe capturar la esencia principal del contenido.
3. Evita palabras genericas como "Nota sobre" o "Resumen de".
4. Responde UNICAMENTE con el texto del titulo, sin comillas, sin puntos finales y sin explicaciones.
5. Idioma: Espanol.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const generatedTitle = response.text().trim().replace(/^["']|["']$/g, '').replace(/\.$/, '')

    return generatedTitle && !generatedTitle.toLowerCase().includes('error')
      ? generatedTitle
      : 'Nota de estudio'
  } catch {
    return 'Nota de estudio'
  }
}

async function handlePut(
  _request: NextRequest,
  body: NoteUpdateBody,
  {
    params,
  }: { params: Promise<{ slug: string; lessonId: string; noteId: string }> },
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

    const supabase = createAdminClient()
    const organizationId = _request.nextUrl.searchParams.get('orgId')
    const enrollment = await resolveCourseEnrollment(
      supabase,
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
      client: supabase,
      courseId: course.id,
      lessonId,
    })

    const noteContent =
      body.note_content === undefined || body.note_content === null
        ? undefined
        : normalizeNoteContentHtml(body.note_content)

    if (body.note_content !== undefined && body.note_content !== null && !noteContent) {
      return apiError(
        'VALIDATION_ERROR',
        'El contenido de la nota es requerido y no puede estar vacio.',
        422,
      )
    }

    let noteTitle =
      body.note_title === undefined || body.note_title === null
        ? undefined
        : body.note_title.trim()

    // El usuario envió un título vacío. NO regeneramos el título por IA en cada
    // guardado (eso lo volvía inestable —cambiaba en cada pulsación— y gastaba
    // cuota de Gemini por keystroke durante el autoguardado). El título se genera
    // una sola vez al crear la nota; aquí conservamos el existente y solo
    // generamos por IA si, por algún motivo, la nota aún no tuviera título.
    if (body.note_title !== undefined && body.note_title !== null && !noteTitle) {
      const notes = await NoteService.getNotesByLesson(
        currentUser.id,
        lessonId,
        enrollment.enrollment_id,
      )
      const existingNote = notes.find((note) => note.note_id === noteId)
      const existingTitle = existingNote?.note_title?.trim()

      if (existingTitle) {
        // La nota ya tiene título: no lo sobrescribimos ni lo regeneramos.
        noteTitle = undefined
      } else {
        const contentForAi = noteContent || existingNote?.note_content
        noteTitle = contentForAi ? await generateNoteTitle(contentForAi) : undefined
      }
    }

    const note = await NoteService.updateNote(
      currentUser.id,
      noteId,
      {
        note_title: noteTitle,
        note_content: noteContent,
        note_tags: body.note_tags,
      },
      {
        enrollmentId: enrollment.enrollment_id,
        lessonId,
        organizationId: enrollment.organization_id,
      },
    )

    if (enrollment.organization_id) {
      await enqueueNoteEnrichment({
        contentHtml: note.note_content,
        noteId: note.note_id,
        organizationId: enrollment.organization_id,
        sourceType: note.source_type || 'manual',
        title: note.note_title,
        userId: currentUser.id,
      })
    }

    return NextResponse.json(note)
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

export const PUT = withZodBody(noteUpdateSchema, handlePut)
