import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

import {
  noteCreateSchema,
  type NoteCreateBody,
} from '@/app/api/courses/_schemas'
import { SessionService } from '@/features/auth/services/session.service'
import { CourseService } from '@/features/courses/services/course.service'
import {
  ensureCourseEnrollmentScope,
  loadCourseEnrollments,
  resolveCourseEnrollment,
  type CourseEnrollmentScope,
} from '@/features/courses/services/course-enrollment.server.service'
import {
  assertNoteLessonScope,
  ChatNoteProvenanceError,
  persistChatNoteProvenance,
  resolveChatNoteProvenance,
} from '@/features/courses/services/chat-note-provenance.server.service'
import { NoteService } from '@/features/courses/services/note.service'
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

    if (generatedTitle && !generatedTitle.toLowerCase().includes('error')) {
      return generatedTitle
    }

    return 'Nota de estudio'
  } catch {
    return 'Nota de estudio'
  }
}

async function handlePost(
  request: NextRequest,
  body: NoteCreateBody,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401)
    }

    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    if (!course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404)
    }

    const supabase = createAdminClient()
    const organizationId = request.nextUrl.searchParams.get('orgId')
    let enrollment = await (organizationId
      ? ensureCourseEnrollmentScope(
          supabase,
          currentUser.id,
          course.id,
          organizationId,
        )
      : resolveCourseEnrollment(supabase, currentUser.id, course.id, null))

    // Legacy panels do not yet send orgId. Resolve only when the course has a
    // single unambiguous org enrollment; never pick arbitrarily across orgs.
    if (!enrollment && !organizationId) {
      const enrollments = await loadCourseEnrollments(
        supabase,
        currentUser.id,
        course.id,
      )
      if (enrollments.length === 1) {
        enrollment = {
          ...enrollments[0],
          course_id: course.id,
          user_id: currentUser.id,
        } as CourseEnrollmentScope
      }
    }

    if (!enrollment) {
      return apiError(
        'ENROLLMENT_NOT_FOUND',
        'No tienes acceso a este curso en este contexto.',
        organizationId ? 403 : 404,
      )
    }

    await assertNoteLessonScope({
      client: supabase,
      courseId: course.id,
      lessonId,
    })

    if (body.source_type === 'chat' && !enrollment.organization_id) {
      return apiError(
        'CHAT_ORGANIZATION_REQUIRED',
        'La conversación debe pertenecer a una organización.',
        422,
      )
    }

    const chatProvenance =
      body.source_type === 'chat' && body.chat_provenance
        ? await resolveChatNoteProvenance({
            client: supabase,
            courseId: course.id,
            enrollmentId: enrollment.enrollment_id,
            input: body.chat_provenance,
            lessonId,
            organizationId: enrollment.organization_id || '',
            userId: currentUser.id,
          })
        : null

    const noteContent = normalizeNoteContentHtml(
      chatProvenance?.canonicalContentHtml || body.note_content,
    )

    if (!noteContent) {
      return apiError(
        'VALIDATION_ERROR',
        'El contenido de la nota es requerido y no puede estar vacio.',
        422,
      )
    }

    const noteTitle = body.note_title?.trim() || (await generateNoteTitle(noteContent))
    const noteTags = body.note_tags?.filter((tag) => tag.trim().length > 0) ?? []

    const note = await NoteService.createNote(currentUser.id, lessonId, {
      note_title: noteTitle,
      note_content: noteContent,
      note_tags: noteTags,
      enrollment_id: enrollment.enrollment_id,
      organization_id: enrollment.organization_id,
      source_type: body.source_type,
    })

    try {
      if (chatProvenance && enrollment.organization_id) {
        await persistChatNoteProvenance({
          client: supabase,
          noteId: note.note_id,
          organizationId: enrollment.organization_id,
          provenance: chatProvenance,
          userId: currentUser.id,
        })
      }
    } catch (error) {
      // Do not leave a row labelled as chat when its provenance could not be
      // persisted. The delete is exactly scoped and only affects this row.
      await NoteService.deleteNote(currentUser.id, note.note_id, {
        enrollmentId: enrollment.enrollment_id,
        lessonId,
        organizationId: enrollment.organization_id,
      })
      throw error
    }

    if (enrollment.organization_id) {
      await enqueueNoteEnrichment({
        contentHtml: note.note_content,
        noteId: note.note_id,
        organizationId: enrollment.organization_id,
        sourceType: note.source_type || body.source_type,
        title: note.note_title,
        userId: currentUser.id,
      })
    }

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof ChatNoteProvenanceError) {
      return apiError('INVALID_NOTE_SCOPE', error.message, 422)
    }
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const POST = withZodBody(noteCreateSchema, handlePost)
