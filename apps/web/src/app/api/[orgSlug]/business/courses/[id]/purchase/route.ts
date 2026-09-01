import type { NextRequest } from 'next/server'

import { handleOrganizationCoursePurchase } from '@/app/api/business/courses/purchase-handler'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; orgSlug: string }> },
) {
  const { id, orgSlug } = await params
  return handleOrganizationCoursePurchase({
    courseId: id,
    organizationSlug: orgSlug,
  })
}
