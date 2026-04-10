import { NextRequest, NextResponse } from 'next/server'
import { AI_CHAT_RATE_LIMIT, applyRouteRateLimit, withRouteRateLimitHeaders } from '@/app/api/_lib/ai-route-rate-limit'
import { SessionService } from '@/features/auth/services/session.service'
import {
  buildSanitizedContextExcerpt,
  sanitizeContextPayload,
  sanitizeUntrustedString,
} from '@/lib/security/context-sanitizer'
import {
  buildSecurityRefusalMessage,
  buildPromptInjectionGuardrailPrompt,
  enforceSecurityResponsePolicy,
  evaluatePromptInjectionRisk,
} from '@/lib/security/prompt-injection-detector'
import { recordSecurityEvent } from '@/lib/security/security-events'
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
    const sanitizedMessage = sanitizeUntrustedString(normalizedData.message, 12000)
    const sanitizedContext = sanitizeUntrustedString(normalizedData.context, 120)
    const sanitizedConversationHistory = normalizedData.conversationHistory.map(
      (entry) => ({
        role: entry.role,
        content: sanitizeUntrustedString(entry.content, 6000),
      }),
    )
    const sanitizedUserName = normalizedData.userName
      ? sanitizeUntrustedString(normalizedData.userName, 200)
      : undefined
    const sanitizedUserInfo = normalizedData.userInfo
      ? sanitizeContextPayload(normalizedData.userInfo)
      : undefined
    const sanitizedCourseContext = normalizedData.courseContext
      ? sanitizeContextPayload(normalizedData.courseContext)
      : undefined
    const sanitizedWorkshopContext = normalizedData.workshopContext
      ? sanitizeContextPayload(normalizedData.workshopContext)
      : undefined
    const sanitizedPageContext = normalizedData.pageContext
      ? sanitizeContextPayload(normalizedData.pageContext)
      : undefined
    const securityAssessment = evaluatePromptInjectionRisk({
      message: sanitizedMessage,
      contextExcerpt: buildSanitizedContextExcerpt({
        context: sanitizedContext,
        pageContext: sanitizedPageContext,
        courseContext: sanitizedCourseContext,
        workshopContext: sanitizedWorkshopContext,
      }),
    })

    const {
      isSystemMessage,
      conversationId: existingConversationId,
      languageFromRequest,
      isPromptMode,
    } = normalizedData

    if (securityAssessment.action === 'block') {
      recordSecurityEvent('prompt-injection-blocked', {
        pathname: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip:
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for') ||
          undefined,
        reasons: securityAssessment.reasons,
        metadata: {
          score: securityAssessment.score,
          categories: securityAssessment.categories,
        },
      })

      logger.warn('[AI-CHAT] Blocked suspicious request', {
        score: securityAssessment.score,
        categories: securityAssessment.categories,
      })

      return withHeaders(
        NextResponse.json({
          response: buildSecurityRefusalMessage(securityAssessment),
          conversationId: existingConversationId || null,
        }),
      )
    }

    const userContext = await resolveChatUserContext({
      supabase,
      authenticatedUser: user,
      requestUserInfo: sanitizedUserInfo,
      userName: sanitizedUserName,
      courseContext: sanitizedCourseContext,
    })

    const { effectiveLanguage, contextPrompt: baseContextPrompt } = await buildAiChatContext({
      user,
      message: sanitizedMessage,
      context: sanitizedContext,
      language: resolveRequestLanguage(sanitizedMessage, languageFromRequest),
      displayName: userContext.displayName,
      userRole: userContext.userRole,
      courseContext: userContext.courseContext,
      workshopContext: sanitizedWorkshopContext,
      pageContext: sanitizedPageContext,
      isFirstMessage: sanitizedConversationHistory.length === 0,
      isPromptMode,
      requestOrigin: request.nextUrl.origin,
    })
    const contextPrompt =
      baseContextPrompt +
      buildPromptInjectionGuardrailPrompt(securityAssessment)

    const analyticsPromise = user
      ? initializeAnalyticsAsync({
          user,
          request,
          context: sanitizedContext,
          existingConversationId: existingConversationId || null,
          courseContext: userContext.courseContext,
        })
      : Promise.resolve({ liaLogger: null, conversationId: null })

    const responseResult = await generateAiChatResponse({
      message: sanitizedMessage,
      context: sanitizedContext,
      language: effectiveLanguage,
      contextPrompt,
      conversationHistory: sanitizedConversationHistory,
      userId: user?.id || null,
      isSystemMessage,
      hasCourseContext:
        sanitizedContext === 'course' && userContext.courseContext !== undefined,
    })
    const securedResponse = enforceSecurityResponsePolicy({
      content: responseResult.response,
      assessment: securityAssessment,
    })

    if (securedResponse !== responseResult.response) {
      recordSecurityEvent('security-response-rewritten', {
        pathname: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip:
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for') ||
          undefined,
        reasons: securityAssessment.reasons,
        metadata: {
          score: securityAssessment.score,
          categories: securityAssessment.categories,
        },
      })
    }

    scheduleAiChatAnalyticsLogging({
      analyticsPromise,
      message: sanitizedMessage,
      response: securedResponse,
      isSystemMessage,
      responseMetadata: responseResult.metadata,
      userId: user?.id,
    })

    if (user) {
      await persistAiChatHistory({
        supabase,
        userId: user.id,
        context: sanitizedContext,
        message: sanitizedMessage,
        response: securedResponse,
        lessonTitle: userContext.courseContext?.lessonTitle,
      })
    }

    return withHeaders(
      NextResponse.json({
        response: securedResponse,
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
