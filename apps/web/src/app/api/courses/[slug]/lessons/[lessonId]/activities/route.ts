import { NextRequest, NextResponse } from 'next/server'

import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import { SupportedLanguage } from '@/core/i18n/i18n'
import { SessionService } from '@/features/auth/services/session.service'
import { getExternalToolDefinition } from '@/features/courses/config/external-tool-registry'
import { resolveActivityConfigFromRecord } from '@/features/courses/services/activity-content-compatibility.service'
import {
  buildActivitySubmissionSummaryMap,
  resolveCourseLessonContext,
} from '@/features/courses/services/activity-submission.server.service'
import type { ExternalToolKey } from '@/features/courses/types/activity-config'
import { normalizeLessonActivityRecord } from '@/lib/course-content'
import { createAdminClient } from '@/lib/supabase/admin'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'

type LessonActivityRecord = Record<string, unknown> & {
  activity_content?: unknown
  activity_id: string
  activity_type?: string | null
  ai_prompts?: unknown
  external_tool_key?: string | null
  id?: string
  requires_soflia_validation?: boolean | null
}

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
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { slug, lessonId } = await params
    const { searchParams } = new URL(request.url)
    const language = (searchParams.get('language') || 'es') as SupportedLanguage
    const supabase = createAdminClient()
    const lessonContext = await resolveCourseLessonContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
    )

    const { data: activities, error: activitiesError } = await supabase
      .from('lesson_activities')
      .select(SELECT_COLUMNS.lesson_activities)
      .eq('lesson_id', lessonId)
      .order('activity_order_index', { ascending: true })

    if (activitiesError) {
      return NextResponse.json(
        { error: 'Error al obtener actividades' },
        { status: 500 },
      )
    }

    let translatedActivities: LessonActivityRecord[] = (activities ??
      []) as LessonActivityRecord[]
    if (translatedActivities.length > 0) {
      try {
        translatedActivities = await ContentTranslationService.translateArray(
          'activity',
          translatedActivities.map((activity) => ({
            ...activity,
            id: activity.activity_id,
          })),
          [
            'activity_title',
            'activity_description',
            'activity_content',
            'ai_prompts',
          ],
          language,
          supabase,
        )
      } catch {
        // Si falla la traduccion, se conserva el contenido base.
      }
    }

    const summaryMap = await buildActivitySubmissionSummaryMap(
      supabase,
      lessonContext,
      translatedActivities,
    )
    const activityIds = translatedActivities.map(
      (activity) => activity.activity_id,
    )
    const { data: liaCompletions } =
      activityIds.length > 0
        ? await supabase
            .from('lia_activity_completions')
            .select('activity_id, status')
            .eq('user_id', currentUser.id)
            .eq('status', 'completed')
            .in('activity_id', activityIds)
        : { data: [] }

    const completedLiaActivityIds = new Set(
      ((liaCompletions || []) as Array<{ activity_id: string }>).map(
        (completion) => completion.activity_id,
      ),
    )

    const normalizedActivities = translatedActivities.map((activity) => {
      const normalizedActivity = normalizeLessonActivityRecord(activity)
      const resolvedActivityConfig = resolveActivityConfigFromRecord(normalizedActivity)
      const submissionSummary = summaryMap.get(activity.activity_id) || null
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
            completedLiaActivityIds.has(activity.activity_id),
        ),
        latest_submission_summary: submissionSummary,
        requires_soflia_validation: Boolean(
          normalizedActivity.requires_soflia_validation ||
            hasActivityValidationEnabled(resolvedActivityConfig),
        ),
      }
    })

    return withCacheHeaders(
      NextResponse.json(normalizedActivities),
      cacheHeaders.private,
    )
  } catch (error) {
    const status =
      error instanceof Error && 'status' in error
        ? Number((error as { status?: number }).status) || 500
        : 500

    return NextResponse.json(
      {
        error: status < 500 && error instanceof Error
          ? error.message
          : 'Error interno del servidor',
      },
      { status },
    )
  }
}
