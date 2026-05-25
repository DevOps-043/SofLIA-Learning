import type { NextRequest } from 'next/server'
import { handleDeadlineSuggestionsRequest } from '@/app/api/_lib/deadline-suggestions/handler'

export const maxDuration = 60

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ orgSlug: string; id: string }> },
) {
  const { orgSlug, id } = await props.params

  return handleDeadlineSuggestionsRequest({
    courseId: id,
    organizationSlug: orgSlug,
    request,
  })
}
