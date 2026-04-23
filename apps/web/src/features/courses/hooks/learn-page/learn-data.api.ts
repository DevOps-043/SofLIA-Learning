import { dedupedFetch } from '../../../../lib/supabase/request-deduplication'
import { buildLearnDataQuery } from './learn-page.service'
import {
  LearnDataRequestError,
  type LearnDataErrorResponse,
  type LearnDataResponse,
} from './learn-data.types'

export async function loadLearnData(
  url: string,
  init?: RequestInit,
): Promise<LearnDataResponse> {
  const response = await fetch(url, init)
  const payload = (await response
    .json()
    .catch(() => null)) as LearnDataResponse | LearnDataErrorResponse | null

  if (!response.ok) {
    throw new LearnDataRequestError(
      response.status,
      (payload as LearnDataErrorResponse | null) ?? null,
    )
  }

  return (payload as LearnDataResponse | null) ?? {}
}

export function buildLearnDataUrl(params: {
  language: string
  lessonId?: string | null
  organizationId?: string | null
  slug: string
}) {
  return `/api/courses/${params.slug}/learn-data${buildLearnDataQuery({
    lessonId: params.lessonId,
    language: params.language,
    organizationId: params.organizationId,
  })}`
}

export function prefetchLearnData(params: {
  language: string
  lessonId: string
  organizationId?: string | null
  slug: string
}) {
  return dedupedFetch(buildLearnDataUrl(params), {
    credentials: 'include',
  }).catch(() => null)
}
