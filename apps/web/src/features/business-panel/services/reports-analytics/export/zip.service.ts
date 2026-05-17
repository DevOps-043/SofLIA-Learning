
import JSZip from 'jszip'
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import { buildAiSamplesCsv } from './csv-ai-samples.builder'
import { buildBreakdownCsv, buildTrendCsv } from './csv-shared'
import {
  buildConnectionCalendarCsv,
  buildLoginHeatmapCsv,
  buildSegmentAnalysisCsv,
} from './csv-connections.builders'
import {
  buildActivitiesCsv,
  buildNotesCsv,
  buildPlannerCsv,
  buildQualityCsv,
  buildSofliaCsv,
} from './csv-engagement.builders'
import {
  buildCourseProgressCsv,
  buildExecutiveSummaryCsv,
  buildUsersDetailCsv,
} from './csv-executive.builders'
import { buildHierarchyRankingCsv } from './csv-hierarchy.builder'
import { buildUserRankingCsv } from './csv-user-ranking.builder'
import { getExportCopy } from './export-copy'
import { resolveExportBlueprint } from './export-blueprint'
import { withCategory } from './rows-segments'

export async function generateReportsAnalyticsZip(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale = 'es',
  blueprint?: ReportsAnalyticsReportBlueprint,
): Promise<Uint8Array> {
  const copy = getExportCopy(locale)
  const zip = new JSZip()
  const reportBlueprint = resolveExportBlueprint(dataset, locale, blueprint)

  zip.file(`${copy.files.executive}.csv`, buildExecutiveSummaryCsv(dataset, copy, locale, reportBlueprint))
  zip.file(`${copy.files.users}.csv`, buildUsersDetailCsv(dataset, copy))
  zip.file(`${copy.files.demographics}.csv`, buildBreakdownCsv([
    ...withCategory('Genero', dataset.demographics.gender, copy, 'gender'),
    ...withCategory('Edad', dataset.demographics.ageBands, copy, 'age'),
    ...withCategory('Puesto', dataset.demographics.jobTitles, copy),
    ...withCategory('Rol', dataset.demographics.roles, copy),
  ], copy))
  zip.file(`${copy.files.courses}.csv`, buildCourseProgressCsv(dataset, copy))
  zip.file(`${copy.files.learningTrend}.csv`, buildTrendCsv(
    dataset.learning.completionsTrend,
    copy.metrics.completionRate,
    dataset.filters.granularity,
    copy,
  ))
  zip.file(`${copy.files.soflia}.csv`, buildSofliaCsv(dataset, copy))
  zip.file(`${copy.files.sofliaTrend}.csv`, buildTrendCsv(
    dataset.soflia.conversationsTrend,
    copy.metrics.totalConversations,
    dataset.filters.granularity,
    copy,
  ))
  zip.file(`${copy.files.activities}.csv`, buildActivitiesCsv(dataset, copy))
  zip.file(`${copy.files.notes}.csv`, buildNotesCsv(dataset, copy))
  zip.file(`${copy.files.planner}.csv`, buildPlannerCsv(dataset, copy))
  zip.file(`${copy.files.heatmap}.csv`, buildLoginHeatmapCsv(dataset, copy))
  zip.file(`${copy.files.calendar}.csv`, buildConnectionCalendarCsv(dataset, copy))
  zip.file(`${copy.files.segments}.csv`, buildSegmentAnalysisCsv(dataset, copy))
  zip.file(`${copy.files.quality}.csv`, buildQualityCsv(dataset, copy))
  zip.file(`${copy.files.hierarchy}.csv`, buildHierarchyRankingCsv(dataset, copy))
  zip.file(`${copy.files.userRanking}.csv`, buildUserRankingCsv(dataset, copy))
  zip.file(`${copy.files.samples}.csv`, buildAiSamplesCsv(dataset, copy))
  zip.file(`${copy.files.dataQuality}.csv`, buildBreakdownCsv(withCategory('Campo faltante', dataset.dataQuality.missingFields, copy), copy))

  return zip.generateAsync({ type: 'uint8array' })
}
