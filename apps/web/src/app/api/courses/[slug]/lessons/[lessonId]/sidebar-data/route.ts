import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getExternalToolDefinition } from '@/features/courses/config/external-tool-registry'
import { resolveActivityConfigFromRecord } from '@/features/courses/services/activity-content-compatibility.service'
import type { ExternalToolKey } from '@/features/courses/types/activity-config'
import {
  normalizeLessonActivityRecord,
  normalizeLessonMaterialRecord,
} from '@/lib/course-content'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'
import { buildActivityCompletionState } from './sidebar-data/sidebar-completion'
import { resolveSidebarContext } from './sidebar-data/sidebar-context'
import { loadSidebarData } from './sidebar-data/sidebar-loader'
import { buildQuizStatus } from './sidebar-data/sidebar-quiz-status'
import { mergeTranslationContext } from './sidebar-data/sidebar-translation-context'
import { translateSidebarContent } from './sidebar-data/sidebar-translations'
import type { SidebarRouteContext } from './sidebar-data/sidebar.types'

function hasActivityValidationEnabled(config: unknown) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return false
  }

  const validation = (config as { validation?: unknown }).validation
  if (!validation || typeof validation !== 'object' || Array.isArray(validation)) {
    return false
  }

  return Boolean((validation as { enabled?: unknown }).enabled)
}

export async function GET(
  request: NextRequest,
  context: SidebarRouteContext,
) {
  try {
    const sidebarContext = await resolveSidebarContext(request, context.params)
    if (sidebarContext instanceof NextResponse) return sidebarContext

    const sidebarData = await loadSidebarData(sidebarContext)
    if (sidebarData instanceof NextResponse) return sidebarData

    const { activities: rawActivities, materials: rawMaterials } = await translateSidebarContent(
      sidebarContext,
      sidebarData.rawActivities,
      sidebarData.materials,
    )
    const translatedSidebarData = {
      ...sidebarData,
      activityQuizzes: rawActivities.filter(
        (activity) => activity.activity_type === 'quiz' && activity.is_required === true,
      ),
      materialQuizzes: rawMaterials.filter((material) => material.material_type === 'quiz'),
    }
    const [activityCompletionState, quizStatus] = await Promise.all([
      buildActivityCompletionState(sidebarContext, rawActivities, translatedSidebarData),
      buildQuizStatus(sidebarContext, translatedSidebarData),
    ])
    const activities = rawActivities.map((activity) => {
      const normalizedActivity = normalizeLessonActivityRecord(activity)
      const resolvedActivityConfig = resolveActivityConfigFromRecord(normalizedActivity)
      const submissionSummary =
        activityCompletionState.submissionSummaryMap.get(activity.activity_id) || null
      const toolKey =
        resolvedActivityConfig?.toolTask?.toolKey ??
        (typeof normalizedActivity.external_tool_key === 'string'
          ? normalizedActivity.external_tool_key
          : null)

      return {
        ...normalizedActivity,
        activity_config: resolvedActivityConfig,
        external_tool: toolKey
          ? getExternalToolDefinition(toolKey as ExternalToolKey)
          : null,
        is_completed: Boolean(
          normalizedActivity.is_completed ||
            submissionSummary?.completionSatisfied ||
            activityCompletionState.completedActivityIds.has(activity.activity_id),
        ),
        latest_submission_summary: submissionSummary,
        requires_soflia_validation: Boolean(
          normalizedActivity.requires_soflia_validation ||
            hasActivityValidationEnabled(resolvedActivityConfig),
        ),
      }
    })
    const materials = rawMaterials.map((material) =>
      normalizeLessonMaterialRecord(material),
    )

    const response = {
      activities,
      materials,
      quizStatus,
      translationContext: mergeTranslationContext(
        sidebarContext.resolvedLesson.translationContext,
        activities,
        materials,
      ),
    }

    return withCacheHeaders(NextResponse.json(response), cacheHeaders.privateShort)
  } catch (error) {
    techDebtLogger.error('Error in sidebar-data API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
