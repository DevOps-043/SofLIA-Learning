import {
  getLatestCalendarIntegration,
} from '@/app/api/study-planner/calendar/events/calendar-events.db'
import { refreshCalendarAccessToken } from '@/app/api/study-planner/calendar/events/calendar-events-oauth.service'
import { syncDeletedStudySessions } from '@/app/api/study-planner/calendar/events/calendar-events-sync.service'
import { needsCalendarTokenRefresh } from '@/app/api/study-planner/calendar/events/calendar-events.utils'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getLatestStudyPlanId,
  getStudySessionsForRange,
} from './study-planner-sessions.db'
import type { StudyPlannerSessionsResponse } from './study-planner-sessions.types'

interface BuildStudyPlannerSessionsParams {
  userId: string
  startDate: Date
  endDate: Date
  planId?: string
}

export async function syncStudyPlannerSessionsCalendarState(
  params: BuildStudyPlannerSessionsParams & {
    supabase: ReturnType<typeof createAdminClient>
  },
): Promise<void> {
  const integration = await getLatestCalendarIntegration(
    params.supabase,
    params.userId,
  )

  if (!integration?.access_token) {
    return
  }

  let accessToken = integration.access_token

  if (needsCalendarTokenRefresh(integration.expires_at)) {
    const refreshResult = await refreshCalendarAccessToken(
      params.supabase,
      integration,
    )

    if (!refreshResult.success || !refreshResult.accessToken) {
      return
    }

    accessToken = refreshResult.accessToken
  }

  await syncDeletedStudySessions(
    params.supabase,
    params.userId,
    params.startDate,
    params.endDate,
    accessToken,
    integration,
  )
}

export async function buildStudyPlannerSessionsResponse(
  params: BuildStudyPlannerSessionsParams,
): Promise<StudyPlannerSessionsResponse> {
  const supabase = createAdminClient()
  const activePlanId =
    params.planId || await getLatestStudyPlanId(supabase, params.userId)

  if (!activePlanId) {
    return {
      sessions: [],
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      totalSessions: 0,
      hasActivePlan: false,
    }
  }

  await syncStudyPlannerSessionsCalendarState({
    ...params,
    supabase,
  })

  const sessions = await getStudySessionsForRange(supabase, {
    ...params,
    planId: activePlanId,
  })

  return {
    sessions,
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    totalSessions: sessions.length,
    hasActivePlan: true,
  }
}
