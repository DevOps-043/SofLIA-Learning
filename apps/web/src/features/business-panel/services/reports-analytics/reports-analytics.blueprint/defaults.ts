import type {
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import type { BlueprintCopy } from './types'

export function buildDefaultSections(
  copy: BlueprintCopy,
): ReportsAnalyticsReportBlueprint['sections'] {
  return [
    { id: 'executive', title: copy.executive, purpose: copy.executivePurpose, priority: 1 },
    { id: 'dashboard', title: copy.dashboard, purpose: copy.dashboardPurpose, priority: 2 },
    { id: 'trends', title: copy.trends, purpose: copy.trendsPurpose, priority: 3 },
    { id: 'courses', title: copy.courses, purpose: copy.coursesPurpose, priority: 4 },
    { id: 'users', title: copy.users, purpose: copy.usersPurpose, priority: 5 },
    { id: 'segments', title: copy.segments, purpose: copy.segmentsPurpose, priority: 6 },
    { id: 'quality', title: copy.quality, purpose: copy.qualityPurpose, priority: 7 },
    { id: 'rawData', title: copy.rawData, purpose: copy.rawDataPurpose, priority: 8 },
  ]
}

export function buildDefaultArtifactPlan(
  copy: BlueprintCopy,
): ReportsAnalyticsReportBlueprint['artifactPlan'] {
  return buildDefaultSections(copy).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.purpose,
    includeInCsv: section.id !== 'dashboard',
    includeInWorkbook: true,
  }))
}
