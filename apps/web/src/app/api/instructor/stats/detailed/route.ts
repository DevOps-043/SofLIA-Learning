import { NextRequest } from 'next/server'
import { handleDetailedInstructorStatsRequest } from './detailed-stats'

export async function GET(request: NextRequest) {
  return handleDetailedInstructorStatsRequest(request)
}
