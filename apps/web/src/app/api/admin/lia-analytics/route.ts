import { NextRequest } from 'next/server'
import { handleLiaAnalyticsRequest } from './lia-analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleLiaAnalyticsRequest(request)
}
