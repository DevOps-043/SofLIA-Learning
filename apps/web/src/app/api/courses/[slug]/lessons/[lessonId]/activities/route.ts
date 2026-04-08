import { NextRequest, NextResponse } from 'next/server'

import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import { SupportedLanguage } from '@/core/i18n/i18n'
import { SessionService } from '@/features/auth/services/session.service'
import { getExternalToolDefinition } from '@/features/courses/config/external-tool-registry'
import { resolveActivityConfig } from '@/features/courses/services/activity-content-compatibility.service'
import {
  buildActivitySubmissionSummaryMap,
  resolveCourseLessonContext,
} from '@/features/courses/services/activity-submission.server.service'
import type { ExternalToolKey } from '@/features/courses/types/activity-config'
import { normalizeLessonActivityRecord } from '@/lib/course-content'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()
    const lessonContext = await resolveCourseLessonContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
    )

    const { data: activities, error: activitiesError } = await supabase
      .from('lesson_activities')
      .select('*')
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

    const normalizedActivities = translatedActivities.map((activity) => {
      const normalizedActivity = normalizeLessonActivityRecord(activity)
      const resolvedActivityConfig = resolveActivityConfig(normalizedActivity)
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
        latest_submission_summary:
          summaryMap.get(activity.activity_id) || null,
        requires_soflia_validation: Boolean(
          normalizedActivity.requires_soflia_validation ||
            resolvedActivityConfig?.validation.enabled,
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
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status },
    )
  }
}
