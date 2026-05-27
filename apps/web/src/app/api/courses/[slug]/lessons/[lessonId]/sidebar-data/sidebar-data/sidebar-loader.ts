import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server'
import {
  fetchActivities,
  fetchMaterials,
} from './sidebar-content.queries'
import {
  activitiesLoadErrorResponse,
  materialsLoadErrorResponse,
} from './sidebar-responses'
import {
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
    liaCompletionsResult,
    quizProgressResult,
  ] = await Promise.all([
    fetchActivities(context.supabase, context.resolvedLessonId),
    fetchMaterials(context.supabase, context.resolvedLessonId),
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

  const rawActivities = activitiesResult.data || []
  const materials = materialsResult.data || []

  return {
    rawActivities,
    materials,
    materialQuizzes: materials.filter((material) => material.material_type === 'quiz'),
    activityQuizzes: rawActivities.filter(
      (activity) => activity.activity_type === 'quiz' && activity.is_required === true,
    ),
    enrollment: context.enrollment,
    liaCompletions: liaCompletionsResult.data || [],
    quizProgress: quizProgressResult.data || [],
  }
}
