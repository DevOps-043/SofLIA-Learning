import { NextResponse } from 'next/server'
import type { QuestionWithAnswer, UserProfileRow } from './questionnaire.types'

export function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status })
}

export function buildQuestionnaireResponse(
  questions: QuestionWithAnswer[],
  userProfile: UserProfileRow,
) {
  return NextResponse.json({
    questions,
    total: questions.length,
    userProfile: {
      id: userProfile.id,
      area_id: userProfile.area_id,
      rol_id: userProfile.rol_id,
      dificultad_id: userProfile.dificultad_id,
    },
  })
}

export function internalErrorResponse(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  return NextResponse.json(
    {
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    },
    { status: 500 },
  )
}
