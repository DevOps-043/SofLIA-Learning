import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { mergeQuestionsWithAnswers } from './questions-client/questionnaire-answers'
import { authenticateQuestionnaireUser } from './questions-client/questionnaire-auth'
import { loadAndValidateUserProfile } from './questions-client/questionnaire-profile'
import { buildQuestionnaireResponse, internalErrorResponse } from './questions-client/questionnaire-responses'
import { loadProfileQuestions } from './questions-client/questionnaire-questions'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateQuestionnaireUser(request)
    if (auth instanceof NextResponse) return auth

    const profile = await loadAndValidateUserProfile(auth.client, auth.user.id)
    if (profile instanceof NextResponse) return profile

    const questionsResult = await loadProfileQuestions(auth.client, profile, auth.user.id)
    if (questionsResult instanceof NextResponse) return questionsResult

    const questions = await mergeQuestionsWithAnswers(
      auth.client,
      profile.id,
      questionsResult.questions,
    )

    return buildQuestionnaireResponse(questions, profile)
  } catch (error) {
    logger.error('Error in questionnaire API:', error)
    return internalErrorResponse(error)
  }
}
