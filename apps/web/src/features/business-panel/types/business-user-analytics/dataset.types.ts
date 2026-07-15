import type {
  BusinessUserAnalyticsCalendarCell,
  BusinessUserAnalyticsOverview,
  BusinessUserAnalyticsPeriod,
} from './common.types'
import type {
  BusinessUserAnalyticsActivities,
  BusinessUserAnalyticsAiAdoption,
  BusinessUserAnalyticsAiSample,
  BusinessUserAnalyticsNotes,
  BusinessUserAnalyticsQuality,
  BusinessUserAnalyticsQuizzes,
} from './engagement.types'
import type { BusinessUserAnalyticsLearning } from './learning.types'

export interface BusinessUserAnalyticsDataset {
  success: true
  generatedAt: string
  period: BusinessUserAnalyticsPeriod
  overview: BusinessUserAnalyticsOverview
  learning: BusinessUserAnalyticsLearning
  aiAdoption: BusinessUserAnalyticsAiAdoption
  notes: BusinessUserAnalyticsNotes
  activities: BusinessUserAnalyticsActivities
  quizzes: BusinessUserAnalyticsQuizzes
  quality: BusinessUserAnalyticsQuality
  contributionCalendar: BusinessUserAnalyticsCalendarCell[]
  aiSamples: BusinessUserAnalyticsAiSample[]
  dataHash: string
}

export type BusinessUserAnalyticsResponse = Omit<
  BusinessUserAnalyticsDataset,
  'aiSamples' | 'dataHash'
>

export interface BusinessUserAnalyticsInsightMetric {
  label: string
  value: string
  detail: string
}

export interface BusinessUserAnalyticsInsightSection {
  title: string
  points: string[]
}

export interface BusinessUserAnalyticsInsights {
  generatedAt: string
  model: string
  cached: boolean
  expiresAt: string | null
  unavailable?: boolean
  summary: string
  metrics: BusinessUserAnalyticsInsightMetric[]
  strengths: string[]
  opportunities: string[]
  recommendations: string[]
  nextSteps: BusinessUserAnalyticsInsightSection[]
}

export interface BusinessUserAnalyticsInsightsResponse {
  success: true
  insights: BusinessUserAnalyticsInsights
}
