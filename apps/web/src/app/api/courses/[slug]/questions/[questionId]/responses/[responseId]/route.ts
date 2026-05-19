import { NextRequest, NextResponse } from 'next/server'

import {
  responseUpdateSchema,
  type ResponseUpdateBody,
} from '@/app/api/courses/_schemas'
import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ slug: string; questionId: string; responseId: string }>
}

async function handlePut(
  _request: NextRequest,
  body: ResponseUpdateBody,
  { params }: RouteContext,
) {
  try {
    const { slug, questionId, responseId } = await params
    const supabase = await createClient()

    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401)
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404)
    }

    const { data: response, error: responseError } = await supabase
      .from('course_question_responses')
      .select('user_id, question_id, course_id')
      .eq('id', responseId)
      .eq('question_id', questionId)
      .eq('course_id', course.id)
      .single()

    if (responseError || !response) {
      return apiError('RESPONSE_NOT_FOUND', 'Respuesta no encontrada.', 404)
    }

    const isInstructor = course.instructor_id === user.id
    const isAuthor = response.user_id === user.id

    if (!isAuthor && !isInstructor) {
      return apiError(
        'RESPONSE_EDIT_FORBIDDEN',
        'No tienes permisos para editar esta respuesta.',
        403,
      )
    }

    const { content, is_approved_answer } = body
    const updateData: Record<string, unknown> = {}

    if (content !== undefined) {
      const sanitizedContent = sanitizeHtml(content, {
        level: 'rich',
        maxLength: 50_000,
      }).trim()

      if (!sanitizedContent) {
        return apiError('VALIDATION_ERROR', 'El contenido de la respuesta es requerido.', 422)
      }

      updateData.content = sanitizedContent
    }

    if (is_approved_answer !== undefined) {
      const { data: question } = await supabase
        .from('course_questions')
        .select('user_id')
        .eq('id', questionId)
        .single()

      if (question?.user_id === user.id) {
        if (is_approved_answer) {
          await supabase
            .from('course_question_responses')
            .update({ is_approved_answer: false })
            .eq('question_id', questionId)
            .neq('id', responseId)
        }
        updateData.is_approved_answer = is_approved_answer
        if (is_approved_answer) {
          await supabase
            .from('course_questions')
            .update({ is_resolved: true })
            .eq('id', questionId)
        }
      }
    }
    updateData.is_edited = true
    updateData.edited_at = new Date().toISOString()

    const { data: updatedResponse, error: updateError } = await supabase
      .from('course_question_responses')
      .update(updateData)
      .eq('id', responseId)
      .select(`
        *,
        user:users!course_question_responses_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single()

    if (updateError) {
      return apiError('RESPONSE_UPDATE_FAILED', 'Error al actualizar respuesta.', 500)
    }

    return NextResponse.json(updatedResponse)
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const PUT = withZodBody(responseUpdateSchema, handlePut)

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { slug, questionId, responseId } = await params
    const supabase = await createClient()

    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401)
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404)
    }

    const { data: response, error: responseError } = await supabase
      .from('course_question_responses')
      .select('user_id, question_id, course_id')
      .eq('id', responseId)
      .eq('question_id', questionId)
      .single()

    if (responseError || !response) {
      return apiError('RESPONSE_NOT_FOUND', 'Respuesta no encontrada.', 404)
    }

    const isInstructor = course.instructor_id === user.id
    const isAuthor = response.user_id === user.id

    if (!isAuthor && !isInstructor) {
      return apiError(
        'RESPONSE_DELETE_FORBIDDEN',
        'No tienes permisos para eliminar esta respuesta.',
        403,
      )
    }

    const { error: deleteError } = await supabase
      .from('course_question_responses')
      .update({ is_deleted: true })
      .eq('id', responseId)

    if (deleteError) {
      return apiError('RESPONSE_DELETE_FAILED', 'Error al eliminar respuesta.', 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}
