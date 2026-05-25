import {
  getLatestCalendarIntegration,
} from '@/app/api/study-planner/calendar/events/calendar-events.db'
import { refreshCalendarAccessToken } from '@/app/api/study-planner/calendar/events/calendar-events-oauth.service'
import { syncDeletedStudySessions } from '@/app/api/study-planner/calendar/events/calendar-events-sync.service'
import { needsCalendarTokenRefresh } from '@/app/api/study-planner/calendar/events/calendar-events.utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildUserCacheKey, cache } from '@/lib/cache'
import {
  getLatestStudyPlanId,
  getStudySessionsForRange,
} from './study-planner-sessions.db'
import type { StudyPlannerSessionsResponse } from './study-planner-sessions.types'

const SESSIONS_RESPONSE_CACHE_TTL_SEC = 15

interface BuildStudyPlannerSessionsParams {
  userId: string
  startDate: Date
  endDate: Date
  planId?: string
}

function sessionsResponseCacheKey(
  params: BuildStudyPlannerSessionsParams,
  activePlanId: string | undefined,
) {
  return buildUserCacheKey({
    userId: params.userId,
    resourceType: 'study-planner-sessions',
    variant: [
      params.startDate.toISOString(),
      params.endDate.toISOString(),
      activePlanId || params.planId || 'all',
    ].join(':'),
  })
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
  const isAllPlans = params.planId === 'all'
  const activePlanId =
    isAllPlans ? undefined : (params.planId || await getLatestStudyPlanId(supabase, params.userId))

  if (!isAllPlans && !activePlanId) {
    return {
      sessions: [],
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      totalSessions: 0,
      hasActivePlan: false,
    }
  }

  const cacheKey = sessionsResponseCacheKey(params, activePlanId)
  const cached = await cache.get<StudyPlannerSessionsResponse>(cacheKey)
  if (cached) {
    return cached
  }

  await syncStudyPlannerSessionsCalendarState({
    ...params,
    supabase,
  })

  const sessions = await getStudySessionsForRange(supabase, {
    ...params,
    planId: activePlanId,
  })

  const response = {
    sessions,
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    totalSessions: sessions.length,
    hasActivePlan: isAllPlans || Boolean(activePlanId),
  }

  await cache.set(cacheKey, response, SESSIONS_RESPONSE_CACHE_TTL_SEC)

  return response
}
