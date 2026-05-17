import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { translateKey } from './translations'
import { truncateLabel } from './text.utils'
import type { ReportsAnalyticsT, SegmentDisplayRow } from './types'

export function buildSegmentRows(data: ReportsAnalyticsResponse, t: ReportsAnalyticsT) {
  const rows: SegmentDisplayRow[] = [
    ...data.segments.ageBands.slice(0, 4).map((row) => ({
      ...row,
      label: translateKey(t, 'ageBands', row.key, row.label),
      segmentType: 'age',
      segmentLabel: t('reportsAnalytics.filters.ageBand'),
    })),
    ...data.segments.gender.slice(0, 4).map((row) => ({
      ...row,
      label: translateKey(t, 'gender', row.key, row.label),
      segmentType: 'gender',
      segmentLabel: t('reportsAnalytics.filters.gender'),
    })),
    ...data.segments.jobTitles.slice(0, 4).map((row) => ({
      ...row,
      segmentType: 'job_title',
      segmentLabel: t('reportsAnalytics.filters.jobTitle'),
    })),
    ...data.segments.roles.slice(0, 4).map((row) => ({
      ...row,
      label: translateKey(t, 'roles', row.key, row.label),
      segmentType: 'role',
      segmentLabel: t('reportsAnalytics.filters.role'),
    })),
  ].sort((a, b) => b.users - a.users || b.qualityScore - a.qualityScore).slice(0, 8)

  return {
    rows,
    chartRows: rows.slice(0, 6).map((row) => ({ ...row, shortLabel: truncateLabel(row.label, 18) })),
  }
}
