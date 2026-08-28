import type { NextRequest } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import type { SupportedLanguage } from '@/core/i18n/i18n'
import type { FullCourseRequest } from './full.types'

export async function resolveFullCourseRequest(
  request: NextRequest,
  params: Promise<{ slug: string }>,
): Promise<FullCourseRequest> {
  const { slug } = await params
  const language = (request.nextUrl.searchParams.get('lang') || 'es') as SupportedLanguage
  const supabase = await createClient()
  const currentUser = await SessionService.getCurrentUser()

  return {
    request,
    supabase,
    slug,
    language,
    effectiveUserId: currentUser?.id,
  }
}
