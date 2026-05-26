import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { selectProfileQuestions } from './questionnaire-filter'
import { jsonError } from './questionnaire-responses'
import type {
  QuestionRow,
  QuestionnaireSupabaseClient,
  UserProfileRow,
} from './questionnaire.types'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export async function loadProfileQuestions(
  client: QuestionnaireSupabaseClient,
  userProfile: UserProfileRow,
  userId: string,
): Promise<{ questions: QuestionRow[] } | NextResponse> {
  logger.log('Filtrando preguntas con:', {
    dificultad_id: userProfile.dificultad_id,
    area_id: userProfile.area_id,
    rol_id: userProfile.rol_id,
    user_id: userId,
  })

  const { data, error } = await client
    .from('preguntas')
    .select(SELECT_COLUMNS.preguntas)
    .eq('dificultad', userProfile.dificultad_id)
    .returns<QuestionRow[]>()
    .limit(500)

  if (error) {
    logger.error('Error fetching questions by difficulty:', error)
    return jsonError('Error al obtener las preguntas', 500)
  }

  if (!data || data.length === 0) {
    logger.warn('No se encontraron preguntas con dificultad asignada', {
      dificultad_id: userProfile.dificultad_id,
    })
    return jsonError(
      'No se encontraron preguntas para tu nivel de dificultad. Por favor contacta al administrador.',
      404,
    )
  }

  const { adoption, knowledge } = selectProfileQuestions(data, userProfile)
  const questions = [...adoption, ...knowledge]

  logger.log('Preguntas filtradas:', {
    adopcion: adoption.length,
    conocimiento: knowledge.length,
    total: questions.length,
    total_con_dificultad: data.length,
  })

  if (questions.length === 0) {
    logger.error('No se encontraron preguntas para el perfil del usuario', {
      dificultad_id: userProfile.dificultad_id,
      area_id: userProfile.area_id,
      rol_id: userProfile.rol_id,
      user_id: userId,
    })
    return jsonError(
      'No se encontraron preguntas para tu perfil. Por favor contacta al administrador.',
      404,
      { details: `Dificultad: ${userProfile.dificultad_id}, Área: ${userProfile.area_id}, Rol: ${userProfile.rol_id}` },
    )
  }

  if (questions.length < 12) {
    logger.warn(`Solo se obtuvieron ${questions.length} preguntas de 12 esperadas`, {
      adopcion: adoption.length,
      conocimiento: knowledge.length,
      dificultad_id: userProfile.dificultad_id,
      area_id: userProfile.area_id,
      rol_id: userProfile.rol_id,
      total_disponibles: data.length,
      user_id: userId,
    })
  }

  return { questions }
}
