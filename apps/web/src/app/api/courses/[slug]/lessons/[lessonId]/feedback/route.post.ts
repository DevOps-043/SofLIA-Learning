import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import {
  lessonFeedbackSchema,
  type LessonFeedbackBody,
} from '@/app/api/courses/_schemas'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'

import { SessionService } from '@/features/auth/services/session.service'

async function getCourseBySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
) {
  return supabase.from('courses').select('id').eq('slug', slug).single()
}

async function validateLesson(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lessonId: string,
  courseId: string,
) {
  return supabase
    .from('course_lessons')
    .select(`
      lesson_id,
      module_id,
      course_modules!inner (
        course_id
      )
    `)
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single()
}

async function handlePost(
  _request: NextRequest,
  body: LessonFeedbackBody,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params

    const supabase = await createClient()

    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401)
    }

    const courseResult = await getCourseBySlug(supabase, slug)

    if (courseResult.error || !courseResult.data) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404)
    }

    const lessonResult = await validateLesson(
      supabase,
      lessonId,
      courseResult.data.id,
    )

    if (lessonResult.error || !lessonResult.data) {
      return apiError('LESSON_NOT_FOUND', 'Leccion no encontrada.', 404)
    }

    const { feedback_type } = body

    const { data: existingFeedback, error: existingError } = await supabase
      .from('lesson_feedback')
      .select('id, feedback_type')
      .eq('lesson_id', lessonId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      return apiError('FEEDBACK_LOOKUP_FAILED', 'Error al verificar feedback.', 500)
    }

    if (existingFeedback) {
      if (existingFeedback.feedback_type === feedback_type) {
        const { error: deleteError } = await supabase
          .from('lesson_feedback')
          .delete()
          .eq('id', existingFeedback.id)

        if (deleteError) {
          return apiError('FEEDBACK_DELETE_FAILED', 'Error al eliminar feedback.', 500)
        }

        return NextResponse.json({ feedback_type: null, action: 'removed' })
      }

      const { error: updateError } = await supabase
        .from('lesson_feedback')
        .update({ feedback_type, updated_at: new Date().toISOString() })
        .eq('id', existingFeedback.id)

      if (updateError) {
        return apiError('FEEDBACK_UPDATE_FAILED', 'Error al actualizar feedback.', 500)
      }

      return NextResponse.json({ feedback_type, action: 'updated' })
    }

    const { error: insertError } = await supabase.from('lesson_feedback').insert({
      lesson_id: lessonId,
      user_id: user.id,
      feedback_type,
    })

    if (insertError) {
      techDebtLogger.error('[FEEDBACK API] Error al insertar feedback:', insertError)
      return apiError('FEEDBACK_SAVE_FAILED', 'Error al guardar feedback.', 500)
    }

    return NextResponse.json({ feedback_type, action: 'created' })
  } catch (error) {
    techDebtLogger.error('Error in POST /api/courses/[slug]/lessons/[lessonId]/feedback:', error)
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500)
  }
}

export const POST = withZodBody(lessonFeedbackSchema, handlePost)
