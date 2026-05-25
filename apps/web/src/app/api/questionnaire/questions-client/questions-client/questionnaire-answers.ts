import { logger } from '@/lib/utils/logger'
import type {
  AnswerRow,
  QuestionRow,
  QuestionnaireSupabaseClient,
  QuestionWithAnswer,
} from './questionnaire.types'

export async function mergeQuestionsWithAnswers(
  client: QuestionnaireSupabaseClient,
  userProfileId: number,
  questions: QuestionRow[],
): Promise<QuestionWithAnswer[]> {
  const { data: existingAnswers, error } = await client
    .from('respuestas')
    .select('pregunta_id, valor')
    .eq('user_perfil_id', userProfileId)
    .returns<AnswerRow[]>()

  if (error) {
    logger.error('Error fetching existing answers:', error)
  }

  const answersMap = (existingAnswers || []).reduce<Record<number, unknown>>(
    (acc, answer) => {
      acc[answer.pregunta_id] = answer.valor
      return acc
    },
    {},
  )

  return questions.map((question) => ({
    ...question,
    respuesta_existente: answersMap[question.id] || null,
  }))
}
