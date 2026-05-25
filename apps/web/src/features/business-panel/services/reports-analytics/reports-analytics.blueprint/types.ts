import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsExportFormat,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'

export interface GenerateReportsAnalyticsReportBlueprintParams {
  dataset: ReportsAnalyticsDataset
  locale: ReportsAnalyticsLocale
  format: ReportsAnalyticsExportFormat
  requestedByUserId?: string
}

export interface ParseReportsAnalyticsBlueprintContext {
  dataset: ReportsAnalyticsDataset
  locale: ReportsAnalyticsLocale
  model: string
  format: ReportsAnalyticsExportFormat
  source?: 'gemini' | 'fallback'
}

export interface NormalizeReportsAnalyticsBlueprintContext {
  dataset: ReportsAnalyticsDataset
  locale: ReportsAnalyticsLocale
  model: string
  format: ReportsAnalyticsExportFormat
}

export interface BlueprintCopy {
  executive: string
  executivePurpose: string
  dashboard: string
  dashboardPurpose: string
  trends: string
  trendsPurpose: string
  courses: string
  coursesPurpose: string
  users: string
  usersPurpose: string
  segments: string
  segmentsPurpose: string
  quality: string
  qualityPurpose: string
  rawData: string
  rawDataPurpose: string
  progress: string
  soflia: string
  learningFinding: string
  segmentFinding: string
  noCourseRisk: string
  noSegmentRisk: string
  recommendSoflia: string
  recommendCourse: string
  recommendData: string
  summary: (progress: number, quality: number) => string
  completionDetail: (completion: number) => string
  sofliaDetail: (conversations: number, messages: number) => string
  qualityDetail: (evidence: number) => string
  learningPoint: (completed: number, assigned: number) => string
  courseRisk: (course: string, overdue: number) => string
  segmentRisk: (segment: string, quality: number) => string
  dataQualityPoint: (completion: number) => string
  overdueRisk: (overdue: number) => string
  helpRisk: (helpRate: number) => string
}
