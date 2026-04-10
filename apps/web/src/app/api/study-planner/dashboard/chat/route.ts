import { NextRequest, NextResponse } from 'next/server'
import {
  STUDY_PLANNER_CHAT_RATE_LIMIT,
  applyRouteRateLimit,
  withRouteRateLimitHeaders,
} from '@/app/api/_lib/ai-route-rate-limit'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'
import { SofLIALogger } from '@/lib/analytics/lia-logger/lia-logger-session'
import { getPlanContext } from './context.service'
import { resolvePlanSelectionForChat } from './plan-resolution.service'
import { setCurrentTimezone } from './format.utils'
import type { ChatRequest } from './types'
import {
  extractActionTags,
  resolveDashboardChatAction,
} from './chat-actions.service'
import { parseDashboardChatRequest } from './chat-request.service'
import { sendDashboardChatMessage } from './gemini-chat.service'

function withRateLimitHeaders(
  response: NextResponse,
  rateLimit: ReturnType<typeof applyRouteRateLimit>,
) {
  return rateLimit.success
    ? withRouteRateLimitHeaders(response, rateLimit)
    : response
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const rateLimit = applyRouteRateLimit(
    request,
    STUDY_PLANNER_CHAT_RATE_LIMIT,
    'study-planner-dashboard-chat',
  )

  if (!rateLimit.success) {
    return rateLimit.response
  }

  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return withRateLimitHeaders(
        NextResponse.json(
          { success: false, response: '', error: 'Usuario no autenticado' },
          { status: 401 },
        ),
        rateLimit,
      )
    }

    const payload = (await request.json()) as ChatRequest
    const parsedRequest = parseDashboardChatRequest(payload)
    if (parsedRequest.error) {
      return withRateLimitHeaders(
        NextResponse.json(
          { success: false, response: '', error: parsedRequest.error.error },
          { status: parsedRequest.error.status },
        ),
        rateLimit,
      )
    }

    const {
      message,
      conversationHistory,
      activePlanId,
      trigger,
      isProactiveInit,
    } = parsedRequest.data!
    const liaLogger = new SofLIALogger(user.id)
    let conversationId: string | undefined

    try {
      conversationId = await liaLogger.startConversation({
        contextType: 'study-planner' as never,
        deviceType: request.headers.get('sec-ch-ua-platform') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim(),
      })

      if (message) {
        await liaLogger.logMessage('user', message)
      }
    } catch (error) {
      logger.warn('[StudyPlanner] Fallo inicio de conversacion logger:', error)
    }

    // Resolve which plan to use — enforces explicit selection when multiple plans exist.
    const planResolution = await resolvePlanSelectionForChat({
      userId: user.id,
      activePlanId,
    })

    if (planResolution.status === 'needs_plan_selection') {
      return withRateLimitHeaders(
        NextResponse.json({
          success: true,
          response: planResolution.selectionPrompt,
          action: null,
        }),
        rateLimit,
      )
    }

    if (planResolution.status === 'no_plans') {
      return withRateLimitHeaders(
        NextResponse.json({
          success: true,
          response: 'Aun no tienes ningun plan de estudios. Crea uno desde el boton "Nuevo plan" para que pueda ayudarte.',
          action: null,
        }),
        rateLimit,
      )
    }

    // Guaranteed: status === 'resolved', plan is always present.
    const resolvedPlanId = planResolution.plan!.id
    const { context: planContext, timezone } = await getPlanContext(
      user.id,
      resolvedPlanId,
    )
    setCurrentTimezone(timezone)

    const generationResult = await sendDashboardChatMessage({
      userId: user.id,
      message,
      trigger,
      isProactiveInit,
      conversationHistory,
      planContext,
      timezone,
      planName: planResolution.plan?.name,
      totalUserPlans: planResolution.allPlans?.length ?? 1,
    })

    if (conversationId && liaLogger.getCurrentConversationId()) {
      await liaLogger.logMessage(
        'assistant',
        generationResult.responseText,
        false,
        generationResult.usageMetadata,
      )
    }

    const { action, actions, cleanResponse } = extractActionTags(
      generationResult.responseText,
    )
    const executedAction = await resolveDashboardChatAction(
      user.id,
      resolvedPlanId,
      actions,
      action,
      message,
    )

    return withRateLimitHeaders(
      NextResponse.json({
        success: true,
        response: cleanResponse,
        action: executedAction,
      }),
      rateLimit,
    )
  } catch (error) {
    logger.error('Error critico en chat del dashboard:', error)

    return withRateLimitHeaders(
      NextResponse.json(
        {
          success: false,
          response: 'Ocurrio un error inesperado en el servidor.',
          error: error instanceof Error ? error.message : 'Error interno',
        },
        { status: 500 },
      ),
      rateLimit,
    )
  }
}
