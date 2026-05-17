import type { ReportsAnalyticsUserDetailRow } from '../../../types/reports-analytics.types'
import { buildHierarchyRanking } from './build-hierarchy-ranking'
import { buildUserRanking } from './build-user-ranking'

export function buildRankings(userDetails: ReportsAnalyticsUserDetailRow[]) {
  return {
    regions: buildHierarchyRanking(userDetails, 'region'),
    zones: buildHierarchyRanking(userDetails, 'zone'),
    teams: buildHierarchyRanking(userDetails, 'team'),
    users: buildUserRanking(userDetails),
  }
}
