import type { ReportsAnalyticsHierarchyRankingRow, ReportsAnalyticsHierarchyType, ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_UNSPECIFIED, calculateRankScore } from '../reports-analytics.helpers'
import { buildSegmentRow } from './build-segment-row'

export function buildHierarchyRanking(
  userDetails: ReportsAnalyticsUserDetailRow[],
  type: ReportsAnalyticsHierarchyType,
): ReportsAnalyticsHierarchyRankingRow[] {
  const groups = new Map<string, ReportsAnalyticsUserDetailRow[]>()

  userDetails.forEach((user) => {
    const key = type === 'region' ? user.regionId : type === 'zone' ? user.zoneId : user.teamId
    if (!key || key === REPORTS_ANALYTICS_UNSPECIFIED) return
    groups.set(key, [...(groups.get(key) || []), user])
  })

  return Array.from(groups.entries())
    .map(([id, users]) => {
      const firstUser = users[0]
      const name = type === 'region'
        ? firstUser.regionName
        : type === 'zone'
          ? firstUser.zoneName
          : firstUser.teamName
      const segment = buildSegmentRow(id, name, users)
      const overdueAssignments = users.reduce((sum, user) => sum + user.overdueAssignments, 0)
      const rankScore = calculateRankScore({ ...segment, overdueAssignments })

      return {
        id,
        type,
        name,
        regionId: firstUser.regionId !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.regionId : undefined,
        regionName: firstUser.regionName !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.regionName : undefined,
        zoneId: firstUser.zoneId !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.zoneId : undefined,
        zoneName: firstUser.zoneName !== REPORTS_ANALYTICS_UNSPECIFIED ? firstUser.zoneName : undefined,
        users: users.length,
        averageProgress: segment.averageProgress,
        completionRate: segment.completionRate,
        averageCompletionDays: segment.averageCompletionDays,
        sofliaAdoptionRate: segment.sofliaAdoptionRate,
        notesAdoptionRate: segment.notesAdoptionRate,
        qualityScore: segment.qualityScore,
        overdueAssignments,
        rankScore,
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore || b.users - a.users || a.name.localeCompare(b.name))
}
