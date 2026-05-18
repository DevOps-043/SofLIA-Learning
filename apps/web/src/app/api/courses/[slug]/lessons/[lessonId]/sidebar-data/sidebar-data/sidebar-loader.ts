import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server'
import {
  fetchActivities,
  fetchActivityQuizzes,
  fetchMaterialQuizzes,
  fetchMaterials,
} from './sidebar-content.queries'
import {
  activitiesLoadErrorResponse,
  materialsLoadErrorResponse,
} from './sidebar-responses'
import {
  fetchEnrollment,
  fetchLiaCompletions,
  fetchQuizProgress,
} from './sidebar-progress.queries'
import type { SidebarDataBundle } from './sidebar-results.types'
import type { SidebarContext } from './sidebar.types'

export async function loadSidebarData(
  context: SidebarContext,
): Promise<SidebarDataBundle | NextResponse> {
  const [
    activitiesResult,
    materialsResult,
    materialQuizzesResult,
    activityQuizzesResult,
    enrollment,
    liaCompletionsResult,
    quizProgressResult,
  ] = await Promise.all([
    fetchActivities(context.supabase, context.resolvedLessonId),
    fetchMaterials(context.supabase, context.resolvedLessonId),
    fetchMaterialQuizzes(context.supabase, context.resolvedLessonId),
    fetchActivityQuizzes(context.supabase, context.resolvedLessonId),
    fetchEnrollment(context),
    fetchLiaCompletions(context),
    fetchQuizProgress(context),
  ])

  if (activitiesResult.error) {
    techDebtLogger.error('Error fetching activities:', activitiesResult.error)
    return activitiesLoadErrorResponse()
  }

  if (materialsResult.error) {
    techDebtLogger.error('Error fetching materials:', materialsResult.error)
    return materialsLoadErrorResponse()
  }

  return {
    rawActivities: activitiesResult.data || [],
    materials: materialsResult.data || [],
    materialQuizzes: materialQuizzesResult.data || [],
    activityQuizzes: activityQuizzesResult.data || [],
    enrollment,
    liaCompletions: liaCompletionsResult.data || [],
    quizProgress: quizProgressResult.data || [],
  }
}
