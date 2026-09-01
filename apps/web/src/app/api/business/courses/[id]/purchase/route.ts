import type { NextRequest } from 'next/server'

import { handleOrganizationCoursePurchase } from '../../purchase-handler'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return handleOrganizationCoursePurchase({ courseId: id })
}
