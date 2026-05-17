import { REPORTS_ANALYTICS_AGE_BANDS, REPORTS_ANALYTICS_UNSPECIFIED, buildBreakdown, incrementMap } from '../reports-analytics.helpers'
import type { UserDimension } from './user-dimension'

export function buildDemographics(dimensions: UserDimension[]) {
  const total = dimensions.length
  const genderCounts = new Map<string, number>()
  const ageBandCounts = new Map<string, number>(REPORTS_ANALYTICS_AGE_BANDS.map((band) => [band, 0]))
  const jobTitleCounts = new Map<string, number>()
  const roleCounts = new Map<string, number>()

  dimensions.forEach((dimension) => {
    incrementMap(genderCounts, dimension.gender)
    incrementMap(ageBandCounts, dimension.ageBand)
    incrementMap(jobTitleCounts, dimension.jobTitle)
    incrementMap(roleCounts, dimension.role)
  })

  return {
    gender: buildBreakdown(genderCounts, total),
    ageBands: buildBreakdown(ageBandCounts, total),
    jobTitles: buildBreakdown(jobTitleCounts, total),
    roles: buildBreakdown(roleCounts, total),
    missingDateOfBirth: dimensions.filter((dimension) => !dimension.dateOfBirth).length,
    missingGender: dimensions.filter((dimension) => dimension.gender === REPORTS_ANALYTICS_UNSPECIFIED).length,
    missingJobTitle: dimensions.filter((dimension) => dimension.jobTitle === REPORTS_ANALYTICS_UNSPECIFIED).length,
  }
}
