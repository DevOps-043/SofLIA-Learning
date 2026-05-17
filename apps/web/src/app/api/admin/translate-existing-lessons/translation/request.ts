import type { NextRequest } from 'next/server'

import type { TranslationRequestOptions } from './types'

export async function readTranslationRequest(
  request: NextRequest
): Promise<TranslationRequestOptions> {
  const body = await request.json().catch(() => ({}))
  const {
    lessonIds,
    courseId,
    includeActivities = true,
    includeMaterials = true,
  } = body as {
    courseId?: string
    includeActivities?: boolean
    includeMaterials?: boolean
    lessonIds?: string[]
  }

  return {
    courseId,
    includeActivities,
    includeMaterials,
    lessonIds,
  }
}
