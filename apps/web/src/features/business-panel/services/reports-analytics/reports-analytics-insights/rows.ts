import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'

export function buildInsightSegmentRows(
  dataset: ReportsAnalyticsDataset,
  labels: Record<string, string>,
) {
  return [
    ...dataset.segments.ageBands.map((row) => ({ ...row, label: `${labels.age}: ${row.label}` })),
    ...dataset.segments.gender.map((row) => ({ ...row, label: `${labels.gender}: ${row.label}` })),
    ...dataset.segments.jobTitles.map((row) => ({ ...row, label: `${labels.jobTitle}: ${row.label}` })),
    ...dataset.segments.roles.map((row) => ({ ...row, label: `${labels.role}: ${row.label}` })),
  ].sort((a, b) => a.qualityScore - b.qualityScore || a.averageProgress - b.averageProgress)
}

export function buildInsightHierarchyRows(dataset: ReportsAnalyticsDataset) {
  return [
    ...dataset.rankings.regions,
    ...dataset.rankings.zones,
    ...dataset.rankings.teams,
  ].sort((a, b) => b.rankScore - a.rankScore)
}

export function formatDate(value: string, locale: ReportsAnalyticsLocale): string {
  return new Date(value).toLocaleDateString(locale)
}
