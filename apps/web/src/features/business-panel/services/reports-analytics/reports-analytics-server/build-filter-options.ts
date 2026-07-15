import type { ReportsAnalyticsFilterOptions } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_AGE_BANDS } from '../reports-analytics.helpers'
import { addCourseOption } from './add-course-option'
import { toOptions } from './to-options'
import { uniqueValues } from './unique-values'
import { unwrapRelation } from './unwrap-relation'
import type { AnalyticsQueryData } from './analytics-query-data'
import type { UserDimension } from './user-dimension'

export function buildFilterOptions(
  queryData: AnalyticsQueryData,
  dimensions: UserDimension[],
): ReportsAnalyticsFilterOptions {
  const courseOptions = new Map<string, string>()

  queryData.assignments.forEach((record) => addCourseOption(courseOptions, record.course_id, unwrapRelation(record.courses)?.title))
  queryData.enrollments.forEach((record) => addCourseOption(courseOptions, record.course_id, unwrapRelation(record.courses)?.title))
  queryData.liaConversations.forEach((record) => addCourseOption(courseOptions, record.course_id, unwrapRelation(record.courses)?.title))

  return {
    courses: toOptions(courseOptions),
    genders: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.gender)).map((value) => [value, value]))),
    ageBands: REPORTS_ANALYTICS_AGE_BANDS.map((value) => ({ value, label: value })),
    jobTitles: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.jobTitle)).map((value) => [value, value]))),
    roles: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.role)).map((value) => [value, value]))),
    statuses: toOptions(new Map(uniqueValues(dimensions.map((dimension) => dimension.status)).map((value) => [value, value]))),
    regions: toOptions(
      new Map(
        queryData.regions
          .filter((region) => region.is_active !== false)
          .map((region) => [region.id, region.name || region.code || region.id]),
      ),
    ),
    zones: queryData.zones
      .filter((zone) => zone.is_active !== false)
      .map((zone) => ({
        value: zone.id,
        label: zone.name || zone.code || zone.id,
        regionId: zone.region_id || undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    teams: queryData.teams
      .filter((team) => team.is_active !== false)
      .map((team) => {
        const zone = team.zone_id ? queryData.zones.find((item) => item.id === team.zone_id) : null
        return {
          value: team.id,
          label: team.name || team.code || team.id,
          zoneId: team.zone_id || undefined,
          regionId: zone?.region_id || undefined,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
}
