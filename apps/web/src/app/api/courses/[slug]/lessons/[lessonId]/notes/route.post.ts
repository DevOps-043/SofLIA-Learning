import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

import {
  noteCreateSchema,
  type NoteCreateBody,
} from '@/app/api/courses/_schemas'
import { SessionService } from '@/features/auth/services/session.service'
import { CourseService } from '@/features/courses/services/course.service'
import { NoteService } from '@/features/courses/services/note.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'

async function generateNoteTitle(noteContent: string): Promise<string> {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

    if (!googleApiKey) {
      return 'Nota de estudio'
    }

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
  _request: NextRequest,
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

    const noteContent = sanitizeHtml(body.note_content, {
      level: 'rich',
      maxLength: 50_000,
    }).trim()

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
      source_type: body.source_type || 'manual',
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const POST = withZodBody(noteCreateSchema, handlePost)
