import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SessionService } from '../../../../../features/auth/services/session.service'
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import { UserContextService } from '../../../../../features/study-planner/services/user-context.service'
import type { CalendarEvent } from '../../../../../features/study-planner/types/user-context.types'
import { analyzeCalendarSchema, type AnalyzeCalendarBody } from '../../_schemas'
import type {
  AnalyzeCalendarResponse,
  CalendarAnalysisConfig,
} from './analyze-calendar.types'
import { rankRecommendedSlots } from './calendar-recommendations.service'
import { generateLIAAnalysis } from './lia-availability-analysis.service'

async function handlePost(
  _request: NextRequest,
  body: AnalyzeCalendarBody,
): Promise<NextResponse<AnalyzeCalendarResponse> | Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const userContext = await UserContextService.getFullUserContext(user.id)
    const startDate = body.startDate ? new Date(body.startDate) : new Date()
    const endDate = body.endDate
      ? new Date(body.endDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    const config: CalendarAnalysisConfig = {
      preferredDays: body.preferredDays || [1, 2, 3, 4, 5],
      minSessionMinutes: body.minSessionMinutes || 20,
      maxSessionMinutes: body.maxSessionMinutes || 60,
    }
    const events = await loadCalendarEvents(user.id, userContext, startDate, endDate)
    const availability = CalendarIntegrationService.analyzeAvailability(
      events,
      startDate,
      endDate,
      config.preferredDays,
    )
    const suitableSlots = CalendarIntegrationService.findFreeTimeSlots(
      availability,
      config.minSessionMinutes,
    )
    const liaAnalysis = await generateLIAAnalysis(
      userContext,
      events,
      availability,
      config,
    )

    return NextResponse.json({
      success: true,
      data: {
        events,
        liaAnalysis,
        recommendedSlots: rankRecommendedSlots(suitableSlots, config).slice(0, 20),
      },
    })
  } catch (error) {
    techDebtLogger.error('Error analizando calendario:', error)
    return apiError('ANALYZE_CALENDAR_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(analyzeCalendarSchema, handlePost)

async function loadCalendarEvents(
  userId: string,
  userContext: Awaited<ReturnType<typeof UserContextService.getFullUserContext>>,
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  if (!userContext.calendarIntegration?.isConnected) {
    return []
  }

  return CalendarIntegrationService.getCalendarEvents(userId, startDate, endDate)
}
