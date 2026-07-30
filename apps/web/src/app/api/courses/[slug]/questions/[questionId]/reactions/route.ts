import { NextRequest, NextResponse } from 'next/server'

import {
  reactionToggleSchema,
  type ReactionToggleBody,
} from '@/app/api/courses/_schemas'
import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import {
  isQuestionInOrgScope,
  resolveQuestionsOrgScope,
} from '@/app/api/courses/_lib/question-org-scope'

async function handlePost(
  _request: NextRequest,
  body: ReactionToggleBody,
  { params }: { params: Promise<{ slug: string; questionId: string }> },
) {
  try {
    const { slug, questionId } = await params
    const supabase = await createClient()

    const user = await SessionService.getCurrentUser()
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401)
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404)
    }

    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .select('id, organization_id')
      .eq('id', questionId)
      .eq('course_id', course.id)
      .single()

    // Sólo se reacciona a preguntas de la propia organización.
    const orgScope = await resolveQuestionsOrgScope(supabase, user, course.id)

    if (questionError || !question || !isQuestionInOrgScope(question, orgScope)) {
      return apiError('QUESTION_NOT_FOUND', 'Pregunta no encontrada.', 404)
    }

    const { reaction_type, action } = body

    const { data: existingReaction, error: checkError } = await supabase
      .from('course_question_reactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .eq('reaction_type', reaction_type)
      .maybeSingle()

    if (checkError) {
      return apiError('REACTION_LOOKUP_FAILED', 'Error al verificar reaccion.', 500)
    }

    if (existingReaction) {
      if (action === 'toggle') {
        const { error: deleteError } = await supabase
          .from('course_question_reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (deleteError) {
          return apiError('REACTION_DELETE_FAILED', 'Error al eliminar reaccion.', 500)
        }

        const { count } = await supabase
          .from('course_question_reactions')
          .select('id', { count: 'exact', head: true })
          .eq('question_id', questionId)

        return NextResponse.json({
          action: 'removed',
          reaction_type,
          new_count: count || 0,
          user_reaction: null,
        })
      }

      const { count } = await supabase
        .from('course_question_reactions')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', questionId)

      return NextResponse.json({
        action: 'exists',
        reaction_type,
        new_count: count || 0,
        user_reaction: reaction_type,
      })
    }

    const { data: reaction, error: insertError } = await supabase
      .from('course_question_reactions')
      .insert({
        user_id: user.id,
        question_id: questionId,
        reaction_type,
      })
      .select()
      .single()

    if (insertError) {
      return apiError('REACTION_CREATE_FAILED', 'Error al crear reaccion.', 500)
    }

    const { count } = await supabase
      .from('course_question_reactions')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', questionId)

    return NextResponse.json({
      action: 'added',
      reaction,
      new_count: count || 0,
      user_reaction: reaction_type,
    })
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const POST = withZodBody(reactionToggleSchema, handlePost)
