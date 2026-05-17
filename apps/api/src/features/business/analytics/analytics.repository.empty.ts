import { buildActiveSinceDate } from './analytics.repository.dates'
import type {
  AnalyticsOrganizationInfo,
  AnalyticsSourceData,
} from './analytics.types'

export function buildEmptyAnalyticsSourceData(
  organization: AnalyticsOrganizationInfo,
): AnalyticsSourceData {
  return {
    organization,
    orgUsers: [],
    assignments: [],
    enrollments: [],
    certificates: [],
    lessonProgress: [],
    dailyProgress: [],
    studySessions: [],
    nodes: [],
    activeSinceDate: buildActiveSinceDate(),
  }
}
