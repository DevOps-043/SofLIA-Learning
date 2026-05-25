
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import type { ExportCopy } from './export.types'
import { toCsv } from './csv-shared'

export function buildHierarchyRankingCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(
    [
      ...dataset.rankings.regions,
      ...dataset.rankings.zones,
      ...dataset.rankings.teams,
    ].map((row) => ({
      type: row.type,
      name: row.name,
      region: row.regionName || '',
      zone: row.zoneName || '',
      users: row.users,
      progress: row.averageProgress,
      completion: row.completionRate,
      soflia: row.sofliaAdoptionRate,
      notes: row.notesAdoptionRate,
      quality: row.qualityScore,
      overdue: row.overdueAssignments,
      score: row.rankScore,
    })),
    [
      { key: 'type', header: copy.columns.type },
      { key: 'name', header: copy.columns.name },
      { key: 'region', header: copy.columns.region },
      { key: 'zone', header: copy.columns.zone },
      { key: 'users', header: copy.columns.user },
      { key: 'progress', header: copy.columns.progress },
      { key: 'completion', header: 'Finalizacion' },
      { key: 'soflia', header: 'SofLIA' },
      { key: 'notes', header: copy.columns.notes },
      { key: 'quality', header: copy.columns.quality },
      { key: 'overdue', header: copy.columns.overdue },
      { key: 'score', header: copy.columns.score },
    ],
  )
}
