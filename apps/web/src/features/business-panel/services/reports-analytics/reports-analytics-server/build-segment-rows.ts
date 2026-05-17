import type { ReportsAnalyticsSegmentRow, ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { buildSegmentRow } from './build-segment-row'

export function buildSegmentRows(
  userDetails: ReportsAnalyticsUserDetailRow[],
  keySelector: (user: ReportsAnalyticsUserDetailRow) => string,
): ReportsAnalyticsSegmentRow[] {
  const groups = new Map<string, ReportsAnalyticsUserDetailRow[]>()
  userDetails.forEach((user) => {
    const key = keySelector(user)
    groups.set(key, [...(groups.get(key) || []), user])
  })

  return Array.from(groups.entries())
    .map(([key, users]) => buildSegmentRow(key, key, users))
    .sort((a, b) => b.users - a.users || b.qualityScore - a.qualityScore || a.label.localeCompare(b.label))
}
