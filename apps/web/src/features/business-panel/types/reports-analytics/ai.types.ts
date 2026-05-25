import type { ReportsAnalyticsReportSectionId } from './core.types'

export type ReportsAnalyticsAiSampleSource =
  | 'soflia_message'
  | 'activity_response'
  | 'quiz_response'
  | 'note'

export interface ReportsAnalyticsAiSample {
  source: ReportsAnalyticsAiSampleSource
  anonymousUserId: string
  courseId?: string
  courseTitle?: string
  segment?: {
    ageBand: string
    gender: string
    jobTitle: string
    regionName: string
    zoneName: string
    teamName: string
  }
  text: string
  signals: Record<string, string | number | boolean | null>
}

export interface ReportsAnalyticsAiInsightSection {
  title: string
  points: string[]
}

export interface ReportsAnalyticsAiInsightMetric {
  label: string
  value: string
  detail: string
}

export interface ReportsAnalyticsAiInsights {
  generatedAt: string
  model: string
  summary: string
  executiveMetrics?: ReportsAnalyticsAiInsightMetric[]
  findings: ReportsAnalyticsAiInsightSection[]
  risks: string[]
  recommendations: string[]
  actionPlan?: ReportsAnalyticsAiInsightSection[]
}

export interface ReportsAnalyticsInsightsResponse {
  success: true
  insights: ReportsAnalyticsAiInsights
}

export interface ReportsAnalyticsReportSection {
  id: ReportsAnalyticsReportSectionId
  title: string
  purpose: string
  priority: number
}

export interface ReportsAnalyticsExportArtifactPlan {
  id: ReportsAnalyticsReportSectionId
  title: string
  description: string
  includeInCsv: boolean
  includeInWorkbook: boolean
}

export interface ReportsAnalyticsReportBlueprint {
  generatedAt: string
  model: string
  source: 'gemini' | 'fallback'
  summary: string
  sections: ReportsAnalyticsReportSection[]
  featuredMetrics: ReportsAnalyticsAiInsightMetric[]
  findings: ReportsAnalyticsAiInsightSection[]
  risks: string[]
  recommendations: string[]
  artifactPlan: ReportsAnalyticsExportArtifactPlan[]
}
