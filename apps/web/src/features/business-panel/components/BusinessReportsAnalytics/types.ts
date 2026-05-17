import type { LucideIcon } from 'lucide-react'
import type { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { useBusinessReportsAnalytics } from '../../hooks/useBusinessReportsAnalytics'
import type { ReportsAnalyticsBreakdownItem, ReportsAnalyticsSegmentRow } from '../../types/reports-analytics.types'

export type ThemeTokens = ReturnType<typeof useBusinessPanelTheme>
export type ReportsAnalyticsLocale = 'es' | 'en' | 'pt'
export type ReportsAnalyticsT = (key: string) => string

export type ReportsAnalyticsFilters = ReturnType<typeof useBusinessReportsAnalytics>['filters']
export type ReportsAnalyticsFilterUpdater = ReturnType<typeof useBusinessReportsAnalytics>['updateFilter']
export type ReportsAnalyticsExporter = ReturnType<typeof useBusinessReportsAnalytics>['exportAnalytics']
export type ReportsAnalyticsExportingState = ReturnType<typeof useBusinessReportsAnalytics>['isExporting']

export type SegmentDisplayRow = ReportsAnalyticsSegmentRow & {
  segmentType: string
  segmentLabel: string
}

export type MetricRow = [string, string | number]
export type ReportFormatter = (item: ReportsAnalyticsBreakdownItem) => string
export type SummaryCardIcon = LucideIcon
