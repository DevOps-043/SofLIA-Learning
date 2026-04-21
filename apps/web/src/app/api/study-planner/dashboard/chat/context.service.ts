import { logger } from '../../../../../lib/utils/logger'
import {
  formatStudyPlannerCoverageForPrompt,
  getStudyPlannerCoverageForPlan,
} from '../../../../../features/study-planner/services/study-planner-coverage.server.service'
import { createAdminClient, resolveSessionCalendarSync } from './calendar.service'
import { buildProactiveSection, loadCalendarContext } from './context-calendar.service'
import {
  loadStudyPlan,
  loadStudyPlanReferences,
  loadStudySessionsForPlans,
} from './context-data.service'
import { deriveSessionProgress, loadLessonProgressMap } from './context-lesson-progress.service'
import {
  buildCalendarEventsTodaySection,
  buildCalendarLoadSections,
  buildCoverageFallbackSection,
  buildOrphanedSessionsAlertSection,
  buildOtherPlansSection,
  buildPlanOverviewSection,
  buildProactiveAnalysisSection,
  buildSessionsSection,
} from './context-sections.service'
import type { SyncResult } from './types'

function buildTracePrefix(traceId?: string): string {
  return traceId ? `[StudyPlannerContext:${traceId}]` : '[StudyPlannerContext]'
}

export async function getPlanContext(
  userId: string,
  planId: string,
  options?: { traceId?: string },
): Promise<{ context: string; syncResult?: SyncResult; timezone: string }> {
  const supabase = createAdminClient()
  const tracePrefix = buildTracePrefix(options?.traceId)

  logger.info(`${tracePrefix} getPlanContext userId=${userId} planId=${planId}`)

  const plan = await loadStudyPlan(supabase, userId, planId, tracePrefix)
  const timezone = plan?.timezone || 'America/Mexico_City'
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const sections: string[] = []

  const calendarContext = await loadCalendarContext({
    userId,
    plan,
    supabase,
    timezone,
    tracePrefix,
    now,
    thirtyDaysLater,
  })
  sections.push(...calendarContext.sections)

  const orphanedSessionsSection = buildOrphanedSessionsAlertSection(
    calendarContext.syncResult,
  )
  if (orphanedSessionsSection) {
    sections.push(orphanedSessionsSection)
  }

  sections.push(
    buildCalendarEventsTodaySection(
      calendarContext.calendarEventsToday,
      calendarContext.provider,
    ),
  )

  if (!plan) {
    sections.push('El usuario NO tiene un plan de estudios activo.')
    return {
      context: sections.filter(Boolean).join('\n\n'),
      syncResult: undefined,
      timezone,
    }
  }

  await appendCoverageSection(sections, userId, plan.id, tracePrefix)

  const allUserPlans = await loadStudyPlanReferences(supabase, userId, tracePrefix)
  const typedSessions = await loadStudySessionsForPlans(
    supabase,
    allUserPlans.map((userPlan) => userPlan.id),
    oneWeekAgo,
    thirtyDaysLater,
    tracePrefix,
  )
  const sessions = typedSessions.filter((session) => session.plan_id === plan.id)
  const otherSessions = typedSessions.filter((session) => session.plan_id !== plan.id)

  sections.push(
    buildPlanOverviewSection({
      ...plan,
      preferred_days: plan.preferred_days || [],
    }),
  )
  sections.push(buildSessionsSection(sessions))

  const otherPlansSection = buildOtherPlansSection(otherSessions, allUserPlans)
  if (otherPlansSection) {
    sections.push(otherPlansSection)
  }

  sections.push(...buildCalendarLoadSections(calendarContext.calendarEventsWeek))

  if (
    typedSessions.length > 0
    && calendarContext.calendarEventsThirtyDays.length > 0
  ) {
    const lessonProgressMap = await loadLessonProgressMap({
      supabase,
      userId,
      sessions: typedSessions,
      tracePrefix,
    })
    const proactiveAnalysis = await buildProactiveSection({
      userId,
      planId: plan.id,
      sessions: typedSessions.map((session) => {
        const progressInsight = deriveSessionProgress(session, lessonProgressMap)

        return {
          ...session,
          derivedStatus: progressInsight.derivedStatus,
          progressPct: progressInsight.progressPct,
          hasCalendarEventLinked: Boolean(
            resolveSessionCalendarSync({
              externalEventId: session.external_event_id,
              calendarProvider: session.calendar_provider,
              metrics: session.metrics,
            })?.externalEventId,
          ),
        }
      }),
      calendarEventsThirtyDays: calendarContext.calendarEventsThirtyDays,
      timezone,
    })

    sections.push(buildProactiveAnalysisSection(proactiveAnalysis))
  }

  return {
    context: sections.filter(Boolean).join('\n\n'),
    syncResult: calendarContext.syncResult,
    timezone,
  }
}

async function appendCoverageSection(
  sections: string[],
  userId: string,
  planId: string,
  tracePrefix: string,
): Promise<void> {
  try {
    const coverage = await getStudyPlannerCoverageForPlan({ planId, userId })
    sections.push(
      coverage
        ? formatStudyPlannerCoverageForPrompt(coverage).trim()
        : buildCoverageFallbackSection(),
    )
  } catch (error) {
    logger.warn(`${tracePrefix} failed to calculate deterministic coverage`, error)
    sections.push(buildCoverageFallbackSection())
  }
}
