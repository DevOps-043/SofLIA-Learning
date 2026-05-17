import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import type { BlueprintCopy } from './types'

export function buildFallbackFeaturedMetrics(
  dataset: ReportsAnalyticsDataset,
  copy: BlueprintCopy,
): ReportsAnalyticsReportBlueprint['featuredMetrics'] {
  return [
    {
      label: copy.progress,
      value: `${dataset.overview.averageProgress}%`,
      detail: copy.completionDetail(dataset.overview.completionRate),
    },
    {
      label: copy.soflia,
      value: `${dataset.overview.sofliaAdoptionRate}%`,
      detail: copy.sofliaDetail(dataset.soflia.totalConversations, dataset.soflia.totalMessages),
    },
    {
      label: copy.quality,
      value: `${dataset.overview.qualityScore}%`,
      detail: copy.qualityDetail(dataset.quality.evidenceCount),
    },
  ]
}
