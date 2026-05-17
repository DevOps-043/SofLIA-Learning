import { NextRequest, NextResponse } from 'next/server'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'
import { buildCompletedActivityIds } from './sidebar-data/sidebar-completion'
import { resolveSidebarContext } from './sidebar-data/sidebar-context'
import { loadSidebarData } from './sidebar-data/sidebar-loader'
import { buildQuizStatus } from './sidebar-data/sidebar-quiz-status'
import { mergeTranslationContext } from './sidebar-data/sidebar-translation-context'
import { translateSidebarContent } from './sidebar-data/sidebar-translations'
import type { SidebarRouteContext } from './sidebar-data/sidebar.types'

export async function GET(
  request: NextRequest,
  context: SidebarRouteContext,
) {
  try {
    const sidebarContext = await resolveSidebarContext(request, context.params)
    if (sidebarContext instanceof NextResponse) return sidebarContext

    const sidebarData = await loadSidebarData(sidebarContext)
    if (sidebarData instanceof NextResponse) return sidebarData

    const { activities: rawActivities, materials } = await translateSidebarContent(
      sidebarContext,
      sidebarData.rawActivities,
      sidebarData.materials,
    )
    const completedActivityIds = await buildCompletedActivityIds(
      sidebarContext,
      rawActivities,
      sidebarData,
    )
    const quizStatus = await buildQuizStatus(sidebarContext, sidebarData)
    const activities = rawActivities.map((activity) => ({
      ...activity,
      is_completed: completedActivityIds.has(activity.activity_id),
    }))

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

    return withCacheHeaders(NextResponse.json(response), cacheHeaders.dynamic)
  } catch (error) {
    console.error('Error in sidebar-data API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
