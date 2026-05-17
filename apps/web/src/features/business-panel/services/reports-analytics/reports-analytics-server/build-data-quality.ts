import { REPORTS_ANALYTICS_UNSPECIFIED, buildBreakdown, calculatePercentage } from '../reports-analytics.helpers'
import type { UserDimension } from './user-dimension'

export function buildDataQuality(dimensions: UserDimension[]) {
  const total = dimensions.length
  const missingDateOfBirth = dimensions.filter((dimension) => !dimension.dateOfBirth).length
  const missingGender = dimensions.filter((dimension) => dimension.gender === REPORTS_ANALYTICS_UNSPECIFIED).length
  const missingJobTitle = dimensions.filter((dimension) => dimension.jobTitle === REPORTS_ANALYTICS_UNSPECIFIED).length
  const missingAny = dimensions.filter(
    (dimension) =>
      !dimension.dateOfBirth ||
      dimension.gender === REPORTS_ANALYTICS_UNSPECIFIED ||
      dimension.jobTitle === REPORTS_ANALYTICS_UNSPECIFIED,
  ).length
  const missingFields = new Map<string, number>([
    ['date_of_birth', missingDateOfBirth],
    ['gender', missingGender],
    ['job_title', missingJobTitle],
  ])

  return {
    usersWithCompleteDemographics: total - missingAny,
    usersMissingDemographics: missingAny,
    demographicsCompletionRate: calculatePercentage(total - missingAny, total),
    missingFields: buildBreakdown(missingFields, total),
  }
}
