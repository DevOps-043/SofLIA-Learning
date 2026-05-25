import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

import { fetchLessonsForTranslation } from './translation/lesson-query'
import { processLessonTranslations } from './translation/lesson-processing'
import {
  buildEmptyTranslationResponse,
  buildTranslationResponse,
  createTranslationRunContext,
} from './translation/reporting'
import { readTranslationRequest } from './translation/request'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) {
      return auth
    }

    const options = await readTranslationRequest(request)
    const supabase = await createClient()
    const lessons = await fetchLessonsForTranslation(supabase, options)

    if (lessons.length === 0) {
      return NextResponse.json(buildEmptyTranslationResponse())
    }

    const context = createTranslationRunContext(supabase, auth.userId)

    for (const lesson of lessons) {
      await processLessonTranslations(context, lesson, options)
    }

    return NextResponse.json(buildTranslationResponse(context))
  } catch (error) {
    techDebtLogger.error('[translate-existing-lessons] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
