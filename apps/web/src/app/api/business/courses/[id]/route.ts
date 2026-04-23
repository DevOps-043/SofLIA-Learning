import type { NextRequest } from 'next/server'
import { handleBusinessCourseDetailRequest } from './course-detail'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleBusinessCourseDetailRequest(params)
}
