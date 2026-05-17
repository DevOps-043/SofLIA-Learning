import type { ReportsAnalyticsSegments, ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { buildSegmentRows } from './build-segment-rows'

export function buildSegments(userDetails: ReportsAnalyticsUserDetailRow[]): ReportsAnalyticsSegments {
  return {
    ageBands: buildSegmentRows(userDetails, (user) => user.ageBand),
    gender: buildSegmentRows(userDetails, (user) => user.gender),
    jobTitles: buildSegmentRows(userDetails, (user) => user.jobTitle),
    roles: buildSegmentRows(userDetails, (user) => user.role),
  }
}
