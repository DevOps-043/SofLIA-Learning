import { NextRequest, NextResponse } from 'next/server'
import { AI_CHAT_RATE_LIMIT, applyRouteRateLimit, withRouteRateLimitHeaders } from '@/app/api/_lib/ai-route-rate-limit'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { initializeAnalyticsAsync } from './services/analytics-setup.service'
import { resolveAiChatConversationId, scheduleAiChatAnalyticsLogging } from './services/chat-analytics.service'
import { buildAiChatContext } from './services/chat-context-builder.service'
import { persistAiChatHistory } from './services/chat-history.service'
import { resolveChatUserContext } from './services/chat-user-context.service'
import { generateAiChatResponse } from './services/openai-request.service'
import { normalizeAiChatRequest, resolveRequestLanguage, type AiChatRequestBody } from './services/request-normalization.service'

export async function POST(request: NextRequest) {
  const rateLimit = applyRouteRateLimit(request, AI_CHAT_RATE_LIMIT, 'openai')
  if (!rateLimit.success) return rateLimit.response

  const withHeaders = (response: NextResponse) =>
    withRouteRateLimitHeaders(response, rateLimit)

  try {
    const supabase = await createClient()
    const user = await SessionService.getCurrentUser()

    let requestBody: AiChatRequestBody
    try {
      requestBody = (await request.json()) as AiChatRequestBody
    } catch (error) {
      return withHeaders(
        NextResponse.json(
          {
            error: 'Error al parsear el body del request',
            message: error instanceof Error ? error.message : 'Error desconocido',
          },
          { status: 400 },
        ),
      )
    }

    const normalizedRequest = normalizeAiChatRequest(requestBody)
    if (normalizedRequest.error) {
      return withHeaders(
        NextResponse.json(
          {
            error: normalizedRequest.error.error,
            message: normalizedRequest.error.message,
          },
          { status: normalizedRequest.error.status },
        ),
      )
    }

    const normalizedData = normalizedRequest.data!
    const {
      message, context, conversationHistory, userName, userInfo, courseContext,
      workshopContext, pageContext, isSystemMessage,
      conversationId: existingConversationId, languageFromRequest, isPromptMode,
    } = normalizedData

    const userContext = await resolveChatUserContext({
      supabase,
      authenticatedUser: user,
      requestUserInfo: userInfo,
      userName,
      courseContext,
    })

    const { effectiveLanguage, contextPrompt } = await buildAiChatContext({
      user,
      message,
      context,
      language: resolveRequestLanguage(message, languageFromRequest),
      displayName: userContext.displayName,
      userRole: userContext.userRole,
      courseContext: userContext.courseContext,
      workshopContext,
      pageContext,
      isFirstMessage: conversationHistory.length === 0,
      isPromptMode,
      requestOrigin: request.nextUrl.origin,
    })

    const analyticsPromise = user
      ? initializeAnalyticsAsync({
          user,
          request,
          context,
          existingConversationId: existingConversationId || null,
          courseContext: userContext.courseContext,
        })
      : Promise.resolve({ liaLogger: null, conversationId: null })

    const responseResult = await generateAiChatResponse({
      message,
      context,
      language: effectiveLanguage,
      contextPrompt,
      conversationHistory,
      userId: user?.id || null,
      isSystemMessage,
      hasCourseContext:
        context === 'course' && userContext.courseContext !== undefined,
    })

    scheduleAiChatAnalyticsLogging({
      analyticsPromise,
      message,
      response: responseResult.response,
      isSystemMessage,
      responseMetadata: responseResult.metadata,
      userId: user?.id,
    })

    if (user) {
      await persistAiChatHistory({
        supabase,
        userId: user.id,
        context,
        message,
        response: responseResult.response,
        lessonTitle: userContext.courseContext?.lessonTitle,
      })
    }

    return withHeaders(
      NextResponse.json({
        response: responseResult.response,
        conversationId: await resolveAiChatConversationId(
          analyticsPromise,
          existingConversationId || null,
        ),
      }),
    )
  } catch (error) {
    logger.error('Error en API de chat:', error)
    return withHeaders(
      NextResponse.json(
        {
          error: 'Error interno del servidor',
          message:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.message
              : undefined,
          details:
            process.env.NODE_ENV === 'development' &&
            error instanceof Error &&
            'cause' in error
              ? error.cause
              : undefined,
        },
        { status: 500 },
      ),
    )
  }
}
