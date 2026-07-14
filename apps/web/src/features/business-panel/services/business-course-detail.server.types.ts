import type { createClient } from '../../../lib/supabase/server'

export type BusinessCourseDetailSupabaseClient = Awaited<ReturnType<typeof createClient>>

export type CourseRow = {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor_id: string | null
  duration_total_minutes: number | null
  thumbnail_url: string | null
  slug: string | null
  price: number | null
  average_rating: number | null
  student_count: number | null
  review_count: number | null
  learning_objectives: string[] | null
  created_at: string
  updated_at: string
}

export type GeneratedCourseMetadataRow = {
  payload: unknown
}

export type GeneratedCourseMetadataQueryResult = {
  data: GeneratedCourseMetadataRow[] | null
  error: { message?: string } | null
}

export interface GeneratedCourseMetadataQueryBuilder {
  select(columns: string): GeneratedCourseMetadataQueryBuilder
  eq(column: string, value: string): GeneratedCourseMetadataQueryBuilder
  order(column: string, options: { ascending: boolean }): GeneratedCourseMetadataQueryBuilder
  limit(count: number): PromiseLike<GeneratedCourseMetadataQueryResult>
}

export interface GeneratedCourseMetadataClient {
  from(table: 'courses_staging' | 'courseengine_inbox'): GeneratedCourseMetadataQueryBuilder
}

export type InstructorRow = {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  username: string | null
  email: string | null
  profile_picture_url: string | null
  bio: string | null
  location: string | null
  platform_role: string | null
}

export interface BusinessCourseDetailOptions {
  courseId: string
  businessUserId: string
  organizationId?: string
}
