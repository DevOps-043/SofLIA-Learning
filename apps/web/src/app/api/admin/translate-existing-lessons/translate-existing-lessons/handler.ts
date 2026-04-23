import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { createTranslateErrorResponse, TranslateExistingLessonsError } from './errors'
import { fetchLessonsForTranslation } from './lessons-query'
import { processLessonsForTranslation } from './processor'
import { readTranslationOptions } from './request-options'
import { createNoLessonsResponse, createTranslationSuccessResponse } from './responses'

export async function handleTranslateExistingLessonsRequest(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const options = await readTranslationOptions(request)
    const supabase = await createClient()
    const lessons = await fetchLessonsForTranslation(supabase, options)

    if (lessons.length === 0) return createNoLessonsResponse()

    const result = await processLessonsForTranslation(
      supabase,
      lessons,
      options,
      auth.userId,
    )
    return createTranslationSuccessResponse(result)
  } catch (error) {
    if (error instanceof TranslateExistingLessonsError) {
      return createTranslateErrorResponse(error)
    }

    console.error('[translate-existing-lessons] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
