import type { NextRequest } from 'next/server'
import { z } from 'zod'

import type { TranslationRequestOptions } from './types'

const translationRequestSchema = z.object({
  courseId: z.string().uuid().optional(),
  lessonIds: z.array(z.string().uuid()).max(1_000).optional(),
  includeActivities: z.boolean().optional().default(true),
  includeMaterials: z.boolean().optional().default(true),
})

export async function readTranslationRequest(
  request: NextRequest,
): Promise<TranslationRequestOptions> {
  let raw: unknown = {}
  try {
    const rawBody = await request.text()
    raw = rawBody.trim() ? JSON.parse(rawBody) : {}
  } catch {
    raw = {}
  }

  const parsed = translationRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      courseId: undefined,
      lessonIds: undefined,
      includeActivities: true,
      includeMaterials: true,
    }
  }

  return parsed.data
}
