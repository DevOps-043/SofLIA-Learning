import { logger } from '../../../../../lib/utils/logger'
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import { analyzeProactively, syncSessionsWithCalendar } from './analysis.service'
import {
  createAdminClient,
  getCalendarAccessToken,
  listGoogleCalendarEvents,
} from './calendar.service'
import {
  buildCalendarListContext,
  getStudySessionEventIds,
} from './context-prompt.service'
import type { StudyPlanRow, StudySessionRow } from './context-data.types'
import type { CalendarEvent, SyncResult } from './types'

type AdminClient = ReturnType<typeof createAdminClient>

export interface LoadedCalendarContext {
  calendarEventsToday: CalendarEvent[]
  calendarEventsWeek: CalendarEvent[]
  calendarEventsThirtyDays: CalendarEvent[]
  provider: string | null
  sections: string[]
  syncResult?: SyncResult
}

export async function loadCalendarContext(params: {
  userId: string
  plan: StudyPlanRow | null
  supabase: AdminClient
  timezone: string
  tracePrefix: string
  now: Date
  thirtyDaysLater: Date
}): Promise<LoadedCalendarContext> {
  const { userId, plan, supabase, timezone, tracePrefix, now, thirtyDaysLater } = params
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date(todayStart)
  todayEnd.setHours(23, 59, 59, 999)

  const context: LoadedCalendarContext = {
    calendarEventsToday: [],
    calendarEventsWeek: [],
    calendarEventsThirtyDays: [],
    provider: null,
    sections: [],
  }

  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId)
  context.provider = provider
  logger.info(
    `${tracePrefix} calendar access provider=${provider || 'none'} token=${accessToken ? 'yes' : 'no'}`,
  )

  const selectedCalendarIds = await safeGetSelectedCalendarIds(userId, tracePrefix)
  await appendCalendarListSection(context, {
    accessToken,
    provider,
    selectedCalendarIds,
    tracePrefix,
  })

  if (accessToken && provider === 'google') {
    await loadGoogleCalendarEvents(context, {
      accessToken,
      calendarId,
      plan,
      selectedCalendarIds,
      supabase,
      thirtyDaysLater,
      timezone,
      todayEnd,
      todayStart,
      tracePrefix,
      userId,
      weekEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    })
  } else if (accessToken && provider === 'microsoft') {
    logger.info(`${tracePrefix} microsoft provider connected; availability sync remains read-only`)
  } else {
    logger.warn(`${tracePrefix} no external calendar access available`)
  }

  return context
}

export function buildProactiveSection(params: {
  userId: string
  planId: string
  sessions: Array<StudySessionRow & {
    derivedStatus?: 'effectively_completed' | 'in_progress' | null
    progressPct?: number
    hasCalendarEventLinked: boolean
  }>
  calendarEventsThirtyDays: CalendarEvent[]
  timezone: string
}): ReturnType<typeof analyzeProactively> {
  return analyzeProactively(
    params.userId,
    params.planId,
    params.sessions,
    params.calendarEventsThirtyDays,
    params.timezone,
  )
}

async function safeGetSelectedCalendarIds(
  userId: string,
  tracePrefix: string,
): Promise<string[] | null> {
  try {
    return await CalendarIntegrationService.getSelectedCalendarIds(userId)
  } catch (error) {
    logger.warn(`${tracePrefix} failed to read selected calendar ids`, error)
    return null
  }
}

async function appendCalendarListSection(
  context: LoadedCalendarContext,
  params: {
    accessToken: string | null
    provider: string | null
    selectedCalendarIds: string[] | null
    tracePrefix: string
  },
): Promise<void> {
  const { accessToken, provider, selectedCalendarIds, tracePrefix } = params
  if (!accessToken || !provider) {
    return
  }

  try {
    const calendarListContext = await buildCalendarListContext({
      accessToken,
      provider,
      selectedCalendarIds,
    })

    if (calendarListContext.trim()) {
      context.sections.push(calendarListContext.trim())
    }
  } catch (error) {
    logger.warn(`${tracePrefix} failed to build calendar list context`, error)
  }
}

async function loadGoogleCalendarEvents(
  context: LoadedCalendarContext,
  params: {
    accessToken: string
    calendarId?: string | null
    plan: StudyPlanRow | null
    selectedCalendarIds: string[] | null
    supabase: AdminClient
    thirtyDaysLater: Date
    timezone: string
    todayEnd: Date
    todayStart: Date
    tracePrefix: string
    userId: string
    weekEnd: Date
  },
): Promise<void> {
  const studySessionEventIds = await getStudySessionEventIds(params.supabase, params.userId)

  context.calendarEventsToday = await listGoogleCalendarEvents(
    params.accessToken,
    params.todayStart,
    params.todayEnd,
    params.timezone,
    studySessionEventIds,
    params.selectedCalendarIds,
  )
  context.calendarEventsWeek = await listGoogleCalendarEvents(
    params.accessToken,
    params.todayStart,
    params.weekEnd,
    params.timezone,
    studySessionEventIds,
    params.selectedCalendarIds,
  )
  context.calendarEventsThirtyDays = await listGoogleCalendarEvents(
    params.accessToken,
    params.todayStart,
    params.thirtyDaysLater,
    params.timezone,
    studySessionEventIds,
    params.selectedCalendarIds,
  )

  logger.info(
    `${params.tracePrefix} calendar events loaded today=${context.calendarEventsToday.length} week=${context.calendarEventsWeek.length} thirtyDays=${context.calendarEventsThirtyDays.length}`,
  )

  if (params.plan) {
    context.syncResult = await syncSessionsWithCalendar(
      params.userId,
      params.plan.id,
      params.accessToken,
      context.calendarEventsThirtyDays,
      params.calendarId,
      params.timezone,
    )
  }
}
