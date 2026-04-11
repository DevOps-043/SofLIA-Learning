import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'
import { buildLearnDataResponse } from './services/learn-data-response.service'
import { loadLearnDataPayload } from './services/learn-data-query.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const searchParams = new URL(request.url).searchParams
    const lessonId = searchParams.get('lessonId')
    const language = searchParams.get('language') || 'es'
    const organizationId = searchParams.get('orgId')
    const supabase = await createClient()
    const currentUser = await SessionService.getCurrentUser()

    const payload = await loadLearnDataPayload(
      supabase,
      slug,
      lessonId,
      language,
      currentUser?.id,
      organizationId,
    )

    return withCacheHeaders(
      NextResponse.json(buildLearnDataResponse(payload)),
      cacheHeaders.dynamic,
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === 'COURSE_NOT_FOUND'
            ? 'Curso no encontrado'
            : 'Error interno del servidor',
        details:
          error instanceof Error && error.message !== 'COURSE_NOT_FOUND'
            ? error.message
            : undefined,
      },
      {
        status:
          error instanceof Error && error.message === 'COURSE_NOT_FOUND'
            ? 404
            : 500,
      },
    )
  }
}
