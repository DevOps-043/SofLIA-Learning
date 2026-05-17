
import type {
  ReportsAnalyticsBreakdownItem,
  ReportsAnalyticsDataset,
} from '../../../types/reports-analytics.types'
import type { ExportCopy, ExportRow } from './export.types'
import { translateDimension } from './export-utils'

export function buildSegmentRows(dataset: ReportsAnalyticsDataset, copy: ExportCopy): ExportRow[] {
  return [
    ...withSegment('Edad', dataset.segments.ageBands, copy, 'age'),
    ...withSegment('Genero', dataset.segments.gender, copy, 'gender'),
    ...withSegment('Puesto', dataset.segments.jobTitles, copy),
    ...withSegment('Rol', dataset.segments.roles, copy),
  ]
}

export function withCategory(
  category: string,
  rows: ReportsAnalyticsBreakdownItem[],
  copy: ExportCopy,
  dimensionGroup?: string,
): ExportRow[] {
  return rows.map((row) => ({
    category,
    label: dimensionGroup ? translateDimension(copy, dimensionGroup, row.key, row.label) : row.label,
    value: row.value,
    percentage: row.percentage,
  }))
}

export function withSegment(
  segmentType: string,
  rows: ReportsAnalyticsDataset['segments']['ageBands'],
  copy: ExportCopy,
  dimensionGroup?: string,
): ExportRow[] {
  return rows.map((row) => ({
    segmentType,
    label: dimensionGroup ? translateDimension(copy, dimensionGroup, row.key, row.label) : row.label,
    users: row.users,
    averageProgress: row.averageProgress,
    completionRate: row.completionRate,
    averageCompletionDays: row.averageCompletionDays,
    sofliaAdoptionRate: row.sofliaAdoptionRate,
    notesAdoptionRate: row.notesAdoptionRate,
    quizAverageScore: row.quizAverageScore,
    qualityScore: row.qualityScore,
  }))
}
