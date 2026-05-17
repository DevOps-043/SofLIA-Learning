
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import type { ExportCopy } from './export.types'
import { toCsv } from './csv-shared'

export function buildUserRankingCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(
    dataset.rankings.users.map((row, index) => ({
      rank: index + 1,
      user: row.displayName,
      email: row.email,
      jobTitle: row.jobTitle,
      region: row.regionName,
      zone: row.zoneName,
      team: row.teamName,
      progress: row.averageProgress,
      completion: row.completionRate,
      soflia: row.sofliaConversations,
      notes: row.notesCreated,
      quality: row.qualityScore,
      overdue: row.overdueAssignments,
      score: row.rankScore,
    })),
    [
      { key: 'rank', header: copy.columns.rank },
      { key: 'user', header: copy.columns.user },
      { key: 'email', header: copy.columns.email },
      { key: 'jobTitle', header: copy.columns.jobTitle },
      { key: 'region', header: copy.columns.region },
      { key: 'zone', header: copy.columns.zone },
      { key: 'team', header: copy.columns.team },
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
