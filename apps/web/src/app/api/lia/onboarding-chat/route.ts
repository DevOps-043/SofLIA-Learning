import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger as techDebtLogger } from '@/lib/utils/logger'
import {
  onboardingChatSchema,
  type OnboardingChatBody,
} from '../_schemas'

async function handlePost(
  request: NextRequest,
  body: OnboardingChatBody,
  _context: unknown,
) {
  try {
    const { question, context, userName, pageContext } = body

    if (!question || !question.trim()) {
      return apiError('QUESTION_REQUIRED', 'La pregunta es requerida', 400)
    }

    const aiChatResp = await fetch(new URL('/api/ai-chat', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'onboarding',
        conversationHistory: context.conversationHistory || [],
        language: 'es',
        message: question,
        pageContext,
        userName,
      }),
    })

    if (!aiChatResp.ok) {
      const errText = await aiChatResp.text().catch(() => 'Unknown error')
      throw new Error(`Error from /api/ai-chat: ${aiChatResp.status} - ${errText}`)
    }

    const aiData = await aiChatResp.json()
    return NextResponse.json({ success: true, response: aiData.response })
  } catch (error) {
    techDebtLogger.error('Error en onboarding-chat:', error)
    return apiError(
      'ONBOARDING_CHAT_ERROR',
      'Error procesando la solicitud',
      500,
    )
  }
}

export const POST = withZodBody(onboardingChatSchema, handlePost)
