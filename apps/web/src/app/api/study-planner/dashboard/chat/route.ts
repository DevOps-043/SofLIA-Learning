import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  STUDY_PLANNER_CHAT_RATE_LIMIT,
  applyRouteRateLimit,
  withRouteRateLimitHeaders,
} from '@/app/api/_lib/ai-route-rate-limit'
import { SessionService } from '@/features/auth/services/session.service'
import { recordSecurityEvent } from '@/lib/security/security-events'
import { logger } from '@/lib/utils/logger'
import { SofLIALogger } from '@/lib/analytics/lia-logger/lia-logger-session'
import { getPlanContext } from './context.service'
import { resolvePlanSelectionForChat } from './plan-resolution.service'
import { setCurrentTimezone } from './format.utils'
import type { ChatRequest } from './types'
import {
  buildActionProposals,
  extractActionTags,
  resolveDashboardChatAction,
} from './chat-actions.service'
import { parseDashboardChatRequest } from './chat-request.service'
import { sendDashboardChatMessage } from './gemini-chat.service'
import { evaluateStudyPlannerPromptGuardrails } from './security-guardrails.service'

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
    const traceId = randomUUID()
    const promptGuardrails = evaluateStudyPlannerPromptGuardrails(message)

    if (promptGuardrails.blocked) {
      recordSecurityEvent('prompt-injection-blocked', {
        pathname: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip:
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for') ||
          undefined,
        reasons: promptGuardrails.assessment.reasons,
        metadata: {
          score: promptGuardrails.assessment.score,
          categories: promptGuardrails.assessment.categories,
        },
      })

      return withRateLimitHeaders(
        NextResponse.json({
          success: true,
          response: promptGuardrails.refusalMessage,
          action: null,
          actions: [],
          needsConfirmation: false,
          traceId,
        }),
        rateLimit,
      )
    }

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
    const { context: planContext, syncResult, timezone } = await getPlanContext(
      user.id,
      resolvedPlanId,
      { traceId },
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
    const deterministicActions = buildDeterministicActionsFromContext(syncResult)
    const resolvedActions = actions.length > 0 ? actions : deterministicActions
    const actionProposals = buildActionProposals(resolvedActions, traceId)
    const executedAction = await resolveDashboardChatAction(
      user.id,
      resolvedPlanId,
      resolvedActions,
      action || deterministicActions[0] || null,
      message,
      traceId,
    )
    const needsConfirmation =
      actionProposals.some((proposal) => proposal.status === 'confirmation_needed') ||
      executedAction?.status === 'confirmation_needed'

    return withRateLimitHeaders(
      NextResponse.json({
        success: true,
        response: cleanResponse,
        actions: actionProposals,
        action: executedAction,
        needsConfirmation,
        traceId,
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

function buildDeterministicActionsFromContext(
  syncResult: Awaited<ReturnType<typeof getPlanContext>>['syncResult'],
) {
  const sessionIds = syncResult?.orphanedSessionIds || []
  if (sessionIds.length === 0) {
    return []
  }

  return [{
    type: 'resync_calendar_sessions' as const,
    data: { sessionIds },
    status: 'confirmation_needed' as const,
    requiresConfirmation: true,
    message: 'Confirma si quieres resincronizar estas sesiones con Google Calendar.',
  }]
}
