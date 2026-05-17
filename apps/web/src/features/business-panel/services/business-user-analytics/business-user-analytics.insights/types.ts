import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import type {
  BusinessUserAnalyticsDataset,
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsRange,
} from '../../../types/business-user-analytics.types'

export type BusinessUserAnalyticsSupabaseClient = SupabaseClient<Database>

export interface CacheRow {
  id: string
  user_id: string
  organization_id: string
  range: string
  locale: string
  data_hash: string
  model_name: string | null
  payload: Json
  created_at: string
  expires_at: string
}

export interface CacheInsert {
  user_id: string
  organization_id: string
  range: string
  locale: string
  data_hash: string
  model_name?: string | null
  payload: Json
  expires_at: string
}

export interface GetBusinessUserAnalyticsInsightsParams {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
  locale: BusinessUserAnalyticsLocale
  dataset: BusinessUserAnalyticsDataset
}

export interface CacheInsightsInput {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
  locale: BusinessUserAnalyticsLocale
  dataHash: string
}

export interface StoreInsightsInput extends CacheInsightsInput {
  insights: BusinessUserAnalyticsInsights
}

export interface FallbackInsightsText {
  unavailable: string
  progressMetric: string
  aiMetric: string
  planningMetric: string
  nextStepsTitle: string
  noCourseStrength: string
  noCourseOpportunity: string
  recommendPlanning: string
  recommendSoflia: string
  recommendNotes: string
  nextStepCourse: string
  nextStepQuestions: string
  nextStepReview: string
  summary: (progress: number, quality: number) => string
  progressDetail: (completed: number, total: number) => string
  aiDetail: (conversations: number, score: number) => string
  planningDetail: (completed: number, planned: number) => string
  strongCourse: (course: string, progress: number) => string
  weakCourse: (course: string, progress: number) => string
  activeDays: (days: number, streak: number) => string
  notesOpportunity: (rate: number) => string
  activitiesOpportunity: (score: number) => string
}
