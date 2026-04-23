import type { NextRequest } from 'next/server'
import type { TranslationOptions } from './types'

export async function readTranslationOptions(
  request: NextRequest,
): Promise<TranslationOptions> {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const lessonIds = Array.isArray(body.lessonIds)
    ? body.lessonIds.filter((lessonId): lessonId is string => typeof lessonId === 'string')
    : undefined

  return {
    lessonIds,
    courseId: typeof body.courseId === 'string' ? body.courseId : undefined,
    includeActivities:
      body.includeActivities === undefined ? true : Boolean(body.includeActivities),
    includeMaterials:
      body.includeMaterials === undefined ? true : Boolean(body.includeMaterials),
  }
}
