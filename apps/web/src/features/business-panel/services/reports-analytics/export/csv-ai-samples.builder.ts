
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import type { ExportCopy } from './export.types'
import { translateDimension } from './export-utils'
import { toCsv } from './csv-shared'

export function buildAiSamplesCsv(dataset: ReportsAnalyticsDataset, copy: ExportCopy): string {
  return toCsv(
    dataset.aiSamples.map((sample) => ({
      source: translateDimension(copy, 'source', sample.source),
      course: sample.courseTitle || '',
      ageBand: sample.segment?.ageBand || '',
      gender: translateDimension(copy, 'gender', sample.segment?.gender || ''),
      jobTitle: sample.segment?.jobTitle || '',
      region: sample.segment?.regionName || '',
      zone: sample.segment?.zoneName || '',
      team: sample.segment?.teamName || '',
      text: sample.text,
      signals: JSON.stringify(sample.signals),
    })),
    [
      { key: 'source', header: copy.columns.source },
      { key: 'course', header: copy.columns.course },
      { key: 'ageBand', header: copy.columns.ageBand },
      { key: 'gender', header: copy.columns.gender },
      { key: 'jobTitle', header: copy.columns.jobTitle },
      { key: 'region', header: copy.columns.region },
      { key: 'zone', header: copy.columns.zone },
      { key: 'team', header: copy.columns.team },
      { key: 'text', header: copy.columns.text },
      { key: 'signals', header: copy.columns.signals },
    ],
  )
}
